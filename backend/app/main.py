import datetime
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base, SessionLocal
from .config import settings
from .rate_limit import RateLimitMiddleware
from .seed import seed_initial_data
from .routers import auth, tasks, projects, calendar, notes, dashboard, ai, invoices, git

logger = logging.getLogger(__name__)

# Initialize database schema and baseline demo data (non-production only)
if settings.APP_ENV != "production":
    try:
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            cursor = conn.connection.cursor()
            if "sqlite" in str(engine.url):
                cursor.execute("PRAGMA table_info(milestones)")
                cols = [c[1] for c in cursor.fetchall()]
                if "estimated_minutes" not in cols:
                    cursor.execute("ALTER TABLE milestones ADD COLUMN estimated_minutes INTEGER DEFAULT 0")
                if "actual_minutes" not in cols:
                    cursor.execute("ALTER TABLE milestones ADD COLUMN actual_minutes INTEGER DEFAULT 0")
            else:
                cursor.execute("""
                    ALTER TABLE milestones ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0;
                    ALTER TABLE milestones ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0;
                """)
            conn.connection.commit()
    except Exception as exc:
        logger.debug("Schema initialization: %s", exc)

    try:
        seed_initial_data(SessionLocal())
    except Exception as exc:
        logger.warning("Database baseline seeding skipped: %s", exc)

app = FastAPI(
    title="MentorOS API",
    description="Backend REST API for MentorOS AI Workspace",
    version="1.0.0",
)

# ── Security Headers Middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com; "
        "frame-src https://accounts.google.com;"
    )
    return response

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(git.router, prefix="/api/v1")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "app": "MentorOS",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
