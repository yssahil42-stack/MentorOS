import os
import secrets
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=root_env)
load_dotenv()

app_env = os.getenv("APP_ENV", "development").strip().lower()
is_production = app_env == "production"
configured_secret = os.getenv("SECRET_KEY")
configured_database_url = os.getenv("DATABASE_URL")
configured_origins = os.getenv("CORS_ORIGINS")
if is_production:
    if not configured_secret or len(configured_secret) < 32:
        raise RuntimeError("Production requires a SECRET_KEY of at least 32 characters.")
    if not configured_database_url or configured_database_url.startswith("sqlite"):
        raise RuntimeError("Production requires a non-SQLite DATABASE_URL.")
    if not configured_origins:
        raise RuntimeError("Production requires explicit CORS_ORIGINS.")
    if any(not origin.strip().startswith("https://") for origin in configured_origins.split(",")):
        raise RuntimeError("Production CORS_ORIGINS must use HTTPS.")
DEV_SECRET_FALLBACK = "mentoros_stable_dev_secret_key_32_bytes_long_minimum_required_for_hs256"

is_vercel = os.getenv("VERCEL") == "1"
default_sqlite = "sqlite:////tmp/mentoros.db" if is_vercel else "sqlite:///./mentoros.db"

class Settings(BaseModel):
    APP_ENV: str = app_env
    SECRET_KEY: str = configured_secret or (secrets.token_urlsafe(32) if is_production else DEV_SECRET_FALLBACK)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    DATABASE_URL: str = configured_database_url or default_sqlite
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in (configured_origins or (
            "http://localhost:5173,http://localhost:5174,http://localhost:5175,"
            "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,"
            "https://mentoros1.vercel.app,https://mentoros-web.vercel.app,"
            "https://mentoros-dev.vercel.app,https://mentoros-hq.vercel.app"
        )).split(",")
        if origin.strip()
    ]
    # AI Provider: Exclusively Groq
    AI_PROVIDER: str = "groq"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    AI_TIMEOUT: float = float(os.getenv("AI_TIMEOUT", "15.0"))
    # Google Identity Services / OAuth Credentials
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    # GitHub Integration
    GITHUB_PERSONAL_ACCESS_TOKEN: str = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN", "")
    GITHUB_USERNAME: str = os.getenv("GITHUB_USERNAME", "yssahil42-stack")

settings = Settings()
