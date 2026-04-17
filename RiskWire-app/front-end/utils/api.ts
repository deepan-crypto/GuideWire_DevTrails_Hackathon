// Central API layer for RiskWire backend
// Backend base URL — set EXPO_PUBLIC_API_URL in .env for production
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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
}

export interface PayoutLog {
  id: number;
  riderId: number;
  amount: number;
  timestamp: string; // ISO datetime
}

export interface Notification {
  _id: string;
  rider_id: string;
  type: 'WEATHER_PAYOUT' | 'POLICY_ACTIVE' | 'CLAIM_APPROVED' | 'INFO';
  title: string;
  message: string;
  amount?: number;
  trigger_type?: string;
  claim_number?: string;
  zone?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface PlanDetail {
  premium: number;
  daily_payout: number;
}

export type QuoteResponse = Record<string, PlanDetail>;

// ── Rider endpoints ────────────────────────────────────────────────

/** Register a new rider after activation form completion. Returns the Rider with its generated id. */
export async function registerRider(data: {
  name: string;
  phone: string;
  city: string;
  zone: string;
  platform: string;
  age: number;
}): Promise<Rider> {
  const params = new URLSearchParams({
    name: data.name,
    phone: data.phone,
    city: data.city,
    zone: data.zone,
    platform: data.platform,
    age: String(data.age),
  });
  return request<Rider>(`/rider/register?${params}`, { method: 'POST' });
}

/** Fetch a rider's full profile by id. */
export async function getRider(riderId: number): Promise<Rider> {
  return request<Rider>(`/rider/${riderId}`);
}

/** Update rider personal details (name, phone, city, platform, age). */
export async function updateRider(riderId: number, updates: Partial<Rider>): Promise<Rider> {
  return request<Rider>(`/rider/${riderId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/** Get payout history for a rider, newest first. */
export async function getPayouts(riderId: number): Promise<PayoutLog[]> {
  return request<PayoutLog[]>(`/rider/${riderId}/payouts`);
}

/** Get notifications for a rider. */
export async function getNotifications(riderId: number, limit: number = 20): Promise<Notification[]> {
  return request<Notification[]>(`/rider/${riderId}/notifications?limit=${limit}`);
}

/** Mark a notification as read. */
export async function markNotificationAsRead(riderId: number, notificationId: string): Promise<Notification> {
  return request<Notification>(`/rider/${riderId}/notifications/${notificationId}/read`, { method: 'POST' });
}

// ── Insurance endpoints ────────────────────────────────────────────

/** Get pricing quote for all tiers for a rider's zone. */
export async function getQuote(riderId: number): Promise<QuoteResponse> {
  return request<QuoteResponse>(`/insurance/quote?riderId=${riderId}`);
}

/** Get dynamic pricing from Oracle for a specific zone (used on home/info pages). */
export async function getDynamicPricing(zone: string = 'MZ-DEL-04'): Promise<{
  zone: string;
  zone_name: string;
  risk_multiplier: number;
  plans: QuoteResponse;
}> {
  const ORACLE_URL = process.env.EXPO_PUBLIC_ORACLE_URL || 'https://guidewire-devtrails-hackathon.onrender.com';
  const res = await fetch(`${ORACLE_URL}/api/v1/pricing/forecast-quote?zone=${zone}`);
  if (!res.ok) {
    throw new Error(`Oracle error ${res.status}`);
  }
  return res.json();
}

/** Purchase a policy tier (basic | standard | pro). Returns updated Rider. */
export async function buyPolicy(riderId: number, tier: string): Promise<Rider> {
  return request<Rider>(`/insurance/buy?riderId=${riderId}&tier=${tier}`, { method: 'POST' });
}
