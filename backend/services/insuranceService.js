const axios = require('axios');
const { Rider, PayoutLog, Policy, Claim, FraudLog, ReferralCode, BillingTransaction } = require('../models');

const ORACLE_BASE_URL = process.env.ORACLE_BASE_URL;

// Market crash state
let marketCrashActive = false;
let marketCrashAction = 'NONE';

// ── Getter/Setter for market crash state ──────────────────────────────────
function isMarketCrashActive() { return marketCrashActive; }
function setMarketCrashState(active, action) {
  marketCrashActive = active;
  marketCrashAction = action;
}

// ── Rider Registration ────────────────────────────────────────────────────

async function registerRider(name, phone, city, zone, platform, age, workerId) {
  const rider = await Rider.create({
    name,
    phone,
    city,
    zone,
    platform,
    age: age || 25,
    wallet_balance: 500.0,
    is_policy_active: false,
    policy_tier: null,
    registered_at: new Date().toISOString().split('T')[0],
    worker_id: workerId || '',
    verified: !!(workerId && workerId.length > 0),
    referral_code: 'RW-' + phone.substring(Math.max(0, phone.length - 4)) + '-' + (Date.now() % 10000),
  });
  return formatRider(rider);
}

async function getRider(riderId) {
  // Support both Mongo ObjectId strings and legacy numeric IDs
  const rider = await Rider.findById(riderId).catch(() => null)
    || await Rider.findOne({ phone: riderId }).catch(() => null);
  if (!rider) throw new Error('Rider not found: ' + riderId);
  return rider;
}

async function updateRider(riderId, updates) {
  const rider = await getRider(riderId);
  if (updates.name != null) rider.name = updates.name;
  if (updates.phone != null) rider.phone = updates.phone;
  if (updates.city != null) rider.city = updates.city;
  if (updates.platform != null) rider.platform = updates.platform;
  if (updates.age != null) rider.age = updates.age;
  await rider.save();
  return formatRider(rider);
}

async function getPayouts(riderId) {
  const payouts = await PayoutLog.find({ rider_id: riderId }).sort({ timestamp: -1 });
  return payouts.map(formatPayoutLog);
}

// ── Quote & Policy Purchase ───────────────────────────────────────────────

async function getQuote(riderId) {
  const rider = await getRider(riderId);
  try {
    const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/pricing/forecast-quote?zone=${rider.zone}`);
    return res.data.plans;
  } catch (e) {
    return {
      basic: { premium: 95.0, daily_payout: 300.0 },
      standard: { premium: 143.0, daily_payout: 500.0 },
      pro: { premium: 218.0, daily_payout: 1000.0 },
    };
  }
}

async function buyPolicy(riderId, tier) {
  const rider = await getRider(riderId);

  // ── Item 8: Adverse Selection Lockout ─────────────────────────────────
  // Block new enrollments if a weather red-alert is already active in the rider's zone.
  // This prevents riders from buying coverage only when a storm is imminent (48h rule).
  try {
    const alertRes = await axios.get(`${ORACLE_BASE_URL}/api/v1/pricing/quote?zone=${rider.zone}`);
    const live = alertRes.data;
    if (live && live.payout_triggered === true) {
      throw new Error(
        'ADVERSE_SELECTION_LOCKOUT: A weather red-alert is currently active in zone ' + rider.zone +
        '. New policy enrollment is locked 48 hours before and during active weather events. ' +
        'Please try again after the alert clears.'
      );
    }
  } catch (e) {
    // Only rethrow if it is our lockout error, not an oracle connectivity issue
    if (e.message && e.message.startsWith('ADVERSE_SELECTION_LOCKOUT')) throw e;
  }

  // ── Dynamic Solvency Protocol: Block Pro/Standard during market crash ──
  if (marketCrashActive && (tier.toUpperCase() === 'PRO' || tier.toUpperCase() === 'STANDARD')) {
    throw new Error(
      'MARKET_CRASH_PROTOCOL: ' + tier.toUpperCase() +
      ' tier is temporarily locked. Only Basic tier is available during market crisis.'
    );
  }

  let premium = 0;
  let planName = '';

  try {
    const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/pricing/forecast-quote?zone=${rider.zone}`);
    const plan = res.data.plans[tier.toLowerCase()];
    if (plan) premium = plan.premium;
  } catch (e) {
    switch (tier.toUpperCase()) {
      case 'PRO': premium = 218.0; break;
      case 'STANDARD': premium = 143.0; break;
      default: premium = 95.0;
    }
  }

  switch (tier.toUpperCase()) {
    case 'PRO': planName = 'Heat Shield Pro'; break;
    case 'STANDARD': planName = 'Rain Guard Plus'; break;
    default: planName = 'Heat Shield Basic';
  }

  rider.wallet_balance -= premium;
  rider.is_policy_active = true;
  rider.policy_tier = tier.toUpperCase();
  await rider.save();

  const year = new Date().getFullYear();
  const policyNumber = `POL-GW-${year}-${String(rider.id).slice(-6)}`;
  const today = new Date().toISOString().split('T')[0];

  await Policy.create({
    policy_number: policyNumber,
    rider_id: rider.id,
    rider_name: rider.name,
    zone: rider.zone + ' (' + rider.city + ')',
    plan: planName,
    premium: '₹' + Math.floor(premium) + '/day',
    risk_score: 50,
    status: 'Active',
    start_date: today,
    phone: rider.phone,
    email: rider.name.toLowerCase().replace(/\s+/g, '.') + '@gmail.com',
    address: rider.city,
    birthdate: '2000-01-01',
    customer_since: today,
    account_tier: tier.toUpperCase() === 'PRO' ? 'Gold' : (tier.toUpperCase() === 'STANDARD' ? 'Silver' : 'Bronze'),
    delinquency_status: 'CURRENT',
  });

  await BillingTransaction.create({
    txn_id: 'TXN-PREM-' + Date.now() + '-' + rider.id,
    type: 'PREMIUM',
    rider_name: rider.name,
    amount: premium,
    date: today,
    description: `${planName} weekly premium - ${rider.city}`,
    policy_ref: policyNumber,
  });

  return formatRider(rider);
}

