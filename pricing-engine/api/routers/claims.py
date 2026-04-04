"""
Model service endpoints (gig-app-es-ai-endpoints.md).

POST /v1/claims/acceptance-score
POST /v1/claims/rejection-score
POST /v1/claims/fraud-score
"""

import time

from fastapi import APIRouter, Depends

from api.dependencies import get_registry
from api.schemas.requests import UnifiedClaimRequest
from api.schemas.responses import (
    AcceptanceScoreResponse,
    FraudScoreResponse,
    PolicyActions,
    RejectionScoreResponse,
)
from services.model_registry import ModelRegistry
from services.payout_calculator import calculate_payout, calculate_policy_actions

router = APIRouter(prefix="/v1/claims", tags=["Model Scoring"])


def _request_to_payload(req: UnifiedClaimRequest) -> dict:
    """Convert Pydantic request to dict for feature extractor."""
    data = req.model_dump(by_alias=True)
    # Ensure location_history entries are plain dicts
    if "location_history_last_1h" in data and data["location_history_last_1h"]:
        data["location_history_last_1h"] = [
            {k: v for k, v in loc.items() if v is not None}
            for loc in data["location_history_last_1h"]
        ]
    return data


@router.post("/acceptance-score", response_model=AcceptanceScoreResponse)
async def acceptance_score(
    request: UnifiedClaimRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /v1/claims/acceptance-score — Acceptance model endpoint."""
    payload = _request_to_payload(request)
    features = registry.extract_features(payload)

    score, codes, explanation = registry.predict_acceptance(features)

    # Determine status
    recommended = "approved" if score >= 0.80 else ("pending" if score >= 0.50 else "rejected")

    # Calculate payout
    tier = request.policy_context.tier or request.policy_context.plan_id or "standard"
    instant, held = calculate_payout(
        score,
        float(request.claim_context.hours),
        request.user_profile.daily_earnings,
        tier,
    )

    return AcceptanceScoreResponse(
        acceptance_score=round(score, 4),
        recommended_status=recommended,
        instant_payout=instant,
        held_amount=held,
        reason_codes=codes,
        model_version="es-ai-accept-v1.0.0",
    )


@router.post("/rejection-score", response_model=RejectionScoreResponse)
async def rejection_score(
    request: UnifiedClaimRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /v1/claims/rejection-score — Rejection model endpoint."""
    payload = _request_to_payload(request)
    features = registry.extract_features(payload)

    score, codes, explanation = registry.predict_rejection(features)

    recommended = "rejected" if score >= 0.75 else ("pending" if score >= 0.50 else "approved")

    # Held amount = full potential payout when rejecting
    tier = request.policy_context.tier or request.policy_context.plan_id or "standard"
    hourly = request.user_profile.daily_earnings / 8.0
    held = round(hourly * float(request.claim_context.hours), 2)

    return RejectionScoreResponse(
        rejection_score=round(score, 4),
        recommended_status=recommended,
        instant_payout=0 if recommended == "rejected" else held * 0.5,
        held_amount=held,
        reason_codes=codes,
        model_version="es-ai-reject-v1.0.0",
    )


@router.post("/fraud-score", response_model=FraudScoreResponse)
async def fraud_score(
    request: UnifiedClaimRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /v1/claims/fraud-score — Fraud model endpoint."""
    payload = _request_to_payload(request)
    features = registry.extract_features(payload)

    score, flag, codes, explanation = registry.predict_fraud(features)

    recommended = "rejected" if flag or score >= 0.85 else "pending"
    actions = calculate_policy_actions(score) if flag else {
        "downgrade_to_plan": None,
        "premium_multiplier": 1.0,
        "claim_ban_days": 0,
        "strike_increment": 0,
    }

    return FraudScoreResponse(
        fraud_score=round(score, 4),
        fraud_flag=flag,
        recommended_status=recommended,
        policy_actions=PolicyActions(**actions),
        reason_codes=codes,
        model_version="es-ai-fraud-v1.0.0",
    )
