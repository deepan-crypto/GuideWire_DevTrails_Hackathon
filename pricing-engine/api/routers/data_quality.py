"""
Data quality endpoint.

POST /es-ai/data-quality
"""

from fastapi import APIRouter

from api.schemas.requests import DataQualityRequest
from api.schemas.responses import DataQualityBlock, DataQualityResponse
from features.data_quality import assess_data_quality

router = APIRouter(prefix="/es-ai", tags=["Data Quality"])


@router.post("/data-quality", response_model=DataQualityResponse)
async def data_quality_check(request: DataQualityRequest):
    """
    POST /es-ai/data-quality

    Supports two input modes:
    - Option A: Direct payload with claim/rider/location/previousClaims
    - Option B: userId + claimInput (builds minimal payload)
    """
    if request.payload:
        # Option A: direct payload
        payload = {
            "claim_context": request.payload.claim,
            "user_profile": request.payload.rider,
            "current_location": request.payload.location.get("current", request.payload.location)
            if isinstance(request.payload.location, dict) else {},
            "previous_claims": request.payload.previousClaims,
        }
    elif request.claimInput:
        # Option B: build from claim input
        payload = {
            "claim_context": {
                "disruption_type": request.claimInput.type,
                "hours": request.claimInput.hours,
                "claim_location": {
                    "lat": request.claimInput.lat,
                    "lng": request.claimInput.lng,
                } if request.claimInput.lat and request.claimInput.lng else {},
            },
            "current_location": {
                "lat": request.claimInput.lat,
                "lng": request.claimInput.lng,
            } if request.claimInput.lat and request.claimInput.lng else {},
            "user_profile": {"userId": request.userId} if request.userId else {},
        }
    else:
        payload = {}

    dq = assess_data_quality(payload)

    return DataQualityResponse(
        dataQuality=DataQualityBlock(**dq),
        payload=payload,
    )
