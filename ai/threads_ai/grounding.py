"""Cite or Stay Silent: generate an answer from retrieved records only, then verify every citation.

Two layers of protection:
1. The model is told to answer only from the supplied records and to attach, to every claim,
   the record ID plus a short passage copied word for word from that record.
2. Code then checks each citation: the record ID must be one we retrieved, and the quote must
   actually appear in that record. Claims with no valid citation are removed before the user
   sees them. If nothing survives, the assistant abstains.

What the check proves: every sentence shown is tied to real text in a real retrieved record.
What it cannot fully prove: that the sentence is a fair reading of that text. That is why the
UI always shows the quote and links to the authoritative record so a person can check.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Protocol

from .records import EVIDENCE_FIELDS, Record, card, evidence_lines, evidence_values
from .text import normalize_for_quote, tokens

SYSTEM_PROMPT = """\
You help people discover Black history records held by archives, libraries and museums in Canada.
You answer questions using ONLY the catalogue records supplied in the user message. These are
metadata descriptions of records held by other institutions, not the records themselves.

Rules:
- Every claim must be supported by the supplied records. Do not use outside knowledge, even if
  you are confident it is true. If a fact is not in the records, it does not go in the answer.
- For every claim, cite at least one record by its id and include a short quote copied
  character for character from one of that record's fields (title, description, date, people,
  places, communities, subjects, resource type, held by, digitization status, access). Copy only
  the text after the field label (write "Photograph of a train", not "Title: Photograph of a
  train"). Prefer a quote of at least a few words that directly supports the claim. If a claim
  relies on two fields, give two citations rather than joining them into one quote.
- Say only what the quoted text states. Do not infer what a collection contains or what period
  it documents beyond the wording of the record. Attribute each claim to the catalogue, and
  keep the record's own relationships between things:
    Record text: "Fonds of Guy Henson, ... whose work included the Africville Relocation Project."
    Wrong: "The Guy Henson fonds includes material on the Africville Relocation Project."
    Right: "The Guy Henson fonds is described as the fonds of a director whose work included the
            Africville Relocation Project."
- Describe what the records show, for example "A 1964-1967 set of committee minutes held by X
  documents ...". Do not turn a catalogue description into a broader historical narrative.
- Some records use outdated or harmful historical terms. Do not use those terms in your own
  words. They may appear only inside a quote, where they are part of the original record.
- Never invent people, dates, events, relationships, collection details or access instructions.
- If the records do not contain enough to answer the question, set "answerable" to false and
  return no claims. Saying the records are insufficient is a correct and valued answer.
- In "gaps", briefly say what the question asked that these records do not cover. Use an empty
  string if nothing is missing.
- Keep the answer short: at most 6 claims, each one or two sentences.
"""

ANSWER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "answerable": {"type": "boolean"},
        "claims": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "citations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "record_id": {"type": "string"},
                                "quote": {"type": "string"},
                            },
                            "required": ["record_id", "quote"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["text", "citations"],
                "additionalProperties": False,
            },
        },
        "gaps": {"type": "string"},
    },
    "required": ["answerable", "claims", "gaps"],
    "additionalProperties": False,
}

MIN_QUOTE_TOKENS = 3  # shorter quotes are accepted only if they equal a whole field value


class GenerationError(RuntimeError):
    pass


class Generator(Protocol):
    model: str

    def __call__(self, system: str, user: str) -> dict[str, Any]: ...


def format_records(records: list[Record]) -> str:
    blocks = []
    for r in records:
        lines = [f'<record id="{r["id"]}">']
        lines += [f"{label}: {text}" for label, text in evidence_lines(r)]
        lines.append("</record>")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def build_user_message(question: str, records: list[Record]) -> str:
    return (
        f"<records>\n{format_records(records)}\n</records>\n\n"
        f"<question>{question}</question>\n\n"
        "Answer using only these records, following the rules."
    )


# ---------------------------------------------------------------- verification

@dataclass
class VerifiedCitation:
    record_id: str
    quote: str
    record: Record

    def to_dict(self) -> dict[str, Any]:
        return {"record_id": self.record_id, "quote": self.quote, **{f"record_{k}": v for k, v in card(self.record).items() if k != "id"}}


@dataclass
class Verification:
    claims: list[dict[str, Any]] = field(default_factory=list)
    removed: list[dict[str, Any]] = field(default_factory=list)
    proposed: int = 0
    citations_checked: int = 0
    citations_rejected: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "claims_proposed": self.proposed,
            "claims_shown": len(self.claims),
            "claims_removed": self.removed,
            "citations_checked": self.citations_checked,
            "citations_rejected": self.citations_rejected,
            "method": "Each citation must name a retrieved record and quote text that appears in it. "
                      "Claims without a valid citation are removed before display.",
        }


_LABEL_PREFIXES = tuple(normalize_for_quote(label) + ":" for _, label in EVIDENCE_FIELDS)


def _strip_label(q: str) -> str:
    """Models sometimes copy the field label too ("Title: ..."), which is what they were shown."""
    for prefix in _LABEL_PREFIXES:
        if q.startswith(prefix):
            return q[len(prefix):].strip()
    return q


_ELLIPSIS_RE = re.compile(r"\s*(?:\.\.\.|…)\s*")


def _quote_ok(quote: str, record: Record) -> tuple[bool, str]:
    """A quote may join fragments with '...'. Every fragment must appear verbatim in the record."""
    values = [normalize_for_quote(v) for v in evidence_values(record)]
    fragments = [f for f in _ELLIPSIS_RE.split(normalize_for_quote(quote)) if f.strip(" .,;:\"'")]
    if not fragments:
        return False, "empty quote"
    for raw in fragments:
        q = _strip_label(raw.strip(" .,;:\"'")).strip(" .,;:\"'")
        if not q or not any(q in v for v in values):
            return False, "quote not found in the cited record"
        if len(tokens(q)) < MIN_QUOTE_TOKENS and not any(q == v.strip(" .") for v in values):
            return False, "quote too short to support a claim"
    return True, ""


def verify(raw: dict[str, Any], retrieved: list[Record]) -> Verification:
    by_id = {r["id"]: r for r in retrieved}
    v = Verification()
    claims = raw.get("claims") or []
    v.proposed = len(claims)
    for claim in claims:
        text = (claim.get("text") or "").strip()
        good: list[VerifiedCitation] = []
        reasons = []
        for c in claim.get("citations") or []:
            v.citations_checked += 1
            rid, quote = str(c.get("record_id", "")), str(c.get("quote", ""))
            record = by_id.get(rid)
            if record is None:
                v.citations_rejected += 1
                reasons.append(f"{rid or '?'}: not a retrieved record")
                continue
            ok, why = _quote_ok(quote, record)
            if not ok:
                v.citations_rejected += 1
                reasons.append(f"{rid}: {why}")
                continue
            good.append(VerifiedCitation(rid, quote, record))
        if text and good:
            v.claims.append({"text": text, "citations": [g.to_dict() for g in good]})
        else:
            v.removed.append({"text": text, "reason": "; ".join(reasons) or "no citation given"})
    return v


# ---------------------------------------------------------------- Claude generator

class ClaudeGenerator:
    """Calls Claude with structured output. Raises GenerationError on any failure."""

    def __init__(self, model: str, effort: str, timeout_s: float):
        import anthropic  # imported lazily so retrieval-only use needs no SDK

        self._anthropic = anthropic
        self.client = anthropic.Anthropic(timeout=timeout_s, max_retries=1)
        self.model = model
        self.effort = effort

    def __call__(self, system: str, user: str) -> dict[str, Any]:
        a = self._anthropic
        try:
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=16000,
                system=system,
                messages=[{"role": "user", "content": user}],
                output_config={
                    "effort": self.effort,
                    "format": {"type": "json_schema", "schema": ANSWER_SCHEMA},
                },
                # If a safety classifier declines, let the API retry on its recommended fallback model.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
        except TypeError as e:
            # The SDK raises TypeError when no credentials can be resolved at all.
            if "authentication" not in str(e).lower():
                raise
            raise GenerationError("No Anthropic credentials found (set ANTHROPIC_API_KEY)") from e
        except a.AuthenticationError as e:
            raise GenerationError("Invalid Anthropic credentials (check ANTHROPIC_API_KEY)") from e
        except a.RateLimitError as e:
            raise GenerationError("Rate limited by the Anthropic API") from e
        except a.APIStatusError as e:
            raise GenerationError(f"Anthropic API error {e.status_code}: {e.message}") from e
        except a.APIConnectionError as e:
            raise GenerationError("Could not reach the Anthropic API (network or timeout)") from e

        if response.stop_reason == "refusal":
            raise GenerationError("The model declined this request")
        if response.stop_reason == "max_tokens":
            raise GenerationError("The answer was cut off (max_tokens)")
        text = next((b.text for b in response.content if b.type == "text"), None)
        if not text:
            raise GenerationError("Empty response from the model")
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise GenerationError("Model returned invalid JSON") from e


# ---------------------------------------------------------------- OpenAI-compatible generator (Groq, Ollama, ...)

class OpenAICompatGenerator:
    """Calls any OpenAI-compatible /chat/completions endpoint with a strict JSON schema.

    Used for Groq's free tier by default. Also works with Ollama (http://localhost:11434/v1).
    Raises GenerationError on any failure so the pipeline can fall back to cache or records.
    """

    def __init__(self, model: str, base_url: str, api_key: str | None, effort: str, timeout_s: float,
                 transport: Any = None):
        import httpx

        self._httpx = httpx
        self.model = model
        self.effort = effort
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self.client = httpx.Client(base_url=base_url.rstrip("/"), headers=headers, timeout=timeout_s,
                                   transport=transport)

    def request_body(self, system: str, user: str) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": 0,
            "max_completion_tokens": 3000,
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "grounded_answer", "strict": True, "schema": ANSWER_SCHEMA},
            },
        }
        if "gpt-oss" in self.model:
            body["reasoning_effort"] = self.effort if self.effort in ("low", "medium", "high") else "low"
        return body

    def __call__(self, system: str, user: str) -> dict[str, Any]:
        httpx = self._httpx
        try:
            resp = self.client.post("/chat/completions", json=self.request_body(system, user))
        except httpx.TimeoutException as e:
            raise GenerationError("The model service timed out") from e
        except httpx.HTTPError as e:
            raise GenerationError("Could not reach the model service (network)") from e

        if resp.status_code in (401, 403):
            raise GenerationError("Missing or invalid API key (set GROQ_API_KEY)")
        if resp.status_code == 429:
            wait = resp.headers.get("retry-after")
            raise GenerationError(f"Free-tier rate limit reached{f', retry in {wait}s' if wait else ''}")
        if resp.status_code >= 400:
            try:
                detail = resp.json().get("error", {}).get("message", "")
            except ValueError:
                detail = resp.text[:200]
            raise GenerationError(f"Model service error {resp.status_code}: {detail}")

        try:
            choice = resp.json()["choices"][0]
            if choice.get("finish_reason") == "length":
                raise GenerationError("The answer was cut off (token limit)")
            content = choice["message"]["content"]
            return json.loads(content)
        except GenerationError:
            raise
        except (KeyError, IndexError, TypeError, ValueError) as e:
            raise GenerationError("Model returned an unexpected or invalid JSON response") from e


def make_generator(settings: Any) -> "GeneratorFn":
    """Build the generator for settings.provider. Keys are read from the environment, never from code."""
    import os

    from .config import DEFAULT_BASE_URLS

    provider = settings.provider
    if provider == "anthropic":
        return ClaudeGenerator(settings.model, settings.effort, settings.timeout_s)
    if provider in ("groq", "openai"):
        key = os.environ.get("GROQ_API_KEY") if provider == "groq" else os.environ.get("THREADS_AI_API_KEY")
        if provider == "groq" and not key:
            return _Unavailable("No Groq API key found (set GROQ_API_KEY)")
        base_url = settings.base_url or DEFAULT_BASE_URLS[provider]
        return OpenAICompatGenerator(settings.model, base_url, key, settings.effort, settings.timeout_s)
    return _Unavailable(f"Unknown THREADS_AI_PROVIDER '{provider}' (use groq, openai or anthropic)")


class _Unavailable:
    """Stands in for a generator that can't run, so the pipeline degrades to records-only."""

    model = None

    def __init__(self, reason: str):
        self.reason = reason

    def __call__(self, system: str, user: str) -> dict[str, Any]:
        raise GenerationError(self.reason)


GeneratorFn = Callable[[str, str], dict[str, Any]]
