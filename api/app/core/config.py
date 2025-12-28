from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Railway will provide PORT at runtime (you don't need it locally unless you want)
    ENV: str = "development"

    # CORS - accepts comma-separated string from env or list
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://seira-e1iv.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Optional (for later)
    UPSTASH_REDIS_REST_URL: str | None = None
    UPSTASH_REDIS_REST_TOKEN: str | None = None

    # LLM keys
    ANTHROPIC_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # Claude settings
    CLAUDE_MODEL: str = "claude-haiku-4-5-20251001"
    CLAUDE_MAX_TOKENS: int = 4096
    CLAUDE_TIMEOUT: int = 60  # seconds

    model_config = SettingsConfigDict(
        env_file=".env",          # local only (Railway uses real env vars)
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
