from .base import CRUDBase
from .crud_core import plan, tenant, admin_user, locale
from app.models import MediaFile
from app.schemas import MediaFileCreate, MediaFileUpdate

media_file = CRUDBase[MediaFile, MediaFileCreate, MediaFileUpdate](MediaFile)


def create_user(session, user_create):
    return admin_user.create(session, obj_in=user_create)


def create_admin_user(session, user_create):
    return admin_user.create(session, obj_in=user_create)


__all__ = [
    "plan",
    "tenant",
    "admin_user",
    "locale",
    "media_file",
    "create_user",
    "create_admin_user",
]
