from fastapi import APIRouter, Depends, HTTPException, Query
from schema_models.ai import HealthMetrics
import joblib
import numpy as np
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
from database import get_db
from models import User, HealthData
from typing import List, Dict
import pytz

router = APIRouter()

# Load model and scaler
model_path = os.path.join("ml_models", "isolation_forest_model.pkl")
scaler_path = os.path.join("ml_models", "scaler.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)



@router.get("/anomaly")
async def anomaly_summary(
    email: str,
    date: str = Query(default=None, description="Format: YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db)
):
    # 🧑 Get user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🗓️ Determine the day
    tz = pytz.timezone("Asia/Kolkata")
    if date:
        try:
            selected = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=tz)
        except:
            raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD expected)")
    else:
        selected = datetime.now(tz)

    start = selected.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    # 📊 Get all resting HR, SpO2, BP data for that date
    result = await db.execute(
        select(HealthData).where(
            HealthData.user_id == user.id,
            HealthData.metric_type.in_(["heart_rate", "spo2", "blood_pressure"]),
            HealthData.timestamp >= start.astimezone(pytz.UTC),
            HealthData.timestamp < end.astimezone(pytz.UTC),
            HealthData.activity_type == "resting"
        )
    )
    records = result.scalars().all()

    # 🧹 Prepare vectors
    merged = {}
    for r in records:
        ts = r.timestamp.replace(second=0, microsecond=0)
        if ts not in merged:
            merged[ts] = {}
        if r.metric_type == "heart_rate":
            merged[ts]["hr"] = r.value
        elif r.metric_type == "spo2":
            merged[ts]["spo2"] = r.value
        elif r.metric_type == "blood_pressure":
            merged[ts]["sbp"] = r.systolic
            merged[ts]["dbp"] = r.diastolic

    vectors = []
    for v in merged.values():
        if all(k in v for k in ["hr", "spo2", "sbp", "dbp"]):
            vectors.append([v["hr"], v["spo2"], v["sbp"], v["dbp"]])

    if not vectors:
        return { "status": "no_data", "message": "No resting health data available for that day." }

    if len(vectors) < 3:
        return { "status": "insufficient", "message": "Not enough data points to detect anomaly reliably." }

    # 🧠 Anomaly detection
    X_scaled = scaler.transform(vectors)
    predictions = model.predict(X_scaled)

    total = len(vectors)
    anomalies = sum(1 for p in predictions if p == -1)
    percent = round((anomalies / total) * 100, 2)

    return {
        "status": "alert" if percent > 20 else "ok",
        "date": start.date().isoformat(),
        "total_records": total,
        "anomalies": anomalies,
        "percent_anomalies": percent,
        "note": "Anomalies detected based on resting heart rate, SpO2, and BP"
    }


@router.get("/insights")
async def get_health_insights(user_email: str, db: AsyncSession = Depends(get_db)):
    # Step 1: Find user
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Time ranges
    tz = pytz.timezone("Asia/Kolkata")
    now = datetime.now(tz)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    week_1_start = today - timedelta(days=7)
    week_2_start = today - timedelta(days=14)

    metrics = ["steps", "heart_rate", "sleep", "calories"]
    insights = []

    for metric in metrics:
        # Week N (recent)
        result = await db.execute(
            select(HealthData).where(
                HealthData.user_id == user.id,
                HealthData.metric_type == metric,
                HealthData.timestamp >= week_1_start.astimezone(pytz.UTC),
                HealthData.timestamp < today.astimezone(pytz.UTC),
                HealthData.value != None
            )
        )
        week1_values = [r.value for r in result.scalars().all()]
        week1_avg = sum(week1_values) / len(week1_values) if week1_values else 0

        # Week N-1 (previous)
        result = await db.execute(
            select(HealthData).where(
                HealthData.user_id == user.id,
                HealthData.metric_type == metric,
                HealthData.timestamp >= week_2_start.astimezone(pytz.UTC),
                HealthData.timestamp < week_1_start.astimezone(pytz.UTC),
                HealthData.value != None
            )
        )
        week2_values = [r.value for r in result.scalars().all()]
        week2_avg = sum(week2_values) / len(week2_values) if week2_values else 0

        if week1_avg and week2_avg:
            change = (week1_avg - week2_avg) / week2_avg

            if change < -0.2:
                insights.append(f"⬇️ Your average {metric.replace('_', ' ')} dropped by {abs(round(change * 100))}% compared to last week.")
            elif change > 0.2:
                insights.append(f"⬆️ Your average {metric.replace('_', ' ')} increased by {round(change * 100)}% this week.")
            else:
                insights.append(f"📊 Your {metric.replace('_', ' ')} remained stable this week.")

    return {"insights": insights}