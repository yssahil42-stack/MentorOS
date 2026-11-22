import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from .config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# If sqlite, set check_same_thread=False
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

is_serverless = os.environ.get("VERCEL") == "1"

engine_kwargs = {
    "connect_args": connect_args,
}
if db_url.startswith("sqlite"):
    engine_kwargs["pool_pre_ping"] = True
elif is_serverless:
    # On Vercel serverless functions with Supabase PgBouncer pooler (port 6543):
    # NullPool avoids connection state corruption across frozen lambdas
    # and reduces connection handshake latency
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,
        "pool_timeout": 20,
    })

engine = create_engine(
    db_url,
    **engine_kwargs,
)

if db_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
