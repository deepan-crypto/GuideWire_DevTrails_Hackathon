"""
Shared Pydantic models for common data structures.

These match the unified input JSON from the spec files exactly.
"""

from pydantic import BaseModel, Field


class LocationPoint(BaseModel):
    lat: float = 0.0
    lng: float = 0.0
    accuracy: float | None = None
    source: str | None = None
    captured_at: str | None = Field(None, alias="captured_at")

    model_config = {"populate_by_name": True}


class ClaimLocation(BaseModel):
    lat: float = 0.0
    lng: float = 0.0


class Evidence(BaseModel):
    type: str = "image"
    url: str | None = None
    captured_at: str | None = None


class ClaimContext(BaseModel):
    claim_id: str | None = None
    user_id: str | None = None
    disruption_type: str = "Heavy Rain"
    hours: int = 1
    note: str | None = None
    claim_timestamp: str | None = None
    claim_location: ClaimLocation | None = None
    evidence: list[Evidence] = []


class UserProfile(BaseModel):
    segment: str = "transportation"
    platform: str | None = None
    zone: str | None = None
    work_shift: str = "day"
    work_hours: float = 8
    daily_earnings: float = 1000
    order_capacity: int = 50


class PolicyContext(BaseModel):
    tier: str | None = None
    plan_id: str | None = None
    weekly_premium: float = 45
    active: bool = True
    claim_ban_until: str | None = None
    fraud_strike_count: int = 0


class PreviousClaimEntry(BaseModel):
    claim_id: str | None = None
    type: str | None = None
    hours: int | None = None
    status: str | None = None
    ai_score: float | None = None
    fraud_flag: bool = False
    created_at: str | None = None


class PreviousClaims(BaseModel):
    window_days: int = 90
    total_count: int = 0
    approved_count: int = 0
    pending_count: int = 0
    rejected_count: int = 0
    fraud_flag_count: int = 0
    avg_ai_score: float = 0.5
    last_claim_at: str | None = None
    recent: list[PreviousClaimEntry] = []


class DerivedFeatures(BaseModel):
    distance_claim_vs_last_point_m: float | None = None
    movement_consistency_score: float | None = None
    claims_last_7d: int = 0
    repeat_disruption_ratio: float = 0.0
    night_claim_ratio_30d: float = 0.0
