from fastapi import APIRouter, Request, Depends, HTTPException
from datetime import datetime, timedelta
import httpx
from models import User, HealthData
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from typing import Optional
import json
from google_auth import GOOGLE_FIT_API_URL, DATA_TYPES, build_request_body  # Adjust if needed
from sqlalchemy import and_
router = APIRouter()

@router.get("/health-data")
async def get_health_data(user_email: str, db: AsyncSession = Depends(get_db)):
    
    # ✅ Fetch user from DB to get access token
    # user = await User.get_by_email(user_email)
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    
    if not user or not user.access_token:
        return {"error": "Access token not found for user."}

    access_token = user.access_token

    # Calculate start and end time for Today
    today = datetime.now()
    start = datetime(today.year, today.month, today.day)
    end = start + timedelta(days=1) - timedelta(milliseconds=1)

    startTimeMillis = int(start.timestamp() * 1000)
    endTimeMillis = int(end.timestamp() * 1000)


    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
        }
    
    body = {
        "aggregateBy": [
            {"dataTypeName": "com.google.heart_rate.bpm"},
            {"dataTypeName": "com.google.blood_pressure"},
            {"dataTypeName": "com.google.oxygen_saturation"}
        ],
        "bucketByTime": {"durationMillis": 86400000},  # 1 day
        "startTimeMillis": startTimeMillis,
        "endTimeMillis": endTimeMillis
    }

    # async with httpx.AsyncClient() as client:
    #     response = await client.post("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    #                                  headers=headers,
    #                                  json=body)

    response = httpx.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        headers=headers,
        json=body
    )

    raw_data = response.json()
    print("RAW RESPONSE from Google Fit:", json.dumps(raw_data, indent=2))
    print("Access token being used:", access_token)


    heart_rate_data = []
    spo2_data = []
    blood_pressure_data = []


    for bucket in raw_data.get("bucket", []):
        for dataset in bucket.get("dataset", []):
            data_type = dataset.get("dataSourceId", "").lower()

            for point in dataset.get("point", []):
                # start_time_nanos = point.get("startTimeNanos")
                # if not start_time_nanos:
                #     continue
                # timestamp = int(start_time_nanos[:13])
                timestamp = int(point["startTimeNanos"][:13])
                values = point["value"]

                if "heart_rate" in data_type:
                    for val in values:
                        if "fpVal" in val:
                            val_rounded = round(val.get("fpVal", 0))
                            # print(f"  → Value: {val_rounded}")
                            heart_rate_data.append({
                                "timestamp": timestamp,
                                "value": val_rounded
                            })

                elif "oxygen_saturation" in data_type:
                     for val in values:
                          spo2_data.append({
                               "timestamp": timestamp,
                                "value": round(val.get("fpVal", 0) * 100, 1)
                                })

                elif "blood_pressure" in data_type:
                     if len(values) >= 2:
                        systolic = round(values[0].get("fpVal", 0))
                        diastolic = round(values[1].get("fpVal", 0))
                        blood_pressure_data.append({
                            "timestamp": timestamp,
                            "systolic": systolic,
                            "diastolic": diastolic
                            })

    # print("✔ Done parsing.")
    # print("Final heart_rate_data:", heart_rate_data)

    return {
        "heart_rate": heart_rate_data,
        "spo2": spo2_data,
        "blood_pressure": blood_pressure_data
    }

