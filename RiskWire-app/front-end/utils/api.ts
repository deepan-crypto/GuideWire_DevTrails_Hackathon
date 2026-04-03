// Central API layer for RiskWire backend

const BASE_URL = 'https://backend-guidewire-devtrails-hackathon.onrender.com/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────
export interface Rider {
  id: number;
  name: string;
  phone: string;
  city: string;
  zone: string;
  platform: string;
  age: number;
  walletBalance: number;
  isPolicyActive: boolean;
  policyTier: string | null;
  referralCode: string | null;
  referredBy: string | null;
  workerId: string | null;
  verified: boolean;
}

export interface PayoutLog {
  id: number;
  riderId: number;
  amount: number;
  timestamp: string;
  triggerType: string | null;
  zone: string | null;
  claimNumber: string | null;
}

export interface PlanDetail {
  premium: number;
  daily_payout: number;
}

export type QuoteResponse = Record<string, PlanDetail>;

export interface ClaimTrackerResponse {
  rider_id: number;
  zone: string;
  policy_active: boolean;
  current_stage: string;
  pipeline: {
    monitoring_weather: boolean;
    trigger_met: boolean;
    validating_shift: boolean;
    payout_sent: boolean;
  };
  trigger_type?: string;
  weather?: { temp: number; rain: number };
  payout_amount?: number;
  payout_time?: string;
  claim_number?: string;
}

export interface MarketStatusResponse {
  crash_active: boolean;
  action: string;
  pro_tier_locked: boolean;
  standard_tier_locked: boolean;
  basic_tier_available: boolean;
}

export interface ReferralResponse {
  code: string;
  times_used: number;
  reward_earned: number;
  share_message: string;
}

// ── Rider endpoints ────────────────────────────────────────────────

export async function registerRider(data: {
  name: string;
  phone: string;
  city: string;
  zone: string;
  platform: string;
  age: number;
  workerId?: string;
}): Promise<Rider> {
  const params = new URLSearchParams({
    name: data.name,
    phone: data.phone,
    city: data.city,
    zone: data.zone,
    platform: data.platform,
    age: String(data.age),
    workerId: data.workerId || '',
  });
  return request<Rider>(`/rider/register?${params}`, { method: 'POST' });
}

export async function getRider(riderId: number): Promise<Rider> {
  return request<Rider>(`/rider/${riderId}`);
}

export async function updateRider(riderId: number, updates: Partial<Rider>): Promise<Rider> {
  return request<Rider>(`/rider/${riderId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function getPayouts(riderId: number): Promise<PayoutLog[]> {
  return request<PayoutLog[]>(`/rider/${riderId}/payouts`);
}

// ── Insurance endpoints ────────────────────────────────────────────

export async function getQuote(riderId: number): Promise<QuoteResponse> {
  return request<QuoteResponse>(`/insurance/quote?riderId=${riderId}`);
}

export async function buyPolicy(riderId: number, tier: string): Promise<Rider> {
  return request<Rider>(`/insurance/buy?riderId=${riderId}&tier=${tier}`, { method: 'POST' });
}

// ── Claim Tracker ──────────────────────────────────────────────────

export async function getClaimTracker(riderId: number): Promise<ClaimTrackerResponse> {
  return request<ClaimTrackerResponse>(`/insurance/claim-tracker?riderId=${riderId}`);
}

// ── Market Status ──────────────────────────────────────────────────

export async function getMarketStatus(): Promise<MarketStatusResponse> {
  return request<MarketStatusResponse>(`/insurance/market-status`);
}

// ── Referral System ────────────────────────────────────────────────

export async function generateReferral(riderId: number): Promise<ReferralResponse> {
  return request<ReferralResponse>(`/insurance/referral/generate?riderId=${riderId}`, { method: 'POST' });
}

export async function redeemReferral(riderId: number, code: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/insurance/referral/redeem?riderId=${riderId}&code=${code}`,
    { method: 'POST' }
  );
}
