import os
import random
import time
import requests
import joblib
import numpy as np
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List
from sklearn.ensemble import GradientBoostingRegressor, IsolationForest
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RiskWire ML Oracle", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OWM_KEY = os.getenv("OWM_API_KEY", "YOUR_OPENWEATHER_KEY")

# ══════════════════════════════════════════════════════════════════════════════
# ENGINE A: Dynamic Premium Pricing (Gradient Boosting Regressor)
# ══════════════════════════════════════════════════════════════════════════════

def train_and_save_pricing_model():
    """Train Gradient Boosting model for risk multiplier prediction.
    Features: [max_temp, max_rain, max_humidity, max_wind, soil_moisture]
    Target: risk score (0-100)"""
    X = np.array([
        [30, 0,  50, 10, 0.5],   # mild weather
        [45, 0,  20, 10, 0.1],   # extreme heat
        [30, 60, 90, 20, 0.9],   # heavy rain
        [25, 20, 80, 70, 0.6],   # windy + humid
        [40, 0,  10, 15, 0.05],  # dry heat
        [42, 0,  40, 12, 0.2],   # severe heat
        [35, 50, 85, 25, 0.8],   # rain + humid
        [28, 5,  60, 8,  0.4],   # normal
        [38, 30, 75, 18, 0.7],   # moderate risk
        [44, 0,  25, 14, 0.1],   # extreme heat
        [32, 80, 95, 30, 0.95],  # severe rain
        [26, 10, 55, 6,  0.3],   # low risk
    ])
    y = np.array([30.0, 60.0, 70.0, 80.0, 65.0, 75.0, 60.0, 25.0, 55.0, 78.0, 85.0, 20.0])
    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3).fit(X, y)
    joblib.dump(model, "omnidex_advanced_risk_model.pkl")

if not os.path.exists("omnidex_advanced_risk_model.pkl"):
    train_and_save_pricing_model()
risk_model = joblib.load("omnidex_advanced_risk_model.pkl")

# ══════════════════════════════════════════════════════════════════════════════
# ENGINE B: Zero-Trust Fraud Defense (Isolation Forest)
# ══════════════════════════════════════════════════════════════════════════════

def train_and_save_fraud_model():
    """Train Isolation Forest for anomaly detection on device telemetry.
    Features: [gps_lat, gps_lon, network_rtt_ms, device_speed, altitude, is_mock_int, asn_datacenter_int]
    Genuine riders produce dense clusters; fraudsters are isolated anomalies."""
    np.random.seed(42)
    n_legit = 200
    # Legitimate riders: real GPS, low RTT, real speed, real altitude, no mock, mobile network
    legit = np.column_stack([
        np.random.normal(13.08, 0.05, n_legit),    # gps_lat (Chennai area)
        np.random.normal(80.27, 0.05, n_legit),     # gps_lon
        np.random.normal(35, 10, n_legit),           # rtt_ms (normal mobile)
        np.random.uniform(0, 40, n_legit),           # speed km/h
        np.random.normal(15, 5, n_legit),            # altitude
        np.zeros(n_legit),                           # is_mock = 0
        np.zeros(n_legit),                           # asn_datacenter = 0
    ])
    # Fraudulent patterns (injected for training envelope)
    n_fraud = 20
    fraud = np.column_stack([
        np.random.normal(13.08, 0.01, n_fraud),     # suspiciously precise GPS
        np.random.normal(80.27, 0.01, n_fraud),
        np.random.normal(250, 50, n_fraud),          # VPN high RTT
        np.zeros(n_fraud),                           # speed exactly 0
        np.zeros(n_fraud),                           # altitude exactly 0
        np.ones(n_fraud),                            # mock flag
        np.ones(n_fraud),                            # datacenter ASN
    ])
    X = np.vstack([legit, fraud])
    model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42).fit(X)
    joblib.dump(model, "fraud_isolation_forest.pkl")

if not os.path.exists("fraud_isolation_forest.pkl"):
    train_and_save_fraud_model()
