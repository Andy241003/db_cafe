"""
VR360 Scene Sync API endpoints.

Cafe-only sync stores scene metadata per tenant and does not use property_id.
"""
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.vr_hotel import VR360Scene
from app.models import Tenant
from app.crud.vr_hotel import vr360_scene
from app.schemas.vr_hotel import VR360SceneListItem, VR360SceneSyncRequest, VR360SceneSyncResponse

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
            id=scene.id,
            scene_id=scene.scene_id,
            scene_name=scene.scene_name,
            scene_subtitle=scene.scene_subtitle,
            panorama_url=scene.panorama_url,
            display_order=scene.display_order,
            is_active=scene.is_active,
        )
        for scene in scenes
    ]


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
