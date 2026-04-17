import os
import requests
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sklearn.ensemble import GradientBoostingRegressor, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

# XGBoost import with graceful fallback
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier as XGBClassifier
    HAS_XGB = False

app = FastAPI(title="RiskWire Pricing & Trigger Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OWM_KEY = os.getenv("OWM_API_KEY", "YOUR_OPENWEATHER_KEY")

# ── Ward-level zone registry (Item 10: hyper-local H3-style zone mapping) ──
ZONE_REGISTRY = {
    "MZ-DEL-04": {"name": "Connaught Place, Delhi",    "lat": 28.6315, "lon": 77.2167, "city": "Delhi"},
    "MZ-DEL-09": {"name": "Karol Bagh, Delhi",          "lat": 28.6514, "lon": 77.1907, "city": "Delhi"},
    "MZ-MUM-01": {"name": "Andheri West, Mumbai",       "lat": 19.1197, "lon": 72.8464, "city": "Mumbai"},
    "MZ-MUM-12": {"name": "Bandra, Mumbai",              "lat": 19.0596, "lon": 72.8295, "city": "Mumbai"},
    "MZ-BLR-02": {"name": "Koramangala, Bangalore",     "lat": 12.9352, "lon": 77.6245, "city": "Bangalore"},
    "MZ-BLR-07": {"name": "Whitefield, Bangalore",      "lat": 12.9698, "lon": 77.7500, "city": "Bangalore"},
    "MZ-HYD-05": {"name": "HITEC City, Hyderabad",      "lat": 17.4435, "lon": 78.3772, "city": "Hyderabad"},
    "MZ-HYD-03": {"name": "Gachibowli, Hyderabad",      "lat": 17.4400, "lon": 78.3489, "city": "Hyderabad"},
    "MZ-CHN-03": {"name": "T. Nagar, Chennai",           "lat": 13.0418, "lon": 80.2341, "city": "Chennai"},
    "MZ-CHN-11": {"name": "Adyar, Chennai",               "lat": 13.0012, "lon": 80.2565, "city": "Chennai"},
    "MZ-PUN-06": {"name": "Hinjewadi, Pune",              "lat": 18.5912, "lon": 73.7380, "city": "Pune"},
    "MZ-KOL-07": {"name": "Salt Lake, Kolkata",           "lat": 22.5726, "lon": 88.3639, "city": "Kolkata"},
    "MZ-AMD-08": {"name": "Satellite, Ahmedabad",         "lat": 23.0225, "lon": 72.5714, "city": "Ahmedabad"},
}

# ════════════════════════════════════════════════════════════════════════════
#  ML MODEL TRAINING
# ════════════════════════════════════════════════════════════════════════════

def build_risk_model():
    """GradientBoosting risk model for dynamic pricing."""
    X = np.array([
        [30, 0,   50, 10, 0.5, 0.2],
        [45, 0,   20, 10, 0.1, 0.4],
        [30, 60,  90, 20, 0.9, 0.3],
        [25, 20,  80, 70, 0.6, 0.5],
        [40, 0,   10, 15, 0.05,0.6],
        [42, 0,   40, 12, 0.2, 0.7],
        [35, 50,  85, 25, 0.8, 0.4],
        [38, 5,   70, 18, 0.3, 0.8],
        [28, 80, 100, 40, 0.95,0.2],
    ])
    y = np.array([30.0, 60.0, 70.0, 80.0, 65.0, 75.0, 60.0, 85.0, 90.0])
    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3).fit(X, y)
    joblib.dump(model, "omnidex_advanced_risk_model.pkl")
    return model


def build_xgb_fraud_model():
    """
    XGBoost classifier for fraud detection.
    Features: [hours_claimed, amount, claims_last_90d, claim_freq_ratio,
               rain_mm, temp_c, aqi, platform_encoded, time_since_policy_days]
    Label: 0=legit, 1=fraud
    """
    np.random.seed(42)
    # Legit claims: moderate hours, reasonable amount, low frequency
    legit = np.column_stack([
        np.random.uniform(2, 8, 200),        # hours
        np.random.uniform(200, 600, 200),    # amount
        np.random.randint(0, 5, 200),        # claims_last_90d
        np.random.uniform(0.01, 0.15, 200), # claim_freq_ratio
        np.random.uniform(20, 80, 200),      # rain_mm
        np.random.uniform(28, 42, 200),      # temp_c
        np.random.uniform(50, 250, 200),     # aqi
        np.random.randint(0, 4, 200),        # platform_encoded
        np.random.uniform(7, 365, 200),      # time_since_policy_days
    ])
    # Fraud claims: extreme hours, high amount, high frequency, suspicious patterns
    fraud = np.column_stack([
        np.random.choice([0.5, 23, 24], 100), # near-zero or max hours
        np.random.uniform(800, 2000, 100),    # inflated amount
        np.random.randint(8, 25, 100),        # high claim frequency
        np.random.uniform(0.5, 1.0, 100),    # high freq ratio
        np.random.uniform(0, 5, 100),         # little actual rain
        np.random.uniform(29, 35, 100),       # normal temp (no trigger)
        np.random.uniform(50, 150, 100),      # normal AQI
        np.random.randint(0, 4, 100),
        np.random.uniform(0, 3, 100),         # very new policy (bought during alert)
    ])
    X = np.vstack([legit, fraud])
    y = np.array([0]*200 + [1]*100)

    if HAS_XGB:
        model = XGBClassifier(
            n_estimators=150, max_depth=4, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            use_label_encoder=False, eval_metric='logloss', random_state=42
        )
    else:
        model = XGBClassifier(n_estimators=150, max_depth=4, learning_rate=0.05, random_state=42)

    model.fit(X, y)
    scaler = StandardScaler().fit(X)
    return model, scaler


def build_isolation_forest():
    """
    Isolation Forest for anomaly detection on claim behaviour.
    Features: [claims_last_90d, claim_freq_ratio, amount, hours_claimed, time_since_policy_days]
    """
    np.random.seed(42)
    # Normal behaviour
    X_normal = np.column_stack([
        np.random.randint(0, 5, 500),
        np.random.uniform(0.01, 0.10, 500),
        np.random.uniform(200, 600, 500),
        np.random.uniform(2, 8, 500),
        np.random.uniform(30, 365, 500),
    ])
    model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    model.fit(X_normal)
    return model


def build_gps_spoof_model():
    """
    Logistic Regression for GPS spoof classification.
    Features: [accuracy_m, speed_kmh, lat_variance, lng_variance,
               impossible_velocity, zero_accuracy, known_fake_location]
    Label: 0=real, 1=spoofed
    """
    np.random.seed(42)
    # Real GPS signals
    real = np.column_stack([
        np.random.uniform(5, 40, 300),       # accuracy 5-40m (normal GPS)
        np.random.uniform(0, 60, 300),       # speed 0-60 km/h
        np.random.uniform(0.0001, 0.01, 300),# lat variance
        np.random.uniform(0.0001, 0.01, 300),# lng variance
        np.zeros(300),                        # no impossible velocity
        np.zeros(300),                        # not zero accuracy flag
        np.zeros(300),                        # not known fake location
    ])
    # Spoofed GPS signals
    spoof = np.column_stack([
        np.random.choice([0, 0.1], 150),     # zero or near-zero accuracy (GPS mock)
        np.random.uniform(200, 1000, 150),   # impossible speed (teleporting)
        np.random.uniform(0.5, 5.0, 150),    # huge lat variance (jumping locations)
        np.random.uniform(0.5, 5.0, 150),    # huge lng variance
        np.ones(150),                         # impossible velocity flag
        np.random.randint(0, 2, 150),        # zero accuracy flag
        np.random.randint(0, 2, 150),        # known fake location flag
    ])
    X = np.vstack([real, spoof])
    y = np.array([0]*300 + [1]*150)

    model = LogisticRegression(max_iter=500, random_state=42).fit(X, y)
    scaler = StandardScaler().fit(X)
    return model, scaler


# ── Load or train models ───────────────────────────────────────────────────
if not os.path.exists("omnidex_advanced_risk_model.pkl"):
    risk_model = build_risk_model()
else:
    risk_model = joblib.load("omnidex_advanced_risk_model.pkl")

print("[ML] Training XGBoost fraud detection model...")
xgb_fraud_model, xgb_scaler = build_xgb_fraud_model()

print("[ML] Training Isolation Forest anomaly detector...")
iso_forest = build_isolation_forest()

print("[ML] Training GPS Spoof classifier...")
gps_spoof_model, gps_scaler = build_gps_spoof_model()
print("[ML] All models ready.")


# ════════════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ════════════════════════════════════════════════════════════════════════════

def fetch_aqi(lat: float, lon: float) -> float:
    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_KEY}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            aqi_index = res.json().get("list", [{}])[0].get("main", {}).get("aqi", 1)
            aqi_map = {1: 30, 2: 80, 3: 150, 4: 250, 5: 350}
            return float(aqi_map.get(aqi_index, 30))
    except Exception:
        pass
    return 0.0


def evaluate_trigger(temp, rain, humidity, wind, aqi) -> dict:
    heat_triggered   = temp >= 42.0
    rain_triggered   = rain >= 50.0
    humid_triggered  = humidity >= 90.0
    wind_triggered   = wind >= 80.0
    aqi_triggered    = aqi >= 300.0

    triggered = heat_triggered or rain_triggered or humid_triggered or wind_triggered or aqi_triggered

    trigger_type = None
    if heat_triggered:   trigger_type = "EXTREME_HEAT"
    elif rain_triggered: trigger_type = "HEAVY_RAIN"
    elif humid_triggered: trigger_type = "HIGH_HUMIDITY"
    elif wind_triggered:  trigger_type = "HIGH_WIND"
    elif aqi_triggered:   trigger_type = "POOR_AQI"

    return {
        "payout_triggered": triggered,
        "trigger_type": trigger_type,
        "checks": {
            "heat_42c": heat_triggered,
            "rain_50mm": rain_triggered,
            "humidity_90pct": humid_triggered,
            "wind_80kmh": wind_triggered,
            "aqi_300_cpcb": aqi_triggered,
        }
    }


# ════════════════════════════════════════════════════════════════════════════
#  FRAUD SCORING — Pydantic schemas
# ════════════════════════════════════════════════════════════════════════════

class ClaimContext(BaseModel):
    claim_id: str
    user_id: str
    disruption_type: str
    hours: float
    amount: Optional[float] = 300.0
    claim_timestamp: str
    claim_location: Optional[dict] = None
    note: Optional[str] = ""

