"""The full AI search flow: parse -> Language Bridge -> retrieve -> generate -> verify -> respond."""

from __future__ import annotations

from typing import Any

from .cache import ResponseCache
from .config import Settings, get_settings
from .grounding import (
    SYSTEM_PROMPT,
    GenerationError,
    GeneratorFn,
    _quote_ok,
    build_user_message,
    make_generator,
    verify,
)
from .language_bridge import LanguageBridge
from .query_parser import parse
from .records import Record, card, load_records
from .retrieval import Filters, Hit, Index, build_units

DISCLAIMER = (
    "Answers use only the catalogue records in the sources indexed by this prototype. "
    "Few or no results do not mean that no records exist; they may be held in collections we have not indexed."
)
ABSTAIN_MESSAGE = (
    "The indexed sources don't contain enough evidence to answer this question, so THREADS won't guess. "
    "That doesn't mean no records exist. They may be held in collections this prototype hasn't indexed yet."
)


class Engine:
    def __init__(
        self,
        records: list[Record],
        bridge: LanguageBridge,
        settings: Settings | None = None,
        generator: GeneratorFn | None = None,
        cache: ResponseCache | None = None,
    ):
        self.settings = settings or get_settings()
        self.records = records
        self.index = Index(records)
        self.bridge = bridge
        self.cache = cache if cache is not None else ResponseCache(self.settings.cache_path)
        self._generator = generator

    @classmethod
    def from_settings(cls, settings: Settings | None = None) -> "Engine":
        s = settings or get_settings()
        records = load_records(path=s.records_path, url=s.records_url)
        return cls(records, LanguageBridge.from_file(s.crosswalk_path), s)

    # ------------------------------------------------------------------ helpers
    @property
    def generator(self) -> GeneratorFn:
        if self._generator is None:
            self._generator = make_generator(self.settings)
        return self._generator

    def _hit_dict(self, h: Hit) -> dict[str, Any]:
        return {
            "record": h.record,
            "score": h.score,
            "matched_terms": h.matched_terms,
            "found_via_bridge": h.found_via_bridge,
            "content_note": self.bridge.content_note_for(h.record),
        }

    def retrieve(self, question: str, filters: dict[str, Any] | None = None, k: int | None = None):
        parsed = parse(question, self.index)
        merged = Filters.from_dict(filters).merged(parsed.filters)
        expansion = self.bridge.expand(parsed.text_query)
        units = build_units(parsed.text_query, expansion.added_terms, self.settings.bridge_weight)
        hits = self.index.search(units, merged, k or self.settings.top_k)
        return parsed, merged, expansion, hits

    # ------------------------------------------------------------------ public API
    def search_records(self, query: str, filters: dict[str, Any] | None = None, k: int = 20) -> dict[str, Any]:
        """Keyword search with Language Bridge, no AI. Member 2's search page can call this."""
        parsed, merged, expansion, hits = self.retrieve(query, filters, k)
        return {
            "query": query,
            "understood": {**parsed.to_dict(), "filters": merged.to_dict()},
            "language_bridge": expansion.to_dict(),
            "results": [self._hit_dict(h) for h in hits],
            "disclaimer": DISCLAIMER,
        }

    def ask(self, question: str, filters: dict[str, Any] | None = None, k: int | None = None) -> dict[str, Any]:
        question = (question or "").strip()
        mode = self.settings.mode

        if mode == "cache":
            cached = self._refresh_cached(self.cache.get(question, filters))
            if cached:
                cached["served_from"] = "cache"
                return cached

        parsed, merged, expansion, hits = self.retrieve(question, filters, k)
        base: dict[str, Any] = {
            "question": question,
            "understood": {**parsed.to_dict(), "filters": merged.to_dict()},
            "language_bridge": expansion.to_dict(),
            "records": [self._hit_dict(h) for h in hits],
            "disclaimer": DISCLAIMER,
            "model": None,
        }

        # Stay silent before calling the model when nothing relevant was retrieved.
        if not hits:
            return {**base, **self._abstain(hits, gaps="No indexed record matched the question."), "served_from": "rules"}

        if mode == "cache":
            return {**base, **self._records_only("Offline mode: no saved answer for this question. Showing matching records."),
                    "served_from": "retrieval_only"}

        try:
            retrieved = [h.record for h in hits]
            raw = self.generator(SYSTEM_PROMPT, build_user_message(question, retrieved))
        except GenerationError as e:
            if mode == "auto":
                cached = self._refresh_cached(self.cache.get(question, filters))
                if cached:
                    cached["served_from"] = "cache"
                    cached["live_error"] = str(e)
                    return cached
            return {**base, **self._records_only(f"AI answer unavailable ({e}). Showing matching records."),
                    "served_from": "retrieval_only"}

        base["model"] = getattr(self.generator, "model", None)
        check = verify(raw, retrieved)
        if not raw.get("answerable") or not check.claims:
            out = self._abstain(hits, gaps=raw.get("gaps") or "")
            out["verification"] = check.to_dict()
            return {**base, **out, "served_from": "live"}

        return {
            **base,
            "status": "answered",
            "answer": {"claims": check.claims},
            "gaps": raw.get("gaps") or "",
            "verification": check.to_dict(),
            "served_from": "live",
        }

    def _refresh_cached(self, cached: dict[str, Any] | None) -> dict[str, Any] | None:
        """Re-attach current record data (links, titles, access) to a saved answer.

        The saved wording and quotes stay as generated, but record details always come from the
        current index, so a corrected link in data/sample/records.json shows up immediately. If a
        cited record no longer exists, or a quote is no longer in it, the saved answer is not used.
        """
        if not cached:
            return None
        by_id = {r["id"]: r for r in self.records}
        for claim in (cached.get("answer") or {}).get("claims", []):
            for c in claim.get("citations", []):
                record = by_id.get(c.get("record_id"))
                if record is None or not _quote_ok(c.get("quote", ""), record)[0]:
                    return None
                c.update({f"record_{k}": v for k, v in card(record).items() if k != "id"})
        fresh_hits = []
        for h in cached.get("records", []):
            record = by_id.get(h.get("record", {}).get("id"))
            if record is not None:
                fresh_hits.append({**h, "record": record, "content_note": self.bridge.content_note_for(record)})
        cached["records"] = fresh_hits
        return cached

    # ------------------------------------------------------------------ responses
    def _abstain(self, hits: list[Hit], gaps: str) -> dict[str, Any]:
        institutions = sorted({h.record.get("source_institution") for h in hits if h.record.get("source_institution")})
        steps = []
        if hits:
            steps.append(f"Look through the {len(hits)} partially matching records below and open their original catalogue entries.")
        if institutions:
            steps.append("Ask the holding institutions directly: " + ", ".join(institutions) + ".")
        steps.append("Try different words, a broader date range, or fewer filters.")
        return {
            "status": "insufficient_evidence",
            "answer": None,
            "message": ABSTAIN_MESSAGE,
            "gaps": gaps,
            "suggested_next_steps": steps,
        }

    @staticmethod
    def _records_only(message: str) -> dict[str, Any]:
        return {"status": "records_only", "answer": None, "message": message, "gaps": ""}
