"""
VR360 Scene Sync API endpoints.

Cafe-only sync stores scene metadata per tenant and does not use property_id.
"""
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.cafe import CafePageSettings, CafeSettings
from app.models.vr_hotel import VR360Scene
from app.models import Tenant
from app.crud.vr_hotel import vr360_scene
from app.schemas.vr_hotel import VR360SceneListItem, VR360SceneSyncRequest, VR360SceneSyncResponse
from app.utils.cafe_vr_settings import (
    build_default_vr360_settings,
    build_grouped_vr360_sections,
    build_scene_catalog,
    normalize_vr360_settings,
)

router = APIRouter(tags=["vr360"])


@router.get("/scenes", response_model=list[VR360SceneListItem])
def list_vr360_scenes(
    current_user: CurrentUser,
    db: SessionDep,
):
    scenes = db.exec(
        select(VR360Scene).where(
            VR360Scene.tenant_id == current_user.tenant_id,
            VR360Scene.property_id.is_(None),
        ).order_by(VR360Scene.display_order, VR360Scene.id)
    ).all()

    return [
        VR360SceneListItem(
            target_id=scene.scene_id,
            scene_name=scene.scene_name,
            scene_subtitle=scene.scene_subtitle,
            panorama_url=scene.panorama_url,
            display_order=scene.display_order,
            is_active=scene.is_active,
        )
        for scene in scenes
    ]


@router.get("/settings")
def get_vr360_settings(
    current_user: CurrentUser,
    db: SessionDep,
):
    cafe_settings = db.exec(
        select(CafeSettings).where(CafeSettings.tenant_id == current_user.tenant_id).limit(1)
    ).first()

    page_settings = db.exec(
        select(CafePageSettings).where(CafePageSettings.tenant_id == current_user.tenant_id)
    ).all()

    page_settings_map = {page.page_code: page for page in page_settings}
    scenes = build_scene_catalog(db, current_user.tenant_id)

    sections = {
        "home": normalize_vr360_settings(
            db,
            current_user.tenant_id,
            raw_target_id=((page_settings_map.get("home").settings_json if page_settings_map.get("home") else {}) or {}).get("target_id"),
            panorama_url=((page_settings_map.get("home").settings_json if page_settings_map.get("home") else {}) or {}).get("panorama_url"),
            vr360_link=page_settings_map.get("home").vr360_link if page_settings_map.get("home") else None,
            vr_title=page_settings_map.get("home").vr_title if page_settings_map.get("home") else None,
            title_translations=((page_settings_map.get("home").settings_json if page_settings_map.get("home") else {}) or {}).get("title_translations"),
        ),
        "about": normalize_vr360_settings(
            db,
            current_user.tenant_id,
            raw_target_id=((page_settings_map.get("about").settings_json if page_settings_map.get("about") else {}) or {}).get("target_id"),
            panorama_url=((page_settings_map.get("about").settings_json if page_settings_map.get("about") else {}) or {}).get("panorama_url"),
            vr360_link=page_settings_map.get("about").vr360_link if page_settings_map.get("about") else None,
            vr_title=page_settings_map.get("about").vr_title if page_settings_map.get("about") else None,
            title_translations=((page_settings_map.get("about").settings_json if page_settings_map.get("about") else {}) or {}).get("title_translations"),
        ),
        **build_grouped_vr360_sections(
            db,
            current_user.tenant_id,
            cafe_settings.settings_json if cafe_settings else {},
        ),
    }

    if not page_settings_map.get("home"):
        sections["home"] = build_default_vr360_settings(db, current_user.tenant_id)
    if not page_settings_map.get("about"):
        sections["about"] = build_default_vr360_settings(db, current_user.tenant_id)

    return {
        "scenes": scenes,
        "sections": sections,
    }


@router.post("/scenes/sync", response_model=VR360SceneSyncResponse)
def sync_vr360_scenes(
    request: VR360SceneSyncRequest,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Sync VR360 scenes from frontend payload.

    - Validates request data
    - Determines tenant from authenticated user
    - Upserts scenes in database
    - Returns sync statistics
    """
    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Authenticated tenant not found"
        )

    if request.tenant_code and request.tenant_code != tenant.code:
        raise HTTPException(status_code=400, detail="tenant_code does not match authenticated tenant")

    # Determine property if provided; for cafe-only VR this is optional
    property_id = request.property_id

    # Convert request scenes to dict format for CRUD
    scenes_data = []
    for scene in request.scenes:
        scenes_data.append({
            "id": scene.id,
            "name": scene.name,
            "subtitle": scene.subtitle,
            "panorama_url": scene.panorama_url,
            "order": scene.order
        })

    # Sync scenes
    try:
        sync_result = vr360_scene.sync_scenes(
            db=db,
            tenant_id=current_user.tenant_id,
            property_id=property_id,
            scenes_data=scenes_data
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync scenes: {str(e)}"
        )

    # Return response
    return VR360SceneSyncResponse(
        success=True,
        message="Scenes synced successfully",
        tenant_code=tenant.code,
        count=len(request.scenes),
        created=sync_result["created"],
        updated=sync_result["updated"],
        deactivated=sync_result["deactivated"]
    )
