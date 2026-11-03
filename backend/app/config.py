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
class Settings(BaseModel):
    APP_ENV: str = app_env
    SECRET_KEY: str = configured_secret or secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    DATABASE_URL: str = configured_database_url or "sqlite:///./mentoros.db"
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in (configured_origins or (
            "http://localhost:5173,http://localhost:5174,http://localhost:5175,"
            "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"
        )).split(",")
        if origin.strip()
    ]
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "smollm2:1.7b")
    # AI Provider Selection
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "groq")  # 'groq', 'ollama', 'auto', 'openrouter', 'gemini'
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Custom Remote / Ngrok OpenAI-Compatible Endpoint
    CUSTOM_OPENAI_URL: str = os.getenv("CUSTOM_OPENAI_URL", "")
    CUSTOM_OPENAI_MODEL: str = os.getenv("CUSTOM_OPENAI_MODEL", "smollm2:1.7b")
    CUSTOM_OPENAI_API_KEY: str = os.getenv("CUSTOM_OPENAI_API_KEY", "")
    AI_TIMEOUT: float = float(os.getenv("AI_TIMEOUT", "60.0"))

settings = Settings()
