# GuideWire ML Backend

Production-grade FastAPI backend serving GPU-accelerated XGBoost ML models for gig worker insurance claim intelligence. Built for the GuideWire Earning Shield platform.

---

## Overview

This system provides **real-time ML-powered claim adjudication** for gig economy workers (delivery riders, drivers, service providers) who file insurance claims for disruptions like heavy rain, heatwaves, or vehicle breakdowns.

The backend runs **three cascading ML models** — Acceptance, Rejection, and Fraud Detection — that evaluate claims based on 35 engineered features across geospatial, temporal, behavioral, and policy dimensions.

### Key Capabilities

- **Claim Acceptance Scoring** — Probability of approval with payout/hold recommendations
- **Claim Rejection Scoring** — Probability of rejection with confidence reasoning
- **Fraud Detection** — GPS spoofing, impossible movement, and repeat pattern detection
- **Data Quality Assessment** — Input completeness grading (A-F) before model inference
- **Hallucination Detection** — Post-inference sanity checks on model predictions
- **SHAP-based Explainability** — Human-readable reason codes for every decision

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Node.js Backend (Express)                     │
│                  http://localhost:5000/api/ai                     │
└──────────────┬───────────────────────────────────┬───────────────┘
               │  Unified JSON Payload             │
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FastAPI ML Server (this repo)                │
│                      http://localhost:8000                        │
│                                                                  │
│  ┌─────────────┐   ┌─────────────────────────────────────────┐  │
│  │ Data Quality │   │         Feature Extractor (35 features) │  │
│  │  Assessment  │   │   Geo · Temporal · Behavioral · Policy  │  │
│  └─────────────┘   └──────────────┬──────────────────────────┘  │
│                                    │                             │
│                    ┌───────────────┼───────────────┐             │
│                    ▼               ▼               ▼             │
│              ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│              │  Fraud    │   │ Accept   │   │ Reject   │        │
│              │  XGBoost  │   │ XGBoost  │   │ XGBoost  │        │
│              │ (500 est) │   │ (300 est)│   │ (300 est)│        │
│              └─────┬────┘   └─────┬────┘   └────┬─────┘        │
│                    │              │              │               │
│                    ▼              ▼              ▼               │
│              ┌──────────────────────────────────────────┐       │
│              │        Cascading Decision Engine          │       │
│              │    Fraud → Accept → Reject → Pending      │       │
│              └──────────────────────────────────────────┘       │
│                               │                                  │
│                    ┌──────────┼──────────┐                       │
│                    ▼                     ▼                        │
│              ┌───────────┐       ┌──────────────┐               │
│              │  Payout   │       │ Hallucination │               │
│              │ Calculator│       │   Detector    │               │
│              └───────────┘       └──────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

### Decision Pipeline (Cascading Fraud-First)

The system uses a cascading pipeline that mirrors real-world insurance adjudication:

1. **Fraud Check First** — If `fraud_score ≥ 0.85` or `fraud_flag = true` → **Reject as fraud**
2. **Acceptance Check** — If `acceptance_score ≥ 0.80` AND `rejection_score < 0.60` → **Approve**
3. **Rejection Check** — If `rejection_score ≥ 0.75` → **Reject**
4. **Fallback** — Otherwise → **Pending** (manual review)

---

## Quick Start

### Prerequisites

- **Python 3.10+** (3.11 or 3.12 recommended)
- **NVIDIA GPU** with CUDA (optional — falls back to CPU automatically)
- ~2 GB disk space for dataset and models

### 1. Setup Environment

```bash
cd D:\GuideWire\GuideWire-ML
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

### 2. Generate Synthetic Dataset

```bash
python scripts/generate_data.py
```

This creates 20,000 synthetic claim records with realistic GPS trails, correlated features, and rule-based labels. Output: `data/synthetic/claims_dataset.parquet` and `.csv`.

**Options:**
```bash
python scripts/generate_data.py --num-records 50000   # More records
python scripts/generate_data.py --seed 123             # Different seed
python scripts/generate_data.py --output data/custom/  # Custom output
```

### 3. Train All Models

```bash
python scripts/train_models.py
```

Trains 3 XGBoost models (Acceptance, Rejection, Fraud) with GPU acceleration, probability calibration, and comprehensive evaluation. Saves model artifacts and detailed metrics report.

**Options:**
```bash
python scripts/train_models.py --data data/synthetic/claims_dataset.parquet
python scripts/train_models.py --output models/artifacts
```

### 4. Start FastAPI Server

```bash
python scripts/run_server.py
```

Server starts at `http://localhost:8000`. API documentation at `http://localhost:8000/docs`.

