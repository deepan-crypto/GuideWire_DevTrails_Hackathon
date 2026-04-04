const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-guidewire-devtrails-hackathon.onrender.com/api/v1/admin'
const ROOT_BASE = API_BASE.replace('/api/v1/admin', '/api')

// Retry with exponential backoff to handle Render.com free-tier cold starts
// (server sleeps after inactivity and takes ~15-30s to wake up on first request)
async function fetchJSON(url, retries = 3, baseDelay = 1500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === retries) {
        console.warn(`API call failed after ${retries + 1} attempts: ${url}`, err.message)
        return null
      }
      const delay = baseDelay * Math.pow(2, attempt)  // 1.5s, 3s, 6s
      console.info(`Retrying ${url} in ${delay}ms (attempt ${attempt + 1}/${retries})...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return null
}

export async function fetchRiders() {
  return await fetchJSON(`${API_BASE}/riders`)
}

export async function fetchPolicies() {
  return await fetchJSON(`${API_BASE}/policies`)
}

export async function fetchPolicyDetail(policyNumber) {
  return await fetchJSON(`${API_BASE}/policies/${policyNumber}`)
}

export async function fetchClaims() {
  return await fetchJSON(`${API_BASE}/claims`)
}

export async function fetchTriggerZones() {
  return await fetchJSON(`${API_BASE}/claims/triggers`)
}

export async function fetchApprovalLog() {
  return await fetchJSON(`${API_BASE}/claims/approval-log`)
}

export async function fetchBillingSummary() {
  return await fetchJSON(`${API_BASE}/billing/summary`)
}

export async function fetchTransactions() {
  return await fetchJSON(`${API_BASE}/billing/transactions`)
}

export async function fetchMonthlyTrend() {
  return await fetchJSON(`${API_BASE}/billing/monthly-trend`)
}

// ── Fraud Audit ────────────────────────────────────────────────

export async function fetchFraudLogs() {
  return await fetchJSON(`${API_BASE}/fraud-logs`)
}

export async function fetchBlockedFraudLogs() {
  return await fetchJSON(`${API_BASE}/fraud-logs/blocked`)
}

// ── Risk Heatmap ───────────────────────────────────────────────

export async function fetchRiskHeatmap() {
  return await fetchJSON(`${API_BASE}/risk-heatmap`)
}

// ── Market Status ──────────────────────────────────────────────

export async function fetchMarketStatus() {
  return await fetchJSON(`${API_BASE}/market-status`)
}

// ── Manual Claims ──────────────────────────────────────────────

export async function payManualClaim(riderId) {
  const url = `${API_BASE}/claims/pay/${riderId}`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error in payManualClaim:`, err);
    return null;
  }
}

export async function triggerMarketCrash(payload) {
  const primaryUrl = `${ROOT_BASE}/admin/trigger-claim`;
  const fallbackUrl = `${API_BASE}/trigger-claim`;
  try {
    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    try {
      const res = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (innerErr) {
      console.error(`Error in triggerMarketCrash:`, innerErr);
      return null;
    }
  }
}
