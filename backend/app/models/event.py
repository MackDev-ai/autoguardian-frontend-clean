from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    mileage_km = Column(Integer, nullable=True)
    cost_total = Column(Numeric(10, 2), nullable=True)
    workshop_name = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    attachments = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="events")
    vehicle = relationship("Vehicle", back_populates="events")
    reminders = relationship("Reminder", back_populates="event", cascade="all, delete-orphan")
