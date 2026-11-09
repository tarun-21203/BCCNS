# Demo runbook

Owner: Member 5. One researcher journey through every module. About 5 minutes.

**Live site:** https://bccns.vercel.app (deployed from `main`; nothing to start).
Use the local setup below only as a backup if the network is unreliable.

## 1. Backup: run locally (two terminals, from the repo root)

```sh
# API (records + AI)
python -m uvicorn app.main:app --app-dir backend --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

**No network or no Groq key?** Set `THREADS_AI_MODE=cache` in `.env` before
starting the API. The four demo questions then come from saved real answers
(`ai/cache/responses.json`). If the API is down entirely, every page falls back
to bundled sample data and shows an "Offline sample data" notice.

## 2. Pre-demo checklist

- [ ] `python scripts/validate.py` prints `OK`
- [ ] `node frontend/src/modules/threads/lib/graph.check.mjs` shows no `FAIL`
- [ ] `node frontend/src/modules/map/lib/coverage.check.mjs` shows no `FAIL`
- [ ] `cd ai && python -m pytest -q tests` passes
- [ ] https://bccns.vercel.app/api/health returns `{"status":"ok"}`
- [ ] https://bccns.vercel.app/api/ai/health shows `records_indexed: 13`
- [ ] Ask one demo question on the live site to confirm Groq answers
- [ ] **Click the two LAC record links by hand** (`bccns-005`, `bccns-006`).
      They sit behind a Cloudflare check that blocks scripts, so they can't be
      verified automatically. All other record links returned 200 on Nov 8.
- [ ] Map tiles (home page and Silence Map) load from the internet; without a
      connection the map background is blank but markers and counts still work
- [ ] Browser zoom 100%, no other tabs, open on the home page

## 3. Demo path

| # | Where | Do | Say |
|---|---|---|---|
| 1 | Home `/search` | Point at the headline and the "13 records from 3 institutions" line | Black history records are spread across institutions with different catalogues. THREADS is one place to find them. This is a small demo sample. |
| 2 | Search | Type **Black Loyalist**, press Search | Results come from Library and Archives Canada and Nova Scotia Archives, in one common format. |
| 3 | Results | Point at "Also searched *Book of Negroes, Loyalist*" | **Language Bridge**: modern words find records catalogued with historical terms. The term list is a draft for community review. |
| 4 | Card: *Book of Negroes, 1783* | Point at Held by, How to access ("From the record"), dashed tags. Click **View details** | **Access Card**: who holds it, how to reach it, and what came from the source vs. what THREADS added (dashed). |
| 5 | Record page | Open **Record provenance**. Click **Open at Library and Archives Canada** | Provenance: original ID, harvest date, field mapping. We link to the original; we don't copy it. |
| 6 | `/ask` | Click **What records document the Africville relocation?** | **Cite or Stay Silent**: every statement cites a record, checked in code. |
| 7 | `/ask` | Click **What was Viola Desmond's favourite song?** | When the records don't answer it, it says so instead of guessing. |
| 8 | `/map` | Read the disclaimer. Click **Africville**, then point at the "Limited indexed coverage" list | **Silence Map**: what our index covers, not how much history exists. Low coverage = where to index next. |
| 9 | Map panel | Click **See connections in Thread View** | |
| 10 | `/threads` | Click a dashed line, then pick **Birchtown** in "Start from" | **Thread View**: records from different institutions linked through shared places and subjects. Every line opens the record that supports it. |
| 11 | Close | | "THREADS does not replace archives or move their collections. It gives people one trusted place to discover what exists across them, understand where the original material lives, and follow the evidence back to the institutions that hold it." |

## 4. If something breaks

- **AI slow or failing:** it falls back to the saved answer automatically; keep going.
- **API crashed:** pages switch to offline sample data; restart the API when convenient.
- **An external link fails:** show the Access Card's provenance instead; the original ID and institution are still there.

## 5. Questions to be ready for

- *How do you add an institution?* Write one mapping file in `mappings/`; no new code.
- *Is the data real?* Yes, real catalogue entries with their real IDs and links, a small hand-picked sample.
- *What did THREADS add?* Community and place tags, shown dashed and listed in `derived_fields` as curated and reviewed.
- *Why only 13 records?* Two-day proof of concept; the design is meant to scale by adding sources.
