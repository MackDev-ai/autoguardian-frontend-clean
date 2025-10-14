from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleRead, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleRead])
def list_vehicles(db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> list[VehicleRead]:
    vehicles = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).all()
    return [VehicleRead.from_orm(vehicle) for vehicle in vehicles]


@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> VehicleRead:
    vehicle = Vehicle(**payload.dict(), user_id=current_user.id)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return VehicleRead.from_orm(vehicle)


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> VehicleRead:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return VehicleRead.from_orm(vehicle)


@router.put("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> VehicleRead:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(vehicle, key, value)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return VehicleRead.from_orm(vehicle)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> None:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
