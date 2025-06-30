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
                print(f"Fetching {key} → status {response.status_code}")
                # print("Response:", response.json())


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
                                    # HealthData.timestamp >= ts_dt,
                                    HealthData.timestamp <= ts_dt.replace(microsecond=999000)
                                    # HealthData.timestamp <= ts_dt + timedelta(milliseconds=999)
                                )
                            )
                            if exists.scalars().first():
                                continue  # Skip duplicates

                            # if key == "blood_pressure":
                            #     systolic = diastolic = None
                            #     for val in point["value"]:
                            #         for entry in val.get("mapVal", []):
                            #             if entry["key"] == "systolic":
                            #                 systolic = entry["value"].get("fpVal")
                            #             elif entry["key"] == "diastolic":
                            #                 diastolic = entry["value"].get("fpVal")

                            #     if systolic and diastolic:
                            #         exists = await db.execute(
                            #             select(HealthData).where(
                            #                 HealthData.user_id == user.id,
                            #                 HealthData.metric_type == key,
                            #                 HealthData.timestamp == ts_dt
                            #             )
                            #         )
                            #         if not exists.scalars().first():
                            #             db.add(HealthData(
                            #                 user_id=user.id,
                            #                 metric_type=key,
                            #                 systolic=int(systolic),
                            #                 diastolic=int(diastolic),
                            #                 timestamp=ts_dt
                            #             ))

                            # elif key == "sleep":
                            #     sleep_type = point["value"][0].get("intVal")
                            #     sleep_duration = (int(point["endTimeNanos"]) - int(point["startTimeNanos"])) / 1e9 / 3600  # hours

                            #     if sleep_duration > 0:
                            #         exists = await db.execute(
                            #             select(HealthData).where(
                            #                 HealthData.user_id == user.id,
                            #                 HealthData.metric_type == key,
                            #                 HealthData.timestamp == ts_dt
                            #             )
                            #         )
                            #         if not exists.scalars().first():
                            #             db.add(HealthData(
                            #                 user_id=user.id,
                            #                 metric_type=key,
                            #                 value=round(sleep_duration, 2),
                            #                 timestamp=ts_dt
                            #             ))

                            # elif key == "stress":
                            #     stress_val = point["value"][0].get("fpVal")
                            #     if stress_val is not None:
                            #         exists = await db.execute(
                            #             select(HealthData).where(
                            #                 HealthData.user_id == user.id,
                            #                 HealthData.metric_type == key,
                            #                 HealthData.timestamp == ts_dt
                            #             )
                            #         )
                            #         if not exists.scalars().first():
                            #             db.add(HealthData(
                            #                 user_id=user.id,
                            #                 metric_type=key,
                            #                 value=stress_val,
                            #                 timestamp=ts_dt
                            #             ))

                            # else:
                            #     value = point["value"][0].get("fpVal")
                            #     if value is not None:
                            #         exists = await db.execute(
                            #             select(HealthData).where(
                            #                 HealthData.user_id == user.id,
                            #                 HealthData.metric_type == key,
                            #                 HealthData.timestamp == ts_dt
                            #             )
                            #         )
                            #         if not exists.scalars().first():
                            #             db.add(HealthData(
                            #                 user_id=user.id,
                            #                 metric_type=key,
                            #                 value=value,
                            #                 timestamp=ts_dt
                            #             ))

                            # Handle each metric
                            # if key == "blood_pressure":
                            #     systolic = diastolic = None
                            #     for val in point["value"]:
                            #         for entry in val.get("mapVal", []):
                            #             if entry["key"] == "systolic":
                            #                 systolic = entry["value"].get("fpVal")
                            #             elif entry["key"] == "diastolic":
                            #                 diastolic = entry["value"].get("fpVal")
                            #     if systolic and diastolic:
                            #         db.add(HealthData(
                            #             user_id=user.id,
                            #             metric_type=key,
                            #             systolic=int(systolic),
                            #             diastolic=int(diastolic),
                            #             timestamp=ts_dt
                            #         ))

                            if key == "blood_pressure":
                                systolic = diastolic = None
                                for val in point["value"]:
                                    if val.get("mapVal"):
                                        for entry in val.get("mapVal", []):
                                            if entry["key"] == "systolic":
                                                systolic = entry["value"].get("fpVal")
                                            elif entry["key"] == "diastolic":
                                                diastolic = entry["value"].get("fpVal")
                                    else:
                                        if val.get("fpVal"):
                                            systolic = val["fpVal"]  # fallback
                                if systolic and diastolic:
                                    # Deduplication check
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


                            elif key == "sleep":
                                duration_hours = (int(point["endTimeNanos"]) - int(point["startTimeNanos"])) / 1e9 / 3600
                                if duration_hours > 0:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=round(duration_hours, 2),
                                        timestamp=ts_dt
                                    ))

                            elif key == "steps":
                                value = point["value"][0].get("intVal")
                                if value is not None:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=value,
                                        timestamp=ts_dt
                                    ))

                            elif key == "stress":
                                stress_val = point["value"][0].get("fpVal")
                                if stress_val is not None:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=stress_val,
                                        timestamp=ts_dt
                                    ))

                            # elif key in ["distance", "calories", "spo2", "heart_rate"]:
                            #     value = point["value"][0].get("fpVal")
                            #     if value is not None:
                            #         db.add(HealthData(
                            #             user_id=user.id,
                            #             metric_type=key,
                            #             value=value,
                            #             timestamp=ts_dt
                            #         ))

                            else:
                                value_dict = point["value"][0]
                                value = value_dict.get("fpVal") or value_dict.get("intVal")
                                if value is not None:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=value,
                                        timestamp=ts_dt
                                    ))




    await db.commit()
