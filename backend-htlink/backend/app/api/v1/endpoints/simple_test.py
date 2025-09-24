from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SimpleResponse(BaseModel):
    message: str
    status: str = "ok"

@router.get("/simple-test")
def simple_test() -> SimpleResponse:
    """Simple test endpoint without any dependencies"""
    return SimpleResponse(message="This is a simple test endpoint")

@router.post("/simple-login")
def simple_login() -> SimpleResponse:
    """Simple login endpoint for testing"""
    return SimpleResponse(message="Simple login test successful")