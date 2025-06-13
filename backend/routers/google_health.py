from fastapi import APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
from datetime import datetime
import time

router = APIRouter()

@router.get("/health-data")
async def get_health_data(user_email: str):
    import json

    with open("mock_fit_data.json") as f:
        raw_data = json.load(f)

    heart_rate_data = []
    spo2_data = []
    blood_pressure_data = []

    print("STARTING PARSE")

    for bucket in raw_data.get("bucket", []):
        for dataset in bucket.get("dataset", []):
            data_type = dataset.get("dataSourceId", "").lower()

            for point in dataset.get("point", []):
                start_time_nanos = point.get("startTimeNanos")
                if not start_time_nanos:
                    continue
                timestamp = int(start_time_nanos[:13])
                values = point.get("value", [])

                if "heart_rate" in data_type:
                    print("💓 Heart Rate Entry")
                    for val in values:
                        if "fpVal" in val:
                            val_rounded = round(val["fpVal"])
                            print(f"  → Value: {val_rounded}")
                            heart_rate_data.append({
                                "timestamp": timestamp,
                                "value": val_rounded
                            })

    print("✔ Done parsing.")
    print("Final heart_rate_data:", heart_rate_data)

    return {
        "heart_rate": heart_rate_data,
        "spo2": spo2_data,
        "blood_pressure": blood_pressure_data
    }

