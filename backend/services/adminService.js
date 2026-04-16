const axios = require('axios');
const { Rider, Policy, Claim, PayoutLog, BillingTransaction, FraudLog } = require('../models');

const ORACLE_BASE_URL = process.env.ORACLE_BASE_URL;

// ── Get All Riders ────────────────────────────────────────────────────────

async function getAllRiders() {
  const riders = await Rider.find();
  return riders.map(formatRiderAdmin);
}

// ── Policies ──────────────────────────────────────────────────────────────

async function getAllPolicies() {
  const policies = await Policy.find();
  return policies.map(formatPolicy);
}

async function getActivePolicies() {
  const policies = await Policy.find({ status: 'Active' });
  return policies.map(formatPolicy);
}

async function getPolicyByNumber(policyNumber) {
  const policy = await Policy.findOne({ policy_number: policyNumber });
  if (!policy) throw new Error('Policy not found: ' + policyNumber);
  return policy;
}

async function getPolicyDetail(policyNumber) {
  const policy = await getPolicyByNumber(policyNumber);
  const claims = await Claim.find({ policy_ref: policyNumber });
  const transactions = await BillingTransaction.find({ policy_ref: policyNumber });
  return {
    policy: formatPolicy(policy),
    claims: claims.map(formatClaim),
    transactions: transactions.map(formatBillingTransaction),
  };
}

// ── Manual Claim Pay ──────────────────────────────────────────────────────

async function payManualClaim(riderId) {
  const rider = await Rider.findById(riderId).catch(() => null)
    || await Rider.findOne({ _id: riderId });
  if (!rider) throw new Error('Rider not found');
  if (!rider.is_policy_active) throw new Error('Policy is not active for payout');

  let amount = 0;
  if (rider.policy_tier === 'PRO') amount = 1000.0;
  else if (rider.policy_tier === 'STANDARD') amount = 500.0;
  else amount = 300.0;

  rider.wallet_balance += amount;
  rider.is_policy_active = false;
  await rider.save();

  const now = new Date();
  const claimNumber = 'CLM-MANUAL-' + Date.now() + '-' + rider._id;
  const year = now.getFullYear();
  const today = now.toISOString().split('T')[0];

  await PayoutLog.create({
    rider_id: rider._id,
    amount,
    timestamp: now,
    trigger_type: 'MANUAL_ADMIN',
    zone: rider.zone,
    claim_number: claimNumber,
  });

  await Claim.create({
    claim_number: claimNumber,
    policy_ref: `POL-GW-${year}-${String(rider._id).slice(-6)}`,
    rider_id: rider._id,
    rider_name: rider.name,
    product: rider.policy_tier,
    fraud_risk: 'NO',
    date_of_loss: today,
    status: 'APPROVED_MANUAL',
    trigger_type: 'MANUAL_ADMIN',
    amount,
    zone: rider.zone,
    approved_at: now.toISOString(),
  });

  return { success: true, amount, claimNumber };
}

// ── Trigger Manual Claim ──────────────────────────────────────────────────

async function triggerManualClaim(zoneId, triggerType, amount) {
  if (!zoneId || !zoneId.trim()) throw new Error('zoneId is required');
  if (!amount || amount <= 0) throw new Error('amount must be greater than 0');

  const normalizedTrigger = (!triggerType || !triggerType.trim()) ? 'MANUAL_ADMIN' : triggerType.toUpperCase();

  let targets = await Rider.find({ zone: zoneId, is_policy_active: true });
  if (targets.length === 0) {
    targets = await Rider.find({ is_policy_active: true });
  }

  let created = 0;
  const now = new Date();
  const year = now.getFullYear();
  const today = now.toISOString().split('T')[0];

  for (const rider of targets) {
    rider.wallet_balance += amount;
    rider.is_policy_active = false;
    await rider.save();

    const claimNumber = 'CLM-MANUAL-' + Date.now() + '-' + rider._id;

    await PayoutLog.create({
      rider_id: rider._id,
      amount,
      timestamp: now,
      trigger_type: normalizedTrigger,
      zone: zoneId,
      claim_number: claimNumber,
    });

    await Claim.create({
      claim_number: claimNumber,
      policy_ref: `POL-GW-${year}-${String(rider._id).slice(-6)}`,
      rider_id: rider._id,
      rider_name: rider.name,
      product: rider.policy_tier,
      fraud_risk: 'NO',
      date_of_loss: today,
      status: 'APPROVED_MANUAL',
      trigger_type: normalizedTrigger,
      amount,
      zone: zoneId,
      approved_at: now.toISOString(),
    });

    created++;
  }

  return { success: true, zoneId, triggerType: normalizedTrigger, amount, claimsCreated: created };
}

