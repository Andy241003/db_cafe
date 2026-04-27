from typing import Any, List
from fastapi import APIRouter, HTTPException
from sqlmodel import Session
from app.core.db import engine
from app import crud
from app.schemas import (
    FeatureCreate,
    FeatureResponse,
    FeatureUpdate
)

router = APIRouter()

@router.get("/", response_model=List[FeatureResponse])
def get_features_test() -> Any:
    """Get all features without authentication"""
    with Session(engine) as session:
        features = crud.feature.get_multi(session, skip=0, limit=100)
        return features

@router.post("/", response_model=FeatureResponse) 
def create_feature_test(feature_in: FeatureCreate) -> Any:
    """Create feature without authentication"""
    print(f"Creating feature: {feature_in}")
    
    with Session(engine) as session:
        # Set defaults
        feature_in.tenant_id = 1
        if not hasattr(feature_in, 'is_system'):
            feature_in.is_system = False
            
        feature = crud.feature.create(session, obj_in=feature_in)
        session.commit()
        session.refresh(feature)
        print(f"Created feature with ID: {feature.id}")
        return feature

@router.delete("/{feature_id}")
def delete_feature_test(feature_id: int) -> Any:
    """Delete feature without authentication"""
    print(f"Deleting feature: {feature_id}")
    
    with Session(engine) as session:
        feature = crud.feature.get(session, id=feature_id)
        if not feature:
            raise HTTPException(status_code=404, detail="Feature not found")
        
        crud.feature.remove(session, id=feature_id)
        session.commit()
        return {"detail": "Feature deleted"}

@router.put("/{feature_id}", response_model=FeatureResponse)
def update_feature_test(feature_id: int, feature_in: FeatureUpdate) -> Any:
    """Update feature without authentication"""
    print(f"Updating feature {feature_id}: {feature_in}")
    
    with Session(engine) as session:
        feature = crud.feature.get(session, id=feature_id)
        if not feature:
            raise HTTPException(status_code=404, detail="Feature not found")
        
        feature = crud.feature.update(session, db_obj=feature, obj_in=feature_in)
        session.commit()
        session.refresh(feature)
        return feature
