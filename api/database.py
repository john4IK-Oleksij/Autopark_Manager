import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("MYSQL_URL")
if not DATABASE_URL:
    raise RuntimeError("The DATABASE_URL environment variable must be set")

# Railway / хмарні хостинги задають 'mysql://...', для pymysql потрібна схема 'mysql+pymysql://'
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()
