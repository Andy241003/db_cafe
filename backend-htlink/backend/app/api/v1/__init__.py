from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, plans, tenants, users, properties, features, features_test, posts, media,
    categories, events, settings, utils, locales, translations, property_categories,
    analytics, test_upload, property_posts, activity_logs, activity_test,
    vr_hotel_settings, vr_hotel_languages, vr_hotel_introduction, vr_hotel_policies, vr_hotel_rules, vr_hotel_rooms,
    vr_hotel_dining, vr_hotel_facility, vr_hotel_service, vr_hotel_contact
)

api_router = APIRouter()
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(activity_logs.router, prefix="/activity-logs", tags=["activity-logs"])
api_router.include_router(activity_test.router, prefix="/activity-test", tags=["activity-test"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(features.router, prefix="/features", tags=["features"])
api_router.include_router(features_test.router, prefix="/features-test", tags=["features-test"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(locales.router, prefix="/locales", tags=["locales"])
api_router.include_router(translations.router, prefix="/translations", tags=["translations"])
api_router.include_router(property_categories.router, prefix="/property-categories", tags=["property-categories"])
api_router.include_router(property_posts.router, prefix="/property-posts", tags=["property-posts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(test_upload.router, prefix="/test-upload", tags=["test-upload"])

# VR Hotel routes
api_router.include_router(vr_hotel_settings.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_languages.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_introduction.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_policies.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_rules.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_rooms.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_dining.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_facility.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_service.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_contact.router, prefix="/vr-hotel", tags=["vr-hotel"])
