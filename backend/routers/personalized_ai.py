# /backend/routers/personalized_ai.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
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
BASE_PATH = os.path.join(BACKEND_DIR, "ml_models", "personalized", "users")

TZ = pytz.timezone("Asia/Kolkata")
RESTING_METRICS = ["heart_rate", "spo2", "blood_pressure"]


# ---------------------------------------------------
# Utility: Load trained user model (inference only)
# ---------------------------------------------------
async def get_user_model(user_id: int):
    user_folder = os.path.join(BASE_PATH, f"user_{user_id}")
    model_path = os.path.join(user_folder, "unsupervised_model.pkl")
    scaler_path = os.path.join(user_folder, "scaler.pkl")

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise HTTPException(status_code=202, detail="Personalized model not trained yet")

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler


def _ist_day_bounds_to_utc_naive(day_start_ist: datetime):
    """
    Given IST-aware day start, return (start_utc_naive, end_utc_naive, end_ist).
    DB stores UTC-naive timestamps, so we compare using UTC-naive bounds.
    """
    start_ist = day_start_ist
    end_ist = start_ist + timedelta(days=1)

    start_utc_naive = start_ist.astimezone(pytz.UTC).replace(tzinfo=None)
    end_utc_naive = end_ist.astimezone(pytz.UTC).replace(tzinfo=None)
    return start_utc_naive, end_utc_naive, end_ist


async def _pick_latest_ist_day_with_data(db: AsyncSession, user_id: int, min_windows: int = 3):
    """
    When date is not provided, pick the latest IST day that likely has enough
    data to produce >= min_windows aggregated 5-min windows.
    Tries latest day then goes back up to 7 days.
    """
    # Find latest timestamp (UTC-naive) for resting metrics
    latest_ts = (
        await db.execute(
            select(HealthData.timestamp)
            .where(
                HealthData.user_id == user_id,
                HealthData.activity_type == "resting",
                HealthData.metric_type.in_(RESTING_METRICS),
            )
            .order_by(HealthData.timestamp.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    if not latest_ts:
        return None

    # Treat DB naive timestamp as UTC, convert to IST
    latest_ist = pytz.UTC.localize(latest_ts).astimezone(TZ)

    # We need at least min_windows complete 5-min windows.
    # Each window requires HR + SpO2 + BP rows present -> roughly >= min_windows * 3 rows.
    # We'll use a small row-count check per day for speed.
    min_rows_hint = max(10, min_windows * 3)

    for back in range(0, 8):  # latest day then up to 7 days back
        candidate = latest_ist - timedelta(days=back)
        day_start_ist = candidate.replace(hour=0, minute=0, second=0, microsecond=0)

        start_utc_naive, end_utc_naive, _ = _ist_day_bounds_to_utc_naive(day_start_ist)

        # Quick count of resting rows in this day
        row_count = (
            await db.execute(
                select(func.count())
                .select_from(HealthData)
                .where(
                    HealthData.user_id == user_id,
                    HealthData.activity_type == "resting",
                    HealthData.metric_type.in_(RESTING_METRICS),
                    HealthData.timestamp >= start_utc_naive,
                    HealthData.timestamp < end_utc_naive,
                )
            )
        ).scalar_one()

        if row_count >= min_rows_hint:
            return day_start_ist

    # Fallback: just use latest day start (even if sparse)
    return latest_ist.replace(hour=0, minute=0, second=0, microsecond=0)


# ---------------------------------------------------
# Personalized anomaly detection endpoint
# ---------------------------------------------------
@router.get("/personal_anomaly")
async def personal_anomaly(
    email: str,
    date: str = Query(default=None, description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    # 1️⃣ Get user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ Determine IST day start
    if date:
        naive_local = datetime.strptime(date, "%Y-%m-%d")  # naive date
        selected = TZ.localize(naive_local)                # IST-aware
        start_ist = selected.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        # Pick the latest day that has enough data windows
        start_ist = await _pick_latest_ist_day_with_data(db, user.id, min_windows=3)
        if not start_ist:
            return {"status": "no_data", "message": "No resting health data available"}

    start_utc_naive, end_utc_naive, end_ist = _ist_day_bounds_to_utc_naive(start_ist)

    # 3️⃣ Fetch resting health metrics within UTC-naive bounds
    result = await db.execute(
        select(HealthData).where(
            HealthData.user_id == user.id,
            HealthData.metric_type.in_(RESTING_METRICS),
            HealthData.activity_type == "resting",
            HealthData.timestamp >= start_utc_naive,
            HealthData.timestamp < end_utc_naive,
        )
    )
    records = result.scalars().all()

    if not records:
        return {"status": "no_data", "message": "No resting health data for this day"}

    # 4️⃣ Convert records to DataFrame
    rows = []
    for r in records:
        rows.append(
            {
                "timestamp": r.timestamp,
                "heart_rate": r.value if r.metric_type == "heart_rate" else None,
                "spo2": r.value if r.metric_type == "spo2" else None,
                "systolic_bp": r.systolic if r.metric_type == "blood_pressure" else None,
                "diastolic_bp": r.diastolic if r.metric_type == "blood_pressure" else None,
            }
        )

    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)

    # 🔥 5-minute window aggregation
    windowed = df.resample("5min").agg(
        {
            "heart_rate": "mean",
            "spo2": "min",
            "systolic_bp": "max",
            "diastolic_bp": "max",
        }
    )

    windowed.dropna(inplace=True)

    if len(windowed) < 3:
        return {"status": "insufficient", "message": "Not enough aggregated data windows"}

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
        "date": start_ist.date().isoformat(),  # IST date shown to user
        "total_records": total,
        "anomalies": anomalies,
        "percent_anomalies": percent,
        "note": "Personalized anomalies detected using resting health metrics",
    }


# ---------------------------------------------------
# Model readiness status endpoint
# ---------------------------------------------------
@router.get("/personal_model_status")
async def personal_model_status(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_folder = os.path.join(BASE_PATH, f"user_{user.id}")
    model_path = os.path.join(user_folder, "unsupervised_model.pkl")
    scaler_path = os.path.join(user_folder, "scaler.pkl")

    if not os.path.exists(user_folder):
        return {"trained": False, "message": "Collecting baseline health data"}

    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return {"trained": False, "message": "Model training in progress"}

    return {"trained": True, "message": "Personalized model ready"}


@router.post("/personal_model/train")
async def train_personal_model(email: str, db: AsyncSession = Depends(get_db)):
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
