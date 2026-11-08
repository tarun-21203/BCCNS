"""Language Bridge: expand a query with related modern, historical, variant and French terms.

The crosswalk lives in data/crosswalk.json (curated by Member 4) and is a DRAFT FOR COMMUNITY
REVIEW. Expansion only affects which records are found. It never changes record text.

Two file formats are accepted:
- Team format: {"mappings": [{"modern_term", "historical_terms", "rationale", "context_note"?}]}
- Concept format: {"concepts": [{"id", "modern", "historical", "variants", "french", ...}]}
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .records import Record
from .text import phrase_key, token_string

TERM_GROUPS = ("modern", "historical", "variants", "french", "related")


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", phrase_key(text)).strip("_") or "concept"


def concepts_from_team_mappings(mappings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert Member 4's mapping format into concepts.

    The team's `historical_terms` mixes neutral older words ("Port Roseway", "Loyalist") with
    harmful ones ("Book of Negroes"). A context note is shown only for terms that the note itself
    talks about, so a record mentioning "Loyalist" does not get the note written for the
    "Book of Negroes" title.
    """
    concepts = []
    for i, m in enumerate(mappings):
        modern = m.get("modern_term")
        historical = list(m.get("historical_terms") or [])
        note = m.get("context_note")
        note_key = f" {phrase_key(note)} " if note else ""
        concepts.append({
            "id": f"{_slug(modern or 'mapping')}_{i}",
            "label": modern or ", ".join(historical),
            "modern": [modern] if modern else [],
            "historical": historical,
            "note": m.get("rationale"),
            "content_note": note,
            "note_terms": [t for t in historical if note and f" {phrase_key(t)} " in note_key],
        })
    return concepts


@dataclass
class ConceptMatch:
    concept_id: str
    label: str
    matched_term: str
    also_searched: list[str]
    historical_terms: list[str]
    note: str | None

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class Expansion:
    query: str
    matches: list[ConceptMatch] = field(default_factory=list)

    @property
    def added_terms(self) -> list[str]:
        """Terms to add to the search, excluding words the user already typed."""
        typed = token_string(self.query)
        seen: set[str] = set()
        out = []
        for m in self.matches:
            for term in m.also_searched:
                key = phrase_key(term)
                if key and key not in seen and f" {key} " not in typed:
                    seen.add(key)
                    out.append(term)
        return out

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "matched": [m.to_dict() for m in self.matches],
            "added_terms": self.added_terms,
            "status": "Draft terminology map for community review. Not an authoritative vocabulary.",
        }


class LanguageBridge:
    def __init__(self, crosswalk: dict[str, Any]):
        self.status = crosswalk.get("status") or crosswalk.get("_status", "")
        if "mappings" in crosswalk:
            self.concepts = concepts_from_team_mappings(crosswalk["mappings"])
        else:
            self.concepts = list(crosswalk.get("concepts", []))

    @classmethod
    def from_file(cls, path: Path) -> "LanguageBridge":
        return cls(json.loads(Path(path).read_text(encoding="utf-8")))

    @staticmethod
    def _terms(concept: dict[str, Any], groups=TERM_GROUPS) -> list[str]:
        return [t for g in groups for t in concept.get(g, [])]

    def expand(self, query: str) -> Expansion:
        q = token_string(query)
        result = Expansion(query=query)
        for concept in self.concepts:
            # Longest term first so "African Nova Scotian" wins over "Black" in reporting.
            for term in sorted(self._terms(concept), key=len, reverse=True):
                key = phrase_key(term)
                if key and f" {key} " in q:
                    others = [t for t in self._terms(concept) if phrase_key(t) != key]
                    result.matches.append(
                        ConceptMatch(
                            concept_id=concept["id"],
                            label=concept.get("label", concept["id"]),
                            matched_term=term,
                            also_searched=others,
                            historical_terms=list(concept.get("historical", [])),
                            note=concept.get("note"),
                        )
                    )
                    break
        return result

    def content_note_for(self, record: Record) -> str | None:
        """A respectful context note when a record's own wording uses a historical term."""
        if record.get("content_note"):
            return record["content_note"]
        text = token_string(" ".join([
            record.get("title") or "",
            record.get("description") or "",
            " ".join(record.get("original_terms") or []),
        ]))
        for concept in self.concepts:
            note = concept.get("content_note")
            if not note:
                continue
            for term in concept.get("note_terms", concept.get("historical", [])):
                if f" {phrase_key(term)} " in text:
                    return note
        return None
