"""
Location trail generator — physics-based GPS simulation.

Generates realistic GPS trails for different claim categories:
- Legitimate: smooth movement, normal jitter, realistic speeds
- Borderline: some gaps, slightly wider speed range
- Rejectable: sparse pings, location gaps
- Fraudulent: GPS spoofing (zero jitter, impossible speeds, static locations)
"""

import math
from datetime import datetime, timedelta

import numpy as np

from data.generators.constants import (
    ACCURACY_RANGES,
    CITY_COORDS,
    SPEED_RANGES,
)


def _degrees_per_meter(lat: float) -> tuple[float, float]:
    """Convert 1 meter to degrees at a given latitude."""
    lat_deg = 1.0 / 111_320.0
    lng_deg = 1.0 / (111_320.0 * math.cos(math.radians(lat)))
    return lat_deg, lng_deg


def generate_location_trail(
    zone: str,
    category: str,
    claim_timestamp: datetime,
    rng: np.random.Generator,
) -> tuple[dict, list[dict]]:
    """
    Generate a 1-hour GPS trail and current location for a claim.

    Parameters
    ----------
    zone : str
        City name (must be in CITY_COORDS).
    category : str
        One of: 'legitimate', 'borderline', 'rejectable', 'fraudulent'.
    claim_timestamp : datetime
        When the claim was filed (trail ends near this time).
    rng : np.random.Generator
        Random generator for reproducibility.

    Returns
    -------
    tuple of (current_location dict, location_history list of dicts)
    """
    base_lat, base_lng = CITY_COORDS.get(zone, (11.0168, 76.9558))

    # Add random offset within city (~5km radius)
    lat_deg, lng_deg = _degrees_per_meter(base_lat)
    offset_m = rng.normal(0, 2000, size=2)  # 2km std dev
    start_lat = base_lat + offset_m[0] * lat_deg
    start_lng = base_lng + offset_m[1] * lng_deg

    # Trail generation depends on category
    if category == "legitimate":
        trail, current = _generate_legitimate_trail(
            start_lat, start_lng, claim_timestamp, rng,
        )
    elif category == "borderline":
        trail, current = _generate_borderline_trail(
            start_lat, start_lng, claim_timestamp, rng,
        )
    elif category == "rejectable":
        trail, current = _generate_rejectable_trail(
            start_lat, start_lng, claim_timestamp, rng,
        )
    else:  # fraudulent
        trail, current = _generate_fraudulent_trail(
            start_lat, start_lng, claim_timestamp, rng,
        )

    return current, trail


def _generate_legitimate_trail(
    start_lat: float,
    start_lng: float,
    claim_ts: datetime,
    rng: np.random.Generator,
) -> tuple[list[dict], dict]:
    """Smooth, consistent movement with normal GPS jitter."""
    speed_min, speed_max = SPEED_RANGES["legitimate"]
    acc_min, acc_max = ACCURACY_RANGES["legitimate"]

    speed_kmh = rng.uniform(speed_min, speed_max)
    speed_m_per_sec = speed_kmh * 1000.0 / 3600.0
    direction = rng.uniform(0, 2 * math.pi)

    trail_start = claim_ts - timedelta(hours=1)
    ping_count = int(rng.integers(10, 20))  # 10-19 pings over 1 hour
    interval_sec = 3600.0 / ping_count

    lat, lng = start_lat, start_lng
    lat_deg, lng_deg = _degrees_per_meter(lat)

    trail = []
    for i in range(ping_count):
        t = trail_start + timedelta(seconds=i * interval_sec)

        # Move with slight direction changes
        direction += rng.normal(0, 0.08)
        dist = speed_m_per_sec * interval_sec
        lat += dist * math.cos(direction) * lat_deg
        lng += dist * math.sin(direction) * lng_deg

        # Realistic GPS jitter (5-15m)
        jitter_m = rng.normal(0, 8)
        jittered_lat = lat + jitter_m * lat_deg
        jittered_lng = lng + jitter_m * lng_deg

        accuracy = float(rng.uniform(acc_min, acc_max))

        trail.append({
            "lat": round(jittered_lat, 6),
            "lng": round(jittered_lng, 6),
            "accuracy": round(accuracy, 1),
            "source": "gps",
            "captured_at": t.isoformat() + "Z",
            "captured_at_epoch": t.timestamp(),
        })

    # Current location = last trail point + tiny movement
    current = {
        "lat": round(lat + rng.normal(0, 3) * lat_deg, 6),
        "lng": round(lng + rng.normal(0, 3) * lng_deg, 6),
        "accuracy": round(float(rng.uniform(acc_min, acc_max)), 1),
        "source": "gps",
        "captured_at": (claim_ts - timedelta(seconds=int(rng.integers(10, 120)))).isoformat() + "Z",
        "captured_at_epoch": (claim_ts - timedelta(seconds=int(rng.integers(10, 120)))).timestamp(),
    }

    return trail, current


