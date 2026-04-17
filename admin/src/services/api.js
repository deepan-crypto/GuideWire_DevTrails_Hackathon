const API_BASE = import.meta.env.VITE_API_URL || '/api/v1/admin'

async function fetchJSON(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn(`API call failed: ${url}`, err.message)
    return null
  }
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

export async function fetchAnalytics() {
  return await fetchJSON(`${API_BASE}/analytics`)
}
