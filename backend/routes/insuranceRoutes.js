const express = require('express');
const router = express.Router();
const insuranceService = require('../services/insuranceService');

// GET /api/v1/insurance/quote
router.get('/quote', async (req, res) => {
  try {
    const riderId = req.query.riderId;
    const quote = await insuranceService.getQuote(riderId);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/insurance/buy
router.post('/buy', async (req, res) => {
  try {
    const riderId = req.query.riderId;
    const tier = req.query.tier;
    const rider = await insuranceService.buyPolicy(riderId, tier);
    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/insurance/claim-tracker
router.get('/claim-tracker', async (req, res) => {
  try {
    const riderId = req.query.riderId;
    const tracker = await insuranceService.getClaimTracker(riderId);
    res.json(tracker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/insurance/market-status
router.get('/market-status', async (req, res) => {
  try {
    const status = insuranceService.getMarketStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/insurance/referral/generate
router.post('/referral/generate', async (req, res) => {
  try {
    const riderId = req.query.riderId;
    const result = await insuranceService.generateReferralCode(riderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/insurance/referral/redeem
router.post('/referral/redeem', async (req, res) => {
  try {
    const riderId = req.query.riderId;
    const code = req.query.code;
    const result = await insuranceService.redeemReferral(riderId, code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
