from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    base_policy_id = Column(Integer, ForeignKey("policies.id", ondelete="SET NULL"), nullable=True, index=True)
    provider = Column(String, nullable=False)
    premium_total = Column(Numeric(10, 2), nullable=False)
    coverage_json = Column(JSON, default=dict)
    deductible = Column(Numeric(10, 2), nullable=True)
    assistance_level = Column(String, nullable=True)
    link_out = Column(String, nullable=True)
    score_breakdown_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="offers")
    vehicle = relationship("Vehicle", back_populates="offers")
    base_policy = relationship("Policy", back_populates="offers")
