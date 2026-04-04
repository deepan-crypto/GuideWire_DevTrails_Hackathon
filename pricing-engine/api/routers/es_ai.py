"""
ES-AI endpoints (es-ai-endpoints.md).

POST /es-ai/predict              — Full cascade prediction
POST /es-ai/decision/accept      — Accept-mode decision
POST /es-ai/decision/reject      — Reject-mode decision
POST /es-ai/decision/fraud       — Fraud-mode decision
"""

import time

from fastapi import APIRouter, Depends

from api.dependencies import get_registry
from api.schemas.requests import ESAIPredictRequest
from api.schemas.responses import (
    DataQualityBlock,
    ESAIPredictResponse,
    PredictionBlock,
    PredictionBreakdown,
)
from features.data_quality import assess_data_quality
from services.model_registry import ModelRegistry

router = APIRouter(prefix="/es-ai", tags=["ES-AI Predictions"])


def _build_unified_payload(req: ESAIPredictRequest) -> dict:
    """
    Build a unified payload dict from either:
    - Direct unified fields (claim_context, current_location, etc.)
    - Wrapped payload (version + payload.claim, payload.rider, etc.)
    """
    # Check if unified fields are provided directly
    if req.claim_context is not None:
        data = {}
        if req.claim_context:
            data["claim_context"] = req.claim_context.model_dump()
        if req.current_location:
            data["current_location"] = req.current_location.model_dump()
        if req.location_history_last_1h:
            data["location_history_last_1h"] = [
                loc.model_dump() for loc in req.location_history_last_1h
            ]
        if req.user_profile:
            data["user_profile"] = req.user_profile.model_dump()
        if req.policy_context:
            data["policy_context"] = req.policy_context.model_dump()
        if req.previous_claims:
            data["previous_claims"] = req.previous_claims.model_dump()
        if req.derived_features:
            data["derived_features"] = req.derived_features.model_dump()
        return data

    # Build from wrapped payload
    p = req.payload
    payload = {}

    if p.claim:
        payload["claim_context"] = {
            "disruption_type": p.claim.get("type", p.claim.get("disruption_type", "Heavy Rain")),
            "hours": p.claim.get("hours", 1),
            "claim_timestamp": p.claim.get("claim_timestamp"),
            "claim_location": p.claim.get("claim_location", {}),
            "evidence": p.claim.get("evidence", []),
            "note": p.claim.get("note"),
        }

    if p.location:
        current = p.location.get("current", p.location)
        payload["current_location"] = current
        past = p.location.get("past1Hour", [])
        if isinstance(past, list):
            payload["location_history_last_1h"] = past

    if p.rider:
        payload["user_profile"] = p.rider
        # Extract policy if embedded in rider
        if "policy" in p.rider:
            payload["policy_context"] = p.rider["policy"]

    if p.previousClaims:
        summary = p.previousClaims.get("summary", p.previousClaims)
        payload["previous_claims"] = summary

    return payload


def _run_full_prediction(
    payload: dict, registry: ModelRegistry
) -> tuple[dict, dict, dict, dict]:
    """Run cascading prediction: fraud → accept → reject."""
    features = registry.extract_features(payload)

    # Fraud check first
    fraud_score, fraud_flag, fraud_codes, fraud_expl = registry.predict_fraud(features)

    # Accept/reject
    accept_score, accept_codes, accept_expl = registry.predict_acceptance(features)
    reject_score, reject_codes, reject_expl = registry.predict_rejection(features)

    # Apply decision rules from spec
    if fraud_flag or fraud_score >= 0.85:
        decision = "fraud"
        confidence = int(fraud_score * 100)
    elif accept_score >= 0.80 and reject_score < 0.60:
        decision = "accept"
        confidence = int(accept_score * 100)
    elif reject_score >= 0.75:
        decision = "reject"
        confidence = int(reject_score * 100)
    else:
        decision = "pending"
        confidence = int(max(accept_score, reject_score) * 100)

    scores = {
        "accept_score": accept_score,
        "reject_score": reject_score,
        "fraud_score": fraud_score,
        "fraud_flag": fraud_flag,
        "decision": decision,
        "confidence": confidence,
    }

    return scores, accept_codes, reject_codes, fraud_codes


