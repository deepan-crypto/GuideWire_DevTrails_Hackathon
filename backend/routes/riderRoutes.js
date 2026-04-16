const express = require('express');
const router = express.Router();
const insuranceService = require('../services/insuranceService');

// POST /api/v1/rider/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, city, zone, platform, age, workerId } = req.query;
    const rider = await insuranceService.registerRider(name, phone, city, zone, platform, parseInt(age) || 25, workerId || '');
    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/rider/:id
router.get('/:id', async (req, res) => {
  try {
    const rider = await insuranceService.getRider(parseInt(req.params.id));
    res.json(insuranceService.formatRider(rider));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/v1/rider/:id
router.put('/:id', async (req, res) => {
  try {
    const rider = await insuranceService.updateRider(parseInt(req.params.id), req.body);
    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/rider/:id/payouts
router.get('/:id/payouts', async (req, res) => {
  try {
    const payouts = await insuranceService.getPayouts(parseInt(req.params.id));
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
