"""
Data quality scoring service.

Evaluates completeness and reliability of incoming claim data
before sending to ML models.
"""
def assess_data_quality(payload: dict) -> dict:
    """
    Assess quality of the input payload.

    Returns dict with: score (0-100), grade (A-F), missing (list of field paths).
    """
    missing = []
    penalties = 0

    # ── Required fields check ──
    claim = payload.get("claim_context", {})
    if not claim:
        missing.append("claim_context")
        penalties += 20
    else:
        if not claim.get("disruption_type"):
            missing.append("claim_context.disruption_type")
            penalties += 10
        if not claim.get("hours"):
            missing.append("claim_context.hours")
            penalties += 5
        if not claim.get("claim_timestamp"):
            missing.append("claim_context.claim_timestamp")
            penalties += 5
        if not claim.get("claim_location"):
            missing.append("claim_context.claim_location")
            penalties += 10
        else:
            loc = claim["claim_location"]
            if not loc.get("lat") or not loc.get("lng"):
                missing.append("claim_context.claim_location.lat/lng")
                penalties += 10

    # Current location
    current = payload.get("current_location", {})
    if not current:
        missing.append("current_location")
        penalties += 15
    else:
        if not current.get("lat") or not current.get("lng"):
            missing.append("current_location.lat/lng")
            penalties += 10
        if not current.get("captured_at"):
            missing.append("current_location.captured_at")
            penalties += 5
        if not current.get("accuracy"):
            missing.append("current_location.accuracy")
            penalties += 3

    # Location history
    history = payload.get("location_history_last_1h", [])
    if not history:
        missing.append("location_history_last_1h")
        penalties += 10
    elif len(history) < 3:
        missing.append("location_history_last_1h (sparse: <3 pings)")
        penalties += 5

    # User profile
    profile = payload.get("user_profile", {})
    if not profile:
        missing.append("user_profile")
        penalties += 10
    else:
        for field in ["segment", "work_hours", "daily_earnings"]:
            if not profile.get(field):
                missing.append(f"user_profile.{field}")
                penalties += 3

    # Policy context
    policy = payload.get("policy_context", {})
    if not policy:
        missing.append("policy_context")
        penalties += 10
    else:
        if not policy.get("tier") and not policy.get("plan_id"):
            missing.append("policy_context.tier")
            penalties += 5

    # Previous claims
    prev = payload.get("previous_claims", {})
    if not prev:
        missing.append("previous_claims")
        penalties += 5

    # Calculate score
    score = max(0, min(100, 100 - penalties))

    # Assign grade
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    elif score >= 60:
        grade = "D"
    else:
        grade = "F"

    return {
        "score": score,
        "grade": grade,
        "missing": missing,
    }
