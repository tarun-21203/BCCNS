"""Tests against the team's shared data: data/sample/records.json and data/crosswalk.json.

These check that the AI module reads Member 1's records and Member 4's crosswalk format correctly.
If those files change, update the expectations here.
"""

from __future__ import annotations

import pytest

from threads_ai.config import DATA_DIR, Settings
from threads_ai.language_bridge import LanguageBridge
from threads_ai.pipeline import Engine
from threads_ai.records import load_records

RECORDS_PATH = DATA_DIR / "sample" / "records.json"
CROSSWALK_PATH = DATA_DIR / "crosswalk.json"
pytestmark = pytest.mark.skipif(not RECORDS_PATH.exists(), reason="team data not present")


@pytest.fixture(scope="module")
def engine() -> Engine:
    s = Settings(mode="cache", records_path=RECORDS_PATH, crosswalk_path=CROSSWALK_PATH)
    return Engine(load_records(path=RECORDS_PATH), LanguageBridge.from_file(CROSSWALK_PATH), s)


def ids(out):
    return [h["record"]["id"] for h in out["results"]]


def test_team_crosswalk_format_is_read(engine):
    assert len(engine.bridge.concepts) >= 5
    assert "draft" in engine.bridge.status.lower()


def test_modern_term_finds_record_titled_with_historical_term(engine):
    out = engine.search_records("Black Loyalist")
    assert "bccns-005" in ids(out)  # "Book of Negroes, 1783"
    matched = [m["matched_term"] for m in out["language_bridge"]["matched"]]
    assert "Black Loyalist" in matched


def test_old_place_name_bridges_to_modern(engine):
    exp = engine.bridge.expand("Shelburne settlers")
    assert "Port Roseway" in exp.added_terms


def test_context_note_only_where_the_note_applies(engine):
    by_id = {h["record"]["id"]: h for h in engine.search_records("Black Loyalist", k=20)["results"]}
    assert by_id["bccns-005"]["content_note"]          # the Book of Negroes title
    assert by_id["bccns-008"]["content_note"] is None   # mentions Loyalist, not the harmful title


def test_relocation_records_get_source_wording_note(engine):
    by_id = {h["record"]["id"]: h for h in engine.search_records("Africville displacement", k=20)["results"]}
    assert "bccns-013" in by_id
    assert "Relocation" in (by_id["bccns-013"]["content_note"] or "")


def test_photo_question_filters_to_photographs(engine):
    out = engine.search_records("photos of Africville")
    assert out["understood"]["filters"].get("resource_type") == "photograph"
    assert ids(out) == ["bccns-015"]


def test_person_question_finds_their_record(engine):
    assert ids(engine.search_records("Viola Desmond"))[0] == "bccns-003"


def test_named_war_is_not_a_date_filter(engine):
    out = engine.search_records("Black Refugees who came after the War of 1812")
    assert "date_from" not in out["understood"]["filters"]
    assert "bccns-002" in ids(out)


def test_possessive_does_not_create_stray_s_token(engine):
    out = engine.search_records("What was Viola Desmond's favourite song?")
    for h in out["results"]:
        assert "s" not in h["matched_terms"], h["record"]["id"]
