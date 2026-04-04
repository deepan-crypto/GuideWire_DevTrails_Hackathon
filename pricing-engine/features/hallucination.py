"""
Hallucination detection — sanity-checks model predictions against available evidence.

Identifies cases where the model's reasoning doesn't match the data it was given,
e.g., citing "location mismatch" when no live location exists.
"""


def check_hallucination(prediction: dict, payload: dict) -> dict:
    """
    Cross-validate prediction reasoning against the available evidence.

    Parameters
    ----------
    prediction : dict
        Model prediction with 'decision', 'reason' or 'breakdown' fields.
    payload : dict
        The input data that was fed to the model.

    Returns
    -------
    dict with: risk (low/medium/high), score (0-100), flags (list), recommendedAction
    """
    flags = []
    score = 0

    decision = prediction.get("decision", "")
    reason = prediction.get("reason", "")
    breakdown = prediction.get("breakdown", {})

    location = payload.get("location", payload.get("current_location", {}))
    telemetry = {}
    if isinstance(location, dict):
        telemetry = location.get("telemetry", {})

    prev_claims = payload.get("previousClaims", payload.get("previous_claims", {}))
    summary = prev_claims.get("summary", prev_claims)

    # ── Flag 1: Location-based reasoning without live location ──
    has_live = telemetry.get("hasLiveLocation", True)
    location_trust = breakdown.get("locationTrust", 100)

    if not has_live and location_trust is not None and location_trust < 50:
        flags.append("location_reason_without_live_location")
        score += 25

    if "location" in reason.lower() and not has_live:
        flags.append("location_cited_without_live_data")
        score += 20

    # ── Flag 2: History-based rejection with no prior claims ──
    total_claims = 0
    if isinstance(summary, dict):
        total_claims = summary.get("total", summary.get("total_count", 0))

    if total_claims == 0 and decision in ("reject", "fraud"):
        if "history" in reason.lower() or "pattern" in reason.lower():
            flags.append("history_reason_with_zero_claims")
            score += 25

    # ── Flag 3: High confidence on sparse data ──
    confidence = prediction.get("confidence", 0)
    ping_count = 0
    loc_history = payload.get("location_history_last_1h", [])
    if isinstance(loc_history, list):
        ping_count = len(loc_history)
    past = payload.get("location", {}).get("past1Hour", [])
    if isinstance(past, list) and past:
        ping_count = max(ping_count, len(past))

    if confidence > 85 and ping_count < 2 and total_claims == 0:
        flags.append("high_confidence_on_sparse_data")
        score += 20

    # ── Flag 4: Fraud flag with clean history ──
    fraud_flag = prediction.get("fraudFlag", prediction.get("fraud_flag", False))
    fraud_score_val = prediction.get("fraudScore", prediction.get("fraud_score", 0))
    fraud_strikes = 0
    policy = payload.get("policy_context", {})
    if isinstance(policy, dict):
        fraud_strikes = policy.get("fraud_strike_count", 0)

    if fraud_flag and fraud_strikes == 0 and total_claims <= 1:
        flags.append("fraud_flag_with_clean_profile")
        score += 15

    # ── Flag 5: Accept decision with very low location trust ──
    if decision == "accept" and location_trust is not None and location_trust < 30:
        flags.append("accept_with_low_location_trust")
        score += 20

    # Clamp score
    score = min(score, 100)

    # Risk level
    if score >= 50:
        risk = "high"
        action = "reject_prediction_and_escalate"
    elif score >= 25:
        risk = "medium"
        action = "request_model_recheck"
    else:
        risk = "low"
        action = "proceed_with_prediction"

    return {
        "hallucination": {
            "risk": risk,
            "score": score,
            "flags": flags,
            "recommendedAction": action,
        }
    }
