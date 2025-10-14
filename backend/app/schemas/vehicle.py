from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VehicleBase(BaseModel):
    make: str
    model: str
    year: Optional[int] = None
    vin: Optional[str] = None
    registration: Optional[str] = None
    engine: Optional[str] = None
    fuel_type: Optional[str] = None
    mileage_km: int = Field(0, ge=0)
    first_registration_date: Optional[date] = None
    photos: List[str] = []
    service_interval_months: Optional[int] = Field(None, ge=0)
    service_interval_km: Optional[int] = Field(None, ge=0)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(VehicleBase):
    pass


class VehicleRead(VehicleBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