fraud_model = joblib.load("fraud_isolation_forest.pkl")

# ══════════════════════════════════════════════════════════════════════════════
# MOCK DATA: Aggregator Platform Simulation (Swiggy/Zomato/Zepto)
# ══════════════════════════════════════════════════════════════════════════════

# Known datacenter ASN providers (VPN detection)
DATACENTER_ASNS = {
    "AS14061", "AS16509", "AS13335", "AS24940", "AS63949",  # DigitalOcean, AWS, Cloudflare, Hetzner, Linode
    "AS212238", "AS9009", "AS20473",  # NordVPN, M247, Vultr
}

# Mock aggregator order volumes (normal baseline)
PLATFORM_BASELINES = {
    "swiggy":  {"normal_orders_per_hour": 1200, "zones": 45},
    "zomato":  {"normal_orders_per_hour": 980,  "zones": 38},
    "zepto":   {"normal_orders_per_hour": 650,  "zones": 22},
}

# BSSID tracking for syndicate detection (in-memory store)
_bssid_claims: dict[str, list] = {}

# ══════════════════════════════════════════════════════════════════════════════
# PRICING ENDPOINTS (Engine A — Called by PolicyCenter)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/pricing/forecast-quote")
def get_forecast_quote(zone: str):
    """Actuarial pricing: 5-day weather forecast → dynamic risk multiplier → plan premiums.
    Called by PolicyCenter before generating a weekly quote."""
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={zone}&appid={OWM_KEY}&units=metric"
    max_t, max_r, max_h, max_w = 30.0, 0.0, 50.0, 10.0
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            for item in data.get('list', []):
                t = item.get('main', {}).get('temp', 30.0)
                r = item.get('rain', {}).get('3h', 0.0)
                h = item.get('main', {}).get('humidity', 50.0)
                w = item.get('wind', {}).get('speed', 2.7) * 3.6  # m/s to km/h
                if t > max_t: max_t = t
                if r > max_r: max_r = r
                if h > max_h: max_h = h
                if w > max_w: max_w = w
    except Exception:
        pass  # Use defaults on API failure

    soil_m = 0.8 if max_r > 10 else (0.1 if max_t > 40 else 0.4)
    raw_ml_score = risk_model.predict(np.array([[max_t, max_r, max_h, max_w, soil_m]]))[0]
    risk_multiplier = raw_ml_score / 50.0
    risk_multiplier = max(0.5, min(2.5, risk_multiplier))

    return {
        "zone": zone,
        "risk_multiplier": round(risk_multiplier, 2),
        "weather_snapshot": {
            "max_temp": round(max_t, 1),
            "max_rain": round(max_r, 1),
            "max_humidity": round(max_h, 1),
            "max_wind": round(max_w, 1),
        },
        "plans": {
            "basic":    {"premium": round(25 * risk_multiplier, 2),  "daily_payout": 300},
            "standard": {"premium": round(50 * risk_multiplier, 2),  "daily_payout": 500},
            "pro":      {"premium": round(100 * risk_multiplier, 2), "daily_payout": 1000},
        }
    }


