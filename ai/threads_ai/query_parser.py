"""Turn a plain-English question into visible, editable filter chips.

Rule-based on purpose: it is instant, free, and never invents a filter. Chips are shown to the
user so they can see exactly what was searched. Only dates, resource types and institutions are
applied as hard filters; people, places and communities stay in the keyword query as boosts.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from .retrieval import Filters, Index
from .text import fold, phrase_key, token_string

# (type names the data might use, words in a question that point to that type).
# A type filter is applied only if one of the names actually exists in the index.
RESOURCE_TYPES: list[tuple[list[str], list[str]]] = [
    (["photograph", "photo", "image"], ["photo", "photos", "photograph", "photographs", "picture", "pictures"]),
    (["audio", "sound recording"], ["audio", "recording", "recordings", "sound recording"]),
    (["moving image", "video", "film"], ["video", "videos", "film", "films", "footage"]),
    (["map"], ["map", "maps"]),
    (["register"], ["register", "registers", "muster roll", "muster book", "nominal roll", "roll"]),
    (["exhibit"], ["exhibit", "exhibits", "exhibition", "virtual exhibit"]),
]


@dataclass
class Chip:
    kind: str            # date | resource_type | institution | community | place | person | subject
    label: str
    value: Any
    applied_as_filter: bool

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class ParsedQuery:
    question: str
    text_query: str
    filters: Filters = field(default_factory=Filters)
    chips: list[Chip] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "text_query": self.text_query,
            "filters": self.filters.to_dict(),
            "chips": [c.to_dict() for c in self.chips],
        }


_DATE_PATTERNS: list[tuple[re.Pattern[str], Any]] = [
    (re.compile(r"\b(?:between|from)\s+(\d{4})\s+(?:and|to|-)\s+(\d{4})\b"), lambda m: (int(m[1]), int(m[2]))),
    (re.compile(r"\b(\d{4})\s*(?:-|–|to)\s*(\d{4})\b"), lambda m: (int(m[1]), int(m[2]))),
    (re.compile(r"\b(\d{3})0s\b"), lambda m: (int(m[1]) * 10, int(m[1]) * 10 + 9)),
    (re.compile(r"\b(\d{1,2})(?:st|nd|rd|th)\s+century\b"), lambda m: ((int(m[1]) - 1) * 100, (int(m[1]) - 1) * 100 + 99)),
    (re.compile(r"\bbefore\s+(\d{4})\b"), lambda m: (None, int(m[1]) - 1)),
    (re.compile(r"\b(?:after|since)\s+(\d{4})\b"), lambda m: (int(m[1]) + 1, None)),
    # Not "of 1812": that is usually part of a name ("War of 1812"), not a date filter.
    (re.compile(r"\b(?:in|during|year)\s+(\d{4})\b"), lambda m: (int(m[1]), int(m[1]))),
]


def _date_label(start: int | None, end: int | None) -> str:
    if start is not None and end is not None:
        return str(start) if start == end else f"{start}–{end}"
    return f"before {end + 1}" if start is None else f"after {start - 1}"


def parse(question: str, index: Index) -> ParsedQuery:
    text = fold(question)
    filters = Filters()
    chips: list[Chip] = []

    # Dates: first pattern that matches wins, and the date words are removed from the keyword query.
    for pattern, extract in _DATE_PATTERNS:
        m = pattern.search(text)
        if m:
            start, end = extract(m)
            filters.date_from, filters.date_to = start, end
            chips.append(Chip("date", _date_label(start, end), {"from": start, "to": end}, True))
            text = text[: m.start()] + " " + text[m.end():]
            break

    q = token_string(text)

    # Resource type: only if the index actually has that type.
    types_in_index = {phrase_key(t): t for t in index.facet_values("resource_type")}
    for names, words in RESOURCE_TYPES:
        actual = next((types_in_index[phrase_key(n)] for n in names if phrase_key(n) in types_in_index), None)
        if actual and any(f" {phrase_key(w)} " in q for w in words):
            filters.resource_type = actual
            chips.append(Chip("resource_type", actual, actual, True))
            break

    # Institution named in the question -> filter.
    for inst in sorted(index.facet_values("source_institution"), key=len, reverse=True):
        core = phrase_key(re.sub(r"\(.*?\)", "", inst))
        if core and f" {core} " in q:
            filters.institution = inst
            chips.append(Chip("institution", inst, inst, True))
            break

    # Entities: shown as chips, kept in the keyword query as boosts (not hard filters).
    for kind, key in (("community", "communities"), ("place", "places"), ("person", "people"), ("subject", "subjects")):
        for value in sorted(index.facet_values(key), key=len, reverse=True):
            pk = phrase_key(value)
            if pk and f" {pk} " in q and not any(c.label == value for c in chips):
                chips.append(Chip(kind, value, value, False))

    return ParsedQuery(question=question, text_query=text.strip(), filters=filters, chips=chips)
