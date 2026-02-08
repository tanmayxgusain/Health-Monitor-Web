# # backend/services/google_sync.py
# from models import HealthData, User, SleepSession
# from datetime import datetime, timedelta, timezone
# import httpx
# from routers.google_auth import DATA_TYPES, GOOGLE_FIT_API_URL, build_request_body
# from sqlalchemy.future import select
# from utils.fit_activity_map import ACTIVITY_MAP  

# from services.train_user_model import train_user_model, should_retrain_user_model
# import os

# async def sync_google_fit_data(user: User, db, days_back: int = 1):
#     now = datetime.utcnow()

#     async with httpx.AsyncClient() as client:
#         added_rows = 0
#         for offset in range(days_back):
#             day = now - timedelta(days=offset)
#             start_time = day.replace(hour=0, minute=0, second=0, microsecond=0)
#             end_time = start_time + timedelta(days=1)

#             start_millis = int(start_time.timestamp() * 1000)
#             end_millis = int(end_time.timestamp() * 1000)

#             headers = {
#                 "Authorization": f"Bearer {user.access_token}"
#             }
#             # STEP 1: Fetch activity segments first
#             activity_map_by_time = []
            


#             activity_body = {
#                 "aggregateBy": [{ "dataTypeName": "com.google.activity.segment" }],
#                 "bucketByTime": { "durationMillis": 86400000 },
#                 "startTimeMillis": int(start_time.timestamp() * 1000),
#                 "endTimeMillis": int(end_time.timestamp() * 1000)
#             }

#             activity_res = await client.post(
#                 GOOGLE_FIT_API_URL,
#                 headers=headers,
#                 json=activity_body,
#                 timeout=30.0
#             )

#             if activity_res.status_code == 200:
#                 for bucket in activity_res.json().get("bucket", []):
#                     for dataset in bucket.get("dataset", []):
#                         for point in dataset.get("point", []):
#                             start_ms = int(point["startTimeNanos"]) // 1_000_000
#                             end_ms = int(point["endTimeNanos"]) // 1_000_000
#                             code = point["value"][0]["intVal"]
#                             activity_type = ACTIVITY_MAP.get(code, "unknown")
#                             activity_map_by_time.append({
#                                 "start": datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).replace(microsecond=0),
#                                 "end": datetime.fromtimestamp(end_ms / 1000, tz=timezone.utc).replace(microsecond=0),
#                                 "activity": activity_type
#                             })

#             def infer_activity(timestamp):
#                 for segment in activity_map_by_time:
#                     if segment["start"] <= timestamp <= segment["end"]:
#                         return segment["activity"]
#                 return "resting"
            
            


#             for key, data_type in DATA_TYPES.items():
#                 # request_body = build_request_body(data_type, start_millis, end_millis)
#                 response = await client.post(
#                     GOOGLE_FIT_API_URL,
#                     headers=headers,
#                     json=build_request_body(data_type, start_millis, end_millis),
#                     timeout=30.0
                    
#                 )
#                 print(f"Fetching {key} → status {response.status_code}")
#                 # print("Response:", response.json())


#                 if response.status_code != 200:
#                     continue

#                 for bucket in response.json().get("bucket", []):
#                     for dataset in bucket.get("dataset", []):
#                         for point in dataset.get("point", []):
#                             ts = int(point["startTimeNanos"]) // 1_000_000
#                             ts_dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
#                             ts_dt = ts_dt.replace(microsecond=0)
#                             activity = infer_activity(ts_dt)

#                             # Deduplication check
#                             exists = await db.execute(
#                                 select(HealthData).where(
#                                     HealthData.user_id == user.id,
#                                     HealthData.metric_type == key,
#                                     HealthData.timestamp >= ts_dt.replace(microsecond=0),
#                                     # HealthData.timestamp >= ts_dt,
#                                     HealthData.timestamp <= ts_dt.replace(microsecond=999000)
#                                     # HealthData.timestamp <= ts_dt + timedelta(milliseconds=999)
#                                 )
#                             )
#                             if exists.scalars().first():
#                                 continue  # Skip duplicates

                            

#                             elif key == "blood_pressure":
#                                 values = [v.get("fpVal") for v in point["value"] if "fpVal" in v and isinstance(v.get("fpVal"), (int, float))]

#                                 if len(values) >= 2:
#                                     # Sort values descending to assume systolic > diastolic
#                                     values.sort(reverse=True)
#                                     systolic = values[0]
#                                     diastolic = values[-1]