// ── Claim Tracker ────────────────────────────────────────────────────────

async function getClaimTracker(riderId) {
  const rider = await getRider(riderId);
  const tracker = {};

  let stage = 'MONITORING';
  let triggered = false;
  let validated = false;
  let paid = false;

  try {
    const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/pricing/quote?zone=${rider.zone}`);
    const live = res.data;
    if (live && live.payout_triggered === true) {
      triggered = true;
      stage = 'TRIGGER_MET';
      tracker.trigger_type = live.trigger_type || 'WEATHER';
      tracker.weather = { temp: live.live_temp || 30.0, rain: live.live_rain || 0.0 };
    }
  } catch (e) { /* Oracle unreachable */ }

  const payouts = await PayoutLog.find({ rider_id: riderId }).sort({ timestamp: -1 });

  if (payouts.length > 0) {
    const latest = payouts[0];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (latest.timestamp && new Date(latest.timestamp) > twentyFourHoursAgo) {
      paid = true; validated = true; triggered = true;
      stage = 'PAYOUT_SENT';
      tracker.payout_amount = latest.amount;
      tracker.payout_time = latest.timestamp instanceof Date
        ? latest.timestamp.toISOString()
        : String(latest.timestamp);
      tracker.claim_number = latest.claim_number;
    }
  }

  const pendingClaims = await Claim.find({ rider_id: riderId });
  for (const c of pendingClaims) {
    if (c.status === 'Open') {
      validated = false; triggered = true;
      stage = 'VALIDATING_SHIFT';
    }
  }

  tracker.rider_id = riderId;
  tracker.zone = rider.zone;
  tracker.policy_active = rider.is_policy_active;
  tracker.current_stage = stage;
  tracker.pipeline = {
    monitoring_weather: true,
    trigger_met: triggered,
    validating_shift: validated || (triggered && stage === 'VALIDATING_SHIFT'),
    payout_sent: paid,
  };

  return tracker;
}

// ── Market Status ─────────────────────────────────────────────────────────

function getMarketStatus() {
  return {
    crash_active: marketCrashActive,
    action: marketCrashAction,
    pro_tier_locked: marketCrashActive,
    standard_tier_locked: marketCrashActive,
    basic_tier_available: true,
    timestamp: new Date().toISOString(),
  };
}

// ── Referral System ───────────────────────────────────────────────────────

async function generateReferralCode(riderId) {
  const rider = await getRider(riderId);

  const existing = await ReferralCode.findOne({ owner_rider_id: riderId });
  if (existing) {
    return {
      code: existing.code,
      times_used: existing.times_used,
      reward_earned: existing.reward_earned,
      share_message: 'Join RiskWire with my code ' + existing.code + ' and get ₹50 bonus! Download: https://riskwire.app',
    };
  }

  const code = rider.referral_code || ('RW-' + rider.id.toString().slice(-4) + '-' + (Date.now() % 10000));
  await ReferralCode.create({
    code,
    owner_rider_id: riderId,
    owner_name: rider.name,
    times_used: 0,
    reward_earned: 0.0,
    created_at: new Date().toISOString().split('T')[0],
  });

  return {
    code,
    times_used: 0,
    reward_earned: 0.0,
    share_message: 'Join RiskWire with my code ' + code + ' and get ₹50 bonus! Download: https://riskwire.app',
  };
}

async function redeemReferral(riderId, code) {
  const ref = await ReferralCode.findOne({ code });
  if (!ref) throw new Error('Invalid referral code: ' + code);
  if (String(ref.owner_rider_id) === String(riderId)) throw new Error('Cannot use your own referral code');

  const newUser = await getRider(riderId);
  newUser.wallet_balance += 50.0;
  newUser.referred_by = code;
  await newUser.save();

  const owner = await getRider(ref.owner_rider_id);
  owner.wallet_balance += 25.0;
  await owner.save();

  ref.times_used += 1;
  ref.reward_earned += 25.0;
  await ref.save();

  return {
    success: true,
    new_user_bonus: 50.0,
    referrer_bonus: 25.0,
    message: '₹50 added to your wallet!',
  };
}

// ── Format helpers ────────────────────────────────────────────────────────

function formatRider(r) {
  return {
    id: r._id ? r._id.toHexString() : r.id,
    name: r.name,
    phone: r.phone,
    city: r.city,
    zone: r.zone,
    platform: r.platform,
    age: r.age,
    walletBalance: r.wallet_balance,
    isPolicyActive: r.is_policy_active,
    policyTier: r.policy_tier,
    registeredAt: r.registered_at,
    referralCode: r.referral_code,
    referredBy: r.referred_by,
    workerId: r.worker_id,
    verified: r.verified,
  };
}

function formatPayoutLog(p) {
  return {
    id: p._id ? p._id.toHexString() : p.id,
    riderId: p.rider_id,
    amount: p.amount,
    timestamp: p.timestamp,
    triggerType: p.trigger_type,
    zone: p.zone,
    claimNumber: p.claim_number,
  };
}

module.exports = {
  registerRider,
  getRider,
  updateRider,
  getPayouts,
  getQuote,
  buyPolicy,
  getClaimTracker,
  getMarketStatus,
  generateReferralCode,
  redeemReferral,
  formatRider,
  formatPayoutLog,
  isMarketCrashActive,
  setMarketCrashState,
};







