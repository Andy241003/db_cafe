from typing import List
from app.models import AdminUser


def has_role(user: AdminUser, allowed_roles: List[str]) -> bool:
    """Check if user has any of the allowed roles (case-insensitive)"""
    return user.role.upper() in [role.upper() for role in allowed_roles]


def is_owner(user: AdminUser) -> bool:
    """Check if user is owner"""
    return user.role.upper() == "OWNER"


def is_admin_or_owner(user: AdminUser) -> bool:
    """Check if user is admin or owner"""
    return user.role.upper() in ["OWNER", "ADMIN"]


def can_edit_content(user: AdminUser) -> bool:
    """Check if user can edit content (owner, admin, or editor)"""
    return user.role.upper() in ["OWNER", "ADMIN", "EDITOR"]


def can_delete_content(user: AdminUser) -> bool:
    """Check if user can delete content (owner, admin, or editor)"""
    return user.role.upper() in ["OWNER", "ADMIN", "EDITOR"]


def is_viewer(user: AdminUser) -> bool:
    """Check if user is viewer"""
    return user.role.upper() == "VIEWER"