#                                     exists = await db.execute(
#                                         select(HealthData).where(
#                                             HealthData.user_id == user.id,
#                                             HealthData.metric_type == key,
#                                             HealthData.timestamp == ts_dt
#                                         )
#                                     )
#                                     if not exists.scalars().first():
#                                         db.add(HealthData(
#                                             user_id=user.id,
#                                             metric_type=key,
#                                             systolic=int(systolic),
#                                             diastolic=int(diastolic),
#                                             timestamp=ts_dt,
#                                             activity_type=activity
#                                         ))
#                                         added_rows += 1



#                             elif key == "sleep":
#                                 # Extract duration for meaningful sleep stages only (2: light, 3: deep, 4: REM, 5: awake)
#                                 sleep_stage = point["value"][0].get("intVal", 0)
#                                 start_nanos = int(point["startTimeNanos"])
#                                 end_nanos = int(point["endTimeNanos"])
#                                 duration_sec = (end_nanos - start_nanos) / 1e9
#                                 sleep_duration = duration_sec / 3600  # Convert to hours

#                                 print(f"[🛌 Sleep] Stage: {sleep_stage}, Duration (hrs): {sleep_duration:.2f}, Time: {ts_dt}")

#                                 # Store only meaningful sleep stages and skip unknown/awake if needed
#                                 if sleep_stage in [2, 3, 4] and sleep_duration > 0:
#                                     start_dt = datetime.fromtimestamp(start_nanos / 1e9, tz=timezone.utc).replace(microsecond=0)
#                                     end_dt = datetime.fromtimestamp(end_nanos / 1e9, tz=timezone.utc).replace(microsecond=0)

#                                     # Optional deduplication for sessions
#                                     session_exists = await db.execute(
#                                         select(SleepSession).where(
#                                             SleepSession.user_id == user.id,
#                                             SleepSession.start_time == start_dt,
#                                             SleepSession.end_time == end_dt,
#                                         )
#                                     )
#                                     if not session_exists.scalars().first():
#                                         db.add(SleepSession(
#                                             user_id=user.id,
#                                             start_time=start_dt,
#                                             end_time=end_dt,
#                                             duration_hours=round(sleep_duration, 2),
#                                         ))
                                        



#                             elif key == "distance":
#                                 raw_val = point["value"][0]
#                                 value = raw_val.get("fpVal") or raw_val.get("intVal")  # Fallback in case it's not fpVal
#                                 print(f"[📏 Distance] Value: {value} meters at {ts_dt}")

#                                 if value is not None and value > 0:
#                                     exists = await db.execute(
#                                         select(HealthData).where(
#                                             HealthData.user_id == user.id,
#                                             HealthData.metric_type == key,
#                                             HealthData.timestamp == ts_dt
#                                         )
#                                     )
#                                     if not exists.scalars().first():
#                                         db.add(HealthData(
#                                             user_id=user.id,
#                                             metric_type=key,
#                                             value=round(value / 1000, 2),  # Convert to km
#                                             timestamp=ts_dt,
#                                             activity_type=activity
#                                         ))
                                        



#                             elif key == "steps":
#                                 value = point["value"][0].get("intVal")
#                                 if value is not None:
#                                     db.add(HealthData(
#                                         user_id=user.id,
#                                         metric_type=key,
#                                         value=value,
#                                         timestamp=ts_dt,
#                                         activity_type=activity
#                                     ))
                                    


#                             elif key == "stress":
#                                 stress_val = point["value"][0].get("fpVal")
#                                 if stress_val is not None:
#                                     db.add(HealthData(
#                                         user_id=user.id,
#                                         metric_type=key,
#                                         value=stress_val,
#                                         timestamp=ts_dt,
#                                         activity_type=activity
#                                     ))
                                    


                       


#                             # elif key in ["distance", "calories", "spo2", "heart_rate"]:
#                             #     value = point["value"][0].get("fpVal")
#                             #     if value is not None:
#                             #         db.add(HealthData(
#                             #             user_id=user.id,
#                             #             metric_type=key,
#                             #             value=value,
#                             #             timestamp=ts_dt
#                             #         ))

#                             else:
#                                 value_dict = point["value"][0]
#                                 value = value_dict.get("fpVal") or value_dict.get("intVal")
#                                 if value is not None:
#                                     db.add(HealthData(
#                                         user_id=user.id,
#                                         metric_type=key,
#                                         value=value,
#                                         timestamp=ts_dt,
#                                         activity_type=activity
#                                     ))
#                                     added_rows += 1


#             # 💤 Additional fetch using sessions API for complete sleep data
#             session_url = "https://www.googleapis.com/fitness/v1/users/me/sessions"

