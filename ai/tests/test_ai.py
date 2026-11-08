"""Offline tests: no network or API key needed. The model is replaced by fake generators."""

from __future__ import annotations

from pathlib import Path

from threads_ai.cache import ResponseCache
from threads_ai.config import AI_DIR, Settings
from threads_ai.grounding import GenerationError, verify
from threads_ai.language_bridge import LanguageBridge
from threads_ai.pipeline import Engine
from threads_ai.records import load_records

FIXTURES = AI_DIR / "tests" / "fixtures"
RECORDS = load_records(path=FIXTURES / "sample_records.json")  # fictional, test-only
BRIDGE = LanguageBridge.from_file(FIXTURES / "crosswalk_concepts.json")


def engine(generator=None, mode="live", tmp_path: Path | None = None) -> Engine:
    settings = Settings(mode=mode, cache_path=(tmp_path or Path("/nonexistent")) / "cache.json")
    return Engine(RECORDS, BRIDGE, settings, generator=generator, cache=ResponseCache(settings.cache_path))


class FakeGenerator:
    model = "fake"

    def __init__(self, output):
        self.output = output
        self.calls = 0

    def __call__(self, system, user):
        self.calls += 1
        if isinstance(self.output, Exception):
            raise self.output
        return self.output


# ------------------------------------------------------------- Language Bridge

def test_modern_term_finds_historical_catalogue_wording():
    hits = engine().search_records("Black residents Halifax County")["results"]
    ids = [h["record"]["id"] for h in hits]
    assert "s-b-001" in ids  # catalogued as "Coloured residents"


def test_record_found_only_through_bridge_is_flagged():
    hits = engine().search_records("African Nova Scotian survey")["results"]
    survey = next(h for h in hits if h["record"]["id"] == "s-b-001")
    assert "survey" in survey["matched_terms"]
    hits = engine().search_records("Black Nova Scotians")["results"]
    survey = next(h for h in hits if h["record"]["id"] == "s-b-001")
    assert survey["found_via_bridge"] is True


def test_content_note_attached_when_record_uses_historical_term():
    hits = engine().search_records("Black Loyalists")["results"]
    register = next(h for h in hits if h["record"]["id"] == "s-c-001")
    assert register["content_note"]
    petitions = next(h for h in hits if h["record"]["id"] == "s-c-002")
    assert petitions["content_note"] is None


def test_bridge_never_changes_record_text():
    before = [dict(r) for r in RECORDS]
    engine().search_records("Black history")
    assert RECORDS == before


def test_variant_place_name():
    exp = BRIDGE.expand("Campbell Road")
    assert any(m.concept_id == "africville" for m in exp.matches)
    assert "Africville" in exp.added_terms


def test_french_query_expands():
    exp = BRIDGE.expand("histoire des Noirs")
    assert any(m.concept_id == "black_identity" for m in exp.matches)


# ------------------------------------------------------------- query parsing / filters

def test_decade_and_type_become_filters():
    out = engine().search_records("photos of Africville in the 1960s")
    f = out["understood"]["filters"]
    assert f["date_from"] == 1960 and f["date_to"] == 1969
    assert f["resource_type"] == "Photograph"
    assert [h["record"]["id"] for h in out["results"]] == ["s-a-001"]


def test_explicit_filter_overrides_parsed():
    out = engine().search_records("Africville in the 1960s", filters={"date_from": 1985, "date_to": 1995})
    assert {h["record"]["id"] for h in out["results"]} == {"s-b-002"}


# ------------------------------------------------------------- Cite or Stay Silent

def test_no_matching_records_abstains_without_calling_model():
    gen = FakeGenerator({"answerable": True, "claims": [], "gaps": ""})
    out = engine(gen).ask("What was Viola Desmond's favourite song?")
    assert out["status"] == "insufficient_evidence"
    assert gen.calls == 0


def test_valid_citations_are_kept():
    gen = FakeGenerator({
        "answerable": True,
        "claims": [{
            "text": "A set of committee minutes documents the relocation of Africville residents.",
            "citations": [{"record_id": "s-a-002", "quote": "responsible for the relocation of Africville residents"}],
        }],
        "gaps": "",
    })
    out = engine(gen).ask("Who documented the Africville relocation?")
    assert out["status"] == "answered"
    cite = out["answer"]["claims"][0]["citations"][0]
    assert cite["record_original_url"].startswith("https://example.org/")
    assert cite["record_source_institution"] == "Sample Archive A (fictional)"


