"""
Cafe Branches API endpoints

Handles cafe branch management with multi-language support
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models.cafe import (
    CafeBranch, 
    CafeBranchTranslation, 
    CafeBranchMedia
)

router = APIRouter()


# ==========================================
# Pydantic Schemas
# ==========================================

class BranchTranslationSchema(BaseModel):
    """Branch translation schema"""
    locale: str
    name: str
    address: Optional[str] = None
    description: Optional[str] = None


class BranchMediaSchema(BaseModel):
    """Branch media schema"""
    media_id: int
    is_primary: bool = False
    sort_order: int = 0


class CafeBranchResponse(BaseModel):
    """Cafe Branch Response"""
    id: int
    tenant_id: int
    code: str
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: Optional[str] = None
    primary_image_media_id: Optional[int] = None
    vr360_link: Optional[str] = None
    is_active: bool = True
    is_primary: bool = False
    display_order: int = 0
    attributes_json: Optional[dict] = None
    translations: List[BranchTranslationSchema] = []
    media: List[BranchMediaSchema] = []


class CafeBranchCreate(BaseModel):
    """Cafe Branch Create"""
    code: str
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: Optional[str] = None
    primary_image_media_id: Optional[int] = None
    vr360_link: Optional[str] = None
    is_active: bool = True
    is_primary: bool = False
    display_order: int = 0
    attributes_json: Optional[dict] = None
    translations: List[BranchTranslationSchema]
    media_ids: Optional[List[int]] = None


class CafeBranchUpdate(BaseModel):
    """Cafe Branch Update"""
    code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: Optional[str] = None
    primary_image_media_id: Optional[int] = None
    vr360_link: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    display_order: Optional[int] = None
    attributes_json: Optional[dict] = None
    translations: Optional[List[BranchTranslationSchema]] = None
    media_ids: Optional[List[int]] = None


# ==========================================
# Helper Functions
# ==========================================

def get_branch_with_relations(branch_id: int, db: Session) -> dict:
    """Get branch with all relations"""
    branch = db.get(CafeBranch, branch_id)
    if not branch:
        return None
    
    # Get translations
    trans_stmt = select(CafeBranchTranslation).where(
        CafeBranchTranslation.branch_id == branch_id
    )
    translations = db.exec(trans_stmt).all()
    
    # Get media
    media_stmt = select(CafeBranchMedia).where(
        CafeBranchMedia.branch_id == branch_id
    ).order_by(CafeBranchMedia.sort_order)
    media = db.exec(media_stmt).all()
    
    return {
        **branch.model_dump(),
        "translations": [
            BranchTranslationSchema(
                locale=t.locale,
                name=t.name,
                address=t.address,
                description=t.description
            ) for t in translations
        ],
        "media": [
            BranchMediaSchema(
                media_id=m.media_id,
                is_primary=m.is_primary,
                sort_order=m.sort_order
            ) for m in media
        ]
    }


# ==========================================
# API Endpoints
# ==========================================

@router.get("/", response_model=List[CafeBranchResponse])
def get_branches(
    current_user: CurrentUser,
    db: SessionDep,
    is_active: Optional[bool] = None
):
    """
    Get all branches for current tenant
    """
    statement = select(CafeBranch).where(
        CafeBranch.tenant_id == current_user.tenant_id
    )
    
    if is_active is not None:
        statement = statement.where(CafeBranch.is_active == is_active)
    
    statement = statement.order_by(CafeBranch.display_order)
    branches = db.exec(statement).all()
    
    result = []
    for branch in branches:
        branch_data = get_branch_with_relations(branch.id, db)
        if branch_data:
            result.append(CafeBranchResponse(**branch_data))
    
    return result


@router.get("/{branch_id}", response_model=CafeBranchResponse)
def get_branch(
    branch_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Get specific branch by ID
    """
    branch = db.get(CafeBranch, branch_id)
    
    if not branch or branch.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    branch_data = get_branch_with_relations(branch_id, db)
    return CafeBranchResponse(**branch_data)


