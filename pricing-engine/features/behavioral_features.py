"""
Behavioral feature computation.

Claim pattern analysis, history ratios, and behavioral anomaly signals.
"""

from datetime import datetime


def extract_behavioral_features(
    previous_claims: dict,
    current_disruption_type: str,
    claim_timestamp: datetime,
) -> dict[str, float]:
    """
    Extract all 9 behavioral features from claim history and profile context.

    Parameters
    ----------
    previous_claims : dict
        Must contain: total_count, approved_count, rejected_count,
        fraud_flag_count, avg_ai_score, last_claim_at (ISO string or None),
        and optionally 'recent' (list of recent claim dicts).
    current_disruption_type : str
        The disruption type of the current claim.
    claim_timestamp : datetime
        When the current claim was filed.

    Returns
    -------
    dict with keys matching claim history + derived behavioral feature names.
    """
    total = previous_claims.get("total_count", 0)
    approved = previous_claims.get("approved_count", 0)
    rejected = previous_claims.get("rejected_count", 0)
    fraud_flags = previous_claims.get("fraud_flag_count", 0)
    avg_score = previous_claims.get("avg_ai_score", 0.5)

    # Ratios (avoid division by zero)
    safe_total = max(total, 1)
    approved_ratio = approved / safe_total
    rejected_ratio = rejected / safe_total

    # Days since last claim
    last_claim_at = previous_claims.get("last_claim_at")
    if last_claim_at:
        if isinstance(last_claim_at, str):
            try:
                last_dt = datetime.fromisoformat(last_claim_at.replace("Z", "+00:00"))
                # Make claim_timestamp offset-aware if needed
                if claim_timestamp.tzinfo is None and last_dt.tzinfo is not None:
                    days_since = (
                        claim_timestamp - last_dt.replace(tzinfo=None)
                    ).total_seconds() / 86400.0
                else:
                    days_since = (claim_timestamp - last_dt).total_seconds() / 86400.0
            except (ValueError, TypeError):
                days_since = 90.0
        elif isinstance(last_claim_at, datetime):
            days_since = (claim_timestamp - last_claim_at).total_seconds() / 86400.0
        else:
            days_since = 90.0
    else:
        days_since = 90.0  # No prior claims → max window

    days_since = max(days_since, 0.0)

    # ── Derived behavioral features (from 'recent' claims list) ──
    recent_claims = previous_claims.get("recent", [])
    claims_last_7d = previous_claims.get("claims_last_7d", 0)

    # If not pre-computed, count from recent list
    if claims_last_7d == 0 and recent_claims:
        for c in recent_claims:
            c_date = c.get("created_at", "")
            if isinstance(c_date, str):
                try:
                    c_dt = datetime.fromisoformat(c_date.replace("Z", "+00:00"))
                    if claim_timestamp.tzinfo is None and c_dt.tzinfo is not None:
                        delta_days = (
                            claim_timestamp - c_dt.replace(tzinfo=None)
                        ).total_seconds() / 86400.0
                    else:
                        delta_days = (claim_timestamp - c_dt).total_seconds() / 86400.0
                    if 0 <= delta_days <= 7:
                        claims_last_7d += 1
                except (ValueError, TypeError):
                    pass

    # Repeat disruption ratio (how many past claims have the same type)
    repeat_count = 0
    night_count = 0
    total_recent = max(len(recent_claims), 1)

    for c in recent_claims:
        if c.get("type", "") == current_disruption_type:
            repeat_count += 1
        c_date = c.get("created_at", "")
        if isinstance(c_date, str):
            try:
                c_dt = datetime.fromisoformat(c_date.replace("Z", "+00:00"))
                if c_dt.hour >= 22 or c_dt.hour < 6:
                    night_count += 1
            except (ValueError, TypeError):
                pass

    repeat_disruption_ratio = repeat_count / total_recent
    night_claim_ratio = night_count / total_recent

    # Use pre-computed values if provided
    repeat_disruption_ratio = previous_claims.get(
        "repeat_disruption_ratio", repeat_disruption_ratio
    )
    night_claim_ratio = previous_claims.get("night_claim_ratio_30d", night_claim_ratio)

    return {
        # Group 6: Claim History
        "total_claims_90d": total,
        "approved_ratio": round(approved_ratio, 4),
        "rejected_ratio": round(rejected_ratio, 4),
        "fraud_flag_count": fraud_flags,
        "avg_ai_score": round(avg_score, 4),
        "days_since_last_claim": round(days_since, 2),
        # Group 7: Derived Behavioral
        "claims_last_7d": claims_last_7d,
        "repeat_disruption_ratio": round(repeat_disruption_ratio, 4),
        "night_claim_ratio_30d": round(night_claim_ratio, 4),
    }
