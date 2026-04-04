"""
FastAPI middleware — CORS, request timing, request ID, logging.
"""

import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware


def setup_middleware(app: FastAPI, cors_origins: list[str] | None = None):
    """Register all middleware on the FastAPI app."""

    # CORS
    origins = cors_origins or ["http://localhost:3000", "http://localhost:5000"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def timing_and_request_id(request: Request, call_next):
        """Add request ID, measure latency, log request."""
        # Generate or pass-through request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:12])
        start = time.perf_counter()

        response = await call_next(request)

        latency_ms = int((time.perf_counter() - start) * 1000)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(latency_ms)

        # Store latency for use in response bodies
        request.state.latency_ms = latency_ms if hasattr(request, "state") else 0

        return response
