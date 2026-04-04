"""
Health check routers.

GET /health         — basic liveness (es-ai-endpoints.md §1)
GET /v1/health      — detailed model status (gig-app spec)
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from api.dependencies import get_registry
from api.schemas.responses import HealthResponse, ModelStatus, V1HealthResponse
from services.model_registry import ModelRegistry

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic liveness check — GET /health"""
    return {"status": "ok"}


@router.get("/v1/health", response_model=V1HealthResponse)
async def v1_health(registry: ModelRegistry = Depends(get_registry)):
    """Detailed health with model load status — GET /v1/health"""
    statuses = {
        "acceptance": "loaded" if registry.acceptance_model else "not_loaded",
        "rejection": "loaded" if registry.rejection_model else "not_loaded",
        "fraud": "loaded" if registry.fraud_model else "not_loaded",
    }
    return {
        "status": "ok" if registry.is_loaded else "degraded",
        "service": "es-ai-fastapi",
        "models": statuses,
    }