#             session_res = await client.get(
#                 session_url,
#                 headers=headers,
#                 params={
#                     "startTime": start_time.isoformat() + "Z",
#                     "endTime": end_time.isoformat() + "Z"
#                 },
#                 timeout=30.0
#             )

#             if session_res.status_code == 200:
#                 sessions = session_res.json().get("session", [])
#                 for s in sessions:
#                     if s.get("activityType") != 72:  # 72 = Sleep
#                         continue

#                     start_ts = int(s["startTimeMillis"]) / 1000
#                     end_ts = int(s["endTimeMillis"]) / 1000
#                     start_dt = datetime.fromtimestamp(start_ts, tz=timezone.utc).replace(microsecond=0)
#                     end_dt = datetime.fromtimestamp(end_ts, tz=timezone.utc).replace(microsecond=0)
#                     duration_hours = round((end_ts - start_ts) / 3600, 2)

#                     # Deduplication check
#                     session_exists = await db.execute(
#                         select(SleepSession).where(
#                             SleepSession.user_id == user.id,
#                             SleepSession.start_time == start_dt,
#                             SleepSession.end_time == end_dt,
#                         )
#                     )
#                     if not session_exists.scalars().first():
#                         db.add(SleepSession(
#                             user_id=user.id,
#                             start_time=start_dt,
#                             end_time=end_dt,
#                             duration_hours=duration_hours
#                         ))
                        



#     await db.commit()

#     # ✅ Train logic:
#     # 1) Train first-time model if missing
#     # 2) Else retrain only if Option C conditions are met
#     try:
#         if added_rows == 0:
#             print(f"⏭️ No new rows synced for {user.email}, skipping training check")
        
#         else:

#             # NOTE: train_user_model saves to backend/ml_models/... after you fix BASE_PATH in train_user_model.py
#             backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
#             model_base = os.path.join(backend_dir, "ml_models", "personalized", "users")
#             user_folder = os.path.join(model_base, f"user_{user.id}")
#             model_path = os.path.join(user_folder, "unsupervised_model.pkl")
#             scaler_path = os.path.join(user_folder, "scaler.pkl")

#             if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
#                 await train_user_model(user.id, db)
#                 print(f"✅ Trained first personalized model for {user.email}")
#             else:
#                 if await should_retrain_user_model(user.id, db):
#                     await train_user_model(user.id, db)
#                     print(f"✅ Retrained personalized model for {user.email}")
#                 else:
#                     print(f"⏭️ Skipped retrain for {user.email} (not enough new data / cooldown)")

#     except Exception as e:
#         print(f"❌ Train/retrain failed for {user.email}: {e}")







# backend/services/google_sync.py
from models import HealthData, User, SleepSession
from datetime import datetime, timedelta
import httpx
from routers.google_auth import DATA_TYPES, GOOGLE_FIT_API_URL, build_request_body
from sqlalchemy.future import select
from utils.fit_activity_map import ACTIVITY_MAP

from services.train_user_model import train_user_model, should_retrain_user_model
import os


def to_utc_naive_from_millis(ms: int) -> datetime:
    # ✅ SQLite-friendly: UTC naive datetime
    return datetime.utcfromtimestamp(ms / 1000).replace(microsecond=0)


def to_utc_naive_from_nanos(ns: int) -> datetime:
    return datetime.utcfromtimestamp(ns / 1e9).replace(microsecond=0)


