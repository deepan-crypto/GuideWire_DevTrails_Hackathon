# ES-AI Endpoints (Corporate Dashboard)

FastAPI contract version used by backend: `v1` (configurable via `FASTAPI_VERSION`).

Backend base URL: `/api/ai`

## 1) AI Health

### Endpoint
`GET /api/ai/health`

### Response JSON
```json
{
  "module": "es-ai",
  "endpoint": "health",
  "status": "system_connected",
  "connected": true,
  "components": {
    "privateDbConnected": true,
    "publicDbConnected": true,
    "fastApiConnected": true
  },
  "fastApiVersion": "v1",
  "fastApiHealth": {
    "status": "ok"
  },
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

## 2) AI System Connection Status

### Endpoint
`GET /api/ai/system-status`

### Response JSON
```json
{
  "status": "system_connected",
  "connected": true,
  "components": {
    "privateDbConnected": true,
    "publicDbConnected": true,
    "fastApiConnected": true
  },
  "fastApiVersion": "v1",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

Possible status values:
- `system_connected`
- `system_disconnected`

## 3) AI Prediction

### Endpoint
`POST /api/ai/predict`

### Input JSON
```json
{
  "userId": "optional-user-id-if-admin",
  "type": "rain_disruption",
  "hours": 4,
  "lat": 11.0168,
  "lng": 76.9558,
  "note": "Heavy rain in zone A",
  "accuracy": 10,
  "timestamp": 1711962000000,
  "source": "gps"
}
```

### Data auto-collected and sent to AI model
- Rider current location (from request or `currentLocation`)
- Rider location history for past 1 hour (`locationHistory` filtered by time)
- Previous claims (latest 100, summary + recent entries)
- Policy data (tier, premium, fraud strikes, claim ban)
- Rider profile and earnings metadata

### Response JSON
```json
{
  "fastApiVersion": "v1",
  "dataQuality": {
    "score": 92,
    "grade": "A",
    "missing": []
  },
  "prediction": {
    "mode": "predict",
    "fastApiConnected": true,
    "fastApiVersion": "v1",
    "decision": "accept",
    "confidence": 88,
    "fraudScore": 18,
    "fraudFlag": false,
    "reason": "model_decision",
    "breakdown": {
      "weatherSignal": 82,
      "locationTrust": 90,
      "fraudRisk": 18,
      "policyFit": 86
    }
  },
  "payload": {
    "claim": {},
    "rider": {},
    "location": {},
    "previousClaims": {}
  }
}
```

## 4) AI Confidence (for a claim)

### Endpoint
`GET /api/ai/confidence/:claimId`

### Response JSON
```json
{
  "claimId": "661111111111111111111111",
  "aiDecision": "accept",
  "aiConfidence": 88,
  "fraudFlag": false,
  "fraudScore": 18,
  "aiBreakdown": {
    "weatherSignal": 82,
    "locationTrust": 90,
    "fraudRisk": 18,
    "policyFit": 86
  },
  "status": "approved",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

## 5) AI Data Quality

### Endpoint
`POST /api/ai/data-quality`

### Input JSON (Option A: provide payload directly)
```json
{
  "payload": {
    "claim": {
      "type": "rain_disruption",
      "hours": 4
    },
    "rider": {
      "userId": "661111111111111111111111"
    },
    "location": {
      "current": {
        "lat": 11.0168,
        "lng": 76.9558,
        "timestamp": 1711962000000
      }
    },
    "previousClaims": {
      "summary": {
        "total": 12
      }
    }
  }
}
```

### Input JSON (Option B: build payload from user + claim input)
```json
{
  "userId": "optional-user-id-if-admin",
  "claimInput": {
    "type": "rain_disruption",
    "hours": 4,
    "lat": 11.0168,
    "lng": 76.9558
  }
}
```

### Response JSON
```json
{
  "dataQuality": {
    "score": 85,
    "grade": "B",
    "missing": ["location.current.timestamp"]
  },
  "payload": {
    "claim": {},
    "rider": {},
    "location": {},
    "previousClaims": {}
  }
}
```

## 6) AI Hallucination Check

### Endpoint
`POST /api/ai/hallucination-check`

### Input JSON
```json
{
  "prediction": {
    "decision": "reject",
    "reason": "Location mismatch and missing history",
    "breakdown": {
      "locationTrust": 30
    }
  },
  "payload": {
    "location": {
      "telemetry": {
        "hasLiveLocation": false
      }
    },
    "previousClaims": {
      "summary": {
        "total": 0
      }
    }
  }
}
```

### Response JSON
```json
{
  "hallucination": {
    "risk": "medium",
    "score": 35,
    "flags": [
      "location_reason_without_live_location"
    ],
    "recommendedAction": "request_model_recheck"
  }
}
```

## 7) Claim Auto-Accept Endpoint

### Endpoint
`POST /api/ai/claims/:claimId/auto-accept`

### Behavior
- Builds full AI payload from claim + user profile + current location + past 1-hour location + previous claims.
- Calls AI model decision endpoint for acceptance.
- Updates claim status to `approved` only when AI decision is `accept`.

### Response JSON
```json
{
  "mode": "accept",
  "prediction": {
    "decision": "accept",
    "confidence": 91,
    "fraudScore": 10,
    "fraudFlag": false
  },
  "claim": {
    "_id": "661111111111111111111111",
    "status": "approved"
  }
}
```

## 8) Claim Auto-Reject Endpoint

### Endpoint
`POST /api/ai/claims/:claimId/auto-reject`

### Behavior
- Builds full AI payload from claim + user + location + history.
- Calls AI model decision endpoint for rejection.
- Updates claim status to `rejected` when AI returns `reject` or `fraud`.

### Response JSON
```json
{
  "mode": "reject",
  "prediction": {
    "decision": "reject",
    "confidence": 86,
    "fraudScore": 62,
    "fraudFlag": false
  },
  "claim": {
    "_id": "661111111111111111111111",
    "status": "rejected"
  }
}
```

## 9) Claim Auto-Fraud Endpoint

### Endpoint
`POST /api/ai/claims/:claimId/auto-fraud`

### Behavior
- Builds full AI payload from claim + rider telemetry + prior claims.
- Calls AI model fraud endpoint.
- If AI returns `fraud`, marks claim as `rejected`, sets `fraudFlag=true`, and stores `fraudScore`.

### Response JSON
```json
{
  "mode": "fraud",
  "prediction": {
    "decision": "fraud",
    "confidence": 90,
    "fraudScore": 88,
    "fraudFlag": true
  },
  "claim": {
    "_id": "661111111111111111111111",
    "status": "rejected",
    "fraudFlag": true,
    "fraudScore": 88
  }
}
```

## FastAPI endpoint contract used by backend

Backend service calls these FastAPI endpoints (if reachable):
- `POST /es-ai/predict`
- `POST /es-ai/decision/accept`
- `POST /es-ai/decision/reject`
- `POST /es-ai/decision/fraud`
- `GET /health`

Request body shape sent to FastAPI:
```json
{
  "version": "v1",
  "payload": {
    "claim": {},
    "rider": {},
    "location": {
      "current": {},
      "past1Hour": {}
    },
    "previousClaims": {}
  }
}
```

If FastAPI is unavailable, backend falls back to internal heuristic scoring and still returns predictions.
