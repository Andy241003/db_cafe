from __future__ import annotations

from typing import Any, Dict, Optional

from sqlmodel import Session, select

from app.models.vr_hotel import VR360Scene
from app.utils.cafe_vr_title import clean_title_translations

SECTION_PREFIXES: dict[str, Optional[str]] = {
    "home": None,
    "about": None,
    "menu": "menu",
    "space": "spaces",
    "branches": "branches",
    "events": "events",
    "careers": "careers",
    "promotions": "promotions",
    "contact": "contact",
}


def list_vr360_scenes_for_tenant(db: Session, tenant_id: int, active_only: bool = False) -> list[VR360Scene]:
    query = select(VR360Scene).where(
        VR360Scene.tenant_id == tenant_id,
        VR360Scene.property_id.is_(None),
    )
    if active_only:
        query = query.where(VR360Scene.is_active == True)

    query = query.order_by(VR360Scene.display_order, VR360Scene.id)
    return list(db.exec(query).all())


def get_scene_by_db_id(db: Session, tenant_id: int, scene_db_id: int) -> Optional[VR360Scene]:
    query = select(VR360Scene).where(
        VR360Scene.tenant_id == tenant_id,
        VR360Scene.property_id.is_(None),
        VR360Scene.id == scene_db_id,
    )
    return db.exec(query).first()


def get_scene_by_scene_id(db: Session, tenant_id: int, scene_id: str) -> Optional[VR360Scene]:
    query = select(VR360Scene).where(
        VR360Scene.tenant_id == tenant_id,
        VR360Scene.property_id.is_(None),
        VR360Scene.scene_id == scene_id,
    )
    return db.exec(query).first()


def resolve_scene_reference(db: Session, tenant_id: int, raw_target_id: Any) -> Optional[VR360Scene]:
    if raw_target_id is None:
        return None

    if isinstance(raw_target_id, str):
        normalized = raw_target_id.strip()
        if not normalized:
            return None

        scene = get_scene_by_scene_id(db, tenant_id, normalized)
        if scene:
            return scene

        if normalized.isdigit():
            return get_scene_by_db_id(db, tenant_id, int(normalized))

        return None

    if isinstance(raw_target_id, int):
        return get_scene_by_db_id(db, tenant_id, raw_target_id)

    return None


def normalize_target_id(db: Session, tenant_id: int, raw_target_id: Any) -> Optional[str]:
    scene = resolve_scene_reference(db, tenant_id, raw_target_id)
    if scene:
        return scene.scene_id

    if isinstance(raw_target_id, str):
        normalized = raw_target_id.strip()
        return normalized or None

    return None


def build_scene_option(scene: VR360Scene) -> Dict[str, Any]:
    return {
        "target_id": scene.scene_id,
        "scene_name": scene.scene_name,
        "scene_subtitle": scene.scene_subtitle,
        "panorama_url": scene.panorama_url,
        "display_order": scene.display_order,
        "is_active": scene.is_active,
    }


def build_scene_catalog(db: Session, tenant_id: int) -> list[Dict[str, Any]]:
    return [build_scene_option(scene) for scene in list_vr360_scenes_for_tenant(db, tenant_id)]


def build_default_vr360_settings(db: Session, tenant_id: int) -> Dict[str, Any]:
    first_active_scene = next(iter(list_vr360_scenes_for_tenant(db, tenant_id, active_only=True)), None)
    return {
        "target_id": first_active_scene.scene_id if first_active_scene else None,
        "panorama_url": first_active_scene.panorama_url if first_active_scene else None,
        "vr360_link": None,
        "vr_title": None,
        "title_translations": {},
    }


def normalize_vr360_settings(
    db: Session,
    tenant_id: int,
    *,
    raw_target_id: Any,
    panorama_url: Any,
    vr360_link: Any,
    vr_title: Any,
    title_translations: Any,
) -> Dict[str, Any]:
    scene = resolve_scene_reference(db, tenant_id, raw_target_id)
    normalized_target_id = scene.scene_id if scene else normalize_target_id(db, tenant_id, raw_target_id)
    normalized_panorama_url = panorama_url if isinstance(panorama_url, str) and panorama_url.strip() else None

    if normalized_panorama_url is None and scene and scene.panorama_url:
        normalized_panorama_url = scene.panorama_url

    return {
        "target_id": normalized_target_id,
        "panorama_url": normalized_panorama_url,
        "vr360_link": vr360_link if isinstance(vr360_link, str) and vr360_link.strip() else None,
        "vr_title": vr_title if isinstance(vr_title, str) and vr_title.strip() else None,
        "title_translations": clean_title_translations(title_translations),
    }


def get_section_keys(section_name: str) -> tuple[str, str, str]:
    prefix = SECTION_PREFIXES[section_name]
    if not prefix:
        return ("target_id", "panorama_url", "vr360_link")
    return (
        f"{prefix}_panorama_target_id",
        f"{prefix}_panorama_url",
        f"{prefix}_vr360_link",
    )


def extract_scoped_vr360_settings(
    db: Session,
    tenant_id: int,
    section_name: str,
    settings_json: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    data = settings_json if isinstance(settings_json, dict) else {}
    target_key, panorama_key, vr_key = get_section_keys(section_name)

    if section_name == "contact":
        title_key = "vr_title"
        title_translations = data.get("title_translations")
    else:
        title_key = None
        title_translations = data.get("title_translations") if section_name in {"home", "about"} else data.get(f"{SECTION_PREFIXES[section_name]}_title_translations")

    return normalize_vr360_settings(
        db,
        tenant_id,
        raw_target_id=data.get(target_key),
        panorama_url=data.get(panorama_key),
        vr360_link=data.get(vr_key),
        vr_title=data.get(title_key),
        title_translations=title_translations,
    )


def normalize_scoped_vr360_settings_json(
    db: Session,
    tenant_id: int,
    settings_json: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    data = dict(settings_json or {})
    for section_name, prefix in SECTION_PREFIXES.items():
        if section_name in {"home", "about"}:
            continue

        target_key, panorama_key, _ = get_section_keys(section_name)
        normalized = normalize_vr360_settings(
            db,
            tenant_id,
            raw_target_id=data.get(target_key),
            panorama_url=data.get(panorama_key),
            vr360_link=data.get(get_section_keys(section_name)[2]),
            vr_title=data.get("vr_title") if section_name == "contact" else None,
            title_translations=data.get("title_translations") if section_name == "contact" else data.get(f"{prefix}_title_translations") if prefix else None,
        )

        if target_key in data or normalized["target_id"] is not None:
            data[target_key] = normalized["target_id"]
        if panorama_key in data or normalized["panorama_url"] is not None:
            data[panorama_key] = normalized["panorama_url"]
        if section_name == "contact":
            if "title_translations" in data or normalized["title_translations"]:
                data["title_translations"] = normalized["title_translations"]
            if "vr_title" in data or normalized["vr_title"] is not None:
                data["vr_title"] = normalized["vr_title"]
        elif prefix:
            title_key = f"{prefix}_title_translations"
            if title_key in data or normalized["title_translations"]:
                data[title_key] = normalized["title_translations"]

    return data


def build_grouped_vr360_sections(
    db: Session,
    tenant_id: int,
    settings_json: Optional[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    return {
        section_name: extract_scoped_vr360_settings(db, tenant_id, section_name, settings_json)
        for section_name in ("menu", "space", "branches", "events", "careers", "promotions", "contact")
    }