**Options:**
```bash
python scripts/run_server.py --port 8080      # Custom port
python scripts/run_server.py --reload          # Auto-reload for development
```

### 5. Run Test Suite

```bash
python tests/test_all_endpoints.py
```

Runs 16 tests covering all endpoints with realistic payloads and detailed terminal output.

---

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Basic liveness check |
| `GET` | `/v1/health` | Detailed health with model loading status |

### Model Scoring (Gig-App Spec)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/claims/acceptance-score` | Acceptance probability + payout calculation |
| `POST` | `/v1/claims/rejection-score` | Rejection probability + hold amount |
| `POST` | `/v1/claims/fraud-score` | Fraud probability + policy penalty actions |

### ES-AI Predictions (Corporate Dashboard Spec)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/es-ai/predict` | Full cascade: all 3 models + decision engine |
| `POST` | `/es-ai/decision/accept` | Accept-mode decision (auto-accept flow) |
| `POST` | `/es-ai/decision/reject` | Reject-mode decision (auto-reject flow) |
| `POST` | `/es-ai/decision/fraud` | Fraud-mode decision (auto-fraud flow) |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/es-ai/data-quality` | Input completeness scoring (A-F grade) |
| `POST` | `/es-ai/hallucination-check` | Model prediction sanity validation |

---

## Unified Input JSON

All model endpoints accept the same unified input format. This payload is assembled by the Node.js backend from the database:

```json
{
  "request_id": "esai_20260401_000123",
  "generated_at": "2026-04-01T13:15:22.111Z",
  "claim_context": {
    "claim_id": "CLM_M8F3A91",
    "user_id": "665f1d0f2bc123456789abcd",
    "disruption_type": "Heavy Rain",
    "hours": 4,
    "note": "Road flooded near underpass",
    "claim_timestamp": "2026-04-01T13:14:50.000Z",
    "claim_location": { "lat": 10.9981, "lng": 76.9664 },
    "evidence": [
      {
        "type": "image",
        "url": "https://cdn.example.com/claims/img1.jpg",
        "captured_at": "2026-04-01T13:13:30.000Z"
      }
    ]
  },
  "current_location": {
    "lat": 10.9981, "lng": 76.9664,
    "accuracy": 8, "source": "gps",
    "captured_at": "2026-04-01T13:14:48.000Z"
  },
  "location_history_last_1h": [
    { "lat": 10.9975, "lng": 76.9651, "accuracy": 7, "source": "gps",
      "captured_at": "2026-04-01T12:18:02.000Z" }
  ],
  "user_profile": {
    "segment": "transportation", "platform": "Rapido",
    "zone": "Coimbatore", "work_shift": "day",
    "work_hours": 8, "daily_earnings": 1400, "order_capacity": 60
  },
  "policy_context": {
    "tier": "Standard Shield", "plan_id": "standard",
    "weekly_premium": 45, "active": true,
    "claim_ban_until": null, "fraud_strike_count": 0
  },
  "previous_claims": {
    "window_days": 90, "total_count": 7,
    "approved_count": 4, "pending_count": 2,
    "rejected_count": 1, "fraud_flag_count": 0,
    "avg_ai_score": 0.78,
    "last_claim_at": "2026-03-24T16:08:10.000Z",
    "recent": []
  }
}
```

---

## Feature Engineering

The system extracts **35 features** across 7 groups from each claim payload:

| Group | Features | Description |
|-------|----------|-------------|
| **Claim** (5) | `disruption_type_encoded`, `hours_claimed`, `has_evidence`, `evidence_count`, `evidence_timeliness_min` | Claim metadata and evidence quality |
| **Geospatial** (8) | `distance_claim_vs_current_m`, `distance_claim_vs_trail_centroid_m`, `gps_accuracy_mean/std`, `location_ping_count_1h`, `ping_density`, `max_speed_kmh`, `movement_consistency_score` | GPS trail analysis, spoofing detection |
| **Temporal** (4) | `hour_of_day_sin/cos`, `is_weekend`, `location_freshness_min` | Cyclical time encoding, staleness |
| **Profile** (5) | `segment_encoded`, `work_hours`, `daily_earnings`, `order_capacity`, `shift_encoded` | Rider characteristics |
| **Policy** (4) | `tier_encoded`, `weekly_premium`, `fraud_strike_count`, `is_claim_banned` | Policy risk factors |
| **History** (6) | `total_claims_90d`, `approved_ratio`, `rejected_ratio`, `fraud_flag_count`, `avg_ai_score`, `days_since_last_claim` | Claim history patterns |
| **Behavioral** (3) | `claims_last_7d`, `repeat_disruption_ratio`, `night_claim_ratio_30d` | Behavioral anomaly indicators |

**Zero Training-Serving Skew:** The same `FeatureExtractor` class is used during both synthetic data generation and live API inference, guaranteeing identical feature computation.

---

## Synthetic Data Generation

Since no real-world dataset exists, the system generates production-quality synthetic data:

- **Physics-based GPS simulation** — Realistic movement patterns for legitimate, borderline, rejectable, and fraudulent claims
- **Correlated rider profiles** — Earnings, capacity, and behavior patterns that naturally cluster
- **Category-weighted generation** — 40% legitimate, 25% borderline, 20% rejectable, 15% fraudulent
- **Rule-based labeling** — Feature-driven labels with 5% noise for model generalization
- **8 Indian cities** — Coimbatore, Chennai, Bangalore, Mumbai, Delhi, Hyderabad, Pune, Kolkata

---

## Model Training

### Models

| Model | Architecture | Estimators | Depth | Calibration | Target |
|-------|-------------|------------|-------|-------------|--------|
| **Acceptance** | XGBoost | 300 | 6 | Isotonic | `is_accepted` (binary) |
| **Rejection** | XGBoost | 300 | 5 | Isotonic | `is_rejected` (binary) |
| **Fraud** | XGBoost | 500 | 7 | Sigmoid (Platt) | `is_fraud` (binary, rare event) |

### Key Training Details

- **GPU Acceleration** — `tree_method='gpu_hist'` on NVIDIA GPUs (auto-detects)
- **Early Stopping** — Prevents overfitting by monitoring validation AUC
- **Class Imbalance** — `scale_pos_weight` for rejection/fraud models
- **Probability Calibration** — `CalibratedClassifierCV` for meaningful probability scores
- **Feature Scaling** — `StandardScaler` (fitted on train, applied to val/test)

### Saved Artifacts

After training, `models/artifacts/` contains:

| File | Description |
|------|-------------|
| `acceptance_model.joblib` | Calibrated acceptance model |
| `rejection_model.joblib` | Calibrated rejection model |
| `fraud_model.joblib` | Calibrated fraud model |
| `scaler.joblib` | Fitted StandardScaler |
| `evaluation_report.json` | Comprehensive metrics, hyperparameters, feature importances |

### Evaluation Report

The `evaluation_report.json` includes per-model:
- **Core metrics**: Accuracy, Precision, Recall, F1, AUC-ROC, AUC-PR
- **Advanced metrics**: Specificity, NPV, MCC, Log Loss, Brier Score
- **Confusion matrix**: TP, TN, FP, FN counts
- **Classification report**: Per-class precision/recall/f1
- **Hyperparameters**: Full training configuration
- **Feature importances**: Top 10 features per model
- **Dataset statistics**: Split sizes, class distributions

---

## Project Structure

```
GuideWire-ML/
│
├── api/                          # FastAPI application
│   ├── __init__.py
│   ├── main.py                   # App factory + lifespan model loading
│   ├── dependencies.py           # DI for model registry
│   ├── middleware.py             # CORS, timing, request ID
│   ├── routers/
│   │   ├── health.py             # GET /health, GET /v1/health
│   │   ├── claims.py             # POST /v1/claims/{acceptance,rejection,fraud}-score
│   │   ├── es_ai.py              # POST /es-ai/predict, /es-ai/decision/*
│   │   ├── data_quality.py       # POST /es-ai/data-quality
│   │   └── hallucination.py      # POST /es-ai/hallucination-check
│   └── schemas/
│       ├── common.py             # Shared Pydantic models
│       ├── requests.py           # All request schemas
│       └── responses.py          # All response schemas
│
├── config/
│   ├── __init__.py
│   └── settings.py               # Pydantic BaseSettings (env-based config)
│
├── data/
│   ├── generators/
│   │   ├── constants.py          # Cities, disruptions, weights, feature names
│   │   ├── rider_generator.py    # Correlated rider profiles
│   │   ├── location_generator.py # Physics-based GPS trail simulation
│   │   ├── claim_generator.py    # Claim records with evidence + history
│   │   ├── labeler.py            # Rule-based ground truth + noise
│   │   └── pipeline.py           # Full generation orchestration
│   └── synthetic/                # Generated dataset (gitignored)
│       ├── claims_dataset.parquet
│       └── claims_dataset.csv
│
├── features/
│   ├── __init__.py
│   ├── extractor.py              # Unified 35-feature extraction
│   ├── geo_features.py           # Haversine, speed, trail analysis
│   ├── temporal_features.py      # Cyclical encoding, freshness
│   ├── behavioral_features.py    # Claim frequency, pattern signals
│   ├── data_quality.py           # Input completeness scoring
│   └── hallucination.py          # Prediction sanity checking
│
├── models/
│   ├── __init__.py
│   ├── reason_codes.py           # SHAP → human-readable reason codes
│   └── artifacts/                # Saved model files (gitignored)
│       ├── acceptance_model.joblib
│       ├── rejection_model.joblib
│       ├── fraud_model.joblib
│       ├── scaler.joblib
│       └── evaluation_report.json
│
├── services/
│   ├── __init__.py
│   ├── model_registry.py         # Model loading + caching + prediction
│   └── payout_calculator.py      # Tier-based payout + fraud penalties
│
├── training/
│   ├── __init__.py
│   └── preprocessor.py           # Data loading, splitting, scaling
│
├── scripts/
│   ├── generate_data.py          # CLI: Generate synthetic dataset
│   ├── train_models.py           # CLI: Train all 3 models
│   └── run_server.py             # CLI: Start FastAPI server
│
├── tests/
│   ├── __init__.py
│   └── test_all_endpoints.py     # 16-test suite with detailed output
│
├── .env.example                  # Environment variable template
├── .gitignore                    # Python/ML/IDE exclusions
├── pyproject.toml                # Project metadata + tool config
├── requirements.txt              # Pinned dependencies
└── README.md                     # This file
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Framework** | FastAPI 0.110+ | Async REST API with auto-generated docs |
| **ASGI Server** | Uvicorn | Production ASGI server |
| **ML Framework** | XGBoost 2.0+ | Gradient boosted trees (GPU-accelerated) |
| **Preprocessing** | scikit-learn 1.4+ | Scaling, calibration, metrics |
| **Validation** | Pydantic v2 | Request/response type safety |
| **Data** | Pandas + PyArrow | DataFrames + Parquet I/O |
| **Serialization** | joblib | Model persistence |
| **Config** | python-dotenv | Environment-based settings |
| **Testing** | pytest + TestClient | Endpoint testing |