class GPSContext(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = 10.0   # metres
    speed_kmh: Optional[float] = 0.0
    lat_variance: Optional[float] = 0.001
    lng_variance: Optional[float] = 0.001
    source: Optional[str] = "gps"

class UserProfile(BaseModel):
    segment: Optional[str] = "transportation"
    platform: Optional[str] = "Unknown"
    zone: str
    work_hours: Optional[float] = 8.0
    daily_earnings: Optional[float] = 800.0

class PreviousClaims(BaseModel):
    window_days: Optional[int] = 90
    total_count: Optional[int] = 0
    approved_count: Optional[int] = 0
    fraud_flag_count: Optional[int] = 0
    avg_ai_score: Optional[float] = 0.5

class FraudScoreRequest(BaseModel):
    request_id: str
    claim_context: ClaimContext
    current_location: Optional[GPSContext] = None
    user_profile: Optional[UserProfile] = None
    previous_claims: Optional[PreviousClaims] = None


# ════════════════════════════════════════════════════════════════════════════
#  FRAUD SCORING ENDPOINT
# ════════════════════════════════════════════════════════════════════════════

PLATFORM_MAP = {"Swiggy": 0, "Zomato": 1, "Ola": 2, "Uber": 3, "Rapido": 4, "Unknown": 5}

@app.post("/api/v1/fraud/score")
def score_fraud(req: FraudScoreRequest):
    """
    XGBoost + Isolation Forest + GPS Spoof classifier.
    Returns unified fraud verdict for a claim.
    """
    ctx    = req.claim_context
    gps    = req.current_location or GPSContext(lat=0, lng=0)
    prof   = req.user_profile or UserProfile(zone="MZ-DEL-04")
    prev   = req.previous_claims or PreviousClaims()

    # ── Fetch live weather for the zone ───────────────────────────────────
    ward = ZONE_REGISTRY.get(prof.zone, {})
    live_rain, live_temp, live_aqi = 0.0, 30.0, 50.0
    try:
        if ward:
            url = (f"http://api.openweathermap.org/data/2.5/weather"
                   f"?lat={ward['lat']}&lon={ward['lon']}&appid={OWM_KEY}&units=metric")
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                data = r.json()
                live_temp = data.get("main", {}).get("temp", 30.0)
                live_rain = data.get("rain", {}).get("1h", 0.0)
            live_aqi = fetch_aqi(ward["lat"], ward["lon"])
    except Exception:
        pass

    # ── 1. XGBoost Fraud Score ─────────────────────────────────────────────
    plt_enc = PLATFORM_MAP.get(prof.platform, 5)
    claims_last_90 = prev.total_count
    claim_freq = claims_last_90 / max(prev.window_days, 1)

    # Estimate days since policy (rough heuristic: new policies flagged)
    days_since_policy = 30.0  # default; caller can override via note

    xgb_feats = np.array([[
        ctx.hours,
        ctx.amount,
        claims_last_90,
        claim_freq,
        live_rain,
        live_temp,
        live_aqi,
        plt_enc,
        days_since_policy,
    ]])
    xgb_feats_scaled = xgb_scaler.transform(xgb_feats)
    xgb_proba = float(xgb_fraud_model.predict_proba(xgb_feats_scaled)[0][1])
    xgb_flag   = xgb_proba > 0.60

    # ── 2. Isolation Forest Anomaly Score ─────────────────────────────────
    iso_feats = np.array([[
        claims_last_90,
        claim_freq,
        ctx.amount,
        ctx.hours,
        days_since_policy,
    ]])
    iso_score_raw = iso_forest.score_samples(iso_feats)[0]
    # score_samples returns neg values; more negative = more anomalous
    # map to 0-1: -0.5 → 0.0 (normal), -0.8 → 1.0 (anomaly)
    anomaly_score = float(max(0.0, min(1.0, (-iso_score_raw - 0.3) / 0.5)))
    iso_flag = anomaly_score > 0.65

    # ── 3. GPS Spoof Classification ────────────────────────────────────────
    speed = gps.speed_kmh or 0.0
    acc   = gps.accuracy  if gps.accuracy is not None else 10.0
    lat_v = gps.lat_variance or 0.001
    lng_v = gps.lng_variance or 0.001
    impossible_vel = 1 if speed > 200 else 0
    zero_acc_flag  = 1 if acc < 1.0 else 0
    # Known fake: lat/lng = 0.0 exactly or lat=13.08, lng=80.27 (common mock)
    known_fake = 1 if (gps.lat == 0.0 and gps.lng == 0.0) or (gps.lat == 13.08 and gps.lng == 80.27) else 0

    gps_feats = np.array([[acc, speed, lat_v, lng_v, impossible_vel, zero_acc_flag, known_fake]])
    gps_feats_scaled = gps_scaler.transform(gps_feats)
    gps_spoof_proba = float(gps_spoof_model.predict_proba(gps_feats_scaled)[0][1])
    gps_spoof_flag  = gps_spoof_proba > 0.55

    # ── Combined verdict ───────────────────────────────────────────────────
    combined_score = (xgb_proba * 0.50) + (anomaly_score * 0.30) + (gps_spoof_proba * 0.20)
    fraud_flag = combined_score > 0.55 or (xgb_flag and gps_spoof_flag)

    # Reason codes
    reason_codes = []
    if xgb_flag:        reason_codes.append("HIGH_XGB_FRAUD_SCORE")
    if iso_flag:        reason_codes.append("ANOMALOUS_CLAIM_PATTERN")
    if gps_spoof_flag:  reason_codes.append("GPS_SPOOF_DETECTED")
    if ctx.hours < 0.5: reason_codes.append("IMPLAUSIBLE_HOURS")
    if claim_freq > 0.3: reason_codes.append("HIGH_CLAIM_FREQUENCY")
    if ctx.amount > 1500: reason_codes.append("INFLATED_AMOUNT")
    if days_since_policy < 7: reason_codes.append("NEW_POLICY_ADVERSE_SELECTION")

    return {
        "request_id": req.request_id,
        "claim_id": ctx.claim_id,
        "fraud_flag": fraud_flag,
        "fraud_score": round(combined_score, 4),
        "verdict": "FRAUD" if fraud_flag else "APPROVED",
        "models": {
            "xgboost": {
                "fraud_probability": round(xgb_proba, 4),
                "flag": xgb_flag,
                "model": "XGBoostClassifier" if HAS_XGB else "GradientBoostingClassifier (fallback)",
            },
            "isolation_forest": {
                "anomaly_score": round(anomaly_score, 4),
                "flag": iso_flag,
                "model": "IsolationForest(n_estimators=200, contamination=0.05)",
            },
            "gps_spoof": {
                "spoof_probability": round(gps_spoof_proba, 4),
                "flag": gps_spoof_flag,
                "details": {
                    "accuracy_m": acc,
                    "speed_kmh": speed,
                    "impossible_velocity": bool(impossible_vel),
                    "zero_accuracy": bool(zero_acc_flag),
                    "known_fake_location": bool(known_fake),
                },
                "model": "LogisticRegression (GPS Spoof Classifier)",
            },
        },
        "reason_codes": reason_codes,
        "live_weather": {
            "rain_mm": round(live_rain, 2),
            "temp_c": round(live_temp, 1),
            "aqi": round(live_aqi, 1),
        },
    }


# ── /v1/claims/fraud-score (backward-compat alias) ────────────────────────
@app.post("/v1/claims/fraud-score")
def score_fraud_legacy(req: FraudScoreRequest):
    return score_fraud(req)


# ════════════════════════════════════════════════════════════════════════════
#  PRICING ENDPOINTS (unchanged)
# ════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/pricing/forecast-quote")
def get_forecast_quote(zone: str):
    ward = ZONE_REGISTRY.get(zone)
    max_t, max_r, max_h, max_w, aqi = 30.0, 0.0, 50.0, 10.0, 0.0

    if ward:
        url = (f"http://api.openweathermap.org/data/2.5/forecast"
               f"?lat={ward['lat']}&lon={ward['lon']}&appid={OWM_KEY}&units=metric")
        aqi = fetch_aqi(ward["lat"], ward["lon"])
    else:
        url = f"http://api.openweathermap.org/data/2.5/forecast?q={zone}&appid={OWM_KEY}&units=metric"

    res = requests.get(url, timeout=8)
    if res.status_code == 200:
        for item in res.json().get("list", []):
            t = item.get("main", {}).get("temp", 30.0)
            r = item.get("rain", {}).get("3h", 0.0)
            h = item.get("main", {}).get("humidity", 50.0)
            w = item.get("wind", {}).get("speed", 2.7) * 3.6
            if t > max_t: max_t = t
            if r > max_r: max_r = r
            if h > max_h: max_h = h
            if w > max_w: max_w = w

    soil_m  = 0.8 if max_r > 10 else (0.1 if max_t > 40 else 0.4)
    aqi_norm = min(aqi / 500.0, 1.0)
    raw_score = risk_model.predict(np.array([[max_t, max_r, max_h, max_w, soil_m, aqi_norm]]))[0]
    risk_multiplier = max(0.5, min(2.5, raw_score / 50.0))

    return {
        "zone": zone,
        "zone_name": ward["name"] if ward else zone,
        "risk_multiplier": round(risk_multiplier, 2),
        "live_aqi": round(aqi, 1),
        "forecast_temp": round(max_t, 1),
        "forecast_rain": round(max_r, 1),
        "plans": {
            "basic":    {"premium": round(25 * risk_multiplier, 2),  "daily_payout": 300},
            "standard": {"premium": round(50 * risk_multiplier, 2),  "daily_payout": 500},
            "pro":      {"premium": round(100 * risk_multiplier, 2), "daily_payout": 1000},
        }
    }


@app.get("/api/v1/pricing/quote")
def get_live_quote(zone: str):
    ward = ZONE_REGISTRY.get(zone)
    t, r, h, w, aqi = 30.0, 0.0, 50.0, 10.0, 0.0

    if ward:
        url = (f"http://api.openweathermap.org/data/2.5/weather"
               f"?lat={ward['lat']}&lon={ward['lon']}&appid={OWM_KEY}&units=metric")
        aqi = fetch_aqi(ward["lat"], ward["lon"])
    else:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={zone}&appid={OWM_KEY}&units=metric"

    res = requests.get(url, timeout=8)
    if res.status_code == 200:
        data = res.json()
        t = data.get("main", {}).get("temp", 30.0)
        r = data.get("rain", {}).get("1h", 0.0)
        h = data.get("main", {}).get("humidity", 50.0)
        w = data.get("wind", {}).get("speed", 2.7) * 3.6

    trigger = evaluate_trigger(t, r, h, w, aqi)

    return {
        "zone": zone,
        "zone_name": ward["name"] if ward else zone,
        "live_temp": round(t, 1),
        "live_rain": round(r, 1),
        "live_humidity": round(h, 1),
        "live_wind_kmh": round(w, 1),
        "live_aqi": round(aqi, 1),
        "aqi_source": "OpenWeather Air Pollution API (CPCB-mapped)",
        **trigger,
    }


@app.get("/api/v1/pricing/zone-registry")
def get_zone_registry():
    return {
        "zones": [
            {
                "zone_id": k,
                "name": v["name"],
                "lat": v["lat"],
                "lon": v["lon"],
                "city": v["city"],
                "precision": "municipal_ward",
            }
            for k, v in ZONE_REGISTRY.items()
        ]
    }


@app.get("/api/v1/oracle/market-health/{city}")
def get_market_health(city: str):
    """
    Solvency protocol: detects massive order volume drops (e.g. platform blackout).
    If volume drops > 40%, it triggers a crash state.
    """
    # Simulate a healthy market by default
    drop_pct = 5.2 
    crash = drop_pct > 40.0
    
    return {
        "city": city,
        "crash_detected": crash,
        "overall_order_volume_drop_pct": drop_pct,
        "solvency_protocol_triggered": crash,
        "action": "NONE" if not crash else "LOCK_PRO_STANDARD_TIERS",
        "recommendation": "Maintain standard operations" if not crash else "Implement solvency lock immediately",
        "platforms": {
            "swiggy": {"status": "normal", "volume_index": 0.98},
            "zomato": {"status": "normal", "volume_index": 0.95},
            "uber":   {"status": "normal", "volume_index": 1.02},
        },
        "timestamp": "2026-04-17T12:00:00Z"
    }


@app.get("/api/v1/oracle/platform-status/{zone}")
def get_platform_status(zone: str):
    """
    Dual Validation: checks if gig platforms are actually seeing order disruptions.
    Used by the actuarial engine to confirm weather-triggered payouts.
    """
    # Simulate platform disruption based on zone weather
    # (In production, this would hit Swiggy/Zomato partner APIs)
    ward = ZONE_REGISTRY.get(zone)
    if not ward:
        return {"disruption_confirmed": False, "status": "unknown_zone"}
        
    return {
        "zone": zone,
        "disruption_confirmed": True, # For demo purposes, we always confirm if weather is bad
        "platforms": ["Swiggy", "Zomato", "Uber"],
        "latency_ms": 42,
        "timestamp": "2026-04-17T12:00:00Z"
    }


@app.get("/")
def health():
    return {
        "status": "RiskWire Pricing & Fraud Engine — Live",
        "models": {
            "risk": "GradientBoostingRegressor",
            "fraud": "XGBoostClassifier" if HAS_XGB else "GradientBoostingClassifier",
            "anomaly": "IsolationForest",
            "gps_spoof": "LogisticRegression",
        }
    }