from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    media,
    plans,
    tenants,
    users,
    locales,
    activity_logs,
    activity_test,
    restaurant_settings,
    restaurant_contact,
    restaurant_languages,
    restaurant_branches,
    restaurant_menu,
    restaurant_events,
    restaurant_careers,
    restaurant_promotions,
    restaurant_achievements,
    restaurant_spaces,
    restaurant_content_sections,
    restaurant_services,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"], include_in_schema=False)
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"], include_in_schema=False)
api_router.include_router(users.router, prefix="/users", tags=["users"], include_in_schema=False)
api_router.include_router(locales.router, prefix="/locales", tags=["locales"], include_in_schema=False)
api_router.include_router(activity_logs.router, prefix="/activity-logs", tags=["activity-logs"], include_in_schema=False)
api_router.include_router(activity_test.router, prefix="/activity-test", tags=["activity-test"], include_in_schema=False)

api_router.include_router(restaurant_settings.router, prefix="/restaurant/settings", tags=["restaurant"])
api_router.include_router(restaurant_contact.router, prefix="/restaurant/contact", tags=["restaurant"])
api_router.include_router(restaurant_languages.router, prefix="/restaurant", tags=["restaurant"])
api_router.include_router(restaurant_branches.router, prefix="/restaurant/branches", tags=["restaurant"])
api_router.include_router(restaurant_menu.router, prefix="/restaurant/menu", tags=["restaurant"])
api_router.include_router(restaurant_events.router, prefix="/restaurant/events", tags=["restaurant"])
api_router.include_router(restaurant_careers.router, prefix="/restaurant/careers", tags=["restaurant"])
api_router.include_router(restaurant_promotions.router, prefix="/restaurant/promotions", tags=["restaurant"])
api_router.include_router(restaurant_achievements.router, prefix="/restaurant/achievements", tags=["restaurant"])
api_router.include_router(restaurant_services.router, prefix="/restaurant/services", tags=["restaurant"])
api_router.include_router(restaurant_spaces.router, prefix="/restaurant/spaces", tags=["restaurant"])
api_router.include_router(restaurant_content_sections.router, prefix="/restaurant/content-sections", tags=["restaurant"])
