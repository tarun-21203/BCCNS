# THREADS AI module (Member 3)

Natural-language search ("Ask the archive"), the Language Bridge, and **Cite or Stay Silent** answers.

```
question ─► parse into chips ─► Language Bridge ─► retrieve records ─► LLM ─► verify citations ─► answer or abstain
            (dates, type,       (data/crosswalk.json) (BM25 + filters)            (record ID must be retrieved;
             institution)                                                           quote must appear in it)
```

- **Free model by default:** answers are written by `openai/gpt-oss-120b` on **Groq's free tier**. Claude or a local Ollama model are one setting away.
- **Grounded:** the model sees only the retrieved records and must cite a record ID plus an exact quote for every claim.
- **Verified in code:** a claim whose citation names a record we didn't retrieve, or quotes text that isn't in that record, is removed before display.
- **Stays silent:** no matching records → abstains without calling the model. The model says the records don't answer it, or every claim fails verification → abstains.
- **Language Bridge:** reads Member 4's `data/crosswalk.json`. "Black Loyalist" also finds the record titled *Book of Negroes, 1783*; "Shelburne" also searches "Port Roseway". Context notes appear only on records whose own wording uses the term the note discusses. Record text is never changed.
- **Demo resilience:** if the live call fails, it serves a cached **real** answer, or falls back to showing matching records.

Where things live:

| Piece | Path |
|---|---|
| Python package | `ai/threads_ai/` |
| Mounted in the main API | `backend/app/main.py` → `app.include_router(ai_router)` |
| Frontend page `/ask` | `frontend/src/modules/ask/` |
| Records / crosswalk (shared) | `data/sample/records.json`, `data/crosswalk.json` |
| Test-only fictional fixtures | `ai/tests/fixtures/` |

## Setup

> **Keep the virtual environment outside the repo.** This repo sits in an iCloud-synced Desktop folder, and iCloud stalls reads of the thousands of small files in a venv, which makes Python hang at random. A venv in your home folder avoids that.

```bash
uv venv --python 3.12 ~/.venvs/bccns
uv pip install --python ~/.venvs/bccns/bin/python -r ai/requirements.txt
# or: python3 -m venv ~/.venvs/bccns && ~/.venvs/bccns/bin/pip install -r ai/requirements.txt

cp .env.example .env               # from the repo root; .env is git-ignored
# then put a free key from https://console.groq.com/keys into .env as GROQ_API_KEY=...
```

Without a key everything still works except the written answer: `/ask` shows matching records instead.

