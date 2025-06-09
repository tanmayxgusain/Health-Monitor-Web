from fastapi import FastAPI
from routers import auth, healthdata
from database import Base, engine
import models
from fastapi.middleware.cors import CORSMiddleware
from routers import healthdata

from routers import google_auth 



app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(healthdata.router)

app.include_router(google_auth.router)

@app.get("/")
def root():
    return {"message": "Smart Health API is running"}



# Create tables on startup
Base.metadata.create_all(bind=engine)