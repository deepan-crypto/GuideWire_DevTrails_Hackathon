"""
Application configuration via environment variables.
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration loaded from environment / .env file."""

    # ── FastAPI ──
    FASTAPI_VERSION: str = "v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "info"

    # ── CORS ──
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5000"

    # ── Paths ──
    MODEL_DIR: str = "models/artifacts"
    DATA_DIR: str = "data/synthetic"

    # ── Derived ──
    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def model_path(self) -> Path:
        return Path(self.MODEL_DIR)

    @property
    def data_path(self) -> Path:
        return Path(self.DATA_DIR)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
