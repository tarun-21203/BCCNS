"""Vercel serverless entry point for the THREADS API.

Wraps the existing FastAPI app in backend/app/main.py without changing it.
The browser calls /api/..., so the app is mounted under /api (the prefix is
stripped before FastAPI matches routes). It is also mounted at / so the
function works whichever path Vercel forwards.
"""

import sys
from pathlib import Path

from fastapi import FastAPI

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.main import app as threads_api  # noqa: E402

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", threads_api)
app.mount("/", threads_api)
