"""
Response body schemas for all API endpoints.

Each schema matches the exact JSON shape defined in the spec files.
"""

from pydantic import BaseModel, Field


# ── Health ──

class HealthResponse(BaseModel):
    status: str = "ok"


class ModelStatus(BaseModel):
    acceptance: str = "loaded"
    rejection: str = "loaded"
    fraud: str = "loaded"


class V1HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "es-ai-fastapi"
    models: ModelStatus = ModelStatus()


# ── Acceptance Score (gig-app spec) ──

class AcceptanceScoreResponse(BaseModel):
    acceptance_score: float
    recommended_status: str
    instant_payout: float
    held_amount: float
    reason_codes: list[str]
    model_version: str = "es-ai-accept-v1.0.0"


# ── Rejection Score (gig-app spec) ──

class RejectionScoreResponse(BaseModel):
    rejection_score: float
    recommended_status: str
    instant_payout: float = 0
    held_amount: float
    reason_codes: list[str]
    model_version: str = "es-ai-reject-v1.0.0"


# ── Fraud Score (gig-app spec) ──

class PolicyActions(BaseModel):
    downgrade_to_plan: str | None = None
    premium_multiplier: float = 1.0
    claim_ban_days: int = 0
    strike_increment: int = 0


class FraudScoreResponse(BaseModel):
    fraud_score: float
    fraud_flag: bool
    recommended_status: str
    policy_actions: PolicyActions = PolicyActions()
    reason_codes: list[str]
    model_version: str = "es-ai-fraud-v1.0.0"


# ── ES-AI Predict (es-ai-endpoints.md) ──

class PredictionBreakdown(BaseModel):
    weatherSignal: int = 0
    locationTrust: int = 0
    fraudRisk: int = 0
    policyFit: int = 0


class PredictionBlock(BaseModel):
    mode: str = "predict"
    fastApiConnected: bool = True
    fastApiVersion: str = "v1"
    decision: str = "accept"
    confidence: int = 0
    fraudScore: int = 0
    fraudFlag: bool = False
    reason: str = "model_decision"
    breakdown: PredictionBreakdown = PredictionBreakdown()


class DataQualityBlock(BaseModel):
    score: int = 100
    grade: str = "A"
    missing: list[str] = []


class ESAIPredictResponse(BaseModel):
    fastApiVersion: str = "v1"
    dataQuality: DataQualityBlock = DataQualityBlock()
    prediction: PredictionBlock = PredictionBlock()
    payload: dict = {}


# ── ES-AI Decision endpoints (es-ai-endpoints.md §§7-9) ──

class DecisionPrediction(BaseModel):
    decision: str
    confidence: int
    fraudScore: int
    fraudFlag: bool = False


class DecisionResponse(BaseModel):
    mode: str
    prediction: DecisionPrediction
    claim: dict = {}


# ── Backend decision endpoints (gig-app spec §§1-3) ──

class BackendDecisionResponse(BaseModel):
    request_id: str | None = None
    decision_type: str
    model_version: str
    explanation: str = ""
    reason_codes: list[str] = []
    latency_ms: int = 0


class AcceptanceDecisionResponse(BackendDecisionResponse):
    acceptance_score: float = 0.0
    recommended_status: str = "pending"
    instant_payout: float = 0.0
    held_amount: float = 0.0


class RejectionDecisionResponse(BackendDecisionResponse):
    rejection_score: float = 0.0
    recommended_status: str = "pending"
    instant_payout: float = 0.0
    held_amount: float = 0.0


class FraudDecisionResponse(BackendDecisionResponse):
    fraud_score: float = 0.0
    fraud_flag: bool = False
    recommended_status: str = "pending"
    policy_actions: PolicyActions = PolicyActions()


# ── Data Quality ──

class DataQualityResponse(BaseModel):
    dataQuality: DataQualityBlock
    payload: dict = {}


# ── Hallucination ──

class HallucinationResult(BaseModel):
    risk: str = "low"
    score: int = 0
    flags: list[str] = []
    recommendedAction: str = "proceed_with_prediction"


class HallucinationCheckResponse(BaseModel):
    hallucination: HallucinationResult
