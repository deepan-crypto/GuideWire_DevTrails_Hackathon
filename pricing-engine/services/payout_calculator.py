"""
Payout and hold amount calculator based on policy tier, hours, and acceptance score.
"""


def calculate_payout(
    acceptance_score: float,
    hours_claimed: float,
    daily_earnings: float,
    tier: str,
) -> tuple[float, float]:
    """
    Calculate instant payout and held amount.

    Returns (instant_payout, held_amount) in INR.
    """
    hourly_rate = daily_earnings / 8.0
    base_payout = hourly_rate * hours_claimed

    tier_splits = {
        "basic": (0.70, 0.30),
        "standard": (0.80, 0.20),
        "premium": (0.90, 0.10),
    }

    tier_lower = tier.lower().replace(" shield", "").strip()
    instant_ratio, held_ratio = tier_splits.get(tier_lower, (0.75, 0.25))

    # Confidence boost: higher acceptance → more instant
    confidence_boost = max(0, (acceptance_score - 0.80) * 0.5)
    instant_ratio = min(0.95, instant_ratio + confidence_boost)
    held_ratio = 1.0 - instant_ratio

    instant_payout = round(base_payout * instant_ratio, 2)
    held_amount = round(base_payout * held_ratio, 2)
    return instant_payout, held_amount


def calculate_policy_actions(fraud_score: float) -> dict:
    """Calculate policy penalty actions based on fraud severity."""
    if fraud_score >= 0.95:
        return {
            "downgrade_to_plan": "basic",
            "premium_multiplier": 1.50,
            "claim_ban_days": 7,
            "strike_increment": 2,
        }
    elif fraud_score >= 0.90:
        return {
            "downgrade_to_plan": "basic",
            "premium_multiplier": 1.25,
            "claim_ban_days": 3,
            "strike_increment": 1,
        }
    elif fraud_score >= 0.85:
        return {
            "downgrade_to_plan": "standard",
            "premium_multiplier": 1.15,
            "claim_ban_days": 1,
            "strike_increment": 1,
        }
    return {
        "downgrade_to_plan": None,
        "premium_multiplier": 1.0,
        "claim_ban_days": 0,
        "strike_increment": 0,
    }
