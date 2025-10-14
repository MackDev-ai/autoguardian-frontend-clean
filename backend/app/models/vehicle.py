from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=True)
    vin = Column(String, nullable=True)
    registration = Column(String, nullable=True)
    engine = Column(String, nullable=True)
    fuel_type = Column(String, nullable=True)
    mileage_km = Column(Integer, default=0, nullable=False)
    first_registration_date = Column(Date, nullable=True)
    photos = Column(JSON, default=list)
    service_interval_months = Column(Integer, nullable=True)
    service_interval_km = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="vehicles")
    policies = relationship("Policy", back_populates="vehicle", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="vehicle", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="vehicle", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="vehicle", cascade="all, delete-orphan")
