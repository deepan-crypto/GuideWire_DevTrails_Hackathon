import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not set")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

POLICY_DB = """
RiskWire Policies:
Basic Tier: Base premium 25 INR/week. Payout 300 INR/day.
Standard Tier: Base premium 50 INR/week. Payout 500 INR/day.
Pro Tier: Base premium 100 INR/week. Payout 1000 INR/day.
Premiums are multiplied by the live weather forecast risk multiplier.
Payouts trigger automatically if temperature is 42C or higher, or rainfall is 50mm or higher.
Payouts are instant to the digital wallet. KYC verification is mandatory.
"""

class Query(BaseModel):
    user_input: str
    language: str


@app.post("/api/v1/ai/policy-query")
def ask_rag(req: Query):

    if len(req.user_input) > 500:
        raise HTTPException(status_code=400, detail="Input too long")

    prompt = f"""
You are Vani, RiskWire Support AI.

Answer ONLY using this data:
{POLICY_DB}

If answer not found, say:
"I cannot find this information in RiskWire policies."

User question: {req.user_input}

Reply in {req.language}.
Keep answer short.
"""

    try:
        response = model.generate_content(prompt)

        return {
            "answer": response.text.strip(),
            "language": req.language
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))