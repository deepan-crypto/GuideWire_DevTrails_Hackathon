// Central API layer for RiskWire backend
// Backend base URL — set EXPO_PUBLIC_API_URL in .env for production
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://riskwire-backend.onrender.com/api/v1';

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

/** Fetch a rider's full profile by id. Accepts MongoDB ObjectId string or legacy numeric id. */
export async function getRider(riderId: string | number): Promise<Rider> {
  return request<Rider>(`/rider/${riderId}`);
}

/** Update rider personal details (name, phone, city, platform, age). */
export async function updateRider(riderId: string | number, updates: Partial<Rider>): Promise<Rider> {
  return request<Rider>(`/rider/${riderId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/** Get payout history for a rider, newest first. */
export async function getPayouts(riderId: string | number): Promise<PayoutLog[]> {
  return request<PayoutLog[]>(`/rider/${riderId}/payouts`);
}

/** Get notifications for a rider. */
export async function getNotifications(riderId: string | number, limit: number = 20): Promise<Notification[]> {
  return request<Notification[]>(`/rider/${riderId}/notifications?limit=${limit}`);
}

/** Mark a notification as read. */
export async function markNotificationAsRead(riderId: string | number, notificationId: string): Promise<Notification> {
  return request<Notification>(`/rider/${riderId}/notifications/${notificationId}/read`, { method: 'POST' });
}


// ── Insurance endpoints ────────────────────────────────────────────

/** Get pricing quote for all tiers for a rider's zone. */
export async function getQuote(riderId: string | number): Promise<QuoteResponse> {
  return request<QuoteResponse>(`/insurance/quote?riderId=${riderId}`);
}

/** Purchase a policy tier (basic | standard | pro). Returns updated Rider. */
export async function buyPolicy(riderId: string | number, tier: string): Promise<Rider> {
  return request<Rider>(`/insurance/buy?riderId=${riderId}&tier=${tier}`, { method: 'POST' });
}

// ── Pricing Engine (Oracle) ────────────────────────────────────────────────
const ORACLE_URL = process.env.EXPO_PUBLIC_ORACLE_URL || 'https://guidewire-devtrails-hackathon.onrender.com';

async function oracleRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${ORACLE_URL}${path}`, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Oracle error ${res.status}`);
  return res.json() as Promise<T>;
}

export interface WeatherQuote {
  zone: string;
  zone_name: string;
  live_temp: number;
  live_rain: number;
  live_humidity: number;
  live_wind_kmh: number;
  live_aqi: number;
  payout_triggered: boolean;
  trigger_type: string | null;
  checks: Record<string, boolean>;
}

export interface ForecastQuote {
  zone: string;
  zone_name: string;
  risk_multiplier: number;
  live_aqi: number;
  forecast_temp: number;
  forecast_rain: number;
  plans: {
    basic: { premium: number; daily_payout: number };
    standard: { premium: number; daily_payout: number };
    pro: { premium: number; daily_payout: number };
  };
}

/** Fetch live weather + trigger status for a zone from the pricing engine. */
export async function getLiveWeather(zone: string): Promise<WeatherQuote> {
  return oracleRequest<WeatherQuote>(`/api/v1/pricing/quote?zone=${encodeURIComponent(zone)}`);
}

/** Fetch ML-computed dynamic pricing for a zone from the pricing engine. */
export async function getDynamicPricing(zone: string): Promise<ForecastQuote> {
  return oracleRequest<ForecastQuote>(`/api/v1/pricing/forecast-quote?zone=${encodeURIComponent(zone)}`);
}

