# Ask the archive (Member 3)

Route: `/ask` (supports `/ask?q=...` so other modules can link to a question).

Calls `POST /api/ai/search` (see `ai/README.md` for the response shape) and shows:

- **Searched for** chips: what was parsed from the question (filters are outlined).
- **Language Bridge**: which related and older catalogue terms were also searched, with the curator's note.
- **Answer**: each statement with numbered citations; a Sources list with the exact quote from the catalogue record, a link to the Access Card (`recordHref`) and to the original record.
- **Verification**: how many statements passed the citation check, and what was removed and why.
- **Not enough evidence**: what's missing and next steps, instead of a guess.
- **Records searched**: every retrieved record with institution, original ID, original link, access level, content note and a "Found via Language Bridge" badge.

If the API can't be reached, it shows keyword matches from the shared `data/sample/records.json` and never shows an AI answer.
