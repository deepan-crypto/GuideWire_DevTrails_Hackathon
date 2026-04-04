import os
import random
import requests
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["Legacy Oracle"])
OWM_KEY = os.getenv("OWM_API_KEY", "YOUR_OPENWEATHER_KEY")

@router.get("/pricing/forecast-quote")
def get_forecast_quote(zone: str):
    return {
        "zone": zone,
        "risk_multiplier": 1.0,
        "weather_snapshot": {
            "max_temp": 30.0,
            "max_rain": 0.0,
            "max_humidity": 50.0,
            "max_wind": 10.0,
        },
        "plans": {
            "basic": {"premium": 25.0, "daily_payout": 300},
            "standard": {"premium": 50.0, "daily_payout": 500},
            "pro": {"premium": 100.0, "daily_payout": 1000},
        }
    }

@router.get("/pricing/quote")
def get_live_quote(zone: str):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={zone}&appid={OWM_KEY}&units=metric"
    t, r, h, w, aqi = 30.0, 0.0, 50.0, 10.0, 150
    try:
        res = requests.get(url, timeout=3)
        if res.status_code == 200:
            data = res.json()
            t = data.get('main', {}).get('temp', 30.0)
            r = data.get('rain', {}).get('1h', 0.0)
            h = data.get('main', {}).get('humidity', 50.0)
            w = data.get('wind', {}).get('speed', 2.7) * 3.6
    except Exception:
        pass

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
        "thresholds": {"heat": 42.0, "rain": 50.0, "humidity": 90.0, "wind": 80.0, "aqi": 400}
    }

@router.get("/oracle/market-health/{city}")
def get_market_health(city: str):
    seed = hash(city + datetime.utcnow().strftime("%Y-%m-%d-%H")) % 100
    is_crash = seed < 5
    crash_detected = is_crash
    overall_drop = 80.0 if crash_detected else 0.0

    return {
        "city": city,
        "timestamp": datetime.utcnow().isoformat(),
        "overall_order_volume_drop_pct": overall_drop,
        "crash_detected": crash_detected,
        "solvency_protocol_triggered": crash_detected,
        "action": "LOCK_PRO_STANDARD_TIERS" if crash_detected else "NONE",
        "platforms": [],
        "recommendation": "Mock legacy engine"
    }

@router.get("/oracle/platform-status/{zone_id}")
def get_platform_status(zone_id: str):
    seed = hash(zone_id + datetime.utcnow().strftime("%Y-%m-%d")) % 100
    is_disrupted = seed < 40  # 40% of zones disrupted
    return {
        "zone_id": zone_id,
        "timestamp": datetime.utcnow().isoformat(),
        "platform_data": {},
        "disruption_confirmed": is_disrupted,
        "order_volume_drop_pct": 80.0 if is_disrupted else 0,
    }