@app.get("/api/v1/pricing/quote")
def get_live_quote(zone: str):
    """Live weather check: determines if parametric payout should trigger RIGHT NOW.
    Called by ClaimCenter Autopilot every hour."""
    url = f"http://api.openweathermap.org/data/2.5/weather?q={zone}&appid={OWM_KEY}&units=metric"
    t, r, h, w, aqi = 30.0, 0.0, 50.0, 10.0, 150
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            t = data.get('main', {}).get('temp', 30.0)
            r = data.get('rain', {}).get('1h', 0.0)
            h = data.get('main', {}).get('humidity', 50.0)
            w = data.get('wind', {}).get('speed', 2.7) * 3.6
    except Exception:
        pass

    # Parametric trigger thresholds from README: Rain > 50mm/hr, Heat > 42°C, AQI > 400
    trigger_rain = r >= 50.0
    trigger_heat = t >= 42.0
    trigger_humidity = h >= 90.0
    trigger_wind = w >= 80.0
    trigger_payout = trigger_rain or trigger_heat or trigger_humidity or trigger_wind

    trigger_type = None
    if trigger_heat: trigger_type = "HEAT"
    elif trigger_rain: trigger_type = "RAIN"
    elif trigger_humidity: trigger_type = "HUMIDITY"
    elif trigger_wind: trigger_type = "WIND"

    return {
        "zone": zone,
        "live_temp": round(t, 1),
        "live_rain": round(r, 1),
        "live_humidity": round(h, 1),
        "live_wind": round(w, 1),
        "aqi": aqi,
        "payout_triggered": trigger_payout,
        "trigger_type": trigger_type,
        "thresholds": {
            "heat": 42.0,
            "rain": 50.0,
            "humidity": 90.0,
            "wind": 80.0,
            "aqi": 400,
        }
    }


# ══════════════════════════════════════════════════════════════════════════════
# FRAUD DETECTION ENDPOINT (Engine B — Called by ClaimCenter)
# ══════════════════════════════════════════════════════════════════════════════

class ClaimVerifyRequest(BaseModel):
    claim_id: str
    gps_lat: float
    gps_lon: float = 80.27
    is_mock_flag: bool = False
    network_rtt_ms: float = 35.0
    device_speed: float = 5.0
    altitude: float = 15.0
    asn_type: str = "mobile"        # "mobile" | "datacenter"
    bssid: Optional[str] = None     # Wi-Fi MAC address

