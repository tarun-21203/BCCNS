"""Demo-resilience cache. Holds REAL pipeline outputs only (written by scripts/build_cache.py)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .text import phrase_key


def cache_key(question: str, filters: dict[str, Any] | None) -> str:
    return phrase_key(question) + "|" + json.dumps(filters or {}, sort_keys=True)


class ResponseCache:
    def __init__(self, path: Path):
        self.path = Path(path)
        self._data: dict[str, Any] = {}
        if self.path.exists():
            self._data = json.loads(self.path.read_text(encoding="utf-8")).get("responses", {})

    def get(self, question: str, filters: dict[str, Any] | None) -> dict[str, Any] | None:
        entry = self._data.get(cache_key(question, filters))
        return json.loads(json.dumps(entry)) if entry else None  # defensive copy

    def put(self, question: str, filters: dict[str, Any] | None, response: dict[str, Any]) -> None:
        entry = dict(response)
        entry["cached_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        self._data[cache_key(question, filters)] = entry

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "_notice": "Real outputs of the THREADS AI pipeline over the indexed records, saved for offline demo use. "
                       "Never hand-edit. Regenerate with: python scripts/build_cache.py",
            "responses": self._data,
        }
        self.path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
