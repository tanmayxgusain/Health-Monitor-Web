from fastapi import FastAPI
from routers import auth, healthdata
from database import Base, engine
import models
from fastapi.middleware.cors import CORSMiddleware
from routers import healthdata

from routers import google_auth 

from routers.google_health import router as google_health_router


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
app.include_router(google_health_router)

@app.get("/")
def root():
    return {"message": "Smart Health API is running"}



# Create tables on startup
# Base.metadata.create_all(bind=engine)

# ✅ Async table creation
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)