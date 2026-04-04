"""
Dependency injection for FastAPI.

Provides model registry and services to router handlers.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.model_registry import ModelRegistry

# Global singleton — initialized at startup
_registry: ModelRegistry | None = None


def init_registry(model_dir: str = "models/artifacts") -> ModelRegistry:
    """Initialize the global model registry (called once at startup)."""
    global _registry
    _registry = ModelRegistry(model_dir)
    return _registry


def get_registry() -> ModelRegistry:
    """FastAPI dependency — returns the loaded model registry."""
    if _registry is None:
        raise RuntimeError("Model registry not initialized. Call init_registry() first.")
    return _registry
