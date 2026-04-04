"""
Hallucination check endpoint.

POST /es-ai/hallucination-check
"""

from fastapi import APIRouter

from api.schemas.requests import HallucinationCheckRequest
from api.schemas.responses import HallucinationCheckResponse, HallucinationResult
from features.hallucination import check_hallucination

router = APIRouter(prefix="/es-ai", tags=["Hallucination Detection"])


@router.post("/hallucination-check", response_model=HallucinationCheckResponse)
async def hallucination_check(request: HallucinationCheckRequest):
    """
    POST /es-ai/hallucination-check

    Cross-validates model prediction against the input payload
    to detect reasoning inconsistencies.
    """
    prediction = request.prediction.model_dump()
    payload = request.payload.model_dump(by_alias=True)

    result = check_hallucination(prediction, payload)
    h = result["hallucination"]

    return HallucinationCheckResponse(
        hallucination=HallucinationResult(
            risk=h["risk"],
            score=h["score"],
            flags=h["flags"],
            recommendedAction=h["recommendedAction"],
        )
    )
