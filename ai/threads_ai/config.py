"""Settings, read from environment variables. See ai/README.md for the full list."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = AI_DIR.parent
# Shared team data (owned by Member 1 and Member 4). Same files the main backend serves.
DATA_DIR = REPO_DIR / "data"


def _load_dotenv(path: Path) -> None:
    """Read KEY=value lines from the repo's .env (git-ignored). Real environment variables win."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


_load_dotenv(REPO_DIR / ".env")

DEFAULT_MODELS = {
    "groq": "openai/gpt-oss-120b",
    "openai": "qwen2.5:7b",  # e.g. Ollama at http://localhost:11434/v1
    "anthropic": "claude-opus-5-5",
}
DEFAULT_BASE_URLS = {
    "groq": "https://api.groq.com/openai/v1",
    "openai": "http://localhost:11434/v1",
}


def _path(env: str, default: Path) -> Path:
    value = os.environ.get(env)
    return Path(value).expanduser() if value else default


@dataclass(frozen=True)
class Settings:
    # Where records come from. THREADS_RECORDS_URL (Member 1's API) wins over the file path.
    records_url: str | None = field(default_factory=lambda: os.environ.get("THREADS_RECORDS_URL") or None)
    records_path: Path = field(
        default_factory=lambda: _path("THREADS_RECORDS_PATH", DATA_DIR / "sample" / "records.json")
    )
    crosswalk_path: Path = field(default_factory=lambda: _path("THREADS_CROSSWALK_PATH", DATA_DIR / "crosswalk.json"))
    cache_path: Path = field(default_factory=lambda: _path("THREADS_AI_CACHE_PATH", AI_DIR / "cache" / "responses.json"))

    # live  = call the model, never use the cache
    # auto  = call the model, fall back to a cached real response if the call fails or times out
    # cache = never call the model (offline demo); serve cached responses or records only
    mode: str = field(default_factory=lambda: os.environ.get("THREADS_AI_MODE", "auto").lower())

    # Which model service writes the answer.
    #   groq      = free tier, needs GROQ_API_KEY (default)
    #   openai    = any other OpenAI-compatible server, e.g. Ollama: set THREADS_AI_BASE_URL
    #   anthropic = Claude, needs ANTHROPIC_API_KEY (paid)
    provider: str = field(default_factory=lambda: os.environ.get("THREADS_AI_PROVIDER", "groq").lower())
    model: str = field(default_factory=lambda: os.environ.get("THREADS_AI_MODEL") or DEFAULT_MODELS.get(
        os.environ.get("THREADS_AI_PROVIDER", "groq").lower(), "openai/gpt-oss-120b"))
    base_url: str | None = field(default_factory=lambda: os.environ.get("THREADS_AI_BASE_URL") or None)
    # Reasoning depth for models that support it (Groq gpt-oss: low|medium|high; Claude: effort).
    effort: str = field(default_factory=lambda: os.environ.get("THREADS_AI_EFFORT", "low"))
    timeout_s: float = field(default_factory=lambda: float(os.environ.get("THREADS_AI_TIMEOUT", "45")))

    # Retrieval. 6 records keeps a question at roughly 2.5K tokens, which matters on Groq's free tier.
    top_k: int = field(default_factory=lambda: int(os.environ.get("THREADS_AI_TOP_K", "6")))
    bridge_weight: float = 0.6  # weight of Language Bridge terms relative to the user's own words


def get_settings() -> Settings:
    return Settings()
