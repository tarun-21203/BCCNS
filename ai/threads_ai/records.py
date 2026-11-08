"""Loading normalized records (shared schema from the project context, Section 5)."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path
from typing import Any

Record = dict[str, Any]

# Fields shown to the model and used for citation checks, in display order.
EVIDENCE_FIELDS: list[tuple[str, str]] = [
    ("title", "Title"),
    ("description", "Description"),
    ("date_display", "Date"),
    ("people", "People"),
    ("places", "Places"),
    ("communities", "Communities"),
    ("subjects", "Subjects"),
    ("resource_type", "Resource type"),
    ("source_institution", "Held by"),
    ("digitization_status", "Digitization status"),
    ("access_information", "Access"),
]


def _unwrap(payload: Any) -> list[Record]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("records", "results", "items", "data"):
            if isinstance(payload.get(key), list):
                return payload[key]
    raise ValueError("Expected a list of records or an object with a 'records' list")


def load_records(path: Path | None = None, url: str | None = None) -> list[Record]:
    if url:
        with urllib.request.urlopen(url, timeout=15) as resp:  # noqa: S310 - URL comes from our own config
            payload = json.load(resp)
    else:
        assert path is not None
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    records = _unwrap(payload)
    missing = [r.get("id", "?") for r in records if not r.get("id") or not r.get("original_url")]
    if missing:
        raise ValueError(f"Records missing 'id' or 'original_url': {missing[:5]}")
    return records


def field_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return "; ".join(str(v) for v in value if v)
    return str(value)


def evidence_lines(record: Record) -> list[tuple[str, str]]:
    """(label, text) pairs that the model sees and that quotes are checked against."""
    out = []
    for key, label in EVIDENCE_FIELDS:
        text = field_text(record.get(key))
        if text:
            out.append((label, text))
    return out


def evidence_values(record: Record) -> list[str]:
    return [text for _, text in evidence_lines(record)]


def card(record: Record) -> Record:
    """The fields a UI needs to render a citation or Access Card."""
    keys = (
        "id", "title", "source_institution", "source_id", "original_id", "original_url",
        "resource_type", "date_display", "digitization_status", "access_information",
        "access_info_level", "harvested_at", "field_mapping",
    )
    return {k: record.get(k) for k in keys}
