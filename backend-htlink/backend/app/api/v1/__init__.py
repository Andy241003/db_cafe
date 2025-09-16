from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, login, plans, tenants, users, properties, features, posts, media,
    categories, events, settings
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(features.router, prefix="/features", tags=["features"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])