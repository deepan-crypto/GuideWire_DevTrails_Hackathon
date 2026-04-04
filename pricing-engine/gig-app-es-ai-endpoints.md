# ES-AI Endpoints (Claim Acceptance, Rejection, Fraud)

## Purpose

This document defines the ES-AI API contract for:

1. Automatic claim acceptance
2. Automatic claim rejection
3. Automatic fraud detection

It includes:

- Separate backend endpoints for each decision type
- FastAPI endpoints (model-serving layer)
- Required input JSON
- Output JSON examples
- The exact data that must be collected (current location, last 1 hour location, claim history, policy profile)

## Current Status In This Repo

- Implemented now: `POST /api/ai/analyze-claim` (mock response)
- Implemented now: claim submit flow calls FastAPI `POST /score-claim`
- Not implemented as separate endpoints: acceptance/rejection/fraud endpoints

This file defines the recommended endpoint split to implement next.

## Architecture

1. App/Client submits claim using `POST /api/claims/create`.
2. Backend builds AI context by collecting user + location + history + claim input.
3. Backend calls dedicated FastAPI endpoints:
   - acceptance
   - rejection
   - fraud
4. Backend applies decision policy and stores decision in `Claim`.

## Data That Must Be Sent To AI

The backend should collect and send all of the following in one payload.

### Required Data Blocks

1. `claim_context`
- claim id, disruption type, hours, note, evidence metadata, claim timestamp

2. `current_location`
- rider's current/present lat-lng
- accuracy
- capture time

3. `location_history_last_1h`
- all location pings from `LocationLog` in previous 60 minutes
- each with lat, lng, accuracy, source, captured_at

4. `user_profile`
- segment, platform, zone, work shift, work hours, daily earnings, order capacity

5. `policy_context`
- plan id, premium, fraud strike count, claim ban status

6. `previous_claims`
- recent claims (recommended window: last 90 days)
- status distribution
- average ai score
- fraud flags count

7. `derived_features`
- optional calculated features such as:
  - distance between claim location and last known point
  - movement consistency in last 1h
  - abnormal claim frequency
  - repeated claim type pattern

## Unified Input JSON (Backend -> FastAPI)

Use this payload for all three model endpoints.

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
    "claim_location": {
      "lat": 10.9981,
      "lng": 76.9664
    },
    "evidence": [
      {
        "type": "image",
        "url": "https://cdn.example.com/claims/CLM_M8F3A91/img1.jpg",
        "captured_at": "2026-04-01T13:13:30.000Z"
      }
    ]
  },
  "current_location": {
    "lat": 10.9981,
    "lng": 76.9664,
    "accuracy": 8,
    "source": "gps",
    "captured_at": "2026-04-01T13:14:48.000Z"
  },
  "location_history_last_1h": [
    {
      "lat": 10.9975,
      "lng": 76.9651,
      "accuracy": 7,
      "source": "gps",
      "captured_at": "2026-04-01T12:18:02.000Z"
    },
    {
      "lat": 10.9979,
      "lng": 76.9658,
      "accuracy": 9,
      "source": "gps",
      "captured_at": "2026-04-01T12:40:21.000Z"
    }
  ],
  "user_profile": {
    "segment": "transportation",
    "platform": "Rapido",
    "zone": "Coimbatore",
    "work_shift": "day",
    "work_hours": 8,
    "daily_earnings": 1400,
    "order_capacity": 60
  },
  "policy_context": {
    "tier": "Standard Shield",
    "plan_id": "standard",
    "weekly_premium": 45,
    "active": true,
    "claim_ban_until": null,
    "fraud_strike_count": 0
  },
  "previous_claims": {
    "window_days": 90,
    "total_count": 7,
    "approved_count": 4,
    "pending_count": 2,
    "rejected_count": 1,
    "fraud_flag_count": 0,
    "avg_ai_score": 0.78,
    "last_claim_at": "2026-03-24T16:08:10.000Z",
    "recent": [
      {
        "claim_id": "CLM_M7D1C21",
        "type": "Heatwave",
        "hours": 3,
        "status": "approved",
        "ai_score": 0.84,
        "fraud_flag": false,
        "created_at": "2026-03-24T16:08:10.000Z"
      }
    ]
  },
  "derived_features": {
    "distance_claim_vs_last_point_m": 42,
    "movement_consistency_score": 0.91,
    "claims_last_7d": 2,
    "repeat_disruption_ratio": 0.29,
    "night_claim_ratio_30d": 0.14
  }
}
```

## Backend Endpoints (Node/Express)

Base URL: `http://localhost:5000/api/ai`

### 1) Claim Acceptance Endpoint

`POST /api/ai/decision/acceptance`

Use when you want the acceptance probability and payout recommendation.

#### Response JSON (Example)

```json
{
  "request_id": "esai_20260401_000123",
  "decision_type": "acceptance",
  "model_version": "es-ai-accept-v1.0.0",
  "acceptance_score": 0.91,
  "recommended_status": "approved",
  "instant_payout": 1600,
  "held_amount": 400,
  "reason_codes": ["LOC_MATCH", "HISTORY_STABLE", "LOW_RISK_PATTERN"],
  "explanation": "Location pattern is consistent with disruption and prior behavior.",
  "latency_ms": 138
}
```

