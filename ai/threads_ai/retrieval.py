"""Keyword retrieval over normalized records: BM25 with field weights, phrase terms and filters.

Small and dependency-free on purpose. It works the same for 30 records or a few thousand.
Every hit reports which terms matched and whether it was found only through the Language Bridge.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from .records import Record, field_text
from .text import STOPWORDS, phrase_key, tokens

FIELD_WEIGHTS: dict[str, float] = {
    "title": 3.0,
    "subjects": 2.0,
    "communities": 2.0,
    "places": 2.0,
    "people": 2.0,
    "original_terms": 1.5,
    "search_terms": 1.0,
    "description": 1.0,
    "resource_type": 0.5,
    "source_institution": 0.5,
}
K1, B = 1.2, 0.75


@dataclass
class QueryUnit:
    key: str            # normalized token or phrase, e.g. "africville" or "campbell road"
    weight: float
    from_bridge: bool
    display: str


@dataclass
class Hit:
    record: Record
    score: float
    matched_terms: list[str] = field(default_factory=list)
    found_via_bridge: bool = False  # True if it matched ONLY through Language Bridge terms


@dataclass
class Filters:
    institution: str | None = None
    resource_type: str | None = None
    date_from: int | None = None
    date_to: int | None = None
    place: str | None = None
    community: str | None = None
    person: str | None = None
    subject: str | None = None
    digitization_status: str | None = None

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> "Filters":
        d = d or {}
        known = {k: d.get(k) for k in cls.__dataclass_fields__}
        for k in ("date_from", "date_to"):
            if known[k] is not None:
                known[k] = int(known[k])
        return cls(**known)

    def merged(self, other: "Filters") -> "Filters":
        """Explicit (UI) filters win over ones parsed from the question."""
        return Filters(**{k: getattr(self, k) if getattr(self, k) is not None else getattr(other, k)
                          for k in self.__dataclass_fields__})

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v is not None}


def _year(value: Any) -> int | None:
    try:
        return int(str(value)[:4])
    except (TypeError, ValueError):
        return None


def _eq(a: Any, b: str) -> bool:
    return phrase_key(str(a)) == phrase_key(b)


def _passes(record: Record, f: Filters) -> bool:
    if f.institution and not (_eq(record.get("source_institution", ""), f.institution)
                              or _eq(record.get("source_id", ""), f.institution)):
        return False
    if f.resource_type and not _eq(record.get("resource_type", ""), f.resource_type):
        return False
    if f.digitization_status and record.get("digitization_status") != f.digitization_status:
        return False
    for attr, key in (("place", "places"), ("community", "communities"), ("person", "people"), ("subject", "subjects")):
        want = getattr(f, attr)
        if want and not any(_eq(v, want) for v in record.get(key) or []):
            return False
    if f.date_from is not None or f.date_to is not None:
        start, end = _year(record.get("start_date")), _year(record.get("end_date"))
        if start is None and end is None:
            return False  # undated records can't be shown to fall inside a date filter
        start, end = start if start is not None else end, end if end is not None else start
        if f.date_from is not None and end < f.date_from:
            return False
        if f.date_to is not None and start > f.date_to:
            return False
    return True


class Index:
    def __init__(self, records: list[Record]):
        self.records = records
        self._fields: list[dict[str, str]] = []
        self._lengths: list[float] = []
        for r in records:
            per_field = {}
            length = 0.0
            for name, weight in FIELD_WEIGHTS.items():
                toks = tokens(field_text(r.get(name)))
                per_field[name] = " " + " ".join(toks) + " "
                length += weight * len(toks)
            self._fields.append(per_field)
            self._lengths.append(length)
        self._avg_len = (sum(self._lengths) / len(self._lengths)) if records else 1.0

    # -- facet values, used by the query parser to recognise filters in questions
    def facet_values(self, key: str) -> set[str]:
        out: set[str] = set()
        for r in self.records:
            v = r.get(key)
            if isinstance(v, list):
                out.update(str(x) for x in v if x)
            elif v:
                out.add(str(v))
        return out

    def _tf(self, i: int, key: str) -> float:
        needle = f" {key} "
        return sum(w * self._fields[i][name].count(needle) for name, w in FIELD_WEIGHTS.items())

    def search(self, units: list[QueryUnit], filters: Filters | None = None, k: int = 8) -> list[Hit]:
        filters = filters or Filters()
        candidates = [i for i, r in enumerate(self.records) if _passes(r, filters)]
        units = [u for u in units if u.key]
        if not units:
            # Filter-only query: return filtered records in index order with zero score.
            return [Hit(self.records[i], 0.0) for i in candidates[:k]]

        n = len(self.records)
        tf = {u.key: {i: self._tf(i, u.key) for i in candidates} for u in units}
        df = {u.key: sum(1 for i in range(n) if self._tf(i, u.key) > 0) for u in units}

        hits = []
        for i in candidates:
            score, matched, own_match = 0.0, [], False
            for u in units:
                f = tf[u.key][i]
                if f <= 0:
                    continue
                idf = math.log(1 + (n - df[u.key] + 0.5) / (df[u.key] + 0.5))
                norm = f * (K1 + 1) / (f + K1 * (1 - B + B * self._lengths[i] / self._avg_len))
                score += u.weight * idf * norm
                matched.append(u.display)
                own_match = own_match or not u.from_bridge
            if score > 0:
                hits.append(Hit(self.records[i], round(score, 4), matched, found_via_bridge=not own_match))
        hits.sort(key=lambda h: h.score, reverse=True)
        return hits[:k]


def build_units(text_query: str, bridge_terms: list[str], bridge_weight: float) -> list[QueryUnit]:
    units: dict[str, QueryUnit] = {}
    for t in tokens(text_query):
        if len(t) > 1 and t not in STOPWORDS and t not in units:
            units[t] = QueryUnit(t, 1.0, False, t)
    for term in bridge_terms:
        key = phrase_key(term)
        if key and key not in units and key not in STOPWORDS:
            units[key] = QueryUnit(key, bridge_weight, True, term)
    return list(units.values())