async def sync_google_fit_data(user: User, db, days_back: int = 1):
    """
    Incremental sync:
    - if user.last_fit_sync_at exists: sync from (last_fit_sync_at - overlap) -> now
    - else: sync last `days_back` days (fallback)
    Dedupe:
    - prefetch existing timestamps once per day+metric (fast)
    - DB unique constraint prevents duplicates reliably
    """
    now = datetime.utcnow().replace(microsecond=0)

    # ✅ overlap window to catch late-arriving/corrected Fit data
    overlap = timedelta(hours=12)

    if user.last_fit_sync_at:
        start_from = (user.last_fit_sync_at - overlap)
    else:
        start_from = (now - timedelta(days=days_back))

    start_from = start_from.replace(microsecond=0)

    # Normalize day loop boundaries (UTC naive)
    day_cursor = start_from.replace(hour=0, minute=0, second=0)
    last_day = now.replace(hour=0, minute=0, second=0)

    added_rows = 0

    async with httpx.AsyncClient() as client:
        while day_cursor <= last_day:
            start_time = day_cursor
            end_time = start_time + timedelta(days=1)

            start_millis = int(start_time.timestamp() * 1000)
            end_millis = int(end_time.timestamp() * 1000)

            headers = {"Authorization": f"Bearer {user.access_token}"}

            # ----------------------------
            # STEP 1: Fetch activity segments (for activity inference)
            # ----------------------------
            activity_map_by_time = []

            activity_body = {
                "aggregateBy": [{"dataTypeName": "com.google.activity.segment"}],
                "bucketByTime": {"durationMillis": 86400000},
                "startTimeMillis": start_millis,
                "endTimeMillis": end_millis,
            }

            activity_res = await client.post(
                GOOGLE_FIT_API_URL,
                headers=headers,
                json=activity_body,
                timeout=30.0
            )

            if activity_res.status_code == 200:
                for bucket in activity_res.json().get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            start_ms = int(point["startTimeNanos"]) // 1_000_000
                            end_ms = int(point["endTimeNanos"]) // 1_000_000
                            code = point["value"][0].get("intVal")
                            activity_type = ACTIVITY_MAP.get(code, "unknown")
                            activity_map_by_time.append({
                                "start": to_utc_naive_from_millis(start_ms),
                                "end": to_utc_naive_from_millis(end_ms),
                                "activity": activity_type
                            })

            def infer_activity(ts_dt: datetime) -> str:
                # ts_dt is UTC naive
                for seg in activity_map_by_time:
                    if seg["start"] <= ts_dt <= seg["end"]:
                        return seg["activity"]
                return "resting"

            # ----------------------------
            # STEP 2: Sync each metric
            # ----------------------------
            for key, data_type in DATA_TYPES.items():
                response = await client.post(
                    GOOGLE_FIT_API_URL,
                    headers=headers,
                    json=build_request_body(data_type, start_millis, end_millis),
                    timeout=30.0
                )

                print(f"Fetching {key} → status {response.status_code}")

                if response.status_code != 200:
                    continue

                # ✅ Prefetch existing timestamps ONCE per metric per day (fast)
                existing_rows = await db.execute(
                    select(HealthData.timestamp).where(
                        HealthData.user_id == user.id,
                        HealthData.metric_type == key,
                        HealthData.timestamp >= start_time,
                        HealthData.timestamp < end_time,
                    )
                )
                existing_ts = set(existing_rows.scalars().all())

                for bucket in response.json().get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            ts_ms = int(point["startTimeNanos"]) // 1_000_000
                            ts_dt = to_utc_naive_from_millis(ts_ms)
                            activity = infer_activity(ts_dt)

                            # ✅ fast dedupe
                            if ts_dt in existing_ts:
                                continue

                            # ----------------------------
                            # blood_pressure
                            # ----------------------------
                            if key == "blood_pressure":
                                values = [
                                    v.get("fpVal")
                                    for v in point.get("value", [])
                                    if "fpVal" in v and isinstance(v.get("fpVal"), (int, float))
                                ]
                                if len(values) >= 2:
                                    values.sort(reverse=True)
                                    systolic = int(values[0])
                                    diastolic = int(values[-1])

                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        systolic=systolic,
                                        diastolic=diastolic,
                                        timestamp=ts_dt,
                                        activity_type=activity
                                    ))
                                    existing_ts.add(ts_dt)
                                    added_rows += 1
                                continue

                            # ----------------------------
                            # sleep stage points -> SleepSession rows
                            # ----------------------------
                            if key == "sleep":
                                sleep_stage = point["value"][0].get("intVal", 0)
                                start_nanos = int(point["startTimeNanos"])
                                end_nanos = int(point["endTimeNanos"])
                                duration_sec = (end_nanos - start_nanos) / 1e9
                                sleep_duration = duration_sec / 3600

                                # only meaningful stages
                                if sleep_stage in [2, 3, 4] and sleep_duration > 0:
                                    start_dt = to_utc_naive_from_nanos(start_nanos)
                                    end_dt = to_utc_naive_from_nanos(end_nanos)

                                    # Prefetch existing sessions overlapping the day (one query)
                                    existing_sessions = await db.execute(
                                        select(SleepSession.start_time, SleepSession.end_time).where(
                                            SleepSession.user_id == user.id,
                                            SleepSession.start_time < end_time,
                                            SleepSession.end_time > start_time,
                                        )
                                    )
                                    existing_pairs = set(existing_sessions.all())
                                    pair = (start_dt, end_dt)
                                    if pair in existing_pairs:
                                        continue

                                    db.add(SleepSession(
                                        user_id=user.id,
                                        start_time=start_dt,
                                        end_time=end_dt,
                                        duration_hours=round(sleep_duration, 2),
                                    ))
                                    existing_pairs.add(pair)
                                    added_rows += 1
                                continue

                            # ----------------------------
                            # distance
                            # ----------------------------
                            if key == "distance":
                                raw_val = point["value"][0]
                                value = raw_val.get("fpVal") if raw_val.get("fpVal") is not None else raw_val.get("intVal")
                                if value is not None and value > 0:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=round(value / 1000, 2),  # meters -> km
                                        timestamp=ts_dt,
                                        activity_type=activity
                                    ))
                                    existing_ts.add(ts_dt)
                                    added_rows += 1
                                continue

                            # ----------------------------
                            # steps
                            # ----------------------------
                            if key == "steps":
                                value = point["value"][0].get("intVal")
                                if value is not None:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=value,
                                        timestamp=ts_dt,
                                        activity_type=activity
                                    ))
                                    existing_ts.add(ts_dt)
                                    added_rows += 1
                                continue

                            # ----------------------------
                            # stress
                            # ----------------------------
                            if key == "stress":
                                stress_val = point["value"][0].get("fpVal")
                                if stress_val is not None:
                                    db.add(HealthData(
                                        user_id=user.id,
                                        metric_type=key,
                                        value=stress_val,
                                        timestamp=ts_dt,
                                        activity_type=activity
                                    ))
                                    existing_ts.add(ts_dt)
                                    added_rows += 1
                                continue

                            # ----------------------------
                            # default numeric metrics
                            # ----------------------------
                            value_dict = point["value"][0]
                            value = value_dict.get("fpVal") if value_dict.get("fpVal") is not None else value_dict.get("intVal")
                            if value is not None:
                                db.add(HealthData(
                                    user_id=user.id,
                                    metric_type=key,
                                    value=value,
                                    timestamp=ts_dt,
                                    activity_type=activity
                                ))
                                existing_ts.add(ts_dt)
                                added_rows += 1

            # ----------------------------
            # STEP 3: Sessions API for complete sleep sessions
            # ----------------------------
            session_url = "https://www.googleapis.com/fitness/v1/users/me/sessions"
            session_res = await client.get(
                session_url,
                headers=headers,
                params={
                    "startTime": start_time.isoformat() + "Z",
                    "endTime": end_time.isoformat() + "Z"
                },
                timeout=30.0
            )

            if session_res.status_code == 200:
                sessions = session_res.json().get("session", [])
                # Prefetch existing sessions overlapping the day (one query)
                existing_sessions = await db.execute(
                    select(SleepSession.start_time, SleepSession.end_time).where(
                        SleepSession.user_id == user.id,
                        SleepSession.start_time < end_time,
                        SleepSession.end_time > start_time,
                    )
                )
                existing_pairs = set(existing_sessions.all())

                for s in sessions:
                    if s.get("activityType") != 72:  # 72 = Sleep
                        continue

                    start_ms = int(s["startTimeMillis"])
                    end_ms = int(s["endTimeMillis"])
                    start_dt = to_utc_naive_from_millis(start_ms)
                    end_dt = to_utc_naive_from_millis(end_ms)
                    duration_hours = round((end_ms - start_ms) / 1000 / 3600, 2)

                    pair = (start_dt, end_dt)
                    if pair in existing_pairs:
                        continue

                    db.add(SleepSession(
                        user_id=user.id,
                        start_time=start_dt,
                        end_time=end_dt,
                        duration_hours=duration_hours
                    ))
                    existing_pairs.add(pair)
                    added_rows += 1

            day_cursor += timedelta(days=1)

    # ✅ Update cursor only after everything is staged
    user.last_fit_sync_at = now

    # ✅ Single commit
    await db.commit()

    # ✅ Train/retrain logic (same behavior, now accurate)
    try:
        if added_rows == 0:
            print(f"⏭️ No new rows synced for {user.email}, skipping training check")
            return

        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        model_base = os.path.join(backend_dir, "ml_models", "personalized", "users")
        user_folder = os.path.join(model_base, f"user_{user.id}")
        model_path = os.path.join(user_folder, "unsupervised_model.pkl")
        scaler_path = os.path.join(user_folder, "scaler.pkl")

        if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
            await train_user_model(user.id, db)
            print(f"✅ Trained first personalized model for {user.email}")
        else:
            if await should_retrain_user_model(user.id, db):
                await train_user_model(user.id, db)
                print(f"✅ Retrained personalized model for {user.email}")
            else:
                print(f"⏭️ Skipped retrain for {user.email} (not enough new data / cooldown)")

    except Exception as e:
        print(f"❌ Train/retrain failed for {user.email}: {e}")









