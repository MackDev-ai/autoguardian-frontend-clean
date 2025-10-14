from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    policy_type = Column(String, nullable=False)
    insurer = Column(String, nullable=False)
    policy_number = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    premium_total = Column(Numeric(10, 2), nullable=False)
    premium_installments_json = Column(JSON, default=list)
    coverage_json = Column(JSON, default=dict)
    deductible = Column(Numeric(10, 2), nullable=True)
    exclusions = Column(JSON, default=list)
    documents = Column(JSON, default=list)
    raw_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="policies")
    vehicle = relationship("Vehicle", back_populates="policies")
    reminders = relationship("Reminder", back_populates="policy", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="base_policy", cascade="all, delete-orphan")
