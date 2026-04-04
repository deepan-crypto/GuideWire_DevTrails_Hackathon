"""
Rider profile and policy generator.

Produces realistic rider profiles with correlated attributes:
- Segment → platform selection
- Work hours → earnings correlation
- Rider quality → policy tier correlation
"""

import uuid

import numpy as np

from data.generators.constants import (
    CITY_NAMES,
    CITY_WEIGHTS,
    EARNINGS_BY_SEGMENT,
    PLATFORMS_BY_SEGMENT,
    POLICY_TIERS,
    SEGMENTS,
    SEGMENT_WEIGHTS,
    SHIFTS,
    SHIFT_WEIGHTS,
    TIER_WEEKLY_PREMIUM,
    TIER_WEIGHTS_BY_QUALITY,
    weighted_choice,
)


def generate_rider(rng: np.random.Generator, quality: str = "medium") -> dict:
    """
    Generate a single rider profile with correlated attributes.

    Parameters
    ----------
    rng : np.random.Generator
        Random number generator for reproducibility.
    quality : str
        Rider quality category: 'high', 'medium', or 'low'.
        Affects policy tier assignment and fraud strike distribution.

    Returns
    -------
    dict with keys: user_id, segment, platform, zone, work_shift,
                    work_hours, daily_earnings, order_capacity, policy
    """
    # Basic identity
    user_id = f"USR_{uuid.uuid4().hex[:12]}"

    # Segment & platform (correlated)
    segment = weighted_choice(SEGMENTS, SEGMENT_WEIGHTS, rng)
    platforms = PLATFORMS_BY_SEGMENT[segment]
    platform = platforms[rng.integers(0, len(platforms))]

    # Location
    zone = weighted_choice(CITY_NAMES, CITY_WEIGHTS, rng)

    # Shift
    shift = weighted_choice(SHIFTS, SHIFT_WEIGHTS, rng)

    # Work hours (correlated with shift)
    if shift == "day":
        work_hours = float(np.clip(rng.normal(8.5, 1.5), 4, 12))
    elif shift == "night":
        work_hours = float(np.clip(rng.normal(6.5, 1.5), 4, 10))
    else:  # flexible
        work_hours = float(np.clip(rng.normal(9.0, 2.0), 4, 14))

    # Earnings (correlated with segment + hours)
    earn_mean, earn_std = EARNINGS_BY_SEGMENT[segment]
    hourly_factor = work_hours / 8.0  # Normalize around 8-hour day
    daily_earnings = float(np.clip(
        rng.normal(earn_mean * hourly_factor, earn_std),
        400, 3500,
    ))

    # Order capacity (correlated with segment)
    if segment == "food_delivery":
        order_capacity = int(np.clip(rng.normal(45, 12), 20, 80))
    elif segment == "logistics":
        order_capacity = int(np.clip(rng.normal(25, 8), 10, 50))
    else:  # transportation
        order_capacity = int(np.clip(rng.normal(55, 15), 20, 100))

    # ── Policy (correlated with quality) ──
    tier_weights = TIER_WEIGHTS_BY_QUALITY.get(quality, TIER_WEIGHTS_BY_QUALITY["medium"])
    tier = weighted_choice(POLICY_TIERS, tier_weights, rng)
    weekly_premium = TIER_WEEKLY_PREMIUM[tier]

    # Fraud strikes (quality-correlated)
    if quality == "high":
        fraud_strikes = 0
    elif quality == "medium":
        fraud_strikes = int(rng.choice([0, 0, 0, 0, 1], size=1)[0])
    else:  # low
        fraud_strikes = int(rng.choice([0, 0, 1, 1, 2, 3], size=1)[0])

    # Claim ban (rare, more likely for low quality)
    claim_ban_until = None
    if quality == "low" and rng.random() < 0.15:
        claim_ban_until = "2026-04-15T00:00:00.000Z"  # Future ban

    policy = {
        "tier": tier,
        "plan_id": tier,
        "weekly_premium": weekly_premium,
        "active": True,
        "claim_ban_until": claim_ban_until,
        "fraud_strike_count": fraud_strikes,
    }

    return {
        "user_id": user_id,
        "segment": segment,
        "platform": platform,
        "zone": zone,
        "work_shift": shift,
        "work_hours": round(work_hours, 1),
        "daily_earnings": round(daily_earnings, 2),
        "order_capacity": order_capacity,
        "policy": policy,
    }


def generate_riders(
    n: int,
    seed: int = 42,
    category_distribution: dict[str, float] | None = None,
) -> list[dict]:
    """
    Generate N rider profiles with quality-correlated attributes.

    Parameters
    ----------
    n : int
        Number of riders to generate.
    seed : int
        Random seed for reproducibility.
    category_distribution : dict | None
        Override quality distribution. Default: 40% high, 35% medium, 25% low.

    Returns
    -------
    list of rider dicts, each with an added 'quality' key.
    """
    rng = np.random.default_rng(seed)

    if category_distribution is None:
        category_distribution = {"high": 0.40, "medium": 0.35, "low": 0.25}

    qualities = list(category_distribution.keys())
    weights = list(category_distribution.values())

    riders = []
    for _ in range(n):
        quality = weighted_choice(qualities, weights, rng)
        rider = generate_rider(rng, quality)
        rider["quality"] = quality
        riders.append(rider)

    return riders
