const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { runActuarialEngineForZone } = require('../services/schedulerService');

// GET /riders
router.get('/riders', async (req, res) => {
  try {
    const riders = await adminService.getAllRiders();
    res.json(riders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /policies
router.get('/policies', async (req, res) => {
  try {
    const status = req.query.status;
    const policies = status ? await adminService.getActivePolicies() : await adminService.getAllPolicies();
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /policies/:policyNumber (policy numbers contain hyphens like POL-GW-2026-001)
router.get('/policies/:policyNumber', async (req, res) => {
  try {
    const detail = await adminService.getPolicyDetail(req.params.policyNumber);
    res.json(detail);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /claims/pay/:riderId
router.post('/claims/pay/:riderId', async (req, res) => {
  try {
    const result = await adminService.payManualClaim(req.params.riderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /claims
router.get('/claims', async (req, res) => {
  try {
    const claims = await adminService.getAllClaims();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /claims/triggers
router.get('/claims/triggers', async (req, res) => {
  try {
    const zones = await adminService.getTriggerZones();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /claims/approval-log
router.get('/claims/approval-log', async (req, res) => {
  try {
    const log = await adminService.getAutoApprovalLog();
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /billing/summary
router.get('/billing/summary', async (req, res) => {
  try {
    const summary = await adminService.getBillingSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /billing/transactions
router.get('/billing/transactions', async (req, res) => {
  try {
    const txns = await adminService.getRecentTransactions();
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /billing/monthly-trend
router.get('/billing/monthly-trend', async (req, res) => {
  try {
    const trend = await adminService.getMonthlyTrend();
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /fraud-logs
router.get('/fraud-logs', async (req, res) => {
  try {
    const logs = await adminService.getAllFraudLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /fraud-logs/blocked
router.get('/fraud-logs/blocked', async (req, res) => {
  try {
    const logs = await adminService.getBlockedFraudLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /risk-heatmap
router.get('/risk-heatmap', async (req, res) => {
  try {
    const heatmap = await adminService.getRiskHeatmap();
    res.json(heatmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /market-status
router.get('/market-status', async (req, res) => {
  try {
    const status = await adminService.getMarketStatusForAdmin();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /trigger-claim
router.post('/trigger-claim', async (req, res) => {
  try {
    const { zoneId, triggerType, amount } = req.body;
    // Save the manual trigger record
    const result = await adminService.triggerManualClaim(zoneId, triggerType, amount);

    // Fire-and-forget: run zone-scoped auto-pay in background
    // This pays all active riders in the zone via XGBoost fraud check → payout → notification
    runActuarialEngineForZone(zoneId, triggerType || 'MANUAL_WEATHER_TRIGGER')
      .then(payResult => console.log(`[AdminTrigger] Auto-pay complete for zone ${zoneId}:`, payResult))
      .catch(e => console.error(`[AdminTrigger] Auto-pay error for zone ${zoneId}:`, e.message));

    res.json({
      ...result,
      auto_pay_initiated: true,
      message: `Weather trigger saved. Auto-paying all active riders in zone ${zoneId}...`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /solvency  — Item 4: BCR + liquidity reserve + 14-day stress test
router.get('/solvency', async (req, res) => {
  try {
    const metrics = await adminService.getSolvencyMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /operational-cost  — Item 9: straight-through processing rate, overhead %
router.get('/operational-cost', async (req, res) => {
  try {
    const metrics = await adminService.getOperationalCostMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics — full dashboard data from live DB
router.get('/analytics', async (req, res) => {
  try {
    const data = await adminService.getAnalyticsSummary();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