**Groq free-tier limits** (check your account's limits page): about 8,000 tokens per minute and 200,000 per day. One question is about 2,500 tokens, so **about 3 questions a minute and ~80 a day**. If you hit the limit, the API falls back to a saved answer or to records. Save the demo answers in advance (below).

## Run

```bash
# Whole API (Member 1's routes + /ai/*), from the repo root:
~/.venvs/bccns/bin/uvicorn app.main:app --app-dir backend --reload --port 8000

# Frontend (proxies /api to :8000), then open http://localhost:5173/ask
cd frontend && npm install && npm run dev

# Just this module, from ai/:
~/.venvs/bccns/bin/python -m pytest -q tests                      # offline, no key needed
~/.venvs/bccns/bin/python -m threads_ai.cli "What records document the Africville relocation?"
~/.venvs/bccns/bin/python -m threads_ai.cli --records-only "Black Loyalist"
```

## API

| Endpoint | Purpose |
|---|---|
| `POST /ai/search` `{"question", "filters"?, "limit"?}` | Grounded answer with verified citations, or an abstention |
| `GET /ai/records?q=...` | Keyword search **with Language Bridge**, no AI. The search page can use it |
| `GET /ai/expand?q=...` | Which terms the Language Bridge would add |
| `GET /ai/health` | Records indexed, mode, model |

Optional `filters` (override ones parsed from the question): `institution`, `resource_type`, `date_from`, `date_to`, `place`, `community`, `person`, `subject`, `digitization_status`.

### `POST /ai/search` response

```jsonc
{
  "status": "answered",            // or "insufficient_evidence" | "records_only" (model unavailable)
  "sufficient_evidence": true,     // kept from the original placeholder contract
  "answer": {"claims": [{
      "text": "...",
      "citations": [{"record_id": "bccns-013", "quote": "exact words from the record",
                     "record_title": "...", "record_source_institution": "...", "record_original_id": "...",
                     "record_original_url": "...", "record_access_information": "...", "record_access_info_level": "..."}]
  }]},
  "message": "...",                 // shown when there is no answer
  "gaps": "What the records don't cover",
  "suggested_next_steps": ["..."],  // on abstention
  "understood": {"text_query": "...", "filters": {...},
                 "chips": [{"kind": "community", "label": "Africville", "applied_as_filter": false}, ...]},
  "language_bridge": {"matched": [{"matched_term": "relocation", "also_searched": [...], "historical_terms": [...], "note": "..."}],
                      "added_terms": [...], "status": "Draft terminology map for community review..."},
  "records": [{"record": {...full record...}, "score": 3.1, "matched_terms": [...],
               "found_via_bridge": false, "content_note": "..."}],
  "verification": {"claims_proposed": 3, "claims_shown": 2, "claims_removed": [{"text": "...", "reason": "..."}],
                   "citations_checked": 4, "citations_rejected": 1, "method": "..."},
  "served_from": "live",            // "cache" | "rules" (abstained before calling the model) | "retrieval_only"
  "disclaimer": "Answers use only the catalogue records in the sources indexed by this prototype..."
}
```

## Before the demo

```bash
cd ai
~/.venvs/bccns/bin/python scripts/build_cache.py         # runs the demo questions live and saves the real answers (~2 min, paced for Groq)
~/.venvs/bccns/bin/python eval/run_eval.py               # trust scorecard for the pitch slide (~6 min, paced for Groq)
~/.venvs/bccns/bin/python eval/run_eval.py --retrieval   # offline retrieval check (currently 11/11)
export THREADS_AI_MODE=cache                             # optional: fully offline demo from saved answers
```

Demo questions are in `scripts/demo_questions.json` and match the example buttons on `/ask`. Re-run `build_cache.py` after any change to the records, crosswalk or prompt.

## Trust scorecard

Live run on Nov 7, 2026: `openai/gpt-oss-120b` on Groq, 13 records in `data/sample/records.json`, 14 questions in `eval/questions.json`.

| | Result |
|---|---|
| Answerable questions answered | **8 / 8** |
| Unanswerable questions correctly refused | **6 / 6** (e.g. "What was Viola Desmond's favourite song?" — her record exists but doesn't say) |
| Statements proposed by the model | 13 |
| Statements shown, every one tied to an exact quote from a retrieved record | 13 |
| Uncited statements shown to users | **0** (guaranteed by the citation check) |
| Retrieval: expected records found in the top 5 | 11 / 11 |

Re-run with `eval/run_eval.py` after changing records, crosswalk or prompt. Results vary a little between runs because the model does.

## Settings

| Variable | Default | |
|---|---|---|
| `GROQ_API_KEY` | – | Free key for AI answers (put it in `.env`) |
| `THREADS_AI_PROVIDER` | `groq` | `groq`; `openai` (any OpenAI-compatible server, e.g. Ollama); `anthropic` (Claude, paid, needs `pip install anthropic` + `ANTHROPIC_API_KEY`) |
| `THREADS_AI_MODEL` | `openai/gpt-oss-120b` | Groq alternatives: `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` |
| `THREADS_AI_BASE_URL` | per provider | e.g. `http://localhost:11434/v1` for Ollama |
| `THREADS_AI_MODE` | `auto` | `live`, `auto` (fall back to cache), `cache` (offline) |
| `THREADS_AI_EFFORT` | `low` | Reasoning depth for gpt-oss (`low`/`medium`/`high`); higher uses more of the free quota |
| `THREADS_AI_TIMEOUT` | `45` | seconds |
| `THREADS_AI_TOP_K` | `6` | records passed to the model |
| `THREADS_RECORDS_PATH` / `THREADS_RECORDS_URL` | `data/sample/records.json` | where records come from |
| `THREADS_CROSSWALK_PATH` | `data/crosswalk.json` | |

## Honest limits

- The citation check proves every shown sentence is tied to real text in a real retrieved record. It can't fully prove the sentence is a fair reading of that text, which is why the quote and the authoritative link are always shown.
- Retrieval is keyword-based (BM25 + Language Bridge). Embeddings could be added later for fuzzier matching.
- Answers can only be as rich as the catalogue metadata. They describe what records exist, not full histories.
