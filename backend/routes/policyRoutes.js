const express = require('express');
const router = express.Router();
const axios = require('axios');

const ORACLE_BASE_URL = process.env.ORACLE_BASE_URL;

// GET /api/policy/quote  and  GET /api/v1/policy/quote
router.get('/quote', async (req, res) => {
  try {
    const { zoneId, tier } = req.query;
    const normalizedTier = !tier ? 'STANDARD' : tier.toUpperCase();

    let basePremium;
    switch (normalizedTier) {
      case 'PRO': basePremium = 100.0; break;
      case 'STANDARD': basePremium = 50.0; break;
      default: basePremium = 25.0;
    }

    let multiplier = 1.0;
    let reason = 'Oracle unavailable';

    try {
      const payload = { zoneId, tier: normalizedTier };
      const oracleRes = await axios.post(`${ORACLE_BASE_URL}/api/v1/oracle/quote-multiplier`, payload);
      const data = oracleRes.data;
      if (data && data.multiplier != null) {
        multiplier = data.multiplier;
        reason = data.reason || 'AI risk adjustment';
      }
    } catch (e) {
      // Fallback to base premium
    }

    const premium = Math.round(basePremium * multiplier * 100.0) / 100.0;

    res.json({
      zoneId,
      tier: normalizedTier,
      basePremium,
      multiplier,
      premium,
      reason,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
