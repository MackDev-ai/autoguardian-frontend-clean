from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.event import Event
from app.schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventRead])
def list_events(
    vehicle_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
) -> list[EventRead]:
    query = db.query(Event).filter(Event.user_id == current_user.id)
    if vehicle_id:
        query = query.filter(Event.vehicle_id == vehicle_id)
    if type:
        query = query.filter(Event.type == type)
    events = query.order_by(Event.date.desc()).all()
    return [EventRead.from_orm(event) for event in events]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> EventRead:
    event = Event(**payload.dict(), user_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventRead.from_orm(event)


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> EventRead:
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventRead.from_orm(event)


@router.put("/{event_id}", response_model=EventRead)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> EventRead:
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(event, key, value)
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventRead.from_orm(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> None:
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
