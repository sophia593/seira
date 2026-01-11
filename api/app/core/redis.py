"""
Async Redis cache wrapper for Upstash.

All cache operations are fail-safe - errors are logged but don't crash requests.
"""

from __future__ import annotations

import logging
from typing import Any

from upstash_redis.asyncio import Redis

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Singleton instance
_redis: Redis | None = None
_redis_checked: bool = False  # Track if we've already checked credentials


def get_redis() -> Redis | None:
    """
    Returns a singleton async Upstash Redis client.
    Returns None if Upstash credentials are not configured.
    """
    global _redis, _redis_checked

    # Only check settings once
    if _redis_checked:
        return _redis

    settings = get_settings()

    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        logger.info("Redis not configured - caching disabled")
        _redis_checked = True
        return None

    _redis = Redis(
        url=settings.UPSTASH_REDIS_REST_URL,
        token=settings.UPSTASH_REDIS_REST_TOKEN,
    )
    _redis_checked = True
    logger.info("Redis client initialized")

    return _redis


async def cache_get(key: str) -> Any | None:
    """
    Get a value from cache.

    Returns None if Redis unavailable, key missing, or on error.
    Errors are logged but don't propagate.
    """
    redis = get_redis()
    if redis is None:
        return None

    try:
        return await redis.get(key)
    except Exception as e:
        logger.warning(f"Redis GET failed for {key}: {e}")
        return None


async def cache_set(key: str, value: Any, ex: int = 300) -> bool:
    """
    Set a value in cache.

    Args:
        key: Cache key
        value: Value to store (will be JSON serialized by Upstash)
        ex: Expiration in seconds (default: 5 minutes)

    Returns:
        True if successful, False if Redis unavailable or on error
    """
    redis = get_redis()
    if redis is None:
        return False

    try:
        await redis.set(key, value, ex=ex)
        return True
    except Exception as e:
        logger.warning(f"Redis SET failed for {key}: {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Delete a key from cache. Returns False if Redis unavailable or on error."""
    redis = get_redis()
    if redis is None:
        return False

    try:
        await redis.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Redis DELETE failed for {key}: {e}")
        return False


async def cache_exists(key: str) -> bool:
    """Check if a key exists. Returns False if Redis unavailable or on error."""
    redis = get_redis()
    if redis is None:
        return False

    try:
        result = await redis.exists(key)
        return result > 0
    except Exception as e:
        logger.warning(f"Redis EXISTS failed for {key}: {e}")
        return False
