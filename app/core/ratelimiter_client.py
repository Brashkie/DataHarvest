"""
DataHarvest — client for the Rust/Axum rate-limiter/dedup sidecar (ratelimiter/).

Fail-open by design: any connectivity problem with the sidecar must never
block or fail a scrape job — it degrades back to "no shared rate-limit/dedup",
which is the status quo before this service existed. Only connection/timeout
errors are treated this way; a bad API key or a real 5xx from the sidecar
propagates as an exception, since that's a bug we want visible.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx
from loguru import logger

from app.core.config import settings

_TIMEOUT = httpx.Timeout(connect=0.2, read=0.3, write=0.2, pool=0.2)  # ~500ms worst case
_NETWORK_ERRORS = (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout, httpx.TimeoutException)

_client: Optional[httpx.Client] = None


def _get_client() -> httpx.Client:
    global _client
    if _client is None:
        headers = {"x-api-key": settings.RATELIMITER_API_KEY} if settings.RATELIMITER_API_KEY else {}
        _client = httpx.Client(
            base_url=f"http://{settings.RATELIMITER_HOST}:{settings.RATELIMITER_PORT}",
            headers=headers,
            timeout=_TIMEOUT,
        )
    return _client


@dataclass
class RateCheckResult:
    allowed: bool
    retry_after_ms: int = 0
    degraded: bool = False


@dataclass
class DedupCheckResult:
    seen: bool
    degraded: bool = False


def check_rate_limit(domain: str, max_rps: Optional[int] = None) -> RateCheckResult:
    """Consume a rate-limit slot for `domain`. Fails open on network errors."""
    try:
        resp = _get_client().post(
            "/rate/check",
            json={"domain": domain, "max_rps": max_rps or settings.RATELIMITER_DEFAULT_MAX_RPS},
        )
        resp.raise_for_status()
        body = resp.json()
        return RateCheckResult(allowed=body["allowed"], retry_after_ms=body.get("retry_after_ms", 0))
    except _NETWORK_ERRORS as e:
        logger.warning(f"[ratelimiter] rate/check unreachable ({type(e).__name__}) — failing open, domain={domain}")
        return RateCheckResult(allowed=True, degraded=True)


def check_and_mark_seen(url: str, ttl_secs: Optional[int] = None) -> DedupCheckResult:
    """Atomically check-and-mark `url` as seen. Fails open on network errors."""
    payload: dict = {"url": url}
    if ttl_secs is not None:
        payload["ttl_secs"] = ttl_secs
    try:
        resp = _get_client().post("/dedup/check", json=payload)
        resp.raise_for_status()
        return DedupCheckResult(seen=resp.json()["seen"])
    except _NETWORK_ERRORS as e:
        logger.warning(f"[ratelimiter] dedup/check unreachable ({type(e).__name__}) — failing open, url={url}")
        return DedupCheckResult(seen=False, degraded=True)
