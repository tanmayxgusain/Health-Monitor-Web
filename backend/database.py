
# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker


# SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./healthcare.db"


# engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)


# async_session = sessionmaker(
#     bind=engine,
#     class_=AsyncSession,
#     expire_on_commit=False,
# )

# # Base class for models
# Base = declarative_base()


# async def get_db():
#     async with async_session() as session:
#         yield session

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
import os


# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")


# SQLAlchemy expects async driver format
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+asyncpg://",
        1
    )

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with async_session() as session:
        yield session