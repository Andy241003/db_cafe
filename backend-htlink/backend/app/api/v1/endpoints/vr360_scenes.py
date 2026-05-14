"""
VR360 Scene Sync API endpoints

Handles syncing VR360 scenes from frontend 3DVista export
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models import Tenant
from app.crud.vr_hotel import vr360_scene
from app.schemas.vr_hotel import VR360SceneSyncRequest, VR360SceneSyncResponse

router = APIRouter()


@router.post("/scenes/sync", response_model=VR360SceneSyncResponse)
def sync_vr360_scenes(
    request: VR360SceneSyncRequest,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Sync VR360 scenes from frontend payload.

    - Validates request data
    - Determines tenant and property from headers/body
    - Upserts scenes in database
    - Returns sync statistics
    """
    # Determine tenant
    tenant_code_to_use = request.tenant_code
    if not tenant_code_to_use:
        tenant_code_to_use = "demo"  # Default tenant

    # Get tenant from database
    tenant = db.exec(
        select(Tenant).where(Tenant.code == tenant_code_to_use)
    ).first()
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant with code '{tenant_code_to_use}' not found"
        )

    # Determine property
    property_id = request.property_id
    if not property_id:
        raise HTTPException(
            status_code=400,
            detail="Property ID is required in request body"
        )

    # Validate that property belongs to tenant
    # (Assuming property validation is done elsewhere or add it here)

    # Convert request scenes to dict format for CRUD
    scenes_data = []
    for scene in request.scenes:
        scenes_data.append({
            "id": scene.id,
            "name": scene.name,
            "subtitle": scene.subtitle,
            "order": scene.order
        })

    # Sync scenes
    try:
        sync_result = vr360_scene.sync_scenes(
            db=db,
            tenant_id=tenant.id,
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
        property_id=property_id,
        tenant_code=tenant_code_to_use,
        count=len(request.scenes),
        created=sync_result["created"],
        updated=sync_result["updated"],
        deactivated=sync_result["deactivated"]
    )