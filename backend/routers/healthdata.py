from fastapi import APIRouter

router = APIRouter(prefix="/healthdata", tags=["Health Data"])

@router.get("/")
def get_health_data():
    return {"message": "Health data endpoint working!"}
