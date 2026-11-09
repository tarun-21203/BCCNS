"""Offline tests for the OpenAI-compatible (Groq) adapter, using a fake HTTP transport."""

from __future__ import annotations

import json

import httpx
import pytest

from threads_ai.config import Settings
from threads_ai.grounding import ANSWER_SCHEMA, GenerationError, OpenAICompatGenerator, make_generator

GOOD = {"answerable": True, "claims": [{"text": "x", "citations": [{"record_id": "r1", "quote": "a b c"}]}], "gaps": ""}


def gen(handler) -> OpenAICompatGenerator:
    return OpenAICompatGenerator("openai/gpt-oss-120b", "https://api.groq.com/openai/v1", "test-key", "low", 10,
                                 transport=httpx.MockTransport(handler))


def ok(content: str, finish="stop") -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}, "finish_reason": finish}]})


def test_request_shape_and_parsing():
    seen = {}

    def handler(request: httpx.Request):
        seen["url"] = str(request.url)
        seen["auth"] = request.headers.get("authorization")
        seen["body"] = json.loads(request.content)
        return ok(json.dumps(GOOD))

    assert gen(handler)("SYS", "USER") == GOOD
    assert seen["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert seen["auth"] == "Bearer test-key"
    body = seen["body"]
    assert body["messages"][0] == {"role": "system", "content": "SYS"}
    assert body["response_format"]["json_schema"]["strict"] is True
    assert body["response_format"]["json_schema"]["schema"] == ANSWER_SCHEMA
    assert body["reasoning_effort"] == "low"


@pytest.mark.parametrize("response, message", [
    (httpx.Response(401, json={"error": {"message": "bad key"}}), "API key"),
    (httpx.Response(429, headers={"retry-after": "12"}, json={}), "rate limit"),
    (httpx.Response(400, json={"error": {"message": "Generated JSON does not match the expected schema"}}), "schema"),
    (ok("not json"), "invalid JSON"),
    (ok(json.dumps(GOOD), finish="length"), "cut off"),
])
def test_failures_become_generation_errors(response, message):
    with pytest.raises(GenerationError, match=message):
        gen(lambda request: response)("s", "u")


def test_network_error_becomes_generation_error():
    def handler(request):
        raise httpx.ConnectError("no network")

    with pytest.raises(GenerationError, match="network"):
        gen(handler)("s", "u")


def test_missing_groq_key_degrades_cleanly(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    g = make_generator(Settings(provider="groq", model="openai/gpt-oss-120b"))
    with pytest.raises(GenerationError, match="GROQ_API_KEY"):
        g("s", "u")


def test_ollama_needs_no_key(monkeypatch):
    monkeypatch.delenv("THREADS_AI_API_KEY", raising=False)
    g = make_generator(Settings(provider="openai", model="qwen2.5:7b"))
    assert isinstance(g, OpenAICompatGenerator)
    assert str(g.client.base_url).startswith("http://localhost:11434/v1")
