from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "AutoGuardian API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field("change-me", env="SECRET_KEY")
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 14

    sqlalchemy_database_uri: str = Field("sqlite:///./dev.db", env="DATABASE_URL")
    alembic_ini_path: Path = Path(__file__).resolve().parents[2] / "alembic.ini"

    allowed_origins: List[str] = Field(default_factory=lambda: ["*"], env="ALLOWED_ORIGINS")
    redis_url: str = Field("redis://redis:6379/0", env="REDIS_URL")
    minio_endpoint: str | None = Field(None, env="MINIO_ENDPOINT")
    minio_access_key: str | None = Field(None, env="MINIO_ACCESS_KEY")
    minio_secret_key: str | None = Field(None, env="MINIO_SECRET_KEY")
    minio_bucket: str = Field("autoguardian-docs", env="MINIO_BUCKET")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
