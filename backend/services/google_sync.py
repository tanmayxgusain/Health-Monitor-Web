# backend/services/google_sync.py
from models import HealthData, User
from datetime import datetime, timedelta, timezone
import httpx
from routers.google_auth import DATA_TYPES, GOOGLE_FIT_API_URL, build_request_body
from sqlalchemy.future import select

async def sync_google_fit_data(user: User, db, days_back: int = 1):
    now = datetime.utcnow()

    async with httpx.AsyncClient() as client:
        for offset in range(days_back):
            day = now - timedelta(days=offset)
            start_time = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = start_time + timedelta(days=1)

            start_millis = int(start_time.timestamp() * 1000)
            end_millis = int(end_time.timestamp() * 1000)

            headers = {
                "Authorization": f"Bearer {user.access_token}"
            }

            for key, data_type in DATA_TYPES.items():
                response = await client.post(
                    GOOGLE_FIT_API_URL,
                    headers=headers,
                    json=build_request_body(data_type, start_millis, end_millis)
                )

                if response.status_code != 200:
                    continue

                for bucket in response.json().get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            ts = int(point["startTimeNanos"]) // 1_000_000
                            ts_dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
                            ts_dt = ts_dt.replace(microsecond=0)


                            # Deduplication check
                            exists = await db.execute(
                                select(HealthData).where(
                                    HealthData.user_id == user.id,
                                    HealthData.metric_type == key,
                                    HealthData.timestamp >= ts_dt.replace(microsecond=0),
                                    HealthData.timestamp <= ts_dt.replace(microsecond=999000)
                                )
                            )
                            if exists.scalars().first():
                                continue  # Skip duplicates

                            if key == "blood_pressure":
                                systolic = diastolic = None
                                for val in point["value"]:
                                    for entry in val.get("mapVal", []):
                                        if entry["key"] == "systolic":
                                            systolic = entry["value"].get("fpVal")
                                        elif entry["key"] == "diastolic":
                                            diastolic = entry["value"].get("fpVal")
                                if systolic and diastolic:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        systolic=int(systolic),
                                        diastolic=int(diastolic),
                                        timestamp=ts_dt
                                    ))
                                print(f"[🆕 DB INSERT] {key} → {value or f'{systolic}/{diastolic}'} at {ts_dt}")

                            else:
                                value = point["value"][0].get("fpVal") or point["value"][0].get("intVal")
    
                                if value is not None:
                                    # Convert timestamp
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
                            
                            if key == "sleep":
                                for point in dataset.get("point", []):
                                    sleep_type = point["value"][0].get("intVal")
                                    if sleep_type != 110:
                                        continue  # Only process sleep (110)

                                    start_ns = int(point["startTimeNanos"])
                                    end_ns = int(point["endTimeNanos"])
                                    duration_ms = (end_ns - start_ns) // 1_000_000
                                    duration_hours = round(duration_ms / (1000 * 60 * 60), 2)

                                    ts_dt = datetime.fromtimestamp(start_ns // 1_000_000_000, tz=timezone.utc)

                                    exists = await db.execute(
                                        select(HealthData).where(
                                            HealthData.user_id == user.id,
                                            HealthData.metric_type == "sleep",
                                            HealthData.timestamp == ts_dt
                                        )
                                    )
                                    if not exists.scalars().first():
                                        db.add(HealthData(
                                            user_id=user.id,
                                            metric_type="sleep",
                                            value=duration_hours,
                                            timestamp=ts_dt
                                        ))



    await db.commit()
