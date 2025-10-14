from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.policy import Policy
from app.schemas.policy import PolicyCreate, PolicyRead, PolicyUpdate

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("", response_model=list[PolicyRead])
def list_policies(
    vehicle_id: Optional[int] = Query(None),
    policy_type: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
) -> list[PolicyRead]:
    query = db.query(Policy).filter(Policy.user_id == current_user.id)
    if vehicle_id:
        query = query.filter(Policy.vehicle_id == vehicle_id)
    if policy_type:
        query = query.filter(Policy.policy_type == policy_type)
    policies = query.all()
    return [PolicyRead.from_orm(policy) for policy in policies]


@router.post("", response_model=PolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy(payload: PolicyCreate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> PolicyRead:
    policy = Policy(**payload.dict(), user_id=current_user.id)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return PolicyRead.from_orm(policy)


@router.get("/{policy_id}", response_model=PolicyRead)
def get_policy(policy_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> PolicyRead:
    policy = db.query(Policy).filter(Policy.id == policy_id, Policy.user_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return PolicyRead.from_orm(policy)


@router.put("/{policy_id}", response_model=PolicyRead)
def update_policy(policy_id: int, payload: PolicyUpdate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> PolicyRead:
    policy = db.query(Policy).filter(Policy.id == policy_id, Policy.user_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(policy, key, value)
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return PolicyRead.from_orm(policy)


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(policy_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> None:
    policy = db.query(Policy).filter(Policy.id == policy_id, Policy.user_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
