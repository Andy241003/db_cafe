from typing import Any, List

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentSuperUser, SessionDep
from app.models import Plan
from app.schemas import PlanCreate, PlanResponse, PlanUpdate

router = APIRouter()


@router.get("/", response_model=List[PlanResponse])
def read_plans(
    session: SessionDep,
    current_user: CurrentSuperUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve plans. Only superusers can access this.
    """
    plans = crud.plan.get_multi(session, skip=skip, limit=limit)
    return plans


@router.post("/", response_model=PlanResponse)
def create_plan(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    plan_in: PlanCreate,
) -> Any:
    """
    Create new plan. Only superusers can create plans.
    """
    # Check if plan code already exists
    existing_plan = crud.plan.get_by_code(session, code=plan_in.code)
    if existing_plan:
        raise HTTPException(
            status_code=400,
            detail="Plan with this code already exists",
        )
    
    plan = crud.plan.create(session, obj_in=plan_in)
    return plan


@router.get("/{plan_id}", response_model=PlanResponse)
def read_plan(
    plan_id: int,
    session: SessionDep,
    current_user: CurrentSuperUser,
) -> Any:
    """
    Get plan by ID. Only superusers can access plans.
    """
    plan = crud.plan.get(session, id=plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return plan


@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    plan_id: int,
    plan_in: PlanUpdate,
) -> Any:
    """
    Update a plan. Only superusers can update plans.
    """
    plan = crud.plan.get(session, id=plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan = crud.plan.update(session, db_obj=plan, obj_in=plan_in)
    return plan


@router.delete("/{plan_id}")
def delete_plan(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    plan_id: int,
) -> Any:
    """
    Delete a plan. Only superusers can delete plans.
    """
    plan = crud.plan.get(session, id=plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if any tenants are using this plan
    tenants_with_plan = crud.tenant.get_multi_by_field(
        session, "plan_id", plan_id
    )
    if tenants_with_plan:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete plan that is being used by tenants"
        )
    
    crud.plan.remove(session, id=plan_id)
    return {"message": "Plan deleted successfully"}


@router.get("/by-code/{plan_code}", response_model=PlanResponse)
def read_plan_by_code(
    *,
    session: SessionDep,
    current_user: CurrentSuperUser,
    plan_code: str,
) -> Any:
    """
    Get plan by code.
    """
    plan = crud.plan.get_by_code(session, code=plan_code)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return plan
