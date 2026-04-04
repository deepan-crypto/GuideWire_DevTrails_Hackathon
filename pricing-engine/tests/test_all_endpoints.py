"""
Comprehensive API Test Suite for GuideWire ES-AI.

55 tests total — 5 unique test cases per endpoint.
Uses direct function calls + TestClient with full error handling.

Run:  python tests/test_all_endpoints.py
"""

import json
import sys
import time
import traceback
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import requests as http_requests

# ══════════════════════════════════════════════════════════════
# 5 DIVERSE TEST PAYLOADS
# ══════════════════════════════════════════════════════════════

# 1: Legitimate — Good rider, strong evidence, close GPS
LEGITIMATE = {
    "request_id": "test_legit_001",
    "claim_context": {
        "claim_id": "CLM_LEG0001", "user_id": "usr_legit_01",
        "disruption_type": "Heavy Rain", "hours": 4,
        "note": "Road flooded near underpass",
        "claim_timestamp": "2026-04-01T13:14:50.000Z",
        "claim_location": {"lat": 10.9981, "lng": 76.9664},
        "evidence": [
            {"type": "image", "url": "https://cdn.example.com/img1.jpg",
             "captured_at": "2026-04-01T13:13:30.000Z"},
            {"type": "image", "url": "https://cdn.example.com/img2.jpg",
             "captured_at": "2026-04-01T13:14:00.000Z"},
        ],
    },
    "current_location": {
        "lat": 10.9982, "lng": 76.9665, "accuracy": 6,
        "source": "gps", "captured_at": "2026-04-01T13:14:48.000Z",
    },
    "location_history_last_1h": [
        {"lat": 10.9970, "lng": 76.9650, "accuracy": 7, "source": "gps", "captured_at": "2026-04-01T12:15:00.000Z"},
        {"lat": 10.9975, "lng": 76.9658, "accuracy": 8, "source": "gps", "captured_at": "2026-04-01T12:35:00.000Z"},
        {"lat": 10.9980, "lng": 76.9663, "accuracy": 7, "source": "gps", "captured_at": "2026-04-01T12:55:00.000Z"},
    ],
    "user_profile": {
        "segment": "transportation", "platform": "Rapido", "zone": "Coimbatore",
        "work_shift": "day", "work_hours": 8, "daily_earnings": 1400, "order_capacity": 60,
    },
    "policy_context": {
        "tier": "Standard Shield", "plan_id": "standard", "weekly_premium": 45,
        "active": True, "claim_ban_until": None, "fraud_strike_count": 0,
    },
    "previous_claims": {
        "window_days": 90, "total_count": 5, "approved_count": 4,
        "pending_count": 1, "rejected_count": 0, "fraud_flag_count": 0,
        "avg_ai_score": 0.82, "last_claim_at": "2026-03-20T10:00:00.000Z", "recent": [],
    },
    "derived_features": {
        "distance_claim_vs_last_point_m": 30, "movement_consistency_score": 0.92,
        "claims_last_7d": 1, "repeat_disruption_ratio": 0.20, "night_claim_ratio_30d": 0.05,
    },
}

# 2: Suspicious — Fraud strikes, location mismatch, no evidence, night
SUSPICIOUS = {
    "request_id": "test_suspicious_001",
    "claim_context": {
        "claim_id": "CLM_SUS0001", "user_id": "usr_sus_01",
        "disruption_type": "Heavy Rain", "hours": 10,
        "note": "Flooded roads",
        "claim_timestamp": "2026-04-01T02:14:50.000Z",
        "claim_location": {"lat": 12.9716, "lng": 77.5946},
        "evidence": [],
    },
    "current_location": {
        "lat": 19.0760, "lng": 72.8777, "accuracy": 3,
        "source": "gps", "captured_at": "2026-04-01T01:50:00.000Z",
    },
    "location_history_last_1h": [],
    "user_profile": {
        "segment": "food_delivery", "platform": "Swiggy", "zone": "Mumbai",
        "work_shift": "night", "work_hours": 4, "daily_earnings": 600, "order_capacity": 20,
    },
    "policy_context": {
        "tier": "basic", "plan_id": "basic", "weekly_premium": 25,
        "active": True, "claim_ban_until": None, "fraud_strike_count": 3,
    },
    "previous_claims": {
        "window_days": 90, "total_count": 18, "approved_count": 3,
        "pending_count": 2, "rejected_count": 10, "fraud_flag_count": 3,
        "avg_ai_score": 0.25, "last_claim_at": "2026-03-31T23:00:00.000Z", "recent": [],
    },
    "derived_features": {
        "claims_last_7d": 7, "repeat_disruption_ratio": 0.85, "night_claim_ratio_30d": 0.80,
    },
}

