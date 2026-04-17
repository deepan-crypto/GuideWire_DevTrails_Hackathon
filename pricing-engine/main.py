import os
import requests
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import GradientBoostingRegressor

app = FastAPI(title="RiskWire Pricing & Trigger Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OWM_KEY = os.getenv("OWM_API_KEY", "YOUR_OPENWEATHER_KEY")

# ── Ward-level zone registry (Item 10: hyper-local H3-style zone mapping) ──
# Each zone ID maps to lat/lng centroid of the exact municipal ward
ZONE_REGISTRY = {
    "MZ-DEL-04": {"name": "Connaught Place, Delhi",    "lat": 28.6315, "lon": 77.2167, "city": "Delhi"},
    "MZ-DEL-09": {"name": "Karol Bagh, Delhi",          "lat": 28.6514, "lon": 77.1907, "city": "Delhi"},
    "MZ-MUM-12": {"name": "Andheri West, Mumbai",       "lat": 19.1197, "lon": 72.8464, "city": "Mumbai"},
    "MZ-BLR-07": {"name": "Koramangala, Bangalore",     "lat": 12.9352, "lon": 77.6245, "city": "Bangalore"},
    "MZ-HYD-03": {"name": "HITEC City, Hyderabad",      "lat": 17.4435, "lon": 78.3772, "city": "Hyderabad"},
    "MZ-CHN-05": {"name": "T. Nagar, Chennai",          "lat": 13.0418, "lon": 80.2341, "city": "Chennai"},
    "MZ-PUN-02": {"name": "Hinjewadi, Pune",             "lat": 18.5912, "lon": 73.7380, "city": "Pune"},
    "MZ-HYD-08": {"name": "Gachibowli, Hyderabad",      "lat": 17.4400, "lon": 78.3489, "city": "Hyderabad"},
    "MZ-CHN-11": {"name": "Adyar, Chennai",              "lat": 13.0012, "lon": 80.2565, "city": "Chennai"},
}

# ── ML Risk Model ──────────────────────────────────────────────────────────
def train_and_save_model():
    # Features: [temp, rain, humidity, wind_kmh, soil_moisture, aqi_normalized]
    X = np.array([
        [30, 0,   50, 10, 0.5, 0.2],
        [45, 0,   20, 10, 0.1, 0.4],
        [30, 60,  90, 20, 0.9, 0.3],
        [25, 20,  80, 70, 0.6, 0.5],
        [40, 0,   10, 15, 0.05,0.6],
        [42, 0,   40, 12, 0.2, 0.7],
        [35, 50,  85, 25, 0.8, 0.4],
        [38, 5,   70, 18, 0.3, 0.8],  # high AQI scenario
        [28, 80, 100, 40, 0.95,0.2],  # extreme rain
    ])
    y = np.array([30.0, 60.0, 70.0, 80.0, 65.0, 75.0, 60.0, 85.0, 90.0])
    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3).fit(X, y)
    joblib.dump(model, "omnidex_advanced_risk_model.pkl")

if not os.path.exists("omnidex_advanced_risk_model.pkl"):
    train_and_save_model()

risk_model = joblib.load("omnidex_advanced_risk_model.pkl")


def fetch_aqi(lat: float, lon: float) -> float:
    """Fetch live AQI from OpenWeather Air Pollution API. Returns 0-500 AQI."""
    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_KEY}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            # OWM AQI index 1-5; convert to approx AQI 0-500
            aqi_index = data.get("list", [{}])[0].get("main", {}).get("aqi", 1)
            # Map 1-5 → 0,50,100,200,300 (approximate CPCB scale)
            aqi_map = {1: 30, 2: 80, 3: 150, 4: 250, 5: 350}
            return float(aqi_map.get(aqi_index, 30))
    except Exception:
        pass
    return 0.0


# ── Item 1: Dual-trigger: Weather + AQI > 300 (CPCB standard) ─────────────
def evaluate_trigger(temp: float, rain: float, humidity: float, wind: float, aqi: float) -> dict:
    heat_triggered   = temp >= 42.0
    rain_triggered   = rain >= 50.0
    humid_triggered  = humidity >= 90.0
    wind_triggered   = wind >= 80.0
    aqi_triggered    = aqi >= 300.0  # Item 1: AQI > 300 from CPCB API — quantifiable trigger

    triggered = heat_triggered or rain_triggered or humid_triggered or wind_triggered or aqi_triggered

    trigger_type = None
    if heat_triggered:  trigger_type = "EXTREME_HEAT"
    elif rain_triggered: trigger_type = "HEAVY_RAIN"
    elif humid_triggered: trigger_type = "HIGH_HUMIDITY"
    elif wind_triggered: trigger_type = "HIGH_WIND"
    elif aqi_triggered: trigger_type = "POOR_AQI"

    return {
        "payout_triggered": triggered,
        "trigger_type": trigger_type,
        "checks": {
            "heat_42c": heat_triggered,
            "rain_50mm": rain_triggered,
            "humidity_90pct": humid_triggered,
            "wind_80kmh": wind_triggered,
            "aqi_300_cpcb": aqi_triggered,   # Item 1: AQI quantifiable trigger
        }
    }


# ── /api/v1/pricing/forecast-quote  (Item 7: dynamic pricing) ─────────────
@app.get("/api/v1/pricing/forecast-quote")
def get_forecast_quote(zone: str):
    """
    Item 7: Dynamic pricing — premiums algorithmically adjusted by weather forecast risk.
    Item 10: Uses ward-level lat/lng for hyper-local OpenWeather fetch.
    """
    ward = ZONE_REGISTRY.get(zone)
    max_t, max_r, max_h, max_w, aqi = 30.0, 0.0, 50.0, 10.0, 0.0

    if ward:
        # Item 10: fetch weather by exact ward lat/lng (hyper-local basis risk minimization)
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

    soil_m = 0.8 if max_r > 10 else (0.1 if max_t > 40 else 0.4)
    aqi_norm = min(aqi / 500.0, 1.0)  # normalize to 0-1
    raw_score = risk_model.predict(np.array([[max_t, max_r, max_h, max_w, soil_m, aqi_norm]]))[0]

    # Item 7: risk multiplier 0.5x (calm) to 2.5x (peak monsoon / heatwave)
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


# ── /api/v1/pricing/quote  (live trigger check) ────────────────────────────
@app.get("/api/v1/pricing/quote")
def get_live_quote(zone: str):
    """
    Item 1: Trigger check — weather + AQI > 300 (verifiable CPCB standard).
    Item 8: Used by buyPolicy() to enforce adverse selection lockout.
    Item 10: Ward-level lat/lng for hyper-local weather.
    """
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


# ── /api/v1/pricing/zone-registry  (Item 10: ward registry) ───────────────
@app.get("/api/v1/pricing/zone-registry")
def get_zone_registry():
    """Returns all ward-level zone definitions with lat/lng for basis risk audit."""
    return {
        "zones": [
            {
                "zone_id": k,
                "name": v["name"],
                "lat": v["lat"],
                "lon": v["lon"],
                "city": v["city"],
                "precision": "municipal_ward",  # Item 10: hyper-local
            }
            for k, v in ZONE_REGISTRY.items()
        ]
    }