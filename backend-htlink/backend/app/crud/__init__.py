from .crud_core import plan, tenant, admin_user, locale
from .crud_content import (
    property, property_translation, feature_category, feature_category_translation,
    feature, feature_translation, property_category, property_feature,
    post, post_translation, media_file, post_media, event, setting
)
from . import property_posts

# For backwards compatibility, also import the old single crud functions
def create_user(session, user_create):
    """Create admin user - compatibility function"""
    return admin_user.create(session, obj_in=user_create)

def create_admin_user(session, user_create):
    """Create admin user - alias"""
    return admin_user.create(session, obj_in=user_create)

# Export all CRUD instances
__all__ = [
    "plan", "tenant", "admin_user", "locale",
    "property", "property_translation", "feature_category", "feature_category_translation",
    "feature", "feature_translation", "property_category", "property_feature",
    "post", "post_translation", "media_file", "post_media", "event", "setting",
    "property_posts",
    "create_user", "create_admin_user"
]