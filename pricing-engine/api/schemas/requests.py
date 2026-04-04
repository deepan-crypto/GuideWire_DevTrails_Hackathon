"""
Request body schemas for all API endpoints.
"""

from pydantic import BaseModel, Field

from api.schemas.common import (
    ClaimContext,
    DerivedFeatures,
    LocationPoint,
    PolicyContext,
    PreviousClaims,
    UserProfile,
)


# ── Unified Input (gig-app spec: Backend → FastAPI) ──

class UnifiedClaimRequest(BaseModel):
    """Full unified input JSON matching gig-app-es-ai-endpoints.md"""
    request_id: str | None = None
    generated_at: str | None = None
    claim_context: ClaimContext = ClaimContext()
    current_location: LocationPoint = LocationPoint()
    location_history_last_1h: list[LocationPoint] = []
    user_profile: UserProfile = UserProfile()
    policy_context: PolicyContext = PolicyContext()
    previous_claims: PreviousClaims = PreviousClaims()
    derived_features: DerivedFeatures | None = None


# ── ES-AI Predict (es-ai-endpoints.md: versioned wrapper) ──

class ESAIPayload(BaseModel):
    """The 'payload' block sent to /es-ai/predict"""
    claim: dict = {}
    rider: dict = {}
    location: dict = {}
    previousClaims: dict = Field(default={}, alias="previousClaims")

    model_config = {"populate_by_name": True}


class ESAIPredictRequest(BaseModel):
    """Request to POST /es-ai/predict, /es-ai/decision/accept|reject|fraud"""
    version: str = "v1"
    payload: ESAIPayload = ESAIPayload()

    # Also accept unified format directly
    claim_context: ClaimContext | None = None
    current_location: LocationPoint | None = None
    location_history_last_1h: list[LocationPoint] | None = None
    user_profile: UserProfile | None = None
    policy_context: PolicyContext | None = None
    previous_claims: PreviousClaims | None = None
    derived_features: DerivedFeatures | None = None


# ── Data Quality ──

class DataQualityPayload(BaseModel):
    claim: dict = {}
    rider: dict = {}
    location: dict = {}
    previousClaims: dict = Field(default={}, alias="previousClaims")

    model_config = {"populate_by_name": True}


class ClaimInput(BaseModel):
    type: str | None = None
    hours: int | None = None
    lat: float | None = None
    lng: float | None = None


class DataQualityRequest(BaseModel):
    """Request to POST /es-ai/data-quality — supports Option A and Option B"""
    # Option A: direct payload
    payload: DataQualityPayload | None = None
    # Option B: build from user + claim
    userId: str | None = None
    claimInput: ClaimInput | None = None


# ── Hallucination Check ──

class HallucinationPrediction(BaseModel):
    decision: str | None = None
    reason: str | None = None
    breakdown: dict = {}
    confidence: float | None = None
    fraudFlag: bool | None = None
    fraudScore: float | None = None


class HallucinationPayload(BaseModel):
    location: dict = {}
    previousClaims: dict = Field(default={}, alias="previousClaims")

    model_config = {"populate_by_name": True}


class HallucinationCheckRequest(BaseModel):
    prediction: HallucinationPrediction = HallucinationPrediction()
    payload: HallucinationPayload = HallucinationPayload()
