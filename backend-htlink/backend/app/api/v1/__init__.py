from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, plans, tenants, users, properties, features, features_test, posts, media,
    categories, events, settings, utils, locales, translations, property_categories,
    analytics, test_upload, property_posts, activity_logs, activity_test,
    vr_hotel_settings, vr_hotel_languages, vr_hotel_introduction, vr_hotel_policies, vr_hotel_rules, vr_hotel_rooms,
    vr_hotel_dining, vr_hotel_facility, vr_hotel_service, vr_hotel_contact, vr_hotel_offers, vr_hotel_export,
    cafe_settings, cafe_contact, cafe_languages, cafe_branches, cafe_menu, cafe_events, cafe_careers, cafe_promotions,
    cafe_spaces, cafe_content_sections, cafe_services
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
api_router.include_router(vr_hotel_offers.router, prefix="/vr-hotel", tags=["vr-hotel"])
api_router.include_router(vr_hotel_export.router, prefix="/vr-hotel", tags=["vr-hotel-export"])

# Cafe routes
api_router.include_router(cafe_settings.router, prefix="/cafe/settings", tags=["cafe"])
api_router.include_router(cafe_contact.router, prefix="/cafe/contact", tags=["cafe"])
api_router.include_router(cafe_languages.router, prefix="/cafe", tags=["cafe"])
api_router.include_router(cafe_branches.router, prefix="/cafe/branches", tags=["cafe"])
api_router.include_router(cafe_menu.router, prefix="/cafe/menu", tags=["cafe"])
api_router.include_router(cafe_events.router, prefix="/cafe/events", tags=["cafe"])
api_router.include_router(cafe_careers.router, prefix="/cafe/careers", tags=["cafe"])
api_router.include_router(cafe_promotions.router, prefix="/cafe/promotions", tags=["cafe"])
api_router.include_router(cafe_services.router, prefix="/cafe/services", tags=["cafe"])
api_router.include_router(cafe_spaces.router, prefix="/cafe/spaces", tags=["cafe"])
api_router.include_router(cafe_content_sections.router, prefix="/cafe/content-sections", tags=["cafe"])
