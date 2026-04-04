"""
SHAP feature → reason code mapping.

Maps feature names to human-readable reason codes based on whether
the SHAP value is positive (pushes toward positive class) or negative.
"""

# Feature → (positive_code, negative_code)
# Positive = feature pushes toward the model's target class
# Negative = feature pushes away from the model's target class
REASON_CODE_MAP: dict[str, tuple[str, str]] = {
    # Claim features
    "disruption_type_encoded":          ("DISRUPTION_TYPE_RISK", "DISRUPTION_TYPE_SAFE"),
    "hours_claimed":                     ("HIGH_HOURS_CLAIMED", "REASONABLE_HOURS"),
    "has_evidence":                      ("HAS_EVIDENCE", "WEAK_EVIDENCE"),
    "evidence_count":                    ("STRONG_EVIDENCE", "LOW_EVIDENCE"),
    "evidence_timeliness_min":           ("STALE_EVIDENCE", "TIMELY_EVIDENCE"),
    # Geospatial features
    "distance_claim_vs_current_m":       ("LOCATION_GAP", "LOC_MATCH"),
    "distance_claim_vs_trail_centroid_m":("TRAIL_MISMATCH", "TRAIL_CONSISTENT"),
    "gps_accuracy_mean":                 ("LOW_GPS_QUALITY", "GOOD_GPS_QUALITY"),
    "gps_accuracy_std":                  ("GPS_VARIANCE_ANOMALY", "GPS_STABLE"),
    "location_ping_count_1h":            ("DENSE_TRAIL", "SPARSE_TRAIL"),
    "location_ping_density_per_min":     ("HIGH_DENSITY", "LOW_DENSITY"),
    "max_speed_kmh":                     ("IMPOSSIBLE_MOVEMENT", "NORMAL_MOVEMENT"),
    "movement_consistency_score":        ("MOVEMENT_CONSISTENT", "MOVEMENT_ERRATIC"),
    # Temporal features
    "hour_of_day_sin":                   ("TIME_PATTERN", "TIME_NORMAL"),
    "hour_of_day_cos":                   ("TIME_PATTERN", "TIME_NORMAL"),
    "is_weekend":                        ("WEEKEND_CLAIM", "WEEKDAY_CLAIM"),
    "location_freshness_min":            ("STALE_LOCATION", "FRESH_LOCATION"),
    # Profile features
    "segment_encoded":                   ("SEGMENT_RISK", "SEGMENT_STABLE"),
    "work_hours":                        ("WORK_HOURS_ANOMALY", "WORK_HOURS_NORMAL"),
    "daily_earnings":                    ("EARNINGS_FACTOR", "EARNINGS_NORMAL"),
    "order_capacity":                    ("CAPACITY_FACTOR", "CAPACITY_NORMAL"),
    "shift_encoded":                     ("SHIFT_RISK", "SHIFT_NORMAL"),
    # Policy features
    "tier_encoded":                      ("POLICY_TIER_RISK", "POLICY_TIER_GOOD"),
    "weekly_premium":                    ("PREMIUM_FACTOR", "PREMIUM_STABLE"),
    "fraud_strike_count":                ("PRIOR_FRAUD_HISTORY", "CLEAN_HISTORY"),
    "is_claim_banned":                   ("CLAIM_BAN_ACTIVE", "NO_BAN"),
    # History features
    "total_claims_90d":                  ("HIGH_CLAIM_VOLUME", "LOW_CLAIM_VOLUME"),
    "approved_ratio":                    ("HISTORY_STABLE", "HISTORY_UNSTABLE"),
    "rejected_ratio":                    ("HIGH_REJECTION_RATE", "LOW_REJECTION_RATE"),
    "fraud_flag_count":                  ("PRIOR_FRAUD_FLAGS", "NO_FRAUD_FLAGS"),
    "avg_ai_score":                      ("HIGH_AI_HISTORY", "LOW_AI_HISTORY"),
    "days_since_last_claim":             ("RECENT_CLAIM", "CLAIM_GAP_OK"),
    # Behavioral features
    "claims_last_7d":                    ("REPEAT_SPIKE", "NORMAL_FREQUENCY"),
    "repeat_disruption_ratio":           ("PATTERN_MISMATCH", "LOW_RISK_PATTERN"),
    "night_claim_ratio_30d":             ("NIGHT_PATTERN", "DAY_PATTERN"),
}


def get_reason_codes_from_shap(
    shap_values: list[float] | None,
    feature_names: list[str],
    top_n: int = 3,
    model_type: str = "acceptance",
) -> tuple[list[str], str]:
    """
    Convert SHAP values to reason codes.

    Parameters
    ----------
    shap_values : list[float] | None
        SHAP values for a single prediction. None falls back to defaults.
    feature_names : list[str]
        Feature names matching the SHAP values order.
    top_n : int
        Number of top reason codes to return.
    model_type : str
        One of: 'acceptance', 'rejection', 'fraud'.

    Returns
    -------
    tuple of (reason_codes list, explanation string)
    """
    if shap_values is None or len(shap_values) == 0:
        # Fallback reason codes
        defaults = {
            "acceptance": (["MODEL_DECISION"], "Decision based on overall feature analysis."),
            "rejection": (["MODEL_DECISION"], "Decision based on overall feature analysis."),
            "fraud": (["MODEL_DECISION"], "Decision based on overall feature analysis."),
        }
        return defaults.get(model_type, defaults["acceptance"])

    import numpy as np

    # Get top N features by absolute SHAP value
    abs_shap = [abs(v) for v in shap_values]
    top_indices = sorted(range(len(abs_shap)), key=lambda i: abs_shap[i], reverse=True)[:top_n]

    codes = []
    explanations = []
    for idx in top_indices:
        fname = feature_names[idx]
        shap_val = shap_values[idx]
        mapping = REASON_CODE_MAP.get(fname, ("FEATURE_SIGNAL", "FEATURE_NORMAL"))

        if model_type in ("rejection", "fraud"):
            # For rejection/fraud: positive SHAP = pushes toward reject/fraud
            code = mapping[0] if shap_val > 0 else mapping[1]
        else:
            # For acceptance: positive SHAP = pushes toward acceptance
            code = mapping[1] if shap_val > 0 else mapping[0]

        if code not in codes:
            codes.append(code)

    explanation_parts = []
    for code in codes[:3]:
        explanation_parts.append(code.replace("_", " ").lower().title())
    explanation = ". ".join(explanation_parts) + "."

    return codes, explanation