@app.post("/api/v1/oracle/verify-claim")
def verify_claim(req: ClaimVerifyRequest):
    """Anti-spoofing fraud endpoint. Before Autopilot executes a payout,
    ClaimCenter sends device telemetry here. The Isolation Forest evaluates
    the spatial-network data and returns confidence + fraud flag.

    Multi-layered checks:
    A. OS-Level Mock Detection (Location.isMock())
    B. "Dead Metadata" Traps (speed=0, altitude=0)
    C. ASN Check (datacenter vs telecom)
    D. RTT Latency anomaly (VPN detection)
    E. BSSID Clustering (syndicate detection)
    F. Isolation Forest ML anomaly score
    """
    fraud_reasons = []
    fraud_score = 0.0

    # ── Layer A: Mock Location Detection ──
    if req.is_mock_flag:
        fraud_reasons.append("MOCK_LOCATION_DETECTED")
        fraud_score += 0.4

    # ── Layer B: Dead Metadata Traps ──
    if req.device_speed == 0.0 and req.altitude == 0.0:
        fraud_reasons.append("DEAD_METADATA_SYNTHETIC_GPS")
        fraud_score += 0.3

    # ── Layer C: ASN Datacenter Check ──
    is_datacenter = req.asn_type.lower() == "datacenter"
    if is_datacenter:
        fraud_reasons.append("VPN_DATACENTER_IP_DETECTED")
        fraud_score += 0.3

    # ── Layer D: RTT Latency Anomaly ──
    if req.network_rtt_ms >= 200:
        fraud_reasons.append("RTT_LATENCY_VPN_BOUNCE")
        fraud_score += 0.25

    # ── Layer E: BSSID Clustering ──
    if req.bssid:
        if req.bssid not in _bssid_claims:
            _bssid_claims[req.bssid] = []
        _bssid_claims[req.bssid].append({
            "claim_id": req.claim_id,
            "gps_lat": req.gps_lat,
            "gps_lon": req.gps_lon,
            "time": datetime.utcnow().isoformat()
        })
        # If 5+ claims from same BSSID but different GPS locations → syndicate
        bssid_entries = _bssid_claims[req.bssid]
        if len(bssid_entries) >= 5:
            unique_lats = set(round(e["gps_lat"], 2) for e in bssid_entries)
            if len(unique_lats) >= 3:
                fraud_reasons.append("BSSID_CLUSTER_SYNDICATE_DETECTED")
                fraud_score += 0.35

    # ── Layer F: Isolation Forest ML Score ──
    features = np.array([[
        req.gps_lat,
        req.gps_lon,
        req.network_rtt_ms,
        req.device_speed,
        req.altitude,
        1.0 if req.is_mock_flag else 0.0,
        1.0 if is_datacenter else 0.0,
    ]])
    # Isolation Forest: -1 = anomaly (fraud), 1 = normal
    ml_prediction = fraud_model.predict(features)[0]
    ml_anomaly_score = float(fraud_model.decision_function(features)[0])

    if ml_prediction == -1:
        fraud_reasons.append("ML_ISOLATION_FOREST_ANOMALY")
        fraud_score += 0.3

    # ── Final Verdict ──
    total_fraud_score = min(1.0, fraud_score)
    confidence_score = round(1.0 - total_fraud_score, 3)
    fraud_flag = total_fraud_score >= 0.3

    return {
        "claim_id": req.claim_id,
        "fraud_flag": fraud_flag,
        "confidence_score": confidence_score,
        "fraud_score": round(total_fraud_score, 3),
        "ml_anomaly_score": round(ml_anomaly_score, 4),
        "ml_prediction": "ANOMALY" if ml_prediction == -1 else "NORMAL",
        "fraud_reasons": fraud_reasons,
        "layers_checked": [
            "MOCK_LOCATION_CHECK",
            "DEAD_METADATA_TRAP",
            "ASN_DATACENTER_CHECK",
            "RTT_LATENCY_CHECK",
            "BSSID_CLUSTERING",
            "ISOLATION_FOREST_ML",
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# MARKET CRASH MONITOR (Engine C — Called by GWCP Cron Job)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/oracle/market-health/{city}")
def get_market_health(city: str):
    """Market crash monitor. Aggregates mock Swiggy/Zomato/Zepto order data.
    If order volumes drop >70%, triggers the Dynamic Solvency Protocol.
    Called hourly by a scheduled GWCP cron job."""

    # Simulate platform order volumes with some randomness
    # Most of the time volumes are normal (85-110% of baseline)
    # Occasionally simulate a crash scenario for demo
    seed = hash(city + datetime.utcnow().strftime("%Y-%m-%d-%H")) % 100
    is_crash = seed < 5  # 5% chance of crash per hour per city (for demo)

    platforms = []
    total_baseline = 0
    total_current = 0

    for name, baseline in PLATFORM_BASELINES.items():
        normal_vol = baseline["normal_orders_per_hour"]
        total_baseline += normal_vol

        if is_crash:
            # Simulate crash: 15-30% of normal volume
            current_vol = int(normal_vol * random.uniform(0.15, 0.30))
            status = "CRITICAL"
        else:
            # Normal operation: 75-120% of baseline
            current_vol = int(normal_vol * random.uniform(0.75, 1.20))
            status = "NORMAL" if current_vol >= normal_vol * 0.5 else "DEGRADED"

        total_current += current_vol
        drop_pct = round(max(0, (1 - current_vol / normal_vol)) * 100, 1)

        platforms.append({
            "platform": name,
            "baseline_orders_per_hour": normal_vol,
            "current_orders_per_hour": current_vol,
            "drop_percentage": drop_pct,
            "status": status,
            "active_zones": baseline["zones"] if not is_crash else int(baseline["zones"] * 0.3),
        })

    overall_drop = round(max(0, (1 - total_current / total_baseline)) * 100, 1)
    crash_detected = overall_drop >= 70.0

    return {
        "city": city,
        "timestamp": datetime.utcnow().isoformat(),
        "overall_order_volume_drop_pct": overall_drop,
        "crash_detected": crash_detected,
        "solvency_protocol_triggered": crash_detected,
        "action": "LOCK_PRO_STANDARD_TIERS" if crash_detected else "NONE",
        "platforms": platforms,
        "recommendation": (
            "CRITICAL: Activate Dynamic Solvency Protocol. Lock Pro/Standard tier purchases. "
            "Shift liquidity to Basic survival tier."
            if crash_detected
            else f"Market healthy. Order volumes at {100 - overall_drop:.0f}% capacity."
        )
    }


# ══════════════════════════════════════════════════════════════════════════════
# MOCK DEVICE INTEGRITY (Google Play Integrity API simulation)
# ══════════════════════════════════════════════════════════════════════════════

class DeviceIntegrityRequest(BaseModel):
    package_name: str = "com.riskwire.app"
    nonce: str = ""

@app.post("/api/v1/oracle/validate-device")
def validate_device(req: DeviceIntegrityRequest):
    """Mock Google Play Integrity API. In production, this would verify:
    - Device is genuine (not emulator)
    - App is unmodified (not tampered)
    - User account is legitimate
    Returns hardware-backed cryptographic attestation."""
    return {
        "requestDetails": {
            "requestPackageName": req.package_name,
            "nonce": req.nonce,
            "timestampMillis": int(time.time() * 1000),
        },
        "appIntegrity": {
            "appRecognitionVerdict": "PLAY_RECOGNIZED",
            "packageName": req.package_name,
        },
        "deviceIntegrity": {
            "deviceRecognitionVerdict": ["MEETS_DEVICE_INTEGRITY"],
        },
        "accountDetails": {
            "appLicensingVerdict": "LICENSED",
        },
        "verdict": "PASS",
    }


# ══════════════════════════════════════════════════════════════════════════════
# MOCK AGGREGATOR PLATFORM STATUS (Dual Validation — Layer 2)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/oracle/platform-status/{zone_id}")
def get_platform_status(zone_id: str):
    """Dual validation Layer 2: Check if the Q-commerce platform
    has actually reduced/halted operations in the zone.
    Verifies order volume drop or zone offline status."""

    # Simulate: if zone has weather trigger, platform orders should also drop
    seed = hash(zone_id + datetime.utcnow().strftime("%Y-%m-%d")) % 100
    is_disrupted = seed < 40  # 40% of zones show disruption correlation

    normal_orders_ph = random.randint(80, 200)
    current_orders = int(normal_orders_ph * (0.2 if is_disrupted else random.uniform(0.7, 1.1)))
    drop_pct = round(max(0, (1 - current_orders / normal_orders_ph)) * 100, 1)

    return {
        "zone_id": zone_id,
        "timestamp": datetime.utcnow().isoformat(),
        "platform_data": {
            "swiggy": {
                "zone_online": not is_disrupted,
                "orders_per_hour": current_orders,
                "normal_baseline": normal_orders_ph,
                "drop_pct": drop_pct if is_disrupted else 0,
            },
            "zomato": {
                "zone_online": not is_disrupted or random.random() > 0.5,
                "orders_per_hour": int(current_orders * 0.8),
                "normal_baseline": int(normal_orders_ph * 0.8),
                "drop_pct": drop_pct if is_disrupted else 0,
            },
        },
        "disruption_confirmed": is_disrupted,
        "order_volume_drop_pct": drop_pct if is_disrupted else 0,
    }


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK & HTML TEST PAGE
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return HTMLResponse(open("index.html").read() if os.path.exists("index.html") else "<h2>RiskWire ML Oracle v2.0 — Running</h2>")

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "engines": {
            "pricing": "Gradient Boosting Regressor (scikit-learn)",
            "fraud": "Isolation Forest (scikit-learn)",
            "market": "Mock Aggregator Monitor",
        },
        "endpoints": [
            "GET  /api/v1/pricing/forecast-quote?zone=",
            "GET  /api/v1/pricing/quote?zone=",
            "POST /api/v1/oracle/verify-claim",
            "GET  /api/v1/oracle/market-health/{city}",
            "POST /api/v1/oracle/validate-device",
            "GET  /api/v1/oracle/platform-status/{zone_id}",
        ]
    }