@router.post("/predict", response_model=ESAIPredictResponse)
async def predict(
    request: ESAIPredictRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /es-ai/predict — Full cascade prediction."""
    t0 = time.perf_counter()
    payload = _build_unified_payload(request)

    # Data quality
    dq = assess_data_quality(payload)

    # Full prediction
    scores, accept_codes, reject_codes, fraud_codes = _run_full_prediction(payload, registry)

    # Build breakdown (scaled to 0-100)
    breakdown = PredictionBreakdown(
        weatherSignal=max(0, min(100, int(scores["accept_score"] * 100))),
        locationTrust=max(0, min(100, int((1 - scores["reject_score"]) * 100))),
        fraudRisk=max(0, min(100, int(scores["fraud_score"] * 100))),
        policyFit=max(0, min(100, int(scores["accept_score"] * 90 + 10))),
    )

    prediction = PredictionBlock(
        mode="predict",
        fastApiConnected=True,
        fastApiVersion=request.version,
        decision=scores["decision"],
        confidence=scores["confidence"],
        fraudScore=int(scores["fraud_score"] * 100),
        fraudFlag=scores["fraud_flag"],
        reason="model_decision",
        breakdown=breakdown,
    )

    return ESAIPredictResponse(
        fastApiVersion=request.version,
        dataQuality=DataQualityBlock(**dq),
        prediction=prediction,
        payload=payload,
    )


@router.post("/decision/accept")
async def decision_accept(
    request: ESAIPredictRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /es-ai/decision/accept — Accept-mode prediction."""
    payload = _build_unified_payload(request)
    features = registry.extract_features(payload)
    score, codes, expl = registry.predict_acceptance(features)
    fraud_score, fraud_flag, _, _ = registry.predict_fraud(features)

    return {
        "mode": "accept",
        "prediction": {
            "decision": "accept" if score >= 0.80 else "pending",
            "confidence": int(score * 100),
            "fraudScore": int(fraud_score * 100),
            "fraudFlag": fraud_flag,
        },
        "claim": {
            "status": "approved" if score >= 0.80 else "pending",
        },
    }


@router.post("/decision/reject")
async def decision_reject(
    request: ESAIPredictRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /es-ai/decision/reject — Reject-mode prediction."""
    payload = _build_unified_payload(request)
    features = registry.extract_features(payload)
    score, codes, expl = registry.predict_rejection(features)
    fraud_score, fraud_flag, _, _ = registry.predict_fraud(features)

    return {
        "mode": "reject",
        "prediction": {
            "decision": "reject" if score >= 0.75 else "pending",
            "confidence": int(score * 100),
            "fraudScore": int(fraud_score * 100),
            "fraudFlag": fraud_flag,
        },
        "claim": {
            "status": "rejected" if score >= 0.75 else "pending",
        },
    }


@router.post("/decision/fraud")
async def decision_fraud(
    request: ESAIPredictRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """POST /es-ai/decision/fraud — Fraud-mode prediction."""
    payload = _build_unified_payload(request)
    features = registry.extract_features(payload)
    fraud_score, fraud_flag, codes, expl = registry.predict_fraud(features)

    return {
        "mode": "fraud",
        "prediction": {
            "decision": "fraud" if fraud_flag else "pending",
            "confidence": int(fraud_score * 100),
            "fraudScore": int(fraud_score * 100),
            "fraudFlag": fraud_flag,
        },
        "claim": {
            "status": "rejected" if fraud_flag else "pending",
            "fraudFlag": fraud_flag,
            "fraudScore": int(fraud_score * 100),
        },
    }
