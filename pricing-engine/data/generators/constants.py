"""
Constants for synthetic data generation.

Defines Indian cities, disruption types, platforms, policy tiers, and all
weighted distributions used throughout the data generation pipeline.
"""

import numpy as np

# ──────────────────────────────────────────────
# Indian City Coordinates (lat, lng)
# ──────────────────────────────────────────────
CITY_COORDS: dict[str, tuple[float, float]] = {
    "Coimbatore": (11.0168, 76.9558),
    "Chennai": (13.0827, 80.2707),
    "Bangalore": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Mumbai": (19.0760, 72.8777),
    "Pune": (18.5204, 73.8567),
    "Delhi": (28.7041, 77.1025),
    "Kolkata": (22.5726, 88.3639),
}

CITY_NAMES = list(CITY_COORDS.keys())
CITY_WEIGHTS = [0.20, 0.15, 0.18, 0.12, 0.12, 0.08, 0.08, 0.07]

# ──────────────────────────────────────────────
# Disruption Types
# ──────────────────────────────────────────────
DISRUPTION_TYPES = [
    "Heavy Rain",
    "Heatwave",
    "Flood",
    "Vehicle Breakdown",
    "Accident",
    "Road Block",
]

DISRUPTION_TYPE_TO_ID: dict[str, int] = {dt: i for i, dt in enumerate(DISRUPTION_TYPES)}

# Seasonal weights (rain/flood higher in monsoon-like distribution)
DISRUPTION_WEIGHTS = [0.30, 0.15, 0.10, 0.20, 0.15, 0.10]

# ──────────────────────────────────────────────
# Rider Segments & Platforms
# ──────────────────────────────────────────────
SEGMENTS = ["transportation", "food_delivery", "logistics"]
SEGMENT_WEIGHTS = [0.50, 0.35, 0.15]

PLATFORMS_BY_SEGMENT: dict[str, list[str]] = {
    "transportation": ["Rapido", "Ola", "Uber"],
    "food_delivery": ["Swiggy", "Zomato", "Dunzo"],
    "logistics": ["Porter", "Delhivery", "Shadowfax"],
}

SEGMENT_TO_ID: dict[str, int] = {s: i for i, s in enumerate(SEGMENTS)}

# ──────────────────────────────────────────────
# Work Shifts
# ──────────────────────────────────────────────
SHIFTS = ["day", "night", "flexible"]
SHIFT_WEIGHTS = [0.55, 0.20, 0.25]
SHIFT_TO_ID: dict[str, int] = {s: i for i, s in enumerate(SHIFTS)}

# ──────────────────────────────────────────────
# Policy Tiers
# ──────────────────────────────────────────────
POLICY_TIERS = ["basic", "standard", "premium"]
TIER_TO_ID: dict[str, int] = {t: i for i, t in enumerate(POLICY_TIERS)}

TIER_WEEKLY_PREMIUM: dict[str, float] = {
    "basic": 25.0,
    "standard": 45.0,
    "premium": 85.0,
}

# Tier assignment weights by rider quality category
TIER_WEIGHTS_BY_QUALITY: dict[str, list[float]] = {
    "high": [0.10, 0.40, 0.50],     # Good riders → better policies
    "medium": [0.30, 0.50, 0.20],
    "low": [0.60, 0.30, 0.10],
}

# ──────────────────────────────────────────────
# Earnings Distributions by Segment
# ──────────────────────────────────────────────
EARNINGS_BY_SEGMENT: dict[str, tuple[float, float]] = {
    "transportation": (1200.0, 350.0),  # mean, std  (INR per day)
    "food_delivery": (900.0, 250.0),
    "logistics": (1500.0, 400.0),
}

# ──────────────────────────────────────────────
# Claim Category Distribution (for dataset generation)
# ──────────────────────────────────────────────
CLAIM_CATEGORIES = ["legitimate", "borderline", "rejectable", "fraudulent"]
CLAIM_CATEGORY_WEIGHTS = [0.65, 0.15, 0.12, 0.08]

# Average claims per rider in 90-day window (by category)
CLAIMS_PER_RIDER: dict[str, tuple[float, float]] = {
    "legitimate": (3.0, 1.5),    # mean, std (Poisson λ derived)
    "borderline": (5.0, 2.0),
    "rejectable": (6.0, 2.5),
    "fraudulent": (8.0, 3.0),
}

# ──────────────────────────────────────────────
# GPS Simulation Parameters
# ──────────────────────────────────────────────
GPS_PING_INTERVAL_MINUTES = 3    # One ping every 3 minutes
EARTH_RADIUS_KM = 6371.0

# Movement speed ranges (km/h) by category
SPEED_RANGES: dict[str, tuple[float, float]] = {
    "legitimate": (10.0, 40.0),      # Normal bike/scooter speed
    "borderline": (5.0, 50.0),       # Slightly wider range
    "rejectable": (0.0, 60.0),       # May include gaps
    "fraudulent": (0.0, 250.0),      # Impossible speeds allowed
}

# GPS accuracy ranges (meters) by category
ACCURACY_RANGES: dict[str, tuple[float, float]] = {
    "legitimate": (5.0, 20.0),       # Normal GPS
    "borderline": (8.0, 30.0),       # Slightly worse
    "rejectable": (10.0, 50.0),      # Poor GPS
    "fraudulent": (1.0, 5.0),        # Suspiciously perfect (spoofed)
}

# ──────────────────────────────────────────────
# Feature Names (ordered — must match extractor output)
# ──────────────────────────────────────────────
FEATURE_NAMES: list[str] = [
    # Group 1: Claim (5)
    "disruption_type_encoded",
    "hours_claimed",
    "has_evidence",
    "evidence_count",
    "evidence_timeliness_min",
    # Group 2: Geospatial (8)
    "distance_claim_vs_current_m",
    "distance_claim_vs_trail_centroid_m",
    "gps_accuracy_mean",
    "gps_accuracy_std",
    "location_ping_count_1h",
    "location_ping_density_per_min",
    "max_speed_kmh",
    "movement_consistency_score",
    # Group 3: Temporal (4)
    "hour_of_day_sin",
    "hour_of_day_cos",
    "is_weekend",
    "location_freshness_min",
    # Group 4: Rider Profile (5)
    "segment_encoded",
    "work_hours",
    "daily_earnings",
    "order_capacity",
    "shift_encoded",
    # Group 5: Policy (4)
    "tier_encoded",
    "weekly_premium",
    "fraud_strike_count",
    "is_claim_banned",
    # Group 6: Claim History (6)
    "total_claims_90d",
    "approved_ratio",
    "rejected_ratio",
    "fraud_flag_count",
    "avg_ai_score",
    "days_since_last_claim",
    # Group 7: Derived Behavioral (3)
    "claims_last_7d",
    "repeat_disruption_ratio",
    "night_claim_ratio_30d",
]

NUM_FEATURES = len(FEATURE_NAMES)  # Should be 35


def weighted_choice(choices: list, weights: list, rng: np.random.Generator | None = None) -> str:
    """Pick one item from choices using weighted probabilities."""
    _rng = rng or np.random.default_rng()
    probs = np.array(weights, dtype=float)
    probs /= probs.sum()
    return choices[_rng.choice(len(choices), p=probs)]
