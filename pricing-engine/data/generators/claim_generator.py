"""
Claim record generator.

Produces claim records with evidence metadata, previous claim histories,
and contextual data for each rider-claim pair. Claim frequency and
characteristics are correlated with the claim category (legitimate,
borderline, rejectable, fraudulent).
"""

import uuid
from datetime import datetime, timedelta

import numpy as np

from data.generators.constants import (
    CITY_COORDS,
    CLAIM_CATEGORIES,
    CLAIM_CATEGORY_WEIGHTS,
    CLAIMS_PER_RIDER,
    DISRUPTION_TYPES,
    DISRUPTION_WEIGHTS,
    weighted_choice,
)
from data.generators.location_generator import generate_location_trail


def _generate_claim_id() -> str:
    """Generate a claim ID matching the spec format: CLM_XXXXXXX."""
    return f"CLM_{uuid.uuid4().hex[:7].upper()}"


def _generate_evidence(
    category: str,
    claim_ts: datetime,
    rng: np.random.Generator,
) -> list[dict]:
    """Generate evidence metadata based on claim category."""
    if category == "fraudulent":
        # 60% chance of no evidence for fraud
        if rng.random() < 0.6:
            return []
        # If evidence exists, it's suspiciously timed
        ev_offset = int(rng.integers(-120, -30))  # Captured way before claim
        return [{
            "type": "image",
            "url": f"https://cdn.example.com/claims/evidence/{uuid.uuid4().hex[:8]}.jpg",
            "captured_at": (claim_ts + timedelta(minutes=ev_offset)).isoformat() + "Z",
        }]

    if category == "rejectable":
        # 50% no evidence
        if rng.random() < 0.5:
            return []
        ev_offset = int(rng.integers(-45, -15))  # Old evidence
        return [{
            "type": "image",
            "url": f"https://cdn.example.com/claims/evidence/{uuid.uuid4().hex[:8]}.jpg",
            "captured_at": (claim_ts + timedelta(minutes=ev_offset)).isoformat() + "Z",
        }]

    if category == "borderline":
        # 70% has evidence
        if rng.random() < 0.3:
            return []
        ev_offset = int(rng.integers(-10, 2))
        return [{
            "type": "image",
            "url": f"https://cdn.example.com/claims/evidence/{uuid.uuid4().hex[:8]}.jpg",
            "captured_at": (claim_ts + timedelta(minutes=ev_offset)).isoformat() + "Z",
        }]

    # Legitimate: 90% has evidence, evidence is well-timed
    if rng.random() < 0.1:
        return []
    ev_count = int(rng.integers(1, 3))  # 1-2 evidence items
    evidences = []
    for _ in range(ev_count):
        ev_offset = int(rng.integers(-3, 2))  # Very close to claim time
        evidences.append({
            "type": rng.choice(["image", "image", "video"]),
            "url": f"https://cdn.example.com/claims/evidence/{uuid.uuid4().hex[:8]}.jpg",
            "captured_at": (claim_ts + timedelta(minutes=ev_offset)).isoformat() + "Z",
        })
    return evidences


def _generate_previous_claims(
    category: str,
    claim_ts: datetime,
    current_disruption: str,
    rng: np.random.Generator,
) -> dict:
    """
    Generate a previous claims summary (90-day window).

    The history distribution is correlated with the claim category.
    """
    # Total claims in 90 days
    mean, std = CLAIMS_PER_RIDER.get(category, (3, 1.5))
    total = int(np.clip(rng.normal(mean, std), 0, 25))

    if total == 0:
        return {
            "window_days": 90,
            "total_count": 0,
            "approved_count": 0,
            "pending_count": 0,
            "rejected_count": 0,
            "fraud_flag_count": 0,
            "avg_ai_score": 0.5,
            "last_claim_at": None,
            "recent": [],
        }

    # Status distribution by category
    if category == "legitimate":
        approved_ratio = rng.uniform(0.6, 0.9)
        rejected_ratio = rng.uniform(0.0, 0.15)
        fraud_ratio = 0.0
    elif category == "borderline":
        approved_ratio = rng.uniform(0.3, 0.6)
        rejected_ratio = rng.uniform(0.1, 0.3)
        fraud_ratio = rng.uniform(0.0, 0.05)
    elif category == "rejectable":
        approved_ratio = rng.uniform(0.1, 0.4)
        rejected_ratio = rng.uniform(0.3, 0.6)
        fraud_ratio = rng.uniform(0.0, 0.1)
    else:  # fraudulent
        approved_ratio = rng.uniform(0.1, 0.3)
        rejected_ratio = rng.uniform(0.2, 0.4)
        fraud_ratio = rng.uniform(0.1, 0.3)

    pending_ratio = max(0.01, 1.0 - approved_ratio - rejected_ratio - fraud_ratio)

    # Normalize to ensure sum == 1.0
    total_ratio = approved_ratio + rejected_ratio + pending_ratio
    approved_ratio /= total_ratio
    rejected_ratio /= total_ratio
    pending_ratio /= total_ratio

    approved = max(0, int(total * approved_ratio))
    rejected = max(0, int(total * rejected_ratio))
    fraud_flags = max(0, int(total * fraud_ratio))
    pending = max(0, total - approved - rejected)

    # Average AI score
    if category == "legitimate":
        avg_score = rng.uniform(0.70, 0.92)
    elif category == "borderline":
        avg_score = rng.uniform(0.45, 0.70)
    elif category == "rejectable":
        avg_score = rng.uniform(0.25, 0.50)
    else:
        avg_score = rng.uniform(0.15, 0.40)

    # Generate recent claims list (up to 5 most recent)
    recent = []
    recent_count = min(total, 5)
    for i in range(recent_count):
        days_ago = int(rng.integers(1, 90))
        claim_dt = claim_ts - timedelta(days=days_ago)
        status = rng.choice(
            ["approved", "rejected", "pending"],
            p=[approved_ratio, rejected_ratio, pending_ratio],
        )
        c_type = weighted_choice(DISRUPTION_TYPES, DISRUPTION_WEIGHTS, rng)
        recent.append({
            "claim_id": _generate_claim_id(),
            "type": c_type,
            "hours": int(rng.integers(1, 8)),
            "status": status,
            "ai_score": round(float(rng.uniform(0.2, 0.95)), 2),
            "fraud_flag": rng.random() < fraud_ratio,
            "created_at": claim_dt.isoformat() + "Z",
        })

    # Sort by date (most recent first)
    recent.sort(key=lambda c: c["created_at"], reverse=True)

    last_claim_at = recent[0]["created_at"] if recent else None

    return {
        "window_days": 90,
        "total_count": total,
        "approved_count": approved,
        "pending_count": pending,
        "rejected_count": rejected,
        "fraud_flag_count": fraud_flags,
        "avg_ai_score": round(avg_score, 2),
        "last_claim_at": last_claim_at,
        "recent": recent,
    }


