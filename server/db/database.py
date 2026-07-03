"""
Database connection and session management using SQLAlchemy async.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from config import settings

import uuid


def _build_engine():
    """
    Create the async engine with PgBouncer-safe settings.

    Supabase routes connections through PgBouncer in transaction mode,
    which recycles backend connections. asyncpg's default naming scheme
    (__asyncpg_stmt_1__, __asyncpg_stmt_2__, ...) collides when PgBouncer
    hands a recycled connection that already has those names registered.
    """ 
    """                                                                 
    Fix: UUID-based names guarantee global uniqueness across all sessions.
    """
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args={
            # Disable asyncpg's LRU prepared statement cache
            "statement_cache_size": 0,
            # Use globally unique names so PgBouncer recycled connections
            # never see a duplicate prepared statement name
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4().hex}__",
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