def _generate_borderline_trail(
    start_lat: float,
    start_lng: float,
    claim_ts: datetime,
    rng: np.random.Generator,
) -> tuple[list[dict], dict]:
    """Some gaps, slightly noisier, wider speed range."""
    speed_min, speed_max = SPEED_RANGES["borderline"]
    acc_min, acc_max = ACCURACY_RANGES["borderline"]

    speed_kmh = rng.uniform(speed_min, speed_max)
    speed_m_per_sec = speed_kmh * 1000.0 / 3600.0
    direction = rng.uniform(0, 2 * math.pi)

    trail_start = claim_ts - timedelta(hours=1)
    total_pings = int(rng.integers(6, 15))
    interval_sec = 3600.0 / total_pings

    lat, lng = start_lat, start_lng
    lat_deg, lng_deg = _degrees_per_meter(lat)

    trail = []
    for i in range(total_pings):
        # 15% chance of skipping a ping (gap)
        if rng.random() < 0.15:
            # Still update position (rider is moving)
            direction += rng.normal(0, 0.12)
            dist = speed_m_per_sec * interval_sec
            lat += dist * math.cos(direction) * lat_deg
            lng += dist * math.sin(direction) * lng_deg
            continue

        t = trail_start + timedelta(seconds=i * interval_sec)
        direction += rng.normal(0, 0.12)
        dist = speed_m_per_sec * interval_sec
        lat += dist * math.cos(direction) * lat_deg
        lng += dist * math.sin(direction) * lng_deg

        jitter_m = rng.normal(0, 12)
        accuracy = float(rng.uniform(acc_min, acc_max))

        trail.append({
            "lat": round(lat + jitter_m * lat_deg, 6),
            "lng": round(lng + jitter_m * lng_deg, 6),
            "accuracy": round(accuracy, 1),
            "source": rng.choice(["gps", "network"], p=[0.8, 0.2]),
            "captured_at": t.isoformat() + "Z",
            "captured_at_epoch": t.timestamp(),
        })

    # Current location (slightly stale — 2-8 min old)
    freshness = int(rng.integers(120, 480))
    current = {
        "lat": round(lat + rng.normal(0, 5) * lat_deg, 6),
        "lng": round(lng + rng.normal(0, 5) * lng_deg, 6),
        "accuracy": round(float(rng.uniform(acc_min, acc_max)), 1),
        "source": "gps",
        "captured_at": (claim_ts - timedelta(seconds=freshness)).isoformat() + "Z",
        "captured_at_epoch": (claim_ts - timedelta(seconds=freshness)).timestamp(),
    }

    return trail, current


def _generate_rejectable_trail(
    start_lat: float,
    start_lng: float,
    claim_ts: datetime,
    rng: np.random.Generator,
) -> tuple[list[dict], dict]:
    """Sparse pings, large gaps, location jumps, stale current location."""
    acc_min, acc_max = ACCURACY_RANGES["rejectable"]

    trail_start = claim_ts - timedelta(hours=1)
    total_pings = int(rng.integers(1, 5))  # Very few pings
    interval_sec = 3600.0 / max(total_pings, 1)

    lat, lng = start_lat, start_lng
    lat_deg, lng_deg = _degrees_per_meter(lat)

    trail = []
    for i in range(total_pings):
        t = trail_start + timedelta(seconds=i * interval_sec)

        # Occasional large jumps (1-5 km)
        if rng.random() < 0.3:
            jump_m = rng.uniform(1000, 5000)
            jump_dir = rng.uniform(0, 2 * math.pi)
            lat += jump_m * math.cos(jump_dir) * lat_deg
            lng += jump_m * math.sin(jump_dir) * lng_deg
        else:
            lat += rng.normal(0, 50) * lat_deg
            lng += rng.normal(0, 50) * lng_deg

        accuracy = float(rng.uniform(acc_min, acc_max))

        trail.append({
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "accuracy": round(accuracy, 1),
            "source": rng.choice(["gps", "network", "wifi"], p=[0.5, 0.3, 0.2]),
            "captured_at": t.isoformat() + "Z",
            "captured_at_epoch": t.timestamp(),
        })

    # Current location very stale (10-30 min old) and far from claim
    freshness = int(rng.integers(600, 1800))
    offset = rng.uniform(2000, 8000)  # 2-8 km away
    offset_dir = rng.uniform(0, 2 * math.pi)
    current = {
        "lat": round(start_lat + offset * math.cos(offset_dir) * lat_deg, 6),
        "lng": round(start_lng + offset * math.sin(offset_dir) * lng_deg, 6),
        "accuracy": round(float(rng.uniform(20, 50)), 1),
        "source": "network",
        "captured_at": (claim_ts - timedelta(seconds=freshness)).isoformat() + "Z",
        "captured_at_epoch": (claim_ts - timedelta(seconds=freshness)).timestamp(),
    }

    return trail, current


