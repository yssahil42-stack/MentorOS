import asyncio
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    _instances = []

    def __init__(self, app):
        super().__init__(app)
        self._requests: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        self._last_cleanup = time.monotonic()
        RateLimitMiddleware._instances.append(self)

    def reset(self):
        self._requests.clear()

    @classmethod
    def reset_all(cls):
        for inst in cls._instances:
            inst.reset()

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if request.method == "OPTIONS" or path == "/health" or not path.startswith("/api/"):
            return await call_next(request)

        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
        bucket, limit, window_seconds = self._get_bucket(path)
        key = (client_ip, bucket)
        now = time.monotonic()

        async with self._lock:
            timestamps = self._requests[key]
            cutoff = now - window_seconds
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= limit:
                retry_after = max(1, int(window_seconds - (now - timestamps[0])))
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)
            if now - self._last_cleanup >= window_seconds:
                expired = [
                    entry
                    for entry, values in self._requests.items()
                    if not values or values[-1] <= now - window_seconds
                ]
                for entry in expired:
                    self._requests.pop(entry, None)
                self._last_cleanup = now

        return await call_next(request)

    @staticmethod
    def _get_bucket(path: str) -> tuple[str, int, int]:
        if path in {"/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password"}:
            return "auth", 10, 60
        if path == "/api/v1/ai/propose":
            return "ai", 5, 60
        return "api", 120, 60
