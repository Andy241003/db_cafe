import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.tags:
        return f"{route.tags[0]}-{route.name}"
    return route.name


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",  # /api/v1/openapi.json
    docs_url=f"{settings.API_V1_STR}/docs",             # /api/v1/docs
    redoc_url=f"{settings.API_V1_STR}/redoc",           # /api/v1/redoc
    generate_unique_id_function=custom_generate_unique_id,
)


# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router)


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "HotelLink 360 API"}


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "HotelLink 360 SaaS API", 
        "version": "1.0.0",
        "docs": "/docs"
    }