# 3: New Rider — First claim ever
NEW_RIDER = {
    "request_id": "test_new_001",
    "claim_context": {
        "claim_id": "CLM_NEW0001", "user_id": "usr_new_01",
        "disruption_type": "Heatwave", "hours": 2,
        "note": "Extreme heat, cannot work",
        "claim_timestamp": "2026-04-01T14:30:00.000Z",
        "claim_location": {"lat": 13.0827, "lng": 80.2707},
        "evidence": [
            {"type": "image", "url": "https://cdn.example.com/heat1.jpg",
             "captured_at": "2026-04-01T14:28:00.000Z"},
        ],
    },
    "current_location": {
        "lat": 13.0830, "lng": 80.2710, "accuracy": 10,
        "source": "gps", "captured_at": "2026-04-01T14:29:00.000Z",
    },
    "location_history_last_1h": [
        {"lat": 13.0820, "lng": 80.2700, "accuracy": 12, "source": "gps", "captured_at": "2026-04-01T13:30:00.000Z"},
    ],
    "user_profile": {
        "segment": "transportation", "platform": "Uber", "zone": "Chennai",
        "work_shift": "day", "work_hours": 6, "daily_earnings": 900, "order_capacity": 35,
    },
    "policy_context": {
        "tier": "Standard Shield", "plan_id": "standard", "weekly_premium": 45,
        "active": True, "claim_ban_until": None, "fraud_strike_count": 0,
    },
    "previous_claims": {
        "window_days": 90, "total_count": 0, "approved_count": 0,
        "pending_count": 0, "rejected_count": 0, "fraud_flag_count": 0,
        "avg_ai_score": 0.5, "last_claim_at": None, "recent": [],
    },
}

# 4: Premium Rider — High earner, perfect history
PREMIUM = {
    "request_id": "test_premium_001",
    "claim_context": {
        "claim_id": "CLM_PRM0001", "user_id": "usr_premium_01",
        "disruption_type": "Vehicle Breakdown", "hours": 6,
        "note": "Engine overheated on highway",
        "claim_timestamp": "2026-04-01T11:00:00.000Z",
        "claim_location": {"lat": 17.3850, "lng": 78.4867},
        "evidence": [
            {"type": "image", "url": "https://cdn.example.com/bd1.jpg", "captured_at": "2026-04-01T10:58:00.000Z"},
            {"type": "video", "url": "https://cdn.example.com/bd.mp4", "captured_at": "2026-04-01T10:59:00.000Z"},
        ],
    },
    "current_location": {
        "lat": 17.3852, "lng": 78.4870, "accuracy": 5,
        "source": "gps", "captured_at": "2026-04-01T10:59:30.000Z",
    },
    "location_history_last_1h": [
        {"lat": 17.3800, "lng": 78.4800, "accuracy": 5, "source": "gps", "captured_at": "2026-04-01T10:00:00.000Z"},
        {"lat": 17.3820, "lng": 78.4830, "accuracy": 5, "source": "gps", "captured_at": "2026-04-01T10:20:00.000Z"},
        {"lat": 17.3840, "lng": 78.4855, "accuracy": 5, "source": "gps", "captured_at": "2026-04-01T10:40:00.000Z"},
        {"lat": 17.3845, "lng": 78.4860, "accuracy": 6, "source": "gps", "captured_at": "2026-04-01T10:50:00.000Z"},
    ],
    "user_profile": {
        "segment": "logistics", "platform": "Dunzo", "zone": "Hyderabad",
        "work_shift": "day", "work_hours": 10, "daily_earnings": 2200, "order_capacity": 80,
    },
    "policy_context": {
        "tier": "Premium Shield", "plan_id": "premium", "weekly_premium": 75,
        "active": True, "claim_ban_until": None, "fraud_strike_count": 0,
    },
    "previous_claims": {
        "window_days": 90, "total_count": 3, "approved_count": 3,
        "pending_count": 0, "rejected_count": 0, "fraud_flag_count": 0,
        "avg_ai_score": 0.91, "last_claim_at": "2026-02-15T09:00:00.000Z", "recent": [],
    },
    "derived_features": {
        "distance_claim_vs_last_point_m": 15, "movement_consistency_score": 0.95,
        "claims_last_7d": 0, "repeat_disruption_ratio": 0.10, "night_claim_ratio_30d": 0.0,
    },
}

# 5: Borderline — Weak evidence, mixed history
BORDERLINE = {
    "request_id": "test_borderline_001",
    "claim_context": {
        "claim_id": "CLM_BRD0001", "user_id": "usr_border_01",
        "disruption_type": "Flood", "hours": 5,
        "note": "Water logging in area",
        "claim_timestamp": "2026-04-01T16:00:00.000Z",
        "claim_location": {"lat": 18.5204, "lng": 73.8567},
        "evidence": [
            {"type": "image", "url": "https://cdn.example.com/old.jpg", "captured_at": "2026-04-01T15:30:00.000Z"},
        ],
    },
    "current_location": {
        "lat": 18.5250, "lng": 73.8600, "accuracy": 25,
        "source": "network", "captured_at": "2026-04-01T15:45:00.000Z",
    },
    "location_history_last_1h": [
        {"lat": 18.5180, "lng": 73.8550, "accuracy": 20, "source": "network", "captured_at": "2026-04-01T15:10:00.000Z"},
    ],
    "user_profile": {
        "segment": "food_delivery", "platform": "Zomato", "zone": "Pune",
        "work_shift": "day", "work_hours": 7, "daily_earnings": 1100, "order_capacity": 45,
    },
    "policy_context": {
        "tier": "Standard Shield", "plan_id": "standard", "weekly_premium": 45,
        "active": True, "claim_ban_until": None, "fraud_strike_count": 1,
    },
    "previous_claims": {
        "window_days": 90, "total_count": 10, "approved_count": 5,
        "pending_count": 2, "rejected_count": 3, "fraud_flag_count": 1,
        "avg_ai_score": 0.55, "last_claim_at": "2026-03-28T12:00:00.000Z", "recent": [],
    },
    "derived_features": {
        "distance_claim_vs_last_point_m": 600, "movement_consistency_score": 0.55,
        "claims_last_7d": 3, "repeat_disruption_ratio": 0.50, "night_claim_ratio_30d": 0.30,
    },
}

SCENARIOS = [
    ("Legitimate Rider", LEGITIMATE),
    ("Suspicious Rider", SUSPICIOUS),
    ("New Rider (First Claim)", NEW_RIDER),
    ("Premium Rider", PREMIUM),
    ("Borderline Case", BORDERLINE),
]


def _wrap_esai(p):
    """Wrap unified payload into ES-AI format."""
    c = p.get("claim_context", {})
    return {
        "version": "v1",
        "payload": {
            "claim": {"type": c.get("disruption_type", "Heavy Rain"), "hours": c.get("hours", 1),
                      "disruption_type": c.get("disruption_type", "Heavy Rain"),
                      "claim_location": c.get("claim_location", {}), "evidence": c.get("evidence", [])},
            "rider": p.get("user_profile", {}),
            "location": {"current": p.get("current_location", {}),
                         "past1Hour": p.get("location_history_last_1h", [])},
            "previousClaims": p.get("previous_claims", {}),
        },
    }


DQ_INPUTS = [
    ("Complete Payload (A)", {"payload": {"claim": {"type": "Heavy Rain", "hours": 4},
     "rider": {"userId": "u1", "segment": "transportation"},
     "location": {"current": {"lat": 11.01, "lng": 76.95, "timestamp": 1711962000000}},
     "previousClaims": {"summary": {"total": 12}}}}),
    ("Minimal claimInput (B)", {"userId": "u2", "claimInput": {"type": "Heatwave", "hours": 3, "lat": 13.08, "lng": 80.27}}),
    ("Empty (worst case)", {}),
    ("Missing Location", {"payload": {"claim": {"type": "Flood", "hours": 2}, "rider": {"segment": "food_delivery"}, "location": {}, "previousClaims": {}}}),
    ("Only Claim", {"payload": {"claim": {"type": "Heavy Rain", "hours": 5}, "rider": {}, "location": {}, "previousClaims": {}}}),
]

HC_INPUTS = [
    ("Reject without live GPS", {"prediction": {"decision": "reject", "reason": "Location mismatch", "breakdown": {"locationTrust": 30}, "confidence": 90}, "payload": {"location": {"telemetry": {"hasLiveLocation": False}}, "previousClaims": {"summary": {"total": 0}}}}),
    ("Clean prediction", {"prediction": {"decision": "accept", "reason": "Consistent", "breakdown": {"locationTrust": 90}, "confidence": 85}, "payload": {"location": {"telemetry": {"hasLiveLocation": True}}, "previousClaims": {"summary": {"total": 8}}}}),
    ("Fraud on zero history", {"prediction": {"decision": "fraud", "reason": "Anomaly", "breakdown": {"locationTrust": 60}, "confidence": 92, "fraudFlag": True, "fraudScore": 88}, "payload": {"location": {"telemetry": {"hasLiveLocation": True}}, "previousClaims": {"summary": {"total": 0}}}}),
    ("High confidence sparse data", {"prediction": {"decision": "reject", "reason": "Insufficient", "breakdown": {"locationTrust": 50}, "confidence": 95}, "payload": {"location": {"telemetry": {"hasLiveLocation": False}}, "previousClaims": {"summary": {"total": 0}}}}),
    ("Accept with low location trust", {"prediction": {"decision": "accept", "reason": "Strong history", "breakdown": {"locationTrust": 15}, "confidence": 75}, "payload": {"location": {"telemetry": {"hasLiveLocation": True}}, "previousClaims": {"summary": {"total": 10}}}}),
]


# ══════════════════════════════════════════════════════════════
# Test Runner — Uses HTTP against running server
# ══════════════════════════════════════════════════════════════

BASE = "http://localhost:8000"
results = []


def _header(text):
    print(f"\n{'━'*72}")
    print(f"  {text}")
    print(f"{'━'*72}")


def _v(label, value, indent=4):
    prefix = " " * indent
    if isinstance(value, dict):
        print(f"{prefix}{label}:")
        for k, v in value.items():
            print(f"{prefix}  {k}: {v}")
    elif isinstance(value, list) and len(value) > 3:
        print(f"{prefix}{label}: [{', '.join(str(x) for x in value[:3])}, ...]")
    else:
        print(f"{prefix}{label}: {value}")


def _record(name, passed, ms):
    results.append({"name": name, "passed": passed, "ms": ms})
    icon = "✅" if passed else "❌"
    print(f"    {icon} {name} ({ms}ms)")


def _get(path):
    t0 = time.perf_counter()
    try:
        r = http_requests.get(f"{BASE}{path}", timeout=10)
        ms = int((time.perf_counter() - t0) * 1000)
        return r.status_code, r.json(), ms
    except Exception as e:
        ms = int((time.perf_counter() - t0) * 1000)
        return 0, {"error": str(e)}, ms


def _post(path, data):
    t0 = time.perf_counter()
    try:
        r = http_requests.post(f"{BASE}{path}", json=data, timeout=10)
        ms = int((time.perf_counter() - t0) * 1000)
        return r.status_code, r.json(), ms
    except Exception as e:
        ms = int((time.perf_counter() - t0) * 1000)
        return 0, {"error": str(e)}, ms


def test_health():
    _header("ENDPOINT 1/11: GET /health (5 tests)")
    for i in range(5):
        code, data, ms = _get("/health")
        ok = code == 200 and data.get("status") == "ok"
        _record(f"GET /health [{i+1}]", ok, ms)


def test_v1_health():
    _header("ENDPOINT 2/11: GET /v1/health (5 tests)")
    for i in range(5):
        code, data, ms = _get("/v1/health")
        ok = code == 200 and data.get("service") == "es-ai-fastapi"
        models = data.get("models", {})
        _v(f"[{i+1}]", f"status={data.get('status')} models={json.dumps(models)}")
        _record(f"GET /v1/health [{i+1}]", ok, ms)


def test_acceptance():
    _header("ENDPOINT 3/11: POST /v1/claims/acceptance-score (5 tests)")
    for label, payload in SCENARIOS:
        code, data, ms = _post("/v1/claims/acceptance-score", payload)
        print(f"\n    ┌─ {label}")
        _v("Score", data.get("acceptance_score"), 6)
        _v("Status", data.get("recommended_status"), 6)
        _v("Instant Payout", f"₹{data.get('instant_payout', 0):,.2f}", 6)
        _v("Held Amount", f"₹{data.get('held_amount', 0):,.2f}", 6)
        _v("Reason Codes", data.get("reason_codes"), 6)
        ok = code == 200 and isinstance(data.get("acceptance_score"), (int, float))
        _record(f"acceptance [{label}]", ok, ms)


def test_rejection():
    _header("ENDPOINT 4/11: POST /v1/claims/rejection-score (5 tests)")
    for label, payload in SCENARIOS:
        code, data, ms = _post("/v1/claims/rejection-score", payload)
        print(f"\n    ┌─ {label}")
        _v("Score", data.get("rejection_score"), 6)
        _v("Status", data.get("recommended_status"), 6)
        _v("Held Amount", f"₹{data.get('held_amount', 0):,.2f}", 6)
        _v("Reason Codes", data.get("reason_codes"), 6)
        ok = code == 200 and "rejection_score" in data
        _record(f"rejection [{label}]", ok, ms)


def test_fraud():
    _header("ENDPOINT 5/11: POST /v1/claims/fraud-score (5 tests)")
    for label, payload in SCENARIOS:
        code, data, ms = _post("/v1/claims/fraud-score", payload)
        print(f"\n    ┌─ {label}")
        _v("Score", data.get("fraud_score"), 6)
        _v("Flag", data.get("fraud_flag"), 6)
        _v("Status", data.get("recommended_status"), 6)
        _v("Actions", data.get("policy_actions"), 6)
        _v("Reason Codes", data.get("reason_codes"), 6)
        ok = code == 200 and isinstance(data.get("fraud_flag"), bool)
        _record(f"fraud [{label}]", ok, ms)


def test_predict():
    _header("ENDPOINT 6/11: POST /es-ai/predict — Full Cascade (5 tests)")
    for label, payload in SCENARIOS:
        esai = _wrap_esai(payload)
        code, data, ms = _post("/es-ai/predict", esai)
        print(f"\n    ┌─ {label}")
        dq = data.get("dataQuality", {})
        pred = data.get("prediction", {})
        _v("Data Quality", f"Score={dq.get('score')} Grade={dq.get('grade')}", 6)
        _v("Decision", pred.get("decision"), 6)
        _v("Confidence", pred.get("confidence"), 6)
        _v("Fraud Score", pred.get("fraudScore"), 6)
        _v("Fraud Flag", pred.get("fraudFlag"), 6)
        _v("Breakdown", pred.get("breakdown"), 6)
        ok = code == 200 and "prediction" in data
        _record(f"predict [{label}]", ok, ms)


def test_decision_accept():
    _header("ENDPOINT 7/11: POST /es-ai/decision/accept (5 tests)")
    for label, payload in SCENARIOS:
        esai = _wrap_esai(payload)
        code, data, ms = _post("/es-ai/decision/accept", esai)
        print(f"\n    ┌─ {label}")
        _v("Mode", data.get("mode"), 6)
        _v("Decision", data.get("prediction", {}).get("decision"), 6)
        _v("Confidence", data.get("prediction", {}).get("confidence"), 6)
        _v("Claim Status", data.get("claim", {}).get("status"), 6)
        ok = code == 200 and data.get("mode") == "accept"
        _record(f"decision/accept [{label}]", ok, ms)


def test_decision_reject():
    _header("ENDPOINT 8/11: POST /es-ai/decision/reject (5 tests)")
    for label, payload in SCENARIOS:
        esai = _wrap_esai(payload)
        code, data, ms = _post("/es-ai/decision/reject", esai)
        print(f"\n    ┌─ {label}")
        _v("Mode", data.get("mode"), 6)
        _v("Decision", data.get("prediction", {}).get("decision"), 6)
        _v("Confidence", data.get("prediction", {}).get("confidence"), 6)
        _v("Claim Status", data.get("claim", {}).get("status"), 6)
        ok = code == 200 and data.get("mode") == "reject"
        _record(f"decision/reject [{label}]", ok, ms)


def test_decision_fraud():
    _header("ENDPOINT 9/11: POST /es-ai/decision/fraud (5 tests)")
    for label, payload in SCENARIOS:
        esai = _wrap_esai(payload)
        code, data, ms = _post("/es-ai/decision/fraud", esai)
        print(f"\n    ┌─ {label}")
        _v("Mode", data.get("mode"), 6)
        _v("Fraud Score", data.get("prediction", {}).get("fraudScore"), 6)
        _v("Fraud Flag", data.get("prediction", {}).get("fraudFlag"), 6)
        _v("Claim", data.get("claim"), 6)
        ok = code == 200 and data.get("mode") == "fraud"
        _record(f"decision/fraud [{label}]", ok, ms)


def test_data_quality():
    _header("ENDPOINT 10/11: POST /es-ai/data-quality (5 tests)")
    for label, payload in DQ_INPUTS:
        code, data, ms = _post("/es-ai/data-quality", payload)
        print(f"\n    ┌─ {label}")
        dq = data.get("dataQuality", {})
        _v("Score", dq.get("score"), 6)
        _v("Grade", dq.get("grade"), 6)
        _v("Missing", dq.get("missing", []), 6)
        ok = code == 200 and "dataQuality" in data
        _record(f"data-quality [{label}]", ok, ms)


def test_hallucination():
    _header("ENDPOINT 11/11: POST /es-ai/hallucination-check (5 tests)")
    for label, payload in HC_INPUTS:
        code, data, ms = _post("/es-ai/hallucination-check", payload)
        print(f"\n    ┌─ {label}")
        h = data.get("hallucination", {})
        _v("Risk", h.get("risk"), 6)
        _v("Score", h.get("score"), 6)
        _v("Flags", h.get("flags", []), 6)
        _v("Action", h.get("recommendedAction"), 6)
        ok = code == 200 and "hallucination" in data
        _record(f"hallucination [{label}]", ok, ms)


def print_summary():
    passed = sum(1 for r in results if r["passed"])
    failed = sum(1 for r in results if not r["passed"])
    total = len(results)
    total_ms = sum(r["ms"] for r in results)

    print(f"\n{'═'*72}")
    print(f"  {'FINAL TEST RESULTS':^68}")
    print(f"{'═'*72}\n")

    # Group by endpoint
    groups = {}
    for r in results:
        base = r["name"].split("[")[0].strip()
        if base not in groups:
            groups[base] = {"p": 0, "f": 0, "ms": 0}
        groups[base]["ms"] += r["ms"]
        if r["passed"]:
            groups[base]["p"] += 1
        else:
            groups[base]["f"] += 1

    print(f"  {'Endpoint':<45s} {'Pass':>4s} {'Fail':>4s} {'Avg':>6s}")
    print(f"  {'─'*62}")
    for ep, s in groups.items():
        cnt = s["p"] + s["f"]
        avg = s["ms"] / max(cnt, 1)
        icon = "✅" if s["f"] == 0 else "❌"
        print(f"  {icon} {ep:<43s} {s['p']:>4d} {s['f']:>4d} {avg:>5.0f}ms")

    print(f"  {'─'*62}")
    print(f"  {'TOTAL':<45s} {passed:>4d} {failed:>4d} {total_ms/max(total,1):>5.0f}ms\n")

    failed_list = [r for r in results if not r["passed"]]
    if failed_list:
        print(f"  ❌ Failed Tests:")
        for r in failed_list:
            print(f"     - {r['name']}")
        print()

    if failed == 0:
        print(f"  🎉 ALL {total} TESTS PASSED! ({total_ms}ms total)")
    else:
        print(f"  ⚠ {failed}/{total} TESTS FAILED")
    print(f"{'═'*72}\n")


def main():
    print()
    print(f"{'═'*72}")
    print(f"  {'GuideWire ES-AI — Comprehensive Endpoint Test Suite':^68}")
    print(f"{'═'*72}")
    print(f"  Server     : {BASE}")
    print(f"  Endpoints  : 11")
    print(f"  Tests/each : 5")
    print(f"  Total tests: 55")
    print(f"{'═'*72}")

    # Check server is running
    print(f"\n  Checking server connectivity...", end=" ", flush=True)
    try:
        r = http_requests.get(f"{BASE}/health", timeout=3)
        if r.status_code == 200:
            print(f"✅ Server is running")
        else:
            print(f"⚠ Server returned {r.status_code}")
    except Exception:
        print(f"❌ Cannot connect to {BASE}")
        print(f"\n  Please start the server first:")
        print(f"    python scripts/run_server.py\n")
        return

    test_health()
    test_v1_health()
    test_acceptance()
    test_rejection()
    test_fraud()
    test_predict()
    test_decision_accept()
    test_decision_reject()
    test_decision_fraud()
    test_data_quality()
    test_hallucination()
    print_summary()


if __name__ == "__main__":
    main()
