import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# If running on Vercel serverless with /tmp SQLite, seed it from mentoros_seed.db if not present
if settings.DATABASE_URL.startswith("sqlite:////tmp/"):
    tmp_path = "/tmp/mentoros.db"
    if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
        backend_dir = Path(__file__).resolve().parent.parent
        seed_path = backend_dir / "mentoros_seed.db"
        if not seed_path.exists():
            seed_path = backend_dir / "mentoros.db"
        if seed_path.exists():
            try:
                shutil.copyfile(str(seed_path), tmp_path)
            except Exception:
                pass

# If sqlite, set check_same_thread=False
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

if settings.DATABASE_URL.startswith("sqlite"):
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
