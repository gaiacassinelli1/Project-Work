"""
SQLAlchemy models — adapted for SQLite.
Uses String IDs instead of PostgreSQL UUID.
Uses JSON instead of JSONB.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ──────────────────────────────────────────────
# USERS
# ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    locale: Mapped[str] = mapped_column(String(8), default="it")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # relationships
    events: Mapped[list["Event"]] = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    fish: Mapped[list["Fish"]] = relationship("Fish", back_populates="user", cascade="all, delete-orphan")
    sea_state: Mapped[Optional["SeaState"]] = relationship("SeaState", back_populates="user", uselist=False)


# ──────────────────────────────────────────────
# EVENTS (immutable — the heart of the system)
# ──────────────────────────────────────────────
class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="events")

    __table_args__ = (
        Index("idx_events_user_time", "user_id", "created_at"),
    )


# ──────────────────────────────────────────────
# FISH
# ──────────────────────────────────────────────
class Fish(Base):
    __tablename__ = "fish"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    dimension: Mapped[str] = mapped_column(String(50))  # studio, lavoro, benessere
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship(back_populates="fish")
    state: Mapped[Optional["FishState"]] = relationship("FishState", back_populates="fish", uselist=False)


# ──────────────────────────────────────────────
# FISH STATE (derived — recomputable)
# ──────────────────────────────────────────────
class FishState(Base):
    __tablename__ = "fish_state"

    fish_id: Mapped[str] = mapped_column(String(36), ForeignKey("fish.id"), primary_key=True)
    growth_level: Mapped[float] = mapped_column(Float, default=0.0)
    visual_stage: Mapped[str] = mapped_column(String(20), default="small")
    last_computed: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    fish: Mapped["Fish"] = relationship(back_populates="state")


# ──────────────────────────────────────────────
# SEA STATE (derived — recomputable)
# ──────────────────────────────────────────────
class SeaState(Base):
    __tablename__ = "sea_state"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    sea_state_score: Mapped[float] = mapped_column(Float, default=0.0)
    sea_state_label: Mapped[str] = mapped_column(String(30), default="neutro")
    visual_params: Mapped[Dict[str, Any]] = mapped_column(JSON, default={})
    last_computed: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship(back_populates="sea_state")
