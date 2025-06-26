# backend/services/google_sync.py
from models import HealthData, User
from datetime import datetime, timedelta, timezone
import httpx
from routers.google_auth import DATA_TYPES, GOOGLE_FIT_API_URL, build_request_body
from sqlalchemy.future import select

async def sync_google_fit_data(user: User, db):
    end_time = datetime.utcnow()
    start_time = end_time.replace(hour=0, minute=0, second=0, microsecond=0)
    start_millis = int(start_time.timestamp() * 1000)
    end_millis = int(end_time.timestamp() * 1000)

    headers = {
        "Authorization": f"Bearer {user.access_token}"
    }

    async with httpx.AsyncClient() as client:
        for key, data_type in DATA_TYPES.items():
            response = await client.post(
                GOOGLE_FIT_API_URL,
                headers=headers,
                json=build_request_body(data_type, start_millis, end_millis)
            )

            if response.status_code != 200:
                continue

            extracted = []
            for bucket in response.json().get("bucket", []):
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        ts = int(point["startTimeNanos"]) // 1_000_000
                        ts_dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)


                        if key == "blood_pressure":
                            systolic = diastolic = None
                            for val in point["value"]:
                                for entry in val.get("mapVal", []):
                                    if entry["key"] == "systolic":
                                        systolic = entry["value"].get("fpVal")
                                    elif entry["key"] == "diastolic":
                                        diastolic = entry["value"].get("fpVal")
                            if systolic and diastolic:
                                exists = await db.execute(
                                    select(HealthData).where(
                                        HealthData.user_id == user.id,
                                        HealthData.metric_type == key,
                                        HealthData.timestamp == ts_dt
                                    )
                                )
                                if not exists.scalars().first():
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        systolic=int(systolic),
                                        diastolic=int(diastolic),
                                        timestamp=ts_dt
                                    ))
                        else:
                            value = point["value"][0].get("fpVal")
                            if value:
                                exists = await db.execute(
                                    select(HealthData).where(
                                        HealthData.user_id == user.id,
                                        HealthData.metric_type == key,
                                        HealthData.timestamp == ts_dt
                                    )
                                )
                                if not exists.scalars().first():
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=value,
                                        timestamp=ts_dt
                                    ))

        await db.commit()