### 2) Claim Rejection Endpoint

`POST /api/ai/decision/rejection`

Use when you want rejection confidence and hold/review reason.

#### Response JSON (Example)

```json
{
  "request_id": "esai_20260401_000123",
  "decision_type": "rejection",
  "model_version": "es-ai-reject-v1.0.0",
  "rejection_score": 0.87,
  "recommended_status": "rejected",
  "instant_payout": 0,
  "held_amount": 2000,
  "reason_codes": ["WEAK_EVIDENCE", "LOCATION_GAP", "PATTERN_MISMATCH"],
  "explanation": "Claim location and route trail are inconsistent in the last 1h window.",
  "latency_ms": 121
}
```

### 3) Claim Fraud Endpoint

`POST /api/ai/decision/fraud`

Use when you want fraud likelihood and policy penalty recommendation.

#### Response JSON (Example)

```json
{
  "request_id": "esai_20260401_000123",
  "decision_type": "fraud",
  "model_version": "es-ai-fraud-v1.0.0",
  "fraud_score": 0.94,
  "fraud_flag": true,
  "recommended_status": "rejected",
  "policy_actions": {
    "downgrade_to_plan": "basic",
    "premium_multiplier": 1.25,
    "claim_ban_days": 3,
    "strike_increment": 1
  },
  "reason_codes": ["IMPOSSIBLE_MOVEMENT", "REPEAT_SPIKE", "EVIDENCE_RISK"],
  "explanation": "Travel path and claim sequence indicate high fraud probability.",
  "latency_ms": 146
}
```

### Optional Orchestration Endpoint

`POST /api/ai/decision/full`

Calls all three model endpoints and returns merged final decision.

## FastAPI Endpoints (Model Service)

Base URL: `http://localhost:8000/v1`

These are the FastAPI versions that backend should call.

### 1) Acceptance Model Endpoint

`POST /v1/claims/acceptance-score`

Input: Unified input JSON (same as above)

Output:

```json
{
  "acceptance_score": 0.91,
  "recommended_status": "approved",
  "instant_payout": 1600,
  "held_amount": 400,
  "reason_codes": ["LOC_MATCH", "HISTORY_STABLE"],
  "model_version": "es-ai-accept-v1.0.0"
}
```

### 2) Rejection Model Endpoint

`POST /v1/claims/rejection-score`

Input: Unified input JSON

Output:

```json
{
  "rejection_score": 0.87,
  "recommended_status": "rejected",
  "instant_payout": 0,
  "held_amount": 2000,
  "reason_codes": ["LOCATION_GAP", "PATTERN_MISMATCH"],
  "model_version": "es-ai-reject-v1.0.0"
}
```

### 3) Fraud Model Endpoint

`POST /v1/claims/fraud-score`

Input: Unified input JSON

Output:

```json
{
  "fraud_score": 0.94,
  "fraud_flag": true,
  "recommended_status": "rejected",
  "policy_actions": {
    "downgrade_to_plan": "basic",
    "premium_multiplier": 1.25,
    "claim_ban_days": 3,
    "strike_increment": 1
  },
  "reason_codes": ["IMPOSSIBLE_MOVEMENT", "REPEAT_SPIKE"],
  "model_version": "es-ai-fraud-v1.0.0"
}
```

### Health Endpoint

`GET /v1/health`

```json
{
  "status": "ok",
  "service": "es-ai-fastapi",
  "models": {
    "acceptance": "loaded",
    "rejection": "loaded",
    "fraud": "loaded"
  }
}
```

## Final Decision Rule (Recommended)

Suggested backend rule after receiving all 3 scores:

1. If `fraud_flag = true` OR `fraud_score >= 0.85` -> reject as fraud.
2. Else if `acceptance_score >= 0.80` AND `rejection_score < 0.60` -> approve.
3. Else if `rejection_score >= 0.75` -> reject.
4. Else -> pending/manual review.

## What To Implement Next In Backend

Add routes in `server/src/routes/ai.routes.js`:

- `POST /decision/acceptance`
- `POST /decision/rejection`
- `POST /decision/fraud`
- `POST /decision/full` (optional)

Add controller methods in `server/src/controllers/ai.controller.js`:

- `analyzeAcceptance`
- `analyzeRejection`
- `analyzeFraud`
- `analyzeFullDecision`

## Database/Data Query Requirements

At request time, backend should query:

1. `User` by `userId` for profile/policy/current location
2. `LocationLog` with `capturedAt >= now - 60 minutes`
3. `Claim` with `createdAt >= now - 90 days`

Minimum quality checks before AI call:

- latest location timestamp should be recent (for example <= 10 min old)
- at least one location point in last 1h (or mark low confidence)
- hours > 0
- claim location valid lat/lng

## Notes

- Keep model input naming stable to avoid feature drift.
- Return `reason_codes` in all model outputs so app can show transparent explanations.
- Log `request_id` end-to-end for auditability.