@router.post("/", response_model=CafeBranchResponse)
def create_branch(
    branch_data: CafeBranchCreate,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Create new branch
    """
    # Check if code already exists
    existing = db.exec(
        select(CafeBranch).where(CafeBranch.code == branch_data.code)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Branch code already exists")
    
    # Create branch
    new_branch = CafeBranch(
        tenant_id=current_user.tenant_id,
        code=branch_data.code,
        phone=branch_data.phone,
        email=branch_data.email,
        latitude=branch_data.latitude,
        longitude=branch_data.longitude,
        google_maps_url=branch_data.google_maps_url,
        primary_image_media_id=branch_data.primary_image_media_id,
        vr360_link=branch_data.vr360_link,
        is_active=branch_data.is_active,
        is_primary=branch_data.is_primary,
        display_order=branch_data.display_order,
        attributes_json=branch_data.attributes_json
    )
    
    db.add(new_branch)
    db.commit()
    db.refresh(new_branch)
    
    # Add translations
    for trans in branch_data.translations:
        translation = CafeBranchTranslation(
            branch_id=new_branch.id,
            locale=trans.locale,
            name=trans.name,
            address=trans.address,
            description=trans.description
        )
        db.add(translation)
    
    # Add media
    if branch_data.media_ids:
        for idx, media_id in enumerate(branch_data.media_ids):
            branch_media = CafeBranchMedia(
                branch_id=new_branch.id,
                media_id=media_id,
                sort_order=idx
            )
            db.add(branch_media)
    
    db.commit()
    
    # Return with relations
    branch_full = get_branch_with_relations(new_branch.id, db)
    return CafeBranchResponse(**branch_full)


@router.put("/{branch_id}", response_model=CafeBranchResponse)
def update_branch(
    branch_id: int,
    branch_data: CafeBranchUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Update existing branch
    """
    branch = db.get(CafeBranch, branch_id)
    
    if not branch or branch.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Update branch fields
    for key, value in branch_data.model_dump(exclude_unset=True, exclude={'translations', 'media_ids'}).items():
        if value is not None:
            setattr(branch, key, value)
            if key == 'attributes_json':
                flag_modified(branch, key)
    
    db.add(branch)
    
    # Update translations
    if branch_data.translations is not None:
        # Delete existing translations
        db.exec(
            select(CafeBranchTranslation).where(
                CafeBranchTranslation.branch_id == branch_id
            )
        ).all()
        
        for existing_trans in db.exec(
            select(CafeBranchTranslation).where(CafeBranchTranslation.branch_id == branch_id)
        ).all():
            db.delete(existing_trans)
        
        # Add new translations
        for trans in branch_data.translations:
            translation = CafeBranchTranslation(
                branch_id=branch_id,
                locale=trans.locale,
                name=trans.name,
                address=trans.address,
                description=trans.description
            )
            db.add(translation)
    
    # Update media
    if branch_data.media_ids is not None:
        # Delete existing media
        for existing_media in db.exec(
            select(CafeBranchMedia).where(CafeBranchMedia.branch_id == branch_id)
        ).all():
            db.delete(existing_media)
        
        # Add new media
        for idx, media_id in enumerate(branch_data.media_ids):
            branch_media = CafeBranchMedia(
                branch_id=branch_id,
                media_id=media_id,
                sort_order=idx
            )
            db.add(branch_media)
    
    db.commit()
    db.refresh(branch)
    
    # Return with relations
    branch_full = get_branch_with_relations(branch_id, db)
    return CafeBranchResponse(**branch_full)


@router.delete("/{branch_id}")
def delete_branch(
    branch_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Delete branch
    """
    branch = db.get(CafeBranch, branch_id)
    
    if not branch or branch.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    db.delete(branch)
    db.commit()
    
    return {"success": True, "message": "Branch deleted"}


@router.post("/{branch_id}/reorder")
def reorder_branch(
    branch_id: int,
    new_order: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """
    Reorder branch display order
    """
    branch = db.get(CafeBranch, branch_id)
    
    if not branch or branch.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    branch.display_order = new_order
    db.add(branch)
    db.commit()
    
    return {"success": True, "message": "Branch reordered"}
