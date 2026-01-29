# /backend/routers/personalized_ai.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
import pytz
import os
import joblib
import numpy as np

from models import User, HealthData
from database import get_db
import pandas as pd

from services.train_user_model import train_user_model


router = APIRouter()
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BASE_PATH = os.path.join("ml_models", "personalized", "users")


# ---------------------------------------------------
# Utility: Load trained user model (inference only)
# ---------------------------------------------------
async def get_user_model(user_id: int):
    user_folder = os.path.join(BASE_PATH, f"user_{user_id}")
    model_path = os.path.join(user_folder, "unsupervised_model.pkl")
    scaler_path = os.path.join(user_folder, "scaler.pkl")

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise HTTPException(
            status_code=202,
            detail="Personalized model not trained yet"
        )

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler


# ---------------------------------------------------
# Personalized anomaly detection endpoint
# ---------------------------------------------------
@router.get("/personal_anomaly")
async def personal_anomaly(
    email: str,
    date: str = Query(default=None, description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db)
):
    # 1️⃣ Get user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ Determine date (IST)
    tz = pytz.timezone("Asia/Kolkata")
    if date:
        selected = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=tz)
    else:
        selected = datetime.now(tz)

    start = selected.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    # 3️⃣ Fetch resting health metrics
    result = await db.execute(
        select(HealthData).where(
            HealthData.user_id == user.id,
            HealthData.metric_type.in_(["heart_rate", "spo2", "blood_pressure"]),
            HealthData.activity_type == "resting",
            HealthData.timestamp >= start.astimezone(pytz.UTC),
            HealthData.timestamp < end.astimezone(pytz.UTC),
        )
    )
    records = result.scalars().all()

    if not records:
        return {
            "status": "no_data",
            "message": "No resting health data for this day"
        }

    
    # 4️⃣ Convert records to DataFrame
    rows = []
    for r in records:
        rows.append({
            "timestamp": r.timestamp,
            "heart_rate": r.value if r.metric_type == "heart_rate" else None,
            "spo2": r.value if r.metric_type == "spo2" else None,
            "systolic_bp": r.systolic if r.metric_type == "blood_pressure" else None,
            "diastolic_bp": r.diastolic if r.metric_type == "blood_pressure" else None,
        })

    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)

    # 🔥 5-minute window aggregation
    windowed = df.resample("5min").agg({
        "heart_rate": "mean",
        "spo2": "min",
        "systolic_bp": "max",
        "diastolic_bp": "max"
    })

    windowed.dropna(inplace=True)

    if len(windowed) < 3:
        return {
            "status": "insufficient",
            "message": "Not enough aggregated data windows"
        }

    X = windowed.values


    # 5️⃣ Load model & predict
    model, scaler = await get_user_model(user.id)
    X_scaled = scaler.transform(X)
    predictions = model.predict(X_scaled)

    total = len(predictions)
    anomalies = int(np.sum(predictions == -1))
    percent = round((anomalies / total) * 100, 2)

    return {
        "status": "alert" if percent > 20 else "ok",
        "date": start.date().isoformat(),
        "total_records": total,
        "anomalies": anomalies,
        "percent_anomalies": percent,
        "note": "Personalized anomalies detected using resting health metrics"
    }


# ---------------------------------------------------
# Model readiness status endpoint
# ---------------------------------------------------
@router.get("/personal_model_status")
async def personal_model_status(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_folder = os.path.join(BASE_PATH, f"user_{user.id}")
    model_path = os.path.join(user_folder, "unsupervised_model.pkl")
    scaler_path = os.path.join(user_folder, "scaler.pkl")

    if not os.path.exists(user_folder):
        return {
            "trained": False,
            "message": "Collecting baseline health data"
        }

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return {
            "trained": False,
            "message": "Model training in progress"
        }

    return {
        "trained": True,
        "message": "Personalized model ready"
    }

@router.post("/personal_model/train")
async def train_personal_model(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Run training
    await train_user_model(user.id, db)

    # Verify files created
    user_folder = os.path.join(BASE_PATH, f"user_{user.id}")
    model_path = os.path.join(user_folder, "unsupervised_model.pkl")
    scaler_path = os.path.join(user_folder, "scaler.pkl")
    meta_path = os.path.join(user_folder, "metadata.json")

    return {
        "user_id": user.id,
        "cwd": os.getcwd(),
        "user_folder": user_folder,
        "model_exists": os.path.exists(model_path),
        "scaler_exists": os.path.exists(scaler_path),
        "metadata_exists": os.path.exists(meta_path),
    }
