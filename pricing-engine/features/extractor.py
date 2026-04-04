"""
Unified Feature Extractor — shared between training and API serving.

This is the SINGLE source of truth for feature extraction. Both the synthetic
data pipeline and the FastAPI prediction endpoints use this class to ensure
zero training-serving skew.
"""

from datetime import datetime

import numpy as np

from data.generators.constants import (
    DISRUPTION_TYPE_TO_ID,
    FEATURE_NAMES,
    NUM_FEATURES,
    SEGMENT_TO_ID,
    SHIFT_TO_ID,
    TIER_TO_ID,
)
from features.behavioral_features import extract_behavioral_features
from features.geo_features import extract_geo_features
from features.temporal_features import extract_temporal_features


class FeatureExtractor:
    """
    Extracts a flat feature vector (35 features) from raw claim data.

    Input is a dictionary matching the unified input JSON schema.
    Output is a numpy array of shape (35,) with features in the order
    defined by FEATURE_NAMES.

    Usage
    -----
    extractor = FeatureExtractor()
    features = extractor.extract(payload_dict)   # → np.ndarray (35,)
    feature_dict = extractor.extract_dict(payload_dict)  # → dict
    """

    def __init__(self):
        self.feature_names = FEATURE_NAMES
        self.num_features = NUM_FEATURES

    def extract_dict(self, payload: dict) -> dict[str, float]:
        """
        Extract features as a dictionary (human-readable).

        Parameters
        ----------
        payload : dict
            Raw claim data matching the unified input JSON schema.
            Expected keys: claim_context, current_location,
            location_history_last_1h, user_profile, policy_context,
            previous_claims, derived_features (optional).
        """
        claim = payload.get("claim_context", {})
        current_loc = payload.get("current_location", {})
        loc_history = payload.get("location_history_last_1h", [])
        profile = payload.get("user_profile", {})
        policy = payload.get("policy_context", {})
        prev_claims = payload.get("previous_claims", {})
        derived = payload.get("derived_features", {})

        # Parse claim timestamp
        claim_ts_raw = claim.get("claim_timestamp", "")
        if isinstance(claim_ts_raw, datetime):
            claim_ts = claim_ts_raw
        elif isinstance(claim_ts_raw, str) and claim_ts_raw:
            try:
                claim_ts = datetime.fromisoformat(claim_ts_raw.replace("Z", "+00:00"))
                claim_ts = claim_ts.replace(tzinfo=None)
            except ValueError:
                claim_ts = datetime.now()
        else:
            claim_ts = datetime.now()

        # Parse location captured_at
        loc_captured_raw = current_loc.get("captured_at", "")
        if isinstance(loc_captured_raw, datetime):
            loc_captured = loc_captured_raw
        elif isinstance(loc_captured_raw, str) and loc_captured_raw:
            try:
                loc_captured = datetime.fromisoformat(loc_captured_raw.replace("Z", "+00:00"))
                loc_captured = loc_captured.replace(tzinfo=None)
            except ValueError:
                loc_captured = None
        else:
            loc_captured = None

        # ── Group 1: Claim Features ──
        disruption_type = claim.get("disruption_type", "Heavy Rain")
        disruption_encoded = DISRUPTION_TYPE_TO_ID.get(disruption_type, 0)
        hours_claimed = float(claim.get("hours", 1))

        evidence = claim.get("evidence", [])
        has_evidence = 1.0 if len(evidence) > 0 else 0.0
        evidence_count = len(evidence)

        # Evidence timeliness (minutes between evidence and claim)
        if evidence and claim_ts:
            first_ev = evidence[0]
            ev_time_raw = first_ev.get("captured_at", "")
            if isinstance(ev_time_raw, str) and ev_time_raw:
                try:
                    ev_time = datetime.fromisoformat(ev_time_raw.replace("Z", "+00:00"))
                    ev_time = ev_time.replace(tzinfo=None)
                    ev_timeliness = (claim_ts - ev_time).total_seconds() / 60.0
                except ValueError:
                    ev_timeliness = 0.0
            elif isinstance(ev_time_raw, datetime):
                ev_timeliness = (claim_ts - ev_time_raw).total_seconds() / 60.0
            else:
                ev_timeliness = 0.0
        else:
            ev_timeliness = 60.0  # No evidence → treated as very late

        claim_features = {
            "disruption_type_encoded": float(disruption_encoded),
            "hours_claimed": hours_claimed,
            "has_evidence": has_evidence,
            "evidence_count": float(evidence_count),
            "evidence_timeliness_min": round(ev_timeliness, 2),
        }

        # ── Group 2: Geospatial Features ──
        claim_loc = claim.get("claim_location", {})
        claim_lat = claim_loc.get("lat", current_loc.get("lat", 0.0))
        claim_lng = claim_loc.get("lng", current_loc.get("lng", 0.0))

        # Ensure location history has epoch timestamps for speed calculation
        processed_history = []
        for loc in loc_history:
            entry = dict(loc)
            if "captured_at_epoch" not in entry:
                cap = entry.get("captured_at", "")
                if isinstance(cap, str) and cap:
                    try:
                        dt = datetime.fromisoformat(cap.replace("Z", "+00:00"))
                        entry["captured_at_epoch"] = dt.timestamp()
                    except ValueError:
                        entry["captured_at_epoch"] = 0
                elif isinstance(cap, (int, float)):
                    entry["captured_at_epoch"] = float(cap)
                elif isinstance(cap, datetime):
                    entry["captured_at_epoch"] = cap.timestamp()
                else:
                    entry["captured_at_epoch"] = 0
            processed_history.append(entry)

        geo_features = extract_geo_features(
            claim_lat, claim_lng, current_loc, processed_history,
        )

        # ── Group 3: Temporal Features ──
        temporal_features = extract_temporal_features(claim_ts, loc_captured)

        # ── Group 4: Rider Profile Features ──
        segment = profile.get("segment", "transportation")
        shift = profile.get("work_shift", "day")
        profile_features = {
            "segment_encoded": float(SEGMENT_TO_ID.get(segment, 0)),
            "work_hours": float(profile.get("work_hours", 8)),
            "daily_earnings": float(profile.get("daily_earnings", 1000)),
            "order_capacity": float(profile.get("order_capacity", 50)),
            "shift_encoded": float(SHIFT_TO_ID.get(shift, 0)),
        }

        # ── Group 5: Policy Features ──
        tier = policy.get("tier", policy.get("plan_id", "standard"))
        # Normalize tier names
        tier_lower = tier.lower().replace(" shield", "").strip()
        ban_until = policy.get("claim_ban_until")
        is_banned = 0.0
        if ban_until:
            if isinstance(ban_until, str):
                try:
                    ban_dt = datetime.fromisoformat(ban_until.replace("Z", "+00:00"))
                    ban_dt = ban_dt.replace(tzinfo=None)
                    is_banned = 1.0 if ban_dt > claim_ts else 0.0
                except ValueError:
                    is_banned = 0.0
            elif isinstance(ban_until, datetime):
                is_banned = 1.0 if ban_until > claim_ts else 0.0

        policy_features = {
            "tier_encoded": float(TIER_TO_ID.get(tier_lower, 1)),
            "weekly_premium": float(policy.get("weekly_premium", 45)),
            "fraud_strike_count": float(policy.get("fraud_strike_count", 0)),
            "is_claim_banned": is_banned,
        }

        # ── Groups 6 & 7: Behavioral Features ──
        # Merge derived_features into previous_claims for the extractor
        enriched_prev = dict(prev_claims)
        if derived:
            enriched_prev.setdefault("claims_last_7d", derived.get("claims_last_7d", 0))
            enriched_prev.setdefault(
                "repeat_disruption_ratio", derived.get("repeat_disruption_ratio", 0)
            )
            enriched_prev.setdefault(
                "night_claim_ratio_30d", derived.get("night_claim_ratio_30d", 0)
            )

        behavioral_features = extract_behavioral_features(
            enriched_prev, disruption_type, claim_ts,
        )

        # ── Combine all features ──
        all_features = {}
        all_features.update(claim_features)
        all_features.update(geo_features)
        all_features.update(temporal_features)
        all_features.update(profile_features)
        all_features.update(policy_features)
        all_features.update(behavioral_features)

        return all_features

    def extract(self, payload: dict) -> np.ndarray:
        """
        Extract features as a numpy array in canonical order.

        Returns shape (35,) float64 array.
        """
        feat_dict = self.extract_dict(payload)
        return np.array(
            [feat_dict.get(name, 0.0) for name in self.feature_names],
            dtype=np.float64,
        )

    def extract_batch(self, payloads: list[dict]) -> np.ndarray:
        """
        Extract features for multiple payloads.

        Returns shape (N, 35) float64 array.
        """
        return np.array([self.extract(p) for p in payloads], dtype=np.float64)
