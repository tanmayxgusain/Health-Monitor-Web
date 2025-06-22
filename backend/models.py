from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from database import Base
from datetime import datetime
from sqlalchemy.orm import relationship, declarative_base

from sqlalchemy.future import select
from database import async_session  # Make sure this is imported
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine







class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    profile_pic = Column(String, nullable=True)
    password = Column(String, nullable=True)

    # ➕ Add these new columns:
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)

    health_data = relationship("HealthData", back_populates="user")

    @classmethod
    async def get_by_email(cls, db: AsyncSession, email: str):
        async with async_session() as session:
            # result = await session.execute(select(cls).where(cls.email == email))
            result = await db.execute(select(cls).where(cls.email == email))
            return result.scalars().first()




class HealthData(Base):
    __tablename__ = "healthdata"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_type = Column(String)  # e.g., heart_rate, spo2, blood_pressure
    value = Column(Float, nullable=True)
    systolic = Column(Integer, nullable=True)
    diastolic = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="health_data")