from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class PolicyBase(BaseModel):
    vehicle_id: int
    policy_type: str
    insurer: str
    policy_number: str
    start_date: date
    end_date: date
    premium_total: Decimal
    coverage_json: Dict[str, Any]
    deductible: Optional[Decimal] = None
    exclusions: List[str] = []
    documents: List[str] = []
    raw_text: Optional[str] = None
    premium_installments_json: List[Dict[str, Any]] = []


class PolicyCreate(PolicyBase):
    pass


class PolicyUpdate(BaseModel):
    policy_type: Optional[str]
    insurer: Optional[str]
    policy_number: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    premium_total: Optional[Decimal]
    coverage_json: Optional[Dict[str, Any]]
    deductible: Optional[Decimal]
    exclusions: Optional[List[str]]
    documents: Optional[List[str]]
    raw_text: Optional[str]
    premium_installments_json: Optional[List[Dict[str, Any]]]


class PolicyRead(PolicyBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
