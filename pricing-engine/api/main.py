"""
FastAPI application factory.

Creates the app, loads models at startup, and registers all routers.
Start with: python scripts/run_server.py
"""

import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.dependencies import get_registry, init_registry
from api.middleware import setup_middleware
from api.routers import claims, data_quality, es_ai, hallucination, health, legacy_oracle

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load models. Shutdown: cleanup."""
    print()
    print(f"{'═'*64}")
    print(f"  {'GuideWire ES-AI — FastAPI Server Starting':^60}")
    print(f"{'═'*64}")
    print()

    t0 = time.time()

    # Initialize model registry
    print("┌─ Loading Model Artifacts")
    print("│")
    registry = init_registry(model_dir="models/artifacts")
    status = registry.load(verbose=True)
    print("│")

    if registry.is_loaded:
        print(f"│  ✅ All models loaded successfully ({time.time()-t0:.1f}s)")
    else:
        missing = [k for k, v in status.items() if v != "loaded"]
        print(f"│  ⚠ Some models missing: {missing}")
        print(f"│  Server will start in degraded mode.")
    print(f"└─")
    print()

    # Print endpoint summary
    print("┌─ Registered Endpoints")
    print("│")
    print("│  Health:")
    print("│    GET  /health")
    print("│    GET  /v1/health")
    print("│")
    print("│  Model Scoring (gig-app spec):")
    print("│    POST /v1/claims/acceptance-score")
    print("│    POST /v1/claims/rejection-score")
    print("│    POST /v1/claims/fraud-score")
    print("│")
    print("│  ES-AI Predictions (corporate dashboard spec):")
    print("│    POST /es-ai/predict")
    print("│    POST /es-ai/decision/accept")
    print("│    POST /es-ai/decision/reject")
    print("│    POST /es-ai/decision/fraud")
    print("│")
    print("│  Utilities:")
    print("│    POST /es-ai/data-quality")
    print("│    POST /es-ai/hallucination-check")
    print("│")
    print(f"└─ Total: 11 endpoints")
    print()
    print(f"{'═'*64}")
    print(f"  Server ready at http://localhost:8000")
    print(f"  Swagger docs at http://localhost:8000/docs")
    print(f"{'═'*64}")
    print()

    yield  # Server is running

    # Shutdown
    print("\n  🛑 ES-AI server shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="GuideWire ES-AI",
        description=(
            "ML-powered claim acceptance, rejection, and fraud detection "
            "for gig worker insurance. Serves XGBoost models via REST API."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    # Middleware
    setup_middleware(app)

    # Routers
    app.include_router(health.router)
    app.include_router(claims.router)
    app.include_router(es_ai.router)
    app.include_router(data_quality.router)
    app.include_router(hallucination.router)
    app.include_router(legacy_oracle.router)

    return app


# Module-level app instance (for uvicorn)
app = create_app()
