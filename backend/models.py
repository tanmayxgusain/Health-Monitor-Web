from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base

from sqlalchemy import DateTime
from datetime import datetime
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    health_data = relationship("HealthData", back_populates="user")





class HealthData(Base):
    __tablename__ = "healthdata"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    heart_rate = Column(Float)
    blood_pressure = Column(String)
    spo2 = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="health_data")