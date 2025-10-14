from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class EventBase(BaseModel):
    vehicle_id: int
    type: str
    date: date
    mileage_km: Optional[int] = None
    cost_total: Optional[Decimal] = None
    workshop_name: Optional[str] = None
    notes: Optional[str] = None
    attachments: List[str] = []


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    type: Optional[str]
    date: Optional[date]
    mileage_km: Optional[int]
    cost_total: Optional[Decimal]
    workshop_name: Optional[str]
    notes: Optional[str]
    attachments: Optional[List[str]]


class EventRead(EventBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
