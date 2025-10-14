from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderRead, ReminderUpdate

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderRead])
def list_reminders(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
) -> list[ReminderRead]:
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    if status_filter:
        query = query.filter(Reminder.status == status_filter)
    reminders = query.order_by(Reminder.due_date.asc()).all()
    return [ReminderRead.from_orm(reminder) for reminder in reminders]


@router.post("", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(payload: ReminderCreate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> ReminderRead:
    reminder = Reminder(**payload.dict(), user_id=current_user.id)
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return ReminderRead.from_orm(reminder)


@router.put("/{reminder_id}", response_model=ReminderRead)
def update_reminder(reminder_id: int, payload: ReminderUpdate, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> ReminderRead:
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(reminder, key, value)
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return ReminderRead.from_orm(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: int, db: Session = Depends(deps.get_db_session), current_user=Depends(deps.get_current_user)) -> None:
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
