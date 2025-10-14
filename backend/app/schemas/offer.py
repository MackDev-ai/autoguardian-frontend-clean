from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional

from pydantic import BaseModel


class OfferBase(BaseModel):
    vehicle_id: int
    base_policy_id: Optional[int] = None
    provider: str
    premium_total: Decimal
    coverage_json: Dict[str, Any]
    deductible: Optional[Decimal] = None
    assistance_level: Optional[str] = None
    link_out: Optional[str] = None
    score_breakdown_json: Dict[str, Any]


class OfferCreate(OfferBase):
    pass


class OfferRead(OfferBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
