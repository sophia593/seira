from __future__ import annotations

from typing import Any

from upstash_redis import Redis

from app.core.config import get_settings

_redis: Redis | None = None


def get_redis() -> Redis | None:
    """
    Returns a singleton Upstash Redis client.
    Returns None if Upstash credentials are not configured.
    """
    global _redis

    settings = get_settings()

    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        return None

    if _redis is None:
        _redis = Redis(
            url=settings.UPSTASH_REDIS_REST_URL,
            token=settings.UPSTASH_REDIS_REST_TOKEN,
        )

    return _redis


async def cache_get(key: str) -> Any | None:
    """Get a value from cache. Returns None if Redis unavailable or key missing."""
    redis = get_redis()
    if redis is None:
        return None
    return redis.get(key)


async def cache_set(key: str, value: Any, ex: int | None = None) -> bool:
    """
    Set a value in cache.

    Args:
        key: Cache key
        value: Value to store (will be JSON serialized)
        ex: Expiration in seconds (optional)

    Returns:
        True if successful, False if Redis unavailable
    """
    redis = get_redis()
    if redis is None:
        return False
    redis.set(key, value, ex=ex)
    return True


async def cache_delete(key: str) -> bool:
    """Delete a key from cache. Returns False if Redis unavailable."""
    redis = get_redis()
    if redis is None:
        return False
    redis.delete(key)
    return True


async def cache_exists(key: str) -> bool:
    """Check if a key exists. Returns False if Redis unavailable."""
    redis = get_redis()
    if redis is None:
        return False
    return redis.exists(key) > 0
