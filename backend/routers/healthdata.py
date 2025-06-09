from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import HealthData
from schemas import HealthDataCreate
from datetime import datetime, timedelta

router = APIRouter(prefix="/healthdata", tags=["Health Data"])

@router.get("/latest")
def get_latest_health_data():
    return {
        "heart_rate": 78,
        "blood_pressure": "120/80",
        "spo2": 97
    }

@router.get("/history")
def get_health_history():
    # Generate dummy time-series data
    base_time = datetime.now()
    return {
        "heart_rate": [{"time": (base_time - timedelta(minutes=i)).strftime("%I:%M %p"), "value": 75 + (i % 5)} for i in range(5)],
        "blood_pressure": [{"time": (base_time - timedelta(minutes=i)).strftime("%I:%M %p"), "value": 118 + (i % 4)} for i in range(5)],
        "spo2": [{"time": (base_time - timedelta(minutes=i)).strftime("%I:%M %p"), "value": 95 + (i % 3)} for i in range(5)],
    }

@router.post("/")
def submit_health_data(data: HealthDataCreate, db: Session = Depends(get_db)):
    new_data = HealthData(
        user_id=data.user_id,
        heart_rate=data.heart_rate,
        blood_pressure=data.blood_pressure,
        spo2=data.spo2,
    )
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return {"message": "Health data submitted", "data_id": new_data.id}
