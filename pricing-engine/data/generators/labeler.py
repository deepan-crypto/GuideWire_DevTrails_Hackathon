"""
Rule-based labeler for synthetic claim data.

Assigns ground-truth labels (is_accepted, is_rejected, is_fraud) based on
extracted features. Mimics human adjudicator logic with controlled noise
for model generalization.
"""

import numpy as np


def assign_labels(features: dict, category: str, rng: np.random.Generator) -> dict:
    """
    Assign ground-truth labels based on extracted features and claim category.

    The labeling function uses a combination of:
    1. Feature-based rules (mimicking human adjudication)
    2. Category prior (the intended category from generation)
    3. Controlled noise (5% label flip for robustness)

    Parameters
    ----------
    features : dict
        Extracted features (35 features from FeatureExtractor).
    category : str
        Generation category: 'legitimate', 'borderline', 'rejectable', 'fraudulent'.
    rng : np.random.Generator
        Random generator.

    Returns
    -------
    dict with keys: is_accepted (0/1), is_rejected (0/1), is_fraud (0/1),
                    ground_truth_label (str)
    """
    # ── Compute fraud signals ──
    fraud_score = 0.0

    max_speed = features.get("max_speed_kmh", 0)
    if max_speed > 200:
        fraud_score += 3.0
    elif max_speed > 150:
        fraud_score += 2.0

    gps_std = features.get("gps_accuracy_std", 5.0)
    if gps_std < 0.5:
        fraud_score += 2.5  # GPS spoofing (zero jitter)
    elif gps_std < 1.0:
        fraud_score += 1.0

    strike_count = features.get("fraud_strike_count", 0)
    fraud_score += strike_count * 1.5

    claims_7d = features.get("claims_last_7d", 0)
    if claims_7d > 5:
        fraud_score += 2.0
    elif claims_7d > 3:
        fraud_score += 1.0

    repeat_ratio = features.get("repeat_disruption_ratio", 0)
    if repeat_ratio > 0.8:
        fraud_score += 1.5

    consistency = features.get("movement_consistency_score", 0.5)
    if consistency > 0.98:
        fraud_score += 1.5  # Too perfect (spoofed)
    elif consistency < 0.1:
        fraud_score += 1.0  # Too erratic

    is_banned = features.get("is_claim_banned", 0)
    if is_banned:
        fraud_score += 2.0

    # ── Compute rejection signals ──
    reject_score = 0.0

    ping_count = features.get("location_ping_count_1h", 10)
    if ping_count < 2:
        reject_score += 2.5
    elif ping_count < 4:
        reject_score += 1.5

    dist_current = features.get("distance_claim_vs_current_m", 0)
    if dist_current > 5000:
        reject_score += 2.0
    elif dist_current > 2000:
        reject_score += 1.0

    has_evidence = features.get("has_evidence", 1)
    if has_evidence == 0:
        reject_score += 2.0

    ev_timeliness = features.get("evidence_timeliness_min", 0)
    if ev_timeliness > 30:
        reject_score += 1.5

    freshness = features.get("location_freshness_min", 0)
    if freshness > 15:
        reject_score += 1.5
    elif freshness > 10:
        reject_score += 0.5

    dist_centroid = features.get("distance_claim_vs_trail_centroid_m", 0)
    if dist_centroid > 3000:
        reject_score += 1.5

    # ── Compute acceptance signals ──
    accept_score = 0.0

    if dist_current < 200:
        accept_score += 2.0
    elif dist_current < 500:
        accept_score += 1.0

    approved_ratio = features.get("approved_ratio", 0.5)
    if approved_ratio > 0.7:
        accept_score += 2.0
    elif approved_ratio > 0.5:
        accept_score += 1.0

    if has_evidence == 1:
        accept_score += 1.5

    if ev_timeliness < 5 and has_evidence:
        accept_score += 1.0

    avg_ai_score = features.get("avg_ai_score", 0.5)
    if avg_ai_score > 0.7:
        accept_score += 1.0

    if ping_count >= 8:
        accept_score += 1.0

    if freshness < 5:
        accept_score += 1.0

    # ── Apply decision rules ──
    is_fraud = 0
    is_rejected = 0
    is_accepted = 0

    # Category-weighted final decision
    if category == "fraudulent":
        # Strong prior toward fraud, but features must somewhat support it
        if fraud_score >= 3.0:
            is_fraud = 1
        elif fraud_score >= 1.5:
            is_fraud = 1 if rng.random() < 0.7 else 0
            if not is_fraud:
                is_rejected = 1
        else:
            # Weak fraud signals → might still be rejected
            is_rejected = 1 if rng.random() < 0.6 else 0
            if not is_rejected:
                is_fraud = 1

    elif category == "rejectable":
        if reject_score >= 3.0:
            is_rejected = 1
        elif reject_score >= 1.5:
            is_rejected = 1 if rng.random() < 0.8 else 0
        else:
            is_rejected = 1 if rng.random() < 0.5 else 0

        if not is_rejected:
            is_accepted = 1 if accept_score > reject_score else 0

    elif category == "borderline":
        # Could go either way — features drive the decision
        if accept_score > reject_score + 1.5:
            is_accepted = 1
        elif reject_score > accept_score + 1.5:
            is_rejected = 1
        else:
            # Coin flip weighted by scores
            accept_prob = accept_score / max(accept_score + reject_score, 1)
            is_accepted = 1 if rng.random() < accept_prob else 0
            is_rejected = 0 if is_accepted else 1

    else:  # legitimate
        if accept_score >= 3.0:
            is_accepted = 1
        elif accept_score >= 1.5:
            is_accepted = 1 if rng.random() < 0.85 else 0
        else:
            is_accepted = 1 if rng.random() < 0.6 else 0

        if not is_accepted:
            is_rejected = 1

    # ── Ensure mutual exclusivity ──
    if is_fraud:
        is_rejected = 1  # Fraud always means rejection too
        is_accepted = 0

    if is_accepted and is_rejected:
        # Shouldn't happen, but resolve conflicts
        is_rejected = 0

    # ── Apply noise (5% label flip) ──
    if rng.random() < 0.05:
        noise_type = rng.choice(["flip_accept", "flip_fraud", "flip_reject"])
        if noise_type == "flip_accept" and not is_fraud:
            is_accepted = 1 - is_accepted
            is_rejected = 1 - is_accepted
        elif noise_type == "flip_fraud" and not is_accepted:
            is_fraud = 1 - is_fraud
            if is_fraud:
                is_rejected = 1
                is_accepted = 0
        elif noise_type == "flip_reject" and not is_fraud:
            is_rejected = 1 - is_rejected
            is_accepted = 1 - is_rejected

    # Ground truth label
    if is_fraud:
        label = "fraud"
    elif is_accepted:
        label = "accepted"
    else:
        label = "rejected"

    return {
        "is_accepted": is_accepted,
        "is_rejected": is_rejected,
        "is_fraud": is_fraud,
        "ground_truth_label": label,
    }
