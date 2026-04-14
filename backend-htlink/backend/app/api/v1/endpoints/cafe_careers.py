"""
Cafe Careers API endpoints

Handles cafe career/job postings with multi-language support
"""
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel

from app.core.db import get_db
from app.api.deps import CurrentUser, SessionDep
from app.models.cafe import (
    CafeCareer,
    CafeCareerTranslation,
    CareerStatus
)

router = APIRouter()


# ==========================================
# Pydantic Schemas
# ==========================================

class CareerTranslationSchema(BaseModel):
    """Career translation schema"""
    locale: str
    title: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None


class CafeCareerResponse(BaseModel):
    """Cafe Career Response"""
    id: int
    tenant_id: int
    code: str
    job_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_text: Optional[str] = None
    deadline: Optional[date] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    application_url: Optional[str] = None
    branch_id: Optional[int] = None
    status: str = "open"
    display_order: int = 0
    is_urgent: bool = False
    attributes_json: Optional[dict] = None
    translations: List[CareerTranslationSchema] = []


class CafeCareerCreate(BaseModel):
    """Cafe Career Create"""
    code: str
    job_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_text: Optional[str] = None
    deadline: Optional[date] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    application_url: Optional[str] = None
    branch_id: Optional[int] = None
    status: str = "open"
    display_order: int = 0
    is_urgent: bool = False
    attributes_json: Optional[dict] = None
    translations: List[CareerTranslationSchema]


class CafeCareerUpdate(BaseModel):
    """Cafe Career Update"""
    code: Optional[str] = None
    job_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_text: Optional[str] = None
    deadline: Optional[date] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    application_url: Optional[str] = None
    branch_id: Optional[int] = None
    status: Optional[str] = None
    display_order: Optional[int] = None
    is_urgent: Optional[bool] = None
    attributes_json: Optional[dict] = None
    translations: Optional[List[CareerTranslationSchema]] = None


# ==========================================
# Helper Functions
# ==========================================

def get_career_with_translations(career_id: int, db: Session) -> dict:
    """Get career with translations"""
    career = db.get(CafeCareer, career_id)
    if not career:
        return None
    
    trans_stmt = select(CafeCareerTranslation).where(
        CafeCareerTranslation.career_id == career_id
    )
    translations = db.exec(trans_stmt).all()
    
    return {
        **career.model_dump(),
        "translations": [
            CareerTranslationSchema(
                locale=t.locale,
                title=t.title,
                description=t.description,
                requirements=t.requirements,
                benefits=t.benefits
            ) for t in translations
        ]
    }


# ==========================================
# API Endpoints
# ==========================================

@router.get("/", response_model=List[CafeCareerResponse])
def get_careers(
    current_user: CurrentUser,
    db: SessionDep,
    status: Optional[str] = None,
    is_urgent: Optional[bool] = None
):
    """Get all career postings"""
    statement = select(CafeCareer).where(
        CafeCareer.tenant_id == current_user.tenant_id
    )
    
    if status:
        statement = statement.where(CafeCareer.status == status)
    
    if is_urgent is not None:
        statement = statement.where(CafeCareer.is_urgent == is_urgent)
    
    statement = statement.order_by(CafeCareer.display_order)
    careers = db.exec(statement).all()
    
    result = []
    for career in careers:
        career_data = get_career_with_translations(career.id, db)
        if career_data:
            result.append(CafeCareerResponse(**career_data))
    
    return result


@router.get("/{career_id}", response_model=CafeCareerResponse)
def get_career(
    career_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Get specific career posting"""
    career = db.get(CafeCareer, career_id)
    
    if not career or career.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Career posting not found")
    
    career_data = get_career_with_translations(career_id, db)
    return CafeCareerResponse(**career_data)


@router.post("/", response_model=CafeCareerResponse)
def create_career(
    career_data: CafeCareerCreate,
    current_user: CurrentUser,
    db: SessionDep
):
    """Create new career posting"""
    existing = db.exec(
        select(CafeCareer).where(
            CafeCareer.tenant_id == current_user.tenant_id,
            CafeCareer.code == career_data.code
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Career code already exists")
    
    new_career = CafeCareer(
        tenant_id=current_user.tenant_id,
        **career_data.model_dump(exclude={'translations'})
    )
    
    db.add(new_career)
    db.commit()
    db.refresh(new_career)
    
    # Add translations
    for trans in career_data.translations:
        translation = CafeCareerTranslation(
            career_id=new_career.id,
            locale=trans.locale,
            title=trans.title,
            description=trans.description,
            requirements=trans.requirements,
            benefits=trans.benefits
        )
        db.add(translation)
    
    db.commit()
    
    career_full = get_career_with_translations(new_career.id, db)
    return CafeCareerResponse(**career_full)


@router.put("/{career_id}", response_model=CafeCareerResponse)
def update_career(
    career_id: int,
    career_data: CafeCareerUpdate,
    current_user: CurrentUser,
    db: SessionDep
):
    """Update career posting"""
    career = db.get(CafeCareer, career_id)
    
    if not career or career.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Career posting not found")
    
    for key, value in career_data.model_dump(
        exclude_unset=True,
        exclude={'translations'}
    ).items():
        if value is not None:
            setattr(career, key, value)
            if key == 'attributes_json':
                flag_modified(career, key)
    
    db.add(career)
    
    if career_data.translations is not None:
        for existing_trans in db.exec(
            select(CafeCareerTranslation).where(CafeCareerTranslation.career_id == career_id)
        ).all():
            db.delete(existing_trans)
        
        for trans in career_data.translations:
            translation = CafeCareerTranslation(
                career_id=career_id,
                locale=trans.locale,
                title=trans.title,
                description=trans.description,
                requirements=trans.requirements,
                benefits=trans.benefits
            )
            db.add(translation)
    
    db.commit()
    
    career_full = get_career_with_translations(career_id, db)
    return CafeCareerResponse(**career_full)


@router.delete("/{career_id}")
def delete_career(
    career_id: int,
    current_user: CurrentUser,
    db: SessionDep
):
    """Delete career posting"""
    career = db.get(CafeCareer, career_id)
    
    if not career or career.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Career posting not found")
    
    db.delete(career)
    db.commit()
    
    return {"success": True, "message": "Career posting deleted"}
