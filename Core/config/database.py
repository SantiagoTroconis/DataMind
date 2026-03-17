import os
from dotenv import load_dotenv

# Load .env before reading env vars — database.py is imported at module level
# before create_app() has a chance to call load_dotenv()
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'mysql+pymysql://root:albert03$@localhost:3306/DataMind_DB?charset=utf8mb4'
)

# SQLite does not support pool_size / max_overflow — use minimal kwargs for it
_is_sqlite = DATABASE_URL.startswith('sqlite')
_engine_kwargs = {
    'echo': False,
    'pool_pre_ping': True,
}
if not _is_sqlite:
    _engine_kwargs['pool_size'] = 10
    _engine_kwargs['max_overflow'] = 20

engine = create_engine(DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
