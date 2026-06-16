import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, Session as DBSession
from sqlalchemy.pool import QueuePool

# Import Base from models to ensure all models are registered
from database.models import Base

# Environment variable name as specified in the contract
DATABASE_URL_ENV = "DATABASE_URL"

def get_database_url() -> str:
    """Read DATABASE_URL from environment variable."""
    database_url = os.environ.get(DATABASE_URL_ENV)
    if not database_url:
        raise ValueError(
            f"Environment variable '{DATABASE_URL_ENV}' is not set. "
            "Please set it to a valid PostgreSQL connection string."
        )
    return database_url

def create_db_engine() -> Engine:
    """Create SQLAlchemy engine with connection pooling."""
    database_url = get_database_url()
    
    # Configure connection pooling
    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=False,  # Set to True for SQL logging in development
    )
    return engine

# Create engine and session factory
engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[DBSession, None, None]:
    """
    FastAPI dependency that yields a database session.
    Ensures session is closed after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """
    Create all tables defined in the models.
    This should be called during application startup.
    """
    Base.metadata.create_all(bind=engine)

def check_db_health() -> bool:
    """
    Perform a health check by executing a simple SQL query.
    Returns True if the database is reachable, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False

def drop_all_tables() -> None:
    """
    Drop all tables (for testing/development only).
    """
    Base.metadata.drop_all(bind=engine)