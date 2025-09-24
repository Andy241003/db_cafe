from fastapi import APIRouter

router = APIRouter()


@router.get("/health-check/")
def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "service": "HotelLink 360 API"}


@router.get("/test")
def test_endpoint():
    """
    Test endpoint
    """
    return {"message": "API is working correctly"}