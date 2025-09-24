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

from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

@router.post("/test-login")
def test_login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> SimpleResponse:
    """Test login with form data but no database"""
    return SimpleResponse(message=f"Login test for user: {form_data.username}")