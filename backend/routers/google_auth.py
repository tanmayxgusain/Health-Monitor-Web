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

    return {"message": "Login successful", "user": {"email": email, "name": name}}

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


@router.get("/google/health-data")
def get_health_data(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user or not user.access_token:
        raise HTTPException(status_code=401, detail="User not authenticated")

    headers = {
        "Authorization": f"Bearer {user.access_token}"
    }

    dataset_url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"

    # Set start/end times (last 24h) in nanoseconds
    import time
    end_time = int(time.time() * 1e9)
    start_time = end_time - 24 * 60 * 60 * int(1e9)

    body = {
        "aggregateBy": [{
            "dataTypeName": "com.google.heart_rate.bpm"
        }],
        "bucketByTime": {"durationMillis": 3600000},  # hourly
        "startTimeMillis": int(start_time / 1e6),
        "endTimeMillis": int(end_time / 1e6)
    }

    response = requests.post(dataset_url, headers=headers, json=body)
    return response.json()
