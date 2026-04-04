"""
Geospatial feature computation.

Provides haversine distance, speed calculation, trail analysis, and
movement consistency scoring for GPS location data.
"""

import math

import numpy as np


def haversine_distance_m(
    lat1: float, lng1: float,
    lat2: float, lng2: float,
) -> float:
    """
    Compute great-circle distance between two points in meters.

    Uses the Haversine formula.
    """
    R = 6_371_000.0  # Earth radius in meters

    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def trail_centroid(locations: list[dict]) -> tuple[float, float]:
    """
    Compute centroid (mean lat, mean lng) of a location trail.

    Returns (0, 0) if empty.
    """
    if not locations:
        return 0.0, 0.0

    lats = [loc["lat"] for loc in locations]
    lngs = [loc["lng"] for loc in locations]
    return float(np.mean(lats)), float(np.mean(lngs))


def compute_speeds_kmh(locations: list[dict]) -> list[float]:
    """
    Compute speed (km/h) between consecutive location pings.

    Each location must have 'lat', 'lng', and 'captured_at' (ISO string or
    timestamp in seconds).  Returns list of N-1 speeds.
    """
    if len(locations) < 2:
        return []

    speeds: list[float] = []
    for i in range(1, len(locations)):
        dist_m = haversine_distance_m(
            locations[i - 1]["lat"], locations[i - 1]["lng"],
            locations[i]["lat"], locations[i]["lng"],
        )
        # Time delta in hours
        t0 = locations[i - 1].get("captured_at_epoch", 0)
        t1 = locations[i].get("captured_at_epoch", 0)
        dt_hours = max((t1 - t0) / 3600.0, 1e-6)  # Avoid division by zero

        speed_kmh = (dist_m / 1000.0) / dt_hours
        speeds.append(speed_kmh)
    return speeds


def movement_consistency(locations: list[dict]) -> float:
    """
    Ratio of straight-line displacement to total path distance.

    Returns a value in [0, 1]:
    - Close to 1.0 = straight-line movement (GPS spoofing indicator if too perfect)
    - Close to 0.0 = very erratic movement
    - Returns 0.5 (neutral) if insufficient data

    The score is designed so both extremes (too perfect and too erratic) are informative.
    """
    if len(locations) < 2:
        return 0.5

    # Total path distance
    total_path = 0.0
    for i in range(1, len(locations)):
        total_path += haversine_distance_m(
            locations[i - 1]["lat"], locations[i - 1]["lng"],
            locations[i]["lat"], locations[i]["lng"],
        )

    if total_path < 1.0:  # Less than 1 meter of movement
        return 0.5

    # Straight-line displacement (first to last)
    displacement = haversine_distance_m(
        locations[0]["lat"], locations[0]["lng"],
        locations[-1]["lat"], locations[-1]["lng"],
    )

    return min(displacement / total_path, 1.0)


def extract_geo_features(
    claim_lat: float,
    claim_lng: float,
    current_location: dict,
    location_history: list[dict],
) -> dict[str, float]:
    """
    Extract all 8 geospatial features from location data.

    Returns dict with keys matching FEATURE_NAMES.
    """
    # Distance: claim location vs current GPS
    dist_claim_current = haversine_distance_m(
        claim_lat, claim_lng,
        current_location.get("lat", 0),
        current_location.get("lng", 0),
    )

    # Distance: claim location vs trail centroid
    centroid_lat, centroid_lng = trail_centroid(location_history)
    dist_claim_centroid = haversine_distance_m(
        claim_lat, claim_lng, centroid_lat, centroid_lng,
    ) if location_history else 0.0

    # GPS accuracy statistics
    accuracies = [loc.get("accuracy", 15.0) for loc in location_history]
    if accuracies:
        acc_mean = float(np.mean(accuracies))
        acc_std = float(np.std(accuracies))
    else:
        acc_mean = current_location.get("accuracy", 15.0)
        acc_std = 0.0

    # Ping density
    ping_count = len(location_history)
    ping_density = ping_count / 60.0  # pings per minute over 1 hour

    # Speed analysis
    speeds = compute_speeds_kmh(location_history)
    max_speed = max(speeds) if speeds else 0.0

    # Movement consistency
    consistency = movement_consistency(location_history)

    return {
        "distance_claim_vs_current_m": round(dist_claim_current, 2),
        "distance_claim_vs_trail_centroid_m": round(dist_claim_centroid, 2),
        "gps_accuracy_mean": round(acc_mean, 2),
        "gps_accuracy_std": round(acc_std, 2),
        "location_ping_count_1h": ping_count,
        "location_ping_density_per_min": round(ping_density, 4),
        "max_speed_kmh": round(max_speed, 2),
        "movement_consistency_score": round(consistency, 4),
    }
