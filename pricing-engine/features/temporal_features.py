"""
Temporal feature computation.

Cyclical time encoding, weekend detection, and location freshness scoring.
"""

import math
from datetime import datetime


def extract_temporal_features(
    claim_timestamp: datetime,
    location_captured_at: datetime | None = None,
) -> dict[str, float]:
    """
    Extract all 4 temporal features from timestamps.

    Parameters
    ----------
    claim_timestamp : datetime
        When the claim was filed.
    location_captured_at : datetime | None
        When the current location was last captured.
        If None, freshness defaults to a large value (stale).

    Returns
    -------
    dict with keys: hour_of_day_sin, hour_of_day_cos, is_weekend, location_freshness_min
    """
    hour = claim_timestamp.hour + claim_timestamp.minute / 60.0

    # Cyclical encoding of hour (sin/cos)
    hour_sin = math.sin(2 * math.pi * hour / 24.0)
    hour_cos = math.cos(2 * math.pi * hour / 24.0)

    # Weekend flag
    is_weekend = 1.0 if claim_timestamp.weekday() >= 5 else 0.0

    # Location freshness (minutes since last GPS capture)
    if location_captured_at is not None:
        delta = (claim_timestamp - location_captured_at).total_seconds()
        freshness_min = max(abs(delta) / 60.0, 0.0)
    else:
        freshness_min = 60.0  # Default: 1 hour (very stale)

    return {
        "hour_of_day_sin": round(hour_sin, 6),
        "hour_of_day_cos": round(hour_cos, 6),
        "is_weekend": is_weekend,
        "location_freshness_min": round(freshness_min, 2),
    }
