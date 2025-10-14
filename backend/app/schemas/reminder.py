from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ReminderBase(BaseModel):
    entity_type: str
    entity_id: int
    vehicle_id: Optional[int] = None
    policy_id: Optional[int] = None
    event_id: Optional[int] = None
    due_date: date
    channel: str = "push"
    status: str = "pending"
    snooze_until: Optional[date] = None


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    channel: Optional[str]
    status: Optional[str]
    snooze_until: Optional[date]


class ReminderRead(ReminderBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