def test_invented_record_id_and_fake_quote_are_removed():
    gen = FakeGenerator({
        "answerable": True,
        "claims": [
            {"text": "Real claim.", "citations": [{"record_id": "s-a-002", "quote": "Minutes and correspondence of the city committee"}]},
            {"text": "Invented record.", "citations": [{"record_id": "s-z-999", "quote": "anything at all here"}]},
            {"text": "Made-up quote.", "citations": [{"record_id": "s-a-002", "quote": "the mayor personally ordered it"}]},
            {"text": "No citation at all.", "citations": []},
        ],
        "gaps": "",
    })
    out = engine(gen).ask("Africville relocation committee")
    assert [c["text"] for c in out["answer"]["claims"]] == ["Real claim."]
    v = out["verification"]
    assert v["claims_proposed"] == 4 and v["claims_shown"] == 1 and len(v["claims_removed"]) == 3


def test_citation_to_record_that_was_not_retrieved_is_rejected():
    # s-c-001 exists in the index, but is not retrieved for this query.
    v = verify(
        {"claims": [{"text": "x", "citations": [{"record_id": "s-c-001", "quote": "Copy of a register listing Black Loyalists"}]}]},
        retrieved=[r for r in RECORDS if r["id"] == "s-a-002"],
    )
    assert v.claims == [] and v.citations_rejected == 1


def test_short_quote_rejected_unless_whole_field():
    retrieved = [r for r in RECORDS if r["id"] == "s-a-002"]
    # Two words lifted from the middle of a description are too weak to support a claim.
    weak = verify({"claims": [{"text": "x", "citations": [{"record_id": "s-a-002", "quote": "city committee"}]}]}, retrieved)
    assert weak.claims == []
    # A short quote that is an entire field (a date, a place) is fine.
    for quote in ("1964-1967", "Halifax"):
        whole = verify({"claims": [{"text": "x", "citations": [{"record_id": "s-a-002", "quote": quote}]}]}, retrieved)
        assert len(whole.claims) == 1, quote


def test_quote_with_copied_field_label_is_accepted():
    retrieved = [r for r in RECORDS if r["id"] == "s-a-002"]
    for quote in ("Title: [SAMPLE] Minutes of the Africville relocation committee", "Date: 1964-1967",
                  "Held by: Sample Archive A (fictional)"):
        v = verify({"claims": [{"text": "x", "citations": [{"record_id": "s-a-002", "quote": quote}]}]}, retrieved)
        assert len(v.claims) == 1, quote
    # A label in front of text that isn't in the record is still rejected.
    v = verify({"claims": [{"text": "x", "citations": [{"record_id": "s-a-002", "quote": "Title: Mayor's secret plan"}]}]}, retrieved)
    assert v.claims == []


def test_quote_joined_with_ellipsis_needs_every_fragment():
    retrieved = [r for r in RECORDS if r["id"] == "s-a-002"]

    def check(quote):
        return verify({"claims": [{"text": "x", "citations": [{"record_id": "s-a-002", "quote": quote}]}]}, retrieved).claims

    assert check("Minutes and correspondence of the city committee, ... Communities: Africville")
    assert check("Minutes and correspondence of the city committee … Date: 1964-1967")
    # One invented fragment fails the whole quote.
    assert not check("Minutes and correspondence of the city committee ... the mayor ordered the removal")
    # A trivially short fragment that isn't a whole field fails too.
    assert not check("Minutes and correspondence of the city committee ... city committee")


def test_model_says_unanswerable_means_abstain():
    gen = FakeGenerator({"answerable": False, "claims": [], "gaps": "The records do not name who led the church."})
    out = engine(gen).ask("Who led the Africville church?")
    assert out["status"] == "insufficient_evidence"
    assert "church" in out["gaps"]
    assert out["suggested_next_steps"]


def test_all_claims_fail_verification_means_abstain():
    gen = FakeGenerator({"answerable": True, "claims": [
        {"text": "Invented.", "citations": [{"record_id": "s-a-002", "quote": "a sentence that is not in the record"}]}
    ], "gaps": ""})
    out = engine(gen).ask("Africville relocation committee")
    assert out["status"] == "insufficient_evidence"


# ------------------------------------------------------------- resilience

def test_model_failure_falls_back_to_records_only():
    gen = FakeGenerator(GenerationError("network down"))
    out = engine(gen, mode="auto").ask("Africville relocation")
    assert out["status"] == "records_only"
    assert out["records"]


def test_model_failure_serves_cached_real_response(tmp_path):
    good = FakeGenerator({"answerable": True, "claims": [
        {"text": "Minutes exist.", "citations": [{"record_id": "s-a-002", "quote": "Minutes and correspondence of the city committee"}]}
    ], "gaps": ""})
    e = engine(good, mode="live", tmp_path=tmp_path)
    live = e.ask("Africville relocation committee")
    e.cache.put("Africville relocation committee", None, live)
    e.cache.save()

    failing = engine(FakeGenerator(GenerationError("timeout")), mode="auto", tmp_path=tmp_path)
    out = failing.ask("Africville relocation committee")
    assert out["served_from"] == "cache" and out["status"] == "answered"

    offline = engine(FakeGenerator(GenerationError("should not be called")), mode="cache", tmp_path=tmp_path)
    assert offline.ask("Africville relocation committee")["served_from"] == "cache"
