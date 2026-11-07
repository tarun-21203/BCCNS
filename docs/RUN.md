# Running the API

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000
```

Then open:

- `http://localhost:8000/health`
- `http://localhost:8000/records?search=Birchtown`
- `http://localhost:8000/records/bccns-005`
- `http://localhost:8000/records?community=Africville`
- `http://localhost:8000/communities`
- `http://localhost:8000/coverage`
- `http://localhost:8000/entities/Birchtown/relationships`
- `http://localhost:8000/mappings`
- `http://localhost:8000/crosswalk`

`POST /ai/search` accepts `{"question": "..."}` and returns matching
records with citations. It is retrieval only: it does not generate an
answer. When no records match, it reports `sufficient_evidence: false`.

Validate the dataset at any time with:

```sh
python3 scripts/validate.py
```