def _generate_fraudulent_trail(
    start_lat: float,
    start_lng: float,
    claim_ts: datetime,
    rng: np.random.Generator,
) -> tuple[list[dict], dict]:
    """
    GPS spoofing patterns:
    - Nearly zero jitter (suspiciously perfect)
    - Very low accuracy values (too good)
    - OR impossible movement speeds (teleportation)
    """
    acc_min, acc_max = ACCURACY_RANGES["fraudulent"]
    spoofing_pattern = rng.choice(["static", "teleport"], p=[0.6, 0.4])

    trail_start = claim_ts - timedelta(hours=1)
    ping_count = int(rng.integers(8, 18))
    interval_sec = 3600.0 / ping_count

    lat_deg, lng_deg = _degrees_per_meter(start_lat)
    trail = []

    if spoofing_pattern == "static":
        # Static GPS spoofing: rider is stationary but claims disruption
        fake_lat = start_lat + rng.normal(0, 100) * lat_deg
        fake_lng = start_lng + rng.normal(0, 100) * lng_deg

        for i in range(ping_count):
            t = trail_start + timedelta(seconds=i * interval_sec)
            # Almost zero jitter — spoofed location
            trail.append({
                "lat": round(fake_lat + rng.normal(0, 0.3) * lat_deg, 6),
                "lng": round(fake_lng + rng.normal(0, 0.3) * lng_deg, 6),
                "accuracy": round(float(rng.uniform(acc_min, acc_max)), 1),
                "source": "gps",
                "captured_at": t.isoformat() + "Z",
                "captured_at_epoch": t.timestamp(),
            })

        current = {
            "lat": round(fake_lat + rng.normal(0, 0.5) * lat_deg, 6),
            "lng": round(fake_lng + rng.normal(0, 0.5) * lng_deg, 6),
            "accuracy": round(float(rng.uniform(acc_min, acc_max)), 1),
            "source": "gps",
            "captured_at": (claim_ts - timedelta(seconds=int(rng.integers(5, 30)))).isoformat() + "Z",
            "captured_at_epoch": (claim_ts - timedelta(seconds=int(rng.integers(5, 30)))).timestamp(),
        }
    else:
        # Teleportation: impossible jumps between pings
        lat, lng = start_lat, start_lng
        for i in range(ping_count):
            t = trail_start + timedelta(seconds=i * interval_sec)

            # Every 2-3 pings, make an impossible jump (10-50 km)
            if rng.random() < 0.4:
                jump_km = rng.uniform(10, 50)
                jump_dir = rng.uniform(0, 2 * math.pi)
                lat += jump_km * 1000 * math.cos(jump_dir) * lat_deg
                lng += jump_km * 1000 * math.sin(jump_dir) * lng_deg
            else:
                lat += rng.normal(0, 10) * lat_deg
                lng += rng.normal(0, 10) * lng_deg

            trail.append({
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "accuracy": round(float(rng.uniform(3, 15)), 1),
                "source": "gps",
                "captured_at": t.isoformat() + "Z",
                "captured_at_epoch": t.timestamp(),
            })

        current = {
            "lat": round(lat + rng.normal(0, 5) * lat_deg, 6),
            "lng": round(lng + rng.normal(0, 5) * lng_deg, 6),
            "accuracy": round(float(rng.uniform(3, 10)), 1),
            "source": "gps",
            "captured_at": (claim_ts - timedelta(seconds=int(rng.integers(5, 60)))).isoformat() + "Z",
            "captured_at_epoch": (claim_ts - timedelta(seconds=int(rng.integers(5, 60)))).timestamp(),
        }

    return trail, current
