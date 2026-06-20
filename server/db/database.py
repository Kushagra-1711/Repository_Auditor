"""
Database connection and session management using SQLAlchemy async.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from config import settings


def _build_engine():
    """
    Create the async engine with PgBouncer-safe settings.

    Supabase routes connections through PgBouncer in transaction mode,
    which does NOT support prepared statements. We must:
      1. Set statement_cache_size=0 in asyncpg connect_args
      2. Set prepared_statement_name_func to None to avoid naming conflicts
      3. Use NullPool — PgBouncer already pools connections for us
    """
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        },
    )


engine = _build_engine()

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db():
    """Dependency that provides a database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)



