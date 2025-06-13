# backend/routers/google_auth.py

from datetime import datetime, time, timedelta
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
import requests
import os
from sqlalchemy.orm import Session
from database import get_db
from models import User

from urllib.parse import urlencode

from dotenv import load_dotenv


load_dotenv()

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Replace these with your actual credentials
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth/google/callback"

SCOPES = [
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.blood_pressure.read",
    "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
    "email",
    "profile"
]

@router.get("/auth/login")
def login():
    query = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent"
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")

@router.get("/auth/callback")
def auth_callback(code: str):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post(token_url, data=data)
    token_info = response.json()
    return {"access_token": token_info.get("access_token"), "refresh_token": token_info.get("refresh_token")}

@router.get("/auth/google/login")
def google_login():
    query = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent"
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@router.get("/auth/google/callback")
def google_callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(status_code=400, detail="Missing code from Google callback")

    # Step 1: Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()

    if "access_token" not in token_json:
        print("Token exchange failed:", token_json)
        raise HTTPException(status_code=401, detail="Token exchange failed")

    access_token = token_json["access_token"]
    refresh_token = token_json.get("refresh_token")  # Can be None on repeated login

    # Step 2: Fetch user info using the access token
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}

    user_info_response = requests.get(user_info_url, headers=headers)
    user_info = user_info_response.json()

    if "email" not in user_info:
        print("User info fetch failed:", user_info)
        raise HTTPException(status_code=401, detail="Failed to fetch user info")

    # Step 3: Extract info
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")
    

    # Step 4: Save user or get existing user
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=name,
            email=email,
            profile_pic=picture,
            access_token=access_token,
            refresh_token=token_json.get("refresh_token")
        )
        db.add(user)
    
    else:
        user.access_token = access_token
        user.refresh_token = token_json.get("refresh_token") or user.refresh_token

    db.commit()
    db.refresh(user)


    # Optional: Create a JWT token or session here

    frontend_url = f"http://localhost:3000/oauth-success?email={email}"
    return RedirectResponse(frontend_url)


@router.get("/auth/fitness/heart-rate")
def get_heart_rate_data(db: Session = Depends(get_db), email: str = "testuser@example.com"):
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.access_token:
        raise HTTPException(status_code=401, detail="User not authorized")

    headers = {
        "Authorization": f"Bearer {user.access_token}",
        "Content-Type": "application/json"
    }

    dataset = "0000000000000-" + str(int(time.time() * 1000000000))  # nanosecond format
    url = f"https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"

    body = {
        "aggregateBy": [{
            "dataTypeName": "com.google.heart_rate.bpm"
        }],
        "bucketByTime": { "durationMillis": 86400000 },
        "startTimeMillis": int((datetime.utcnow() - timedelta(days=1)).timestamp() * 1000),
        "endTimeMillis": int(datetime.utcnow().timestamp() * 1000)
    }

    response = requests.post(url, headers=headers, json=body)
    return response.json()



GOOGLE_FIT_API_URL = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"

# Define data source types
DATA_TYPES = {
    "heart_rate": "com.google.heart_rate.bpm",
    "blood_pressure": "com.google.blood_pressure",
    "spo2": "com.google.oxygen_saturation"
}


def build_request_body(data_type, start_time_millis, end_time_millis):
    return {
        "aggregateBy": [{
            "dataTypeName": data_type
        }],
        "bucketByTime": { "durationMillis": 3600000 },  # hourly buckets
        "startTimeMillis": start_time_millis,
        "endTimeMillis": end_time_millis
    }


@router.get("/google/health-data")
def get_health_data(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user or not user.access_token:
        raise HTTPException(status_code=400, detail="Google account not linked")

    access_token = user.access_token

    # Time range: last 24 hours
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=1)
    start_millis = int(start_time.timestamp() * 1000)
    end_millis = int(end_time.timestamp() * 1000)

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    results = {}

    for key, data_type in DATA_TYPES.items():
        res = requests.post(
            GOOGLE_FIT_API_URL,
            headers=headers,
            json=build_request_body(data_type, start_millis, end_millis)
        )

        if res.status_code != 200:
            results[key] = []
            continue

        buckets = res.json().get("bucket", [])
        extracted = []

        for bucket in buckets:
            for dataset in bucket.get("dataset", []):
                for point in dataset.get("point", []):
                    ts = int(point["startTimeNanos"]) // 1_000_000
                    if data_type == "com.google.blood_pressure":
                        # Systolic and Diastolic from multiple fields
                        systolic = None
                        diastolic = None
                        for val in point["value"]:
                            if val["mapVal"][0]["key"] == "systolic":
                                systolic = val["mapVal"][0]["value"]["fpVal"]
                            elif val["mapVal"][0]["key"] == "diastolic":
                                diastolic = val["mapVal"][0]["value"]["fpVal"]
                        if systolic and diastolic:
                            extracted.append({
                                "timestamp": ts,
                                "systolic": int(systolic),
                                "diastolic": int(diastolic)
                            })
                    else:
                        value = point["value"][0].get("fpVal")
                        if value is not None:
                            extracted.append({
                                "timestamp": ts,
                                "value": int(value)
                            })

        results[key] = extracted

    return results