---

## Integration with Node.js Backend

This FastAPI server is designed to be called by the existing Node.js/Express backend:

1. **Node.js backend** receives a claim submission from the mobile app
2. Backend queries the database for: user profile, current location, location logs (last 1h), previous claims (last 90 days), policy data
3. Backend assembles the unified JSON payload
4. Backend calls FastAPI endpoints:
   - `POST http://localhost:8000/es-ai/predict` for full analysis
   - `POST http://localhost:8000/v1/claims/acceptance-score` for acceptance
   - `POST http://localhost:8000/v1/claims/rejection-score` for rejection
   - `POST http://localhost:8000/v1/claims/fraud-score` for fraud detection
5. Backend applies the returned decision and updates claim status

If the FastAPI server is unavailable, the backend should fall back to internal heuristic scoring.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
APP_NAME=GuideWire-ESAI
APP_ENV=development
HOST=0.0.0.0
PORT=8000
MODEL_DIR=models/artifacts
DATA_DIR=data/synthetic
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

---

## Requirements

- **Python**: 3.10+ (3.11/3.12 recommended)
- **GPU**: NVIDIA GPU with CUDA support (optional, auto-detects)
- **RAM**: ~4 GB for training, ~500 MB for serving
- **Disk**: ~2 GB for dataset + model artifacts
