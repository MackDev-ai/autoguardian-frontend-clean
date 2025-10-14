from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.offer import Offer
from app.schemas.offer import OfferRead

router = APIRouter(prefix="/offers", tags=["offers"])


DEFAULT_WEIGHTS = {
    "price": 0.45,
    "coverage": 0.35,
    "deductible": 0.1,
    "assistance": 0.1,
}


MOCK_OFFERS = [
    {
        "provider": "Shield Insurance",
        "premium_total": 920.50,
        "coverage_json": {"OC": True, "AC": True, "assistance": "EU"},
        "deductible": 500,
        "assistance_level": "EU",
        "link_out": "https://shield.example/policy",
    },
    {
        "provider": "BudgetProtect",
        "premium_total": 780.00,
        "coverage_json": {"OC": True, "AC": False, "assistance": "PL"},
        "deductible": 1000,
        "assistance_level": "PL",
        "link_out": "https://budget.example/policy",
    },
    {
        "provider": "PremiumCar",
        "premium_total": 1100.00,
        "coverage_json": {"OC": True, "AC": True, "szyby": True, "assistance": "EU"},
        "deductible": 0,
        "assistance_level": "EU",
        "link_out": "https://premium.example/policy",
    },
]


def _normalise(values: List[float]) -> List[float]:
    if not values:
        return []
    min_v, max_v = min(values), max(values)
    if max_v == min_v:
        return [0.5 for _ in values]
    return [(v - min_v) / (max_v - min_v) for v in values]


@router.post("/quote", response_model=list[OfferRead], status_code=status.HTTP_201_CREATED)
def quote_offers(
    payload: Dict[str, Any],
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
) -> list[OfferRead]:
    premiums = [offer["premium_total"] for offer in MOCK_OFFERS]
    coverage_scores = [len(offer["coverage_json"]) for offer in MOCK_OFFERS]
    deductibles = [offer["deductible"] for offer in MOCK_OFFERS]
    assistance_scores = [1 if offer.get("assistance_level") == "EU" else 0 for offer in MOCK_OFFERS]

    norm_price = _normalise([-p for p in premiums])
    norm_coverage = _normalise(coverage_scores)
    norm_deductible = _normalise([-d for d in deductibles])
    norm_assistance = _normalise(assistance_scores)

    offers_to_persist: List[Offer] = []
    response: List[OfferRead] = []
    for index, offer_payload in enumerate(MOCK_OFFERS):
        score = (
            DEFAULT_WEIGHTS["price"] * norm_price[index]
            + DEFAULT_WEIGHTS["coverage"] * norm_coverage[index]
            + DEFAULT_WEIGHTS["deductible"] * norm_deductible[index]
            + DEFAULT_WEIGHTS["assistance"] * norm_assistance[index]
        )
        offer = Offer(
            user_id=current_user.id,
            vehicle_id=payload.get("vehicle_id"),
            base_policy_id=payload.get("policy_id"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            score_breakdown_json={
                "score": round(score, 3),
                "weights": DEFAULT_WEIGHTS,
                "inputs": offer_payload,
            },
            **offer_payload,
        )
        db.add(offer)
        offers_to_persist.append(offer)
    db.commit()
    for offer in offers_to_persist:
        db.refresh(offer)
        response.append(OfferRead.from_orm(offer))
    return response


@router.get("", response_model=list[OfferRead])
def list_offers(
    vehicle_id: int,
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
) -> list[OfferRead]:
    offers = (
        db.query(Offer)
        .filter(Offer.user_id == current_user.id, Offer.vehicle_id == vehicle_id)
        .order_by(Offer.created_at.desc())
        .all()
    )
    return [OfferRead.from_orm(offer) for offer in offers]
