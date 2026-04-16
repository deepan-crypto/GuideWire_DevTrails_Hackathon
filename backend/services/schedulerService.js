const cron = require('node-cron');
const axios = require('axios');
const { Rider, PayoutLog, Claim, FraudLog } = require('../models');
const { isMarketCrashActive, setMarketCrashState } = require('./insuranceService');

const ORACLE_BASE_URL = process.env.ORACLE_BASE_URL;

// ── Actuarial Engine with Dual Validation + Fraud Check ──────────────────
// Runs every hour at minute 0

async function runActuarialEngine() {
  console.log('[Scheduler] Running actuarial engine...');

  // Find distinct active zones using Mongoose
  const activeRiders = await Rider.find({ is_policy_active: true });
  const zonesSet = new Set(activeRiders.map(r => r.zone));
  const zones = [...zonesSet];

  for (const zone of zones) {
    try {
      // Layer 1: External Weather Disruption Check
      let live;
      try {
        const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/pricing/quote?zone=${zone}`);
        live = res.data;
      } catch (e) { continue; }
      if (!live || live.payout_triggered !== true) continue;

      // Layer 2: Platform Status (Dual Validation)
      let platformDisrupted = true;
      try {
        const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/oracle/platform-status/${zone}`);
        if (res.data) platformDisrupted = res.data.disruption_confirmed === true;
      } catch (e) { platformDisrupted = true; }
      if (!platformDisrupted) continue;

      // Get riders in this zone with active policies
      const ridersInZone = await Rider.find({ zone, is_policy_active: true });

      for (const rider of ridersInZone) {
        // Layer 3: Fraud Verification
        let isFraud = false;
        try {
          const claimId = 'CLM-AUTO-' + rider._id + '-' + Date.now();
          const unifiedPayload = {
            request_id: 'req_' + Date.now(),
            claim_context: {
              claim_id: claimId,
              user_id: rider.worker_id || String(rider._id),
              disruption_type: 'Heavy Rain',
              hours: 4,
              note: 'Auto-parametric trigger',
              claim_timestamp: new Date().toISOString(),
              claim_location: { lat: 13.08, lng: 80.27 },
              evidence: [],
            },
            current_location: { lat: 13.08, lng: 80.27, accuracy: 10, source: 'gps' },
            location_history_last_1h: [],
            user_profile: {
              segment: 'transportation',
              platform: rider.platform || 'Unknown',
              zone: rider.zone,
              work_shift: 'day',
              work_hours: 8,
              daily_earnings: rider.wallet_balance > 0 ? rider.wallet_balance : 1000.0,
              order_capacity: 50,
            },
            policy_context: { tier: rider.policy_tier, active: true, fraud_strike_count: 0 },
            previous_claims: {
              window_days: 90, total_count: 0, approved_count: 0, pending_count: 0,
              rejected_count: 0, fraud_flag_count: 0, avg_ai_score: 0.5, recent: [],
            },
          };

          const fraudRes = await axios.post(`${ORACLE_BASE_URL}/v1/claims/fraud-score`, unifiedPayload);
          const fraudCheck = fraudRes.data;

          if (fraudCheck) {
            isFraud = fraudCheck.fraud_flag === true;
            await FraudLog.create({
              claim_id: claimId,
              rider_id: rider._id,
              rider_name: rider.name,
              fraud_flag: fraudCheck.fraud_flag,
              confidence_score: 1.0 - (fraudCheck.fraud_score || 0.0),
              fraud_score: fraudCheck.fraud_score,
              ml_prediction: isFraud ? 'FRAUD' : 'NORMAL',
              fraud_reasons: fraudCheck.reason_codes ? fraudCheck.reason_codes.join(',') : '',
              zone,
              gps_lat: 13.08,
              gps_lon: 80.27,
              network_rtt_ms: 35.0,
              timestamp: new Date().toISOString(),
              verdict: isFraud ? 'BLOCKED' : 'PASSED',
            });
          }
        } catch (e) { /* Fail-open for rider safety */ }

        if (isFraud) continue;

        // Execute Payout
        let amount;
        switch (rider.policy_tier) {
          case 'STANDARD': amount = 500.0; break;
          case 'PRO': amount = 1000.0; break;
          default: amount = 300.0;
        }

        if (isMarketCrashActive() && rider.policy_tier !== 'BASIC') amount = 300.0;

        rider.wallet_balance += amount;
        rider.is_policy_active = false;
        await rider.save();

        const now = new Date();
        const claimNumber = 'CLM-' + Date.now() + '-' + rider._id;
        const year = now.getFullYear();
        const today = now.toISOString().split('T')[0];

        await PayoutLog.create({
          rider_id: rider._id,
          amount,
          timestamp: now,
          trigger_type: 'WEATHER_PARAMETRIC',
          zone,
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
          status: 'AUTO-APPROVED',
          trigger_type: 'WEATHER',
          amount,
          zone,
          approved_at: now.toISOString(),
        });
      }
    } catch (e) {
      console.error(`[Scheduler] Zone ${zone} processing failed:`, e.message);
    }
  }
  console.log('[Scheduler] Actuarial engine completed.');
}