// ── Claims ────────────────────────────────────────────────────────────────

async function getAllClaims() {
  const claims = await Claim.find().sort({ date_of_loss: -1 });
  return claims.map(formatClaim);
}

async function getAutoApprovalLog() {
  const claims = await Claim.find({ status: 'AUTO-APPROVED' }).sort({ approved_at: -1 });
  return claims.map(formatClaim);
}

// ── Trigger Zones ─────────────────────────────────────────────────────────

async function getTriggerZones() {
  const activePolicies = await Policy.find({ status: 'Active' });

  const zoneMap = {};
  for (const p of activePolicies) {
    if (!p.zone) continue;
    const zoneId = p.zone.split(' ')[0];
    if (!zoneMap[zoneId]) zoneMap[zoneId] = [];
    zoneMap[zoneId].push(p);
  }

  const fallbackWeather = {
    'MZ-DEL-04': [47.2, 0, 45, 80], 'MZ-DEL-09': [46.1, 0, 45, 80],
    'MZ-MUM-12': [34.5, 112, 42, 80], 'MZ-BLR-07': [31.2, 22, 40, 80],
    'MZ-HYD-03': [38.9, 5, 43, 80], 'MZ-CHN-05': [36.7, 95, 42, 80],
    'MZ-PUN-02': [29.4, 8, 41, 80], 'MZ-HYD-08': [39.5, 3, 43, 80],
    'MZ-CHN-11': [35.9, 88, 42, 80],
  };
  const zoneNames = {
    'MZ-DEL-04': 'Connaught Place, Delhi', 'MZ-DEL-09': 'Karol Bagh, Delhi',
    'MZ-MUM-12': 'Andheri West, Mumbai', 'MZ-BLR-07': 'Koramangala, Bangalore',
    'MZ-HYD-03': 'HITEC City, Hyderabad', 'MZ-CHN-05': 'T. Nagar, Chennai',
    'MZ-PUN-02': 'Hinjewadi, Pune', 'MZ-HYD-08': 'Gachibowli, Hyderabad',
    'MZ-CHN-11': 'Adyar, Chennai',
  };

  const policyZoneNames = {};
  for (const policy of activePolicies) {
    if (!policy.zone) continue;
    const zoneId = policy.zone.split(' ')[0];
    const name = policy.zone.replace(zoneId, '').trim();
    if (name) policyZoneNames[zoneId] = name.replace(/[()]/g, '').trim();
  }

  let zoneIds = Object.keys(zoneMap);
  if (zoneIds.length === 0) zoneIds = Object.keys(fallbackWeather);

  // Count pending claims per zone using Mongoose
  const allClaims = await Claim.find();
  const pendingClaimsByZone = {};
  for (const c of allClaims) {
    if (c.status === 'Open') {
      pendingClaimsByZone[c.zone] = (pendingClaimsByZone[c.zone] || 0) + 1;
    }
  }

  const zones = [];
  for (const zoneId of zoneIds) {
    const fb = fallbackWeather[zoneId] || [32.0, 10.0, 42.0, 80.0];
    let realTemp = fb[0], realRain = fb[1];
    const heatThreshold = fb[2], rainThreshold = fb[3];
    let triggered = false, triggerType = null;

    try {
      const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/pricing/quote?zone=${zoneId}`);
      const live = res.data;
      if (live) {
        if (live.live_temp != null) realTemp = Math.round(live.live_temp * 10) / 10;
        if (live.live_rain != null) realRain = Math.round(live.live_rain * 10) / 10;
        if (live.payout_triggered === true) {
          triggered = true;
          triggerType = live.trigger_type ? live.trigger_type.toUpperCase() : 'WEATHER';
        }
      }
    } catch (e) { /* Fallback to static values */ }

    if (!triggered) {
      const heatTriggered = realTemp >= heatThreshold;
      const rainTriggered = realRain >= rainThreshold;
      triggered = heatTriggered || rainTriggered;
      if (heatTriggered) triggerType = 'HEAT';
      else if (rainTriggered) triggerType = 'RAIN';
    }

    zones.push({
      id: zoneId,
      name: policyZoneNames[zoneId] || zoneNames[zoneId] || zoneId,
      temp: realTemp,
      rain: realRain,
      heatThreshold,
      rainThreshold,
      triggered,
      triggerType,
      riders: (zoneMap[zoneId] || []).length,
      pendingClaims: pendingClaimsByZone[zoneId] || 0,
    });
  }

  return zones;
}

// ── Billing ───────────────────────────────────────────────────────────────

async function getBillingSummary() {
  // Aggregate with Mongoose instead of raw SQL
  const premiumAgg = await BillingTransaction.aggregate([
    { $match: { type: 'PREMIUM' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const payoutAgg = await BillingTransaction.aggregate([
    { $match: { type: 'PAYOUT' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalPremiums = premiumAgg[0]?.total || 0;
  const totalPayouts = Math.abs(payoutAgg[0]?.total || 0);

  const activePolicies = await Policy.find({ status: 'Active' });
  const autoApproved = await Claim.find({ status: 'AUTO-APPROVED' });
  const claimsPaid = autoApproved.length;

  return {
    totalPremiums,
    totalPayouts,
    netRevenue: totalPremiums - totalPayouts,
    lossRatio: totalPremiums > 0 ? Math.round((totalPayouts / totalPremiums) * 1000) / 10 : 0,
    activePolicies: activePolicies.length,
    claimsPaid,
    avgClaimSize: claimsPaid > 0 ? Math.round(totalPayouts / claimsPaid) : 0,
    autoApprovalRate: 97.3,
  };
}

async function getRecentTransactions() {
  const txns = await BillingTransaction.find().sort({ _id: -1 });
  return txns.map(formatBillingTransaction);
}

function getMonthlyTrend() {
  const data = [
    [142000, 28000], [158000, 31000], [175000, 22000],
    [198000, 58000], [224000, 72000], [267000, 118000],
  ];
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return months.map((month, i) => ({ month, premiums: data[i][0], payouts: data[i][1] }));
}

// ── Fraud Audit ───────────────────────────────────────────────────────────

async function getAllFraudLogs() {
  let logs = await FraudLog.find().sort({ _id: -1 });
  if (logs.length === 0) {
    await seedDemoFraudLogs();
    logs = await FraudLog.find().sort({ _id: -1 });
  }
  return logs.map(formatFraudLog);
}

async function getBlockedFraudLogs() {
  const logs = await FraudLog.find({ fraud_flag: true }).sort({ _id: -1 });
  return logs.map(formatFraudLog);
}

async function seedDemoFraudLogs() {
  const demoData = [
    { claim_id: 'CLM-DEMO-001', rider_id: 'demo1', rider_name: 'Arjun Mehta', fraud_flag: false, confidence_score: 0.92, fraud_score: 0.08, ml_prediction: 'NORMAL', fraud_reasons: '', zone: 'MZ-DEL-04', gps_lat: 28.62, gps_lon: 77.22, network_rtt_ms: 32.0, verdict: 'PASSED' },
    { claim_id: 'CLM-DEMO-002', rider_id: 'demo2', rider_name: 'Priya Sharma', fraud_flag: false, confidence_score: 0.88, fraud_score: 0.12, ml_prediction: 'NORMAL', fraud_reasons: '', zone: 'MZ-MUM-12', gps_lat: 19.12, gps_lon: 72.89, network_rtt_ms: 28.0, verdict: 'PASSED' },
    { claim_id: 'CLM-DEMO-003', rider_id: 'fake1', rider_name: 'Fake User Alpha', fraud_flag: true, confidence_score: 0.15, fraud_score: 0.85, ml_prediction: 'ANOMALY', fraud_reasons: 'MOCK_LOCATION_DETECTED,VPN_DATACENTER_IP_DETECTED', zone: 'MZ-DEL-04', gps_lat: 28.63, gps_lon: 77.21, network_rtt_ms: 285.0, verdict: 'BLOCKED' },
    { claim_id: 'CLM-DEMO-004', rider_id: 'demo3', rider_name: 'Rahul Verma', fraud_flag: false, confidence_score: 0.95, fraud_score: 0.05, ml_prediction: 'NORMAL', fraud_reasons: '', zone: 'MZ-BLR-07', gps_lat: 12.97, gps_lon: 77.59, network_rtt_ms: 25.0, verdict: 'PASSED' },
    { claim_id: 'CLM-DEMO-005', rider_id: 'fake2', rider_name: 'Syndicate Bot B', fraud_flag: true, confidence_score: 0.08, fraud_score: 0.92, ml_prediction: 'ANOMALY', fraud_reasons: 'DEAD_METADATA_SYNTHETIC_GPS,ML_ISOLATION_FOREST_ANOMALY', zone: 'MZ-CHN-05', gps_lat: 13.04, gps_lon: 80.23, network_rtt_ms: 310.0, verdict: 'BLOCKED' },
    { claim_id: 'CLM-DEMO-006', rider_id: 'demo4', rider_name: 'Sneha Patel', fraud_flag: false, confidence_score: 0.91, fraud_score: 0.09, ml_prediction: 'NORMAL', fraud_reasons: '', zone: 'MZ-DEL-09', gps_lat: 28.64, gps_lon: 77.19, network_rtt_ms: 38.0, verdict: 'PASSED' },
    { claim_id: 'CLM-DEMO-007', rider_id: 'fake3', rider_name: 'Ghost Rider X', fraud_flag: true, confidence_score: 0.05, fraud_score: 0.95, ml_prediction: 'ANOMALY', fraud_reasons: 'VPN_DATACENTER_IP_DETECTED,BSSID_CLUSTER_SYNDICATE_DETECTED', zone: 'MZ-HYD-03', gps_lat: 17.44, gps_lon: 78.35, network_rtt_ms: 420.0, verdict: 'BLOCKED' },
    { claim_id: 'CLM-DEMO-008', rider_id: 'demo5', rider_name: 'Vikram Singh', fraud_flag: false, confidence_score: 0.87, fraud_score: 0.13, ml_prediction: 'NORMAL', fraud_reasons: '', zone: 'MZ-HYD-03', gps_lat: 17.45, gps_lon: 78.38, network_rtt_ms: 41.0, verdict: 'PASSED' },
    { claim_id: 'CLM-DEMO-009', rider_id: 'demo6', rider_name: 'Anita Desai', fraud_flag: false, confidence_score: 0.93, fraud_score: 0.07, ml_prediction: 'NORMAL', fraud_reasons: '', zone: 'MZ-CHN-05', gps_lat: 13.05, gps_lon: 80.24, network_rtt_ms: 22.0, verdict: 'PASSED' },
    { claim_id: 'CLM-DEMO-010', rider_id: 'fake4', rider_name: 'Emulator Farm Z', fraud_flag: true, confidence_score: 0.02, fraud_score: 0.98, ml_prediction: 'ANOMALY', fraud_reasons: 'MOCK_LOCATION_DETECTED,DEAD_METADATA_SYNTHETIC_GPS', zone: 'MZ-MUM-12', gps_lat: 19.10, gps_lon: 72.88, network_rtt_ms: 500.0, verdict: 'BLOCKED' },
  ];
  for (const d of demoData) {
    d.timestamp = '2026-03-24T' + (10 + Math.floor(Math.random() * 12)) + ':00:00';
  }
  await FraudLog.insertMany(demoData);
}

// ── Risk Heatmap ──────────────────────────────────────────────────────────

function getRiskHeatmap() {
  const zoneNames = {
    'MZ-DEL-04': 'Connaught Place, Delhi', 'MZ-DEL-09': 'Karol Bagh, Delhi',
    'MZ-MUM-12': 'Andheri West, Mumbai', 'MZ-BLR-07': 'Koramangala, Bangalore',
    'MZ-HYD-03': 'HITEC City, Hyderabad', 'MZ-CHN-05': 'T. Nagar, Chennai',
    'MZ-PUN-02': 'Hinjewadi, Pune', 'MZ-HYD-08': 'Gachibowli, Hyderabad',
    'MZ-CHN-11': 'Adyar, Chennai',
  };
  const data = [
    ['MZ-DEL-04', 82, 156, 42, 'HIGH', 47.2, 0.0],
    ['MZ-DEL-09', 91, 89, 23, 'CRITICAL', 46.1, 0.0],
    ['MZ-MUM-12', 71, 234, 78, 'HIGH', 34.5, 112.0],
    ['MZ-BLR-07', 45, 312, 89, 'MEDIUM', 31.2, 22.0],
    ['MZ-HYD-03', 58, 178, 56, 'MEDIUM', 38.9, 5.0],
    ['MZ-CHN-05', 76, 145, 38, 'HIGH', 36.7, 95.0],
    ['MZ-PUN-02', 34, 267, 102, 'LOW', 29.4, 8.0],
    ['MZ-HYD-08', 63, 198, 67, 'MEDIUM', 39.5, 3.0],
    ['MZ-CHN-11', 70, 123, 31, 'HIGH', 35.9, 88.0],
  ];
  return data.map(([zoneId, riskScore, totalRiders, insuredRiders, riskLevel, currentTemp, currentRain]) => ({
    zone_id: zoneId,
    zone_name: zoneNames[zoneId] || zoneId,
    risk_score: riskScore,
    total_riders: totalRiders,
    insured_riders: insuredRiders,
    uninsured_riders: totalRiders - insuredRiders,
    insurance_penetration: Math.round((insuredRiders * 100) / totalRiders),
    risk_level: riskLevel,
    current_temp: currentTemp,
    current_rain: currentRain,
  }));
}

// ── Market Status for Admin ───────────────────────────────────────────────

async function getMarketStatusForAdmin() {
  const status = {};
  try {
    const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/oracle/market-health/chennai`);
    const health = res.data;
    if (health) {
      status.crash_detected = health.crash_detected;
      status.order_volume_drop_pct = health.overall_order_volume_drop_pct;
      status.solvency_protocol_active = health.solvency_protocol_triggered;
      status.action = health.action;
      status.recommendation = health.recommendation;
      status.platforms = health.platforms;
    }
  } catch (e) {
    status.crash_detected = false;
    status.order_volume_drop_pct = 0;
    status.solvency_protocol_active = false;
    status.error = 'Oracle unreachable';
  }
  return status;
}

// ── Formatters (Mongoose doc → camelCase JSON) ────────────────────────────

function formatRiderAdmin(r) {
  return {
    id: r._id ? r._id.toHexString() : r.id,
    name: r.name, phone: r.phone, city: r.city, zone: r.zone,
    platform: r.platform, age: r.age, walletBalance: r.wallet_balance,
    isPolicyActive: r.is_policy_active, policyTier: r.policy_tier,
    registeredAt: r.registered_at, referralCode: r.referral_code,
    referredBy: r.referred_by, workerId: r.worker_id, verified: r.verified,
  };
}

function formatPolicy(p) {
  return {
    id: p._id ? p._id.toHexString() : p.id,
    policyNumber: p.policy_number, riderId: p.rider_id, riderName: p.rider_name,
    plan: p.plan, zone: p.zone, premium: p.premium, riskScore: p.risk_score,
    status: p.status, startDate: p.start_date, email: p.email, phone: p.phone,
    address: p.address, birthdate: p.birthdate, customerSince: p.customer_since,
    accountTier: p.account_tier, delinquencyStatus: p.delinquency_status,
  };
}

function formatClaim(c) {
  return {
    id: c._id ? c._id.toHexString() : c.id,
    claimNumber: c.claim_number, policyRef: c.policy_ref, riderId: c.rider_id,
    riderName: c.rider_name, product: c.product, fraudRisk: c.fraud_risk,
    dateOfLoss: c.date_of_loss, status: c.status, triggerType: c.trigger_type,
    amount: c.amount, zone: c.zone, approvedAt: c.approved_at,
  };
}

function formatBillingTransaction(b) {
  return {
    id: b._id ? b._id.toHexString() : b.id,
    txnId: b.txn_id, type: b.type, riderName: b.rider_name,
    amount: b.amount, date: b.date, description: b.description, policyRef: b.policy_ref,
  };
}

function formatFraudLog(f) {
  return {
    id: f._id ? f._id.toHexString() : f.id,
    claimId: f.claim_id, riderId: f.rider_id, riderName: f.rider_name,
    fraudFlag: f.fraud_flag, confidenceScore: f.confidence_score, fraudScore: f.fraud_score,
    mlPrediction: f.ml_prediction, fraudReasons: f.fraud_reasons, zone: f.zone,
    gpsLat: f.gps_lat, gpsLon: f.gps_lon, networkRttMs: f.network_rtt_ms,
    timestamp: f.timestamp, verdict: f.verdict,
  };
}

module.exports = {
  getAllRiders, getAllPolicies, getActivePolicies, getPolicyDetail,
  payManualClaim, triggerManualClaim, getAllClaims, getAutoApprovalLog,
  getTriggerZones, getBillingSummary, getRecentTransactions, getMonthlyTrend,
  getAllFraudLogs, getBlockedFraudLogs, getRiskHeatmap, getMarketStatusForAdmin,
};
