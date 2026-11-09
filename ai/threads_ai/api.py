"""HTTP API for the AI module.

Run standalone:   uvicorn threads_ai.api:app --reload --port 8003
Mount in the main app (Member 5):
    from threads_ai.api import router as ai_router
    app.include_router(ai_router)
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from fastapi import APIRouter, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .pipeline import Engine


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return Engine.from_settings()


class AskRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    filters: dict[str, Any] | None = Field(
        default=None,
        description="Optional explicit filters from the UI: institution, resource_type, date_from, date_to, "
                    "place, community, person, subject, digitization_status. These override parsed ones.",
    )
    limit: int | None = Field(default=None, ge=1, le=20, description="Max records retrieved (default 8)")


router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/search")
def ai_search(req: AskRequest) -> dict[str, Any]:
    """Grounded natural-language answer with verified citations, or an explicit abstention."""
    out = get_engine().ask(req.question, req.filters, k=req.limit)
    # Kept from the original placeholder contract in backend/app/main.py.
    out["sufficient_evidence"] = out.get("status") == "answered"
    return out


@router.get("/records")
def keyword_search(q: str = Query(..., min_length=1), k: int = Query(20, ge=1, le=100)) -> dict[str, Any]:
    """Keyword search with Language Bridge expansion and no AI. Usable by the main search page."""
    return get_engine().search_records(q, k=k)


@router.get("/expand")
def expand(q: str = Query(..., min_length=1)) -> dict[str, Any]:
    """Show which Language Bridge terms a query would add."""
    return get_engine().bridge.expand(q).to_dict()


@router.get("/health")
def health() -> dict[str, Any]:
    e = get_engine()
    s = e.settings
    return {
        "records_indexed": len(e.records),
        "records_source": s.records_url or str(s.records_path),
        "mode": s.mode,
        "provider": s.provider,
        "model": s.model,
        "crosswalk_concepts": len(e.bridge.concepts),
        "crosswalk_status": "draft for community review",
    }


app = FastAPI(title="THREADS AI search", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