// ── Market Crash Monitor (Dynamic Solvency Protocol) ─────────────────────
// Runs every 30 minutes

async function runMarketCrashMonitor() {
  console.log('[Scheduler] Running market crash monitor...');
  const cities = ['chennai', 'delhi', 'mumbai', 'bangalore', 'hyderabad'];

  for (const city of cities) {
    try {
      const res = await axios.get(`${ORACLE_BASE_URL}/api/v1/oracle/market-health/${city}`);
      const health = res.data;
      if (health && health.crash_detected === true) {
        setMarketCrashState(true, 'LOCK_PRO_STANDARD_TIERS');
        console.log('[Scheduler] Market crash detected in', city);
        return;
      }
    } catch (e) { /* Continue checking other cities */ }
  }

  setMarketCrashState(false, 'NONE');
  console.log('[Scheduler] No market crash detected.');
}

// ── Item 6: UPI Auto-Debit — Weekly Premium Collection ────────────────────
// Runs every Monday at 09:00 IST (03:30 UTC)
// Simulates UPI auto-pay mandate: micro-deducts weekly premiums from wallet.
// No manual card entry required — completely frictionless.

async function runWeeklyPremiumAutoDebit() {
  console.log('[Scheduler] Running weekly UPI auto-debit for premium collection...');
  const { BillingTransaction } = require('../models');

  const WEEKLY_PREMIUMS = { BASIC: 95.0, STANDARD: 143.0, PRO: 218.0 };
  const activeRiders = await Rider.find({ is_policy_active: true });

  let debited = 0, failed = 0;
  const today = new Date().toISOString().split('T')[0];

  for (const rider of activeRiders) {
    const weeklyPremium = WEEKLY_PREMIUMS[rider.policy_tier] || 95.0;

    // Low balance check — warn but still deduct (like a real UPI mandate)
    if (rider.wallet_balance < weeklyPremium) {
      console.warn(`[AutoDebit] Low balance for rider ${rider._id} (${rider.name}): ₹${rider.wallet_balance} < ₹${weeklyPremium}`);
      // Suspend policy if insufficient funds
      rider.is_policy_active = false;
      await rider.save();
      failed++;
      continue;
    }

    // Deduct weekly premium via UPI auto-mandate simulation
    rider.wallet_balance -= weeklyPremium;
    await rider.save();

    // Log billing transaction
    await BillingTransaction.create({
      txn_id: 'TXN-UPI-AUTO-' + Date.now() + '-' + rider._id,
      type: 'PREMIUM',
      rider_name: rider.name,
      amount: weeklyPremium,
      date: today,
      description: `Weekly UPI auto-debit — ${rider.policy_tier} tier — ${rider.city}`,
      policy_ref: `POL-GW-${new Date().getFullYear()}-${String(rider._id).slice(-6)}`,
    });

    debited++;
  }

  console.log(`[AutoDebit] Weekly UPI auto-debit complete. Debited: ${debited}, Suspended (low balance): ${failed}`);
}

// ── Start scheduled tasks ──────────────────────────────────────────────────

function startSchedulers() {
  // Actuarial engine: every hour
  cron.schedule('0 * * * *', () => {
    runActuarialEngine().catch(e => console.error('[Scheduler] Actuarial engine error:', e.message));
  });

  // Market crash monitor: every 30 min
  cron.schedule('30 * * * *', () => {
    runMarketCrashMonitor().catch(e => console.error('[Scheduler] Market crash monitor error:', e.message));
  });

  // Item 6: UPI Auto-Debit — every Monday 09:00 IST (03:30 UTC)
  // Frictionless micro-premium deduction via UPI mandate — no manual card entry
  cron.schedule('30 3 * * 1', () => {
    runWeeklyPremiumAutoDebit().catch(e => console.error('[Scheduler] UPI auto-debit error:', e.message));
  });

  console.log('[Scheduler] Cron jobs registered: actuarial engine (hourly), market crash monitor (30 min), UPI auto-debit (weekly Monday 09:00 IST)');
}

module.exports = { startSchedulers, runActuarialEngine, runMarketCrashMonitor, runWeeklyPremiumAutoDebit };
