const express = require('express');
const router = express.Router();
const insuranceService = require('../services/insuranceService');
const { Notification } = require('../models');

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
    const riderId = req.params.id;
    const rider = await insuranceService.getRider(riderId);
    res.json(insuranceService.formatRider(rider));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});


// PUT /api/v1/rider/:id
router.put('/:id', async (req, res) => {
  try {
    const rider = await insuranceService.updateRider(req.params.id, req.body);
    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/rider/:id/payouts
router.get('/:id/payouts', async (req, res) => {
  try {
    const payouts = await insuranceService.getPayouts(req.params.id);
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/rider/:id/notifications
router.get('/:id/notifications', async (req, res) => {
  try {
    const riderId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await Notification.find({ rider_id: riderId })
      .sort({ created_at: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/rider/:id/notifications/:notificationId/read
router.post('/:id/notifications/:notificationId/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { is_read: true, read_at: new Date() },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
