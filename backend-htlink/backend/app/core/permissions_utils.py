from typing import List
from app.models import AdminUser


def has_role(user: AdminUser, allowed_roles: List[str]) -> bool:
    """Check if user has any of the allowed roles (case-insensitive)"""
    return user.role.lower() in [role.lower() for role in allowed_roles]


def is_owner(user: AdminUser) -> bool:
    """Check if user is owner"""
    return user.role.lower() == "owner"


def is_admin_or_owner(user: AdminUser) -> bool:
    """Check if user is admin or owner"""
    return user.role.lower() in ["owner", "admin"]


def is_viewer(user: AdminUser) -> bool:
    """Check if user is viewer"""
    return user.role.lower() == "viewer"