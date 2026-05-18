"""
Cafe Settings API endpoints

Handles cafe settings, contact, branding, and page configurations
"""
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.models.cafe import CafeSettings, CafePageSettings
from app.utils.cafe_vr_settings import (
    build_default_vr360_settings,
    build_grouped_vr360_sections,
    normalize_scoped_vr360_settings_json,
    normalize_target_id,
    normalize_vr360_settings,
)
from app.utils.cafe_vr_title import clean_title_translations, sync_title_translations

router = APIRouter()


# ==========================================
# Pydantic Schemas
# ==========================================

class CafeVR360SettingsResponse(BaseModel):
    target_id: Optional[str] = None
    panorama_url: Optional[str] = None
    vr360_link: Optional[str] = None
    vr_title: Optional[str] = None
    title_translations: Optional[Dict[str, str]] = None


class CafeSettingsResponse(BaseModel):
    """Cafe Settings Response"""
    id: Optional[int] = None
    tenant_id: Optional[int] = None
    cafe_name: str
    slogan: Optional[str] = None
    primary_color: str = "#6f4e37"
    secondary_color: str = "#d4a574"
    background_color: str = "#ffffff"
    booking_url: Optional[str] = None
    messenger_url: Optional[str] = None
    phone_number: Optional[str] = None
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    cover_image_media_id: Optional[int] = None
    meta_image_media_id: Optional[int] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    settings_json: Optional[Dict[str, Any]] = None
    vr360_sections: Optional[Dict[str, CafeVR360SettingsResponse]] = None
    updated_at: Optional[datetime] = None


class CafeSettingsUpdate(BaseModel):
    """Cafe Settings Update"""
    cafe_name: Optional[str] = None
    slogan: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    background_color: Optional[str] = None
    logo_media_id: Optional[int] = None
    favicon_media_id: Optional[int] = None
    booking_url: Optional[str] = None
    messenger_url: Optional[str] = None
    phone_number: Optional[str] = None
    cover_image_media_id: Optional[int] = None
    meta_image_media_id: Optional[int] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    settings_json: Optional[Dict[str, Any]] = None


class CafePageSettingsResponse(BaseModel):
    """Cafe Page Settings Response"""
    id: Optional[int] = None
    tenant_id: Optional[int] = None
    page_code: str
    is_displaying: bool = True
    vr360: CafeVR360SettingsResponse
    settings_json: Optional[Dict[str, Any]] = None
    updated_at: Optional[datetime] = None


class CafePageSettingsUpdate(BaseModel):
    """Cafe Page Settings Update"""
    page_code: str
    is_displaying: Optional[bool] = None
    target_id: Optional[str | int] = None
    panorama_url: Optional[str] = None
    vr360_link: Optional[str] = None
    vr_title: Optional[str] = None
    title_translations: Optional[Dict[str, str]] = None
    settings_json: Optional[Dict[str, Any]] = None


# ==========================================
# Helper Functions
# ==========================================

def get_cafe_settings_record(db: SessionDep, tenant_id: int) -> Optional[CafeSettings]:
    return db.exec(
        select(CafeSettings).where(CafeSettings.tenant_id == tenant_id).limit(1)
    ).first()


def to_cafe_settings_response(
    settings: CafeSettings | CafeSettingsResponse,
    db: SessionDep,
    tenant_id: int,
) -> CafeSettingsResponse:
    payload = settings.model_dump()
    payload["tenant_id"] = tenant_id
    payload["settings_json"] = normalize_scoped_vr360_settings_json(
        db,
        tenant_id,
        payload.get("settings_json"),
    )
    payload["vr360_sections"] = {
        section_name: CafeVR360SettingsResponse(**section_value)
        for section_name, section_value in build_grouped_vr360_sections(
            db,
            tenant_id,
            payload.get("settings_json"),
        ).items()
    }
    return CafeSettingsResponse(**payload)


def to_page_settings_response(
    page_settings: CafePageSettings | CafePageSettingsResponse,
    db: SessionDep,
    tenant_id: int,
) -> CafePageSettingsResponse:
    payload = page_settings.model_dump()
    payload["tenant_id"] = tenant_id
    normalized_vr360 = normalize_vr360_settings(
        db,
        tenant_id,
        raw_target_id=(payload.get("settings_json") or {}).get("target_id"),
        panorama_url=(payload.get("settings_json") or {}).get("panorama_url"),
        vr360_link=payload.get("vr360_link"),
        vr_title=payload.get("vr_title"),
        title_translations=(payload.get("settings_json") or {}).get("title_translations"),
    )
    payload["settings_json"] = {
        **((payload.get("settings_json") or {}) if isinstance(payload.get("settings_json"), dict) else {}),
        "target_id": normalized_vr360["target_id"],
        "panorama_url": normalized_vr360["panorama_url"],
        "title_translations": clean_title_translations(normalized_vr360.get("title_translations")),
    }
    payload["vr360"] = CafeVR360SettingsResponse(**normalized_vr360)
    return CafePageSettingsResponse(**payload)


def get_page_settings_record(db: SessionDep, tenant_id: int, page_code: str) -> Optional[CafePageSettings]:
    return db.exec(
        select(CafePageSettings).where(
            CafePageSettings.tenant_id == tenant_id,
            CafePageSettings.page_code == page_code,
        )
    ).first()


# ==========================================
# API Endpoints
# ==========================================

@router.get("/", response_model=CafeSettingsResponse)
def get_cafe_settings(
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get cafe settings for current tenant
    """
    settings = get_cafe_settings_record(db, current_user.tenant_id)

    if not settings:
        return CafeSettingsResponse(
            tenant_id=current_user.tenant_id,
            cafe_name="My Cafe",
            primary_color="#6f4e37",
            secondary_color="#d4a574",
            background_color="#ffffff",
            vr360_sections={
                section_name: CafeVR360SettingsResponse(**build_default_vr360_settings(db, current_user.tenant_id))
                for section_name in ("menu", "space", "branches", "events", "careers", "promotions", "contact")
            },
        )

    return to_cafe_settings_response(settings, db, current_user.tenant_id)


@router.post("/", response_model=CafeSettingsResponse)
def create_or_update_cafe_settings(
    settings_data: CafeSettingsUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Create or update cafe settings
    """
    existing = get_cafe_settings_record(db, current_user.tenant_id)

    if existing:
        for key, value in settings_data.model_dump(exclude_unset=True).items():
            if key == "settings_json" and isinstance(value, dict):
                value = normalize_scoped_vr360_settings_json(db, current_user.tenant_id, value)
            if hasattr(existing, key):
                setattr(existing, key, value)
                if key in ['business_hours', 'settings_json']:
                    flag_modified(existing, key)
        existing.updated_at = datetime.utcnow()

        db.add(existing)
        db.commit()
        db.refresh(existing)
        return to_cafe_settings_response(existing, db, current_user.tenant_id)

    settings_dict = settings_data.model_dump(exclude_unset=True)
    if isinstance(settings_dict.get("settings_json"), dict):
        settings_dict["settings_json"] = normalize_scoped_vr360_settings_json(
            db,
            current_user.tenant_id,
            settings_dict["settings_json"],
        )
    if 'cafe_name' not in settings_dict or settings_dict.get('cafe_name') is None:
        settings_dict['cafe_name'] = 'My Cafe'

    new_settings = CafeSettings(
        tenant_id=current_user.tenant_id,
        **settings_dict,
    )
    new_settings.updated_at = datetime.utcnow()
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    return to_cafe_settings_response(new_settings, db, current_user.tenant_id)


@router.get("/pages", response_model=list[CafePageSettingsResponse])
def get_cafe_page_settings(
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get all page settings for current tenant
    """
    statement = select(CafePageSettings).where(
        CafePageSettings.tenant_id == current_user.tenant_id
    )
    page_settings = db.exec(statement).all()
    return [
        to_page_settings_response(page, db, current_user.tenant_id)
        for page in page_settings
    ]


@router.get("/pages/{page_code}", response_model=CafePageSettingsResponse)
def get_page_setting(
    page_code: str,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get specific page setting
    """
    page_setting = get_page_settings_record(db, current_user.tenant_id, page_code)

    if not page_setting:
        return CafePageSettingsResponse(
            tenant_id=current_user.tenant_id,
            page_code=page_code,
            is_displaying=True,
            vr360=CafeVR360SettingsResponse(**build_default_vr360_settings(db, current_user.tenant_id)),
            settings_json=None,
        )

    return to_page_settings_response(page_setting, db, current_user.tenant_id)


@router.post("/pages", response_model=CafePageSettingsResponse)
def create_or_update_page_setting(
    page_data: CafePageSettingsUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Create or update page setting
    """
    existing = get_page_settings_record(db, current_user.tenant_id, page_data.page_code)
    update_dict = page_data.model_dump(exclude_unset=True, exclude={"title_translations"})
    incoming_settings_json = update_dict.get("settings_json")
    base_settings_json = incoming_settings_json
    if base_settings_json is None and existing:
        base_settings_json = existing.settings_json
    if not isinstance(base_settings_json, dict):
        base_settings_json = {}
    if "target_id" in update_dict:
        base_settings_json = {
            **base_settings_json,
            "target_id": normalize_target_id(db, current_user.tenant_id, update_dict.pop("target_id")),
        }
    if "panorama_url" in update_dict:
        base_settings_json = {
            **base_settings_json,
            "panorama_url": update_dict.pop("panorama_url"),
        }

    next_settings_json, _, primary_title = sync_title_translations(
        base_settings_json,
        title_translations=page_data.title_translations,
        fallback_title=update_dict.get("vr_title"),
    )
    normalized_vr360 = normalize_vr360_settings(
        db,
        current_user.tenant_id,
        raw_target_id=next_settings_json.get("target_id"),
        panorama_url=next_settings_json.get("panorama_url"),
        vr360_link=update_dict.get("vr360_link") if "vr360_link" in update_dict else existing.vr360_link if existing else None,
        vr_title=update_dict.get("vr_title") if "vr_title" in update_dict else primary_title,
        title_translations=next_settings_json.get("title_translations"),
    )
    next_settings_json["target_id"] = normalized_vr360["target_id"]
    next_settings_json["panorama_url"] = normalized_vr360["panorama_url"]
    next_settings_json["title_translations"] = normalized_vr360["title_translations"]
    update_dict["vr_title"] = normalized_vr360["vr_title"] or primary_title

    if page_data.title_translations is not None or "target_id" in page_data.model_fields_set or "panorama_url" in page_data.model_fields_set or (
        isinstance(incoming_settings_json, dict) and "title_translations" in incoming_settings_json
    ):
        update_dict["settings_json"] = next_settings_json
        update_dict["vr_title"] = primary_title

    if existing:
        for key, value in update_dict.items():
            if hasattr(existing, key) and key != 'page_code':
                setattr(existing, key, value)
                if key == 'settings_json':
                    flag_modified(existing, key)
        existing.updated_at = datetime.utcnow()

        db.add(existing)
        db.commit()
        db.refresh(existing)
        return to_page_settings_response(existing, db, current_user.tenant_id)

    new_page = CafePageSettings(
        tenant_id=current_user.tenant_id,
        **update_dict,
    )
    new_page.updated_at = datetime.utcnow()
    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return to_page_settings_response(new_page, db, current_user.tenant_id)


@router.delete("/pages/{page_code}")
def delete_page_setting(
    page_code: str,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Delete page setting
    """
    page_setting = get_page_settings_record(db, current_user.tenant_id, page_code)

    if not page_setting:
        raise HTTPException(status_code=404, detail="Page setting not found")

    db.delete(page_setting)
    db.commit()

    return {"success": True, "message": "Page setting deleted"}
