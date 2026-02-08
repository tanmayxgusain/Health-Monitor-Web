# import asyncio
# import random
# from datetime import datetime, timedelta

# from sqlalchemy import select, delete
# from sqlalchemy.ext.asyncio import AsyncSession

# from database import async_session
# from models import User, HealthData


# def utc_naive(dt: datetime) -> datetime:
#     return dt.replace(tzinfo=None)


# async def get_or_create_user(db: AsyncSession, email: str) -> User:
#     res = await db.execute(select(User).where(User.email == email))
#     user = res.scalars().first()
#     if user:
#         return user

#     user = User(
#         name="Test User",
#         email=email,
#         age=26,
#         gender="Male",
#         country="India",
#         role="Patient",
#     )
#     db.add(user)
#     await db.flush()  # assigns user.id
#     return user


# async def clear_user_resting_data(db: AsyncSession, user_id: int):
#     # Optional: wipe old demo data so UniqueConstraint never bites you
#     await db.execute(delete(HealthData).where(HealthData.user_id == user_id))
#     await db.flush()


# async def seed_resting_5min_windows(
#     db: AsyncSession,
#     user_id: int,
#     days: int = 2,                 # 2 days => 576 windows (plenty)
#     anomaly_windows: int = 12      # number of 5-min windows to inject anomalies
# ):
#     now = utc_naive(datetime.utcnow())
#     start = (now - timedelta(days=days)).replace(second=0, microsecond=0)

#     # align to 5-min boundary
#     start = start - timedelta(minutes=start.minute % 5)

#     total_windows = days * 24 * 12  # 12 windows/hour
#     anomaly_idxs = set(random.sample(range(total_windows), k=min(anomaly_windows, total_windows)))

#     rows = []
#     base_hr = random.uniform(60, 75)
#     base_spo2 = random.uniform(97.0, 99.0)
#     base_sys = random.uniform(112, 122)
#     base_dia = random.uniform(72, 82)

#     for i in range(total_windows):
#         ts = start + timedelta(minutes=5 * i)

#         # Normal resting values
#         hr = random.gauss(base_hr, 2.5)
#         spo2 = random.gauss(base_spo2, 0.4)
#         sys = random.gauss(base_sys, 6)
#         dia = random.gauss(base_dia, 4)

#         # Inject anomalies in selected windows
#         if i in anomaly_idxs:
#             kind = random.choice(["hr_spike", "spo2_drop", "bp_spike"])
#             if kind == "hr_spike":
#                 hr += random.uniform(25, 45)
#             elif kind == "spo2_drop":
#                 spo2 -= random.uniform(4, 8)
#             elif kind == "bp_spike":
#                 sys += random.uniform(25, 50)
#                 dia += random.uniform(15, 30)

#         # clamp to realistic-ish bounds
#         hr = max(45, min(150, hr))
#         spo2 = max(85, min(100, spo2))
#         sys = max(90, min(210, sys))
#         dia = max(55, min(140, dia))

#         # IMPORTANT: All three metric rows share the SAME timestamp
#         # so your 5-min resample keeps a complete row after dropna().
#         rows.extend([
#             HealthData(
#                 user_id=user_id,
#                 metric_type="heart_rate",
#                 value=float(round(hr, 1)),
#                 systolic=None,
#                 diastolic=None,
#                 timestamp=ts,
#                 activity_type="resting",
#             ),
#             HealthData(
#                 user_id=user_id,
#                 metric_type="spo2",
#                 value=float(round(spo2, 1)),
#                 systolic=None,
#                 diastolic=None,
#                 timestamp=ts,
#                 activity_type="resting",
#             ),
#             HealthData(
#                 user_id=user_id,
#                 metric_type="blood_pressure",
#                 value=None,
#                 systolic=int(round(sys)),
#                 diastolic=int(round(dia)),
#                 timestamp=ts,
#                 activity_type="resting",
#             ),
#         ])

#     db.add_all(rows)


# async def main():
#     email = "jrtnmy@gmail.com"
#     days = 2

#     async with async_session() as db:
#         user = await get_or_create_user(db, email)

#         # wipe existing demo data (recommended while testing)
#         await clear_user_resting_data(db, user.id)

#         await seed_resting_5min_windows(db, user.id, days=days, anomaly_windows=12)
#         await db.commit()

#         print(f"✅ Seeded {days} days of 5-min RESTING windows for {email} (user_id={user.id}).")
#         print("Now run train_user_model(user.id, db) or trigger your post-sync training logic.")


# if __name__ == "__main__":
#     asyncio.run(main())

import asyncio
import random
from datetime import datetime, timedelta

from database import async_session
from models import HealthData

USER_ID = 1  # change if needed


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


async def main():
    async with async_session() as db:
        # Current UTC-naive time aligned to 5-minute boundary
        now = datetime.utcnow().replace(second=0, microsecond=0)
        now = now - timedelta(minutes=now.minute % 5)

        rows = []

        # Baselines
        base_hr = random.uniform(65, 75)
        base_spo2 = random.uniform(97.0, 99.0)
        base_sys = random.uniform(115, 125)
        base_dia = random.uniform(75, 85)

        # Insert 20 windows, going backwards in time
        for i in range(20):
            ts = now - timedelta(minutes=5 * i)

            hr = clamp(random.gauss(base_hr, 3), 45, 150)
            spo2 = clamp(random.gauss(base_spo2, 0.6), 85, 100)
            sys = clamp(random.gauss(base_sys, 8), 90, 200)
            dia = clamp(random.gauss(base_dia, 6), 55, 130)

            rows.extend([
                HealthData(
                    user_id=USER_ID,
                    metric_type="heart_rate",
                    value=round(hr, 1),
                    timestamp=ts,
                    activity_type="resting",
                ),
                HealthData(
                    user_id=USER_ID,
                    metric_type="spo2",
                    value=round(spo2, 1),
                    timestamp=ts,
                    activity_type="resting",
                ),
                HealthData(
                    user_id=USER_ID,
                    metric_type="blood_pressure",
                    systolic=int(sys),
                    diastolic=int(dia),
                    timestamp=ts,
                    activity_type="resting",
                ),
            ])

        db.add_all(rows)
        await db.commit()

        print("✅ Inserted 20 resting windows (60 rows total)")
        print("Latest timestamp:", now)
        print("Oldest timestamp:", now - timedelta(minutes=5 * 19))


if __name__ == "__main__":
    asyncio.run(main())





