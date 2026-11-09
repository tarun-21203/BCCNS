# Deploying to Vercel

One Vercel project serves both parts from one URL:

- **Website:** `frontend/` is built with Vite and served as static files.
- **API:** `api/index.py` runs the existing FastAPI app (`backend/app/main.py`,
  including the AI routes) as a Python serverless function under `/api`.

Config lives in `vercel.json`, `requirements.txt` (Python deps for the
function) and `.vercelignore`. No app code changes are needed.

## First deploy (dashboard)

1. Sign in at https://vercel.com with GitHub.
2. **Add New → Project**, import the `BCCNS` repository.
   The repo belongs to `tarun-21203`, so the repo owner may need to approve
   Vercel's GitHub app for it. If that isn't possible, use the CLI below.
3. Leave **Root Directory** as the repo root. `vercel.json` sets the build.
4. **Environment Variables:**
   - `GROQ_API_KEY` = a free key from https://console.groq.com/keys
   - optional `THREADS_AI_MODE` = `auto` (live, falls back to saved answers)
     or `cache` (saved answers only, never calls Groq)
5. **Deploy.** Then set **Settings → Git → Production Branch** to the branch
   you want live (e.g. `develop` or `main`).

## Alternative: CLI (no GitHub permissions needed)

```sh
npx vercel login
npx vercel            # preview deploy; answer the setup prompts with defaults
npx vercel env add GROQ_API_KEY
npx vercel --prod     # production deploy
```

## Check after deploying

- `https://<your-app>.vercel.app/api/health` returns `{"status":"ok"}`
- `https://<your-app>.vercel.app/api/ai/health` shows `records_indexed: 13`
- Pages show **no** "Offline sample data" notice
- Refreshing `/threads` or `/search/records/bccns-005` doesn't 404
- Ask the archive answers a demo question

## Notes

- Never commit `.env`; the key lives only in Vercel's settings.
- Groq's free tier allows about 3 questions a minute. If it's exceeded, the
  app falls back to saved answers or matching records.
- If you change `data/`, `ai/threads_ai/` or `mappings/` layout, check
  `includeFiles` in `vercel.json` still covers it.