def generate_claims_for_rider(
    rider: dict,
    category: str,
    rng: np.random.Generator,
    base_date: datetime | None = None,
) -> list[dict]:
    """
    Generate all claims for a single rider within a 90-day window.

    Parameters
    ----------
    rider : dict
        Rider profile from rider_generator.
    category : str
        Claim category: 'legitimate', 'borderline', 'rejectable', 'fraudulent'.
    rng : np.random.Generator
        Random generator.
    base_date : datetime | None
        Reference date. Claims are generated within 90 days before this.

    Returns
    -------
    list of claim payload dicts (unified input format).
    """
    if base_date is None:
        base_date = datetime(2026, 4, 1, 12, 0, 0)

    # Number of claims for this rider
    mean, std = CLAIMS_PER_RIDER.get(category, (3, 1.5))
    n_claims = max(1, int(np.clip(rng.normal(mean, std), 1, 15)))

    claims = []
    for i in range(n_claims):
        # Random timestamp within 90-day window
        days_ago = int(rng.integers(0, 90))
        hours = int(rng.integers(6, 22))  # Most claims 6 AM - 10 PM
        if category == "fraudulent" and rng.random() < 0.3:
            hours = int(rng.integers(22, 28)) % 24  # Night claims for fraud
        minutes = int(rng.integers(0, 60))

        claim_ts = base_date - timedelta(days=int(days_ago))
        claim_ts = claim_ts.replace(hour=int(hours), minute=int(minutes), second=0)

        # Disruption type
        disruption_type = weighted_choice(DISRUPTION_TYPES, DISRUPTION_WEIGHTS, rng)

        # Hours claimed
        if category == "legitimate":
            hours_claimed = int(np.clip(rng.normal(3.5, 1.5), 1, 8))
        elif category == "fraudulent":
            hours_claimed = int(np.clip(rng.normal(6, 2), 2, 12))  # Higher hours
        else:
            hours_claimed = int(np.clip(rng.normal(4, 2), 1, 10))

        # Claim location (near rider's zone)
        city_lat, city_lng = CITY_COORDS.get(rider["zone"], (11.0168, 76.9558))
        claim_lat = city_lat + rng.normal(0, 0.01)
        claim_lng = city_lng + rng.normal(0, 0.01)

        # Generate GPS trail
        current_location, location_history = generate_location_trail(
            rider["zone"], category, claim_ts, rng,
        )

        # Evidence
        evidence = _generate_evidence(category, claim_ts, rng)

        # Previous claims history
        prev_claims = _generate_previous_claims(
            category, claim_ts, disruption_type, rng,
        )

        # Build unified payload
        payload = {
            "request_id": f"esai_{claim_ts.strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}",
            "generated_at": claim_ts.isoformat() + "Z",
            "claim_context": {
                "claim_id": _generate_claim_id(),
                "user_id": rider["user_id"],
                "disruption_type": disruption_type,
                "hours": hours_claimed,
                "note": f"Simulated {disruption_type.lower()} disruption",
                "claim_timestamp": claim_ts.isoformat() + "Z",
                "claim_location": {
                    "lat": round(claim_lat, 6),
                    "lng": round(claim_lng, 6),
                },
                "evidence": evidence,
            },
            "current_location": current_location,
            "location_history_last_1h": location_history,
            "user_profile": {
                "segment": rider["segment"],
                "platform": rider["platform"],
                "zone": rider["zone"],
                "work_shift": rider["work_shift"],
                "work_hours": rider["work_hours"],
                "daily_earnings": rider["daily_earnings"],
                "order_capacity": rider["order_capacity"],
            },
            "policy_context": rider["policy"],
            "previous_claims": prev_claims,
            # Category metadata (used for labeling, not a feature)
            "_category": category,
            "_rider_quality": rider.get("quality", "medium"),
        }

        claims.append(payload)

    return claims
