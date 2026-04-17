import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CloudRain, Thermometer, Wind, RefreshCw } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { getCachedRiderId } from '@/utils/onboardingState';
import { getRider, getLiveWeather, getNotifications, getPayouts } from '@/utils/api';

const PB_NAVY = '#0F4C81';
const PB_GREEN = '#00C37B';
const PB_ORANGE = '#FF5722';

// City → zone code mapping
const CITY_ZONE: Record<string, string> = {
  'Delhi': 'MZ-DEL-04', 'New Delhi': 'MZ-DEL-04',
  'Mumbai': 'MZ-MUM-01', 'Bengaluru': 'MZ-BLR-02', 'Bangalore': 'MZ-BLR-02',
  'Chennai': 'MZ-CHN-03', 'Hyderabad': 'MZ-HYD-05',
  'Pune': 'MZ-PUN-06', 'Kolkata': 'MZ-KOL-07', 'Ahmedabad': 'MZ-AMD-08',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function UpdatesTab() {
  const [loading, setLoading] = useState(true);
  const [lastTime, setLastTime] = useState('');
  const [weather, setWeather] = useState<{
    live_rain: number; live_temp: number; live_wind_kmh: number;
    live_aqi: number; payout_triggered: boolean; trigger_type: string | null;
    zone_name: string; zone: string;
  } | null>(null);
  const [riderInfo, setRiderInfo] = useState<{ zone: string; city: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const riderId = getCachedRiderId();
    if (!riderId) { setLoading(false); return; }
    try {
      const [rider, notifs, pouts] = await Promise.all([
        getRider(riderId),
        getNotifications(riderId, 20),
        getPayouts(riderId),
      ]);
      setRiderInfo({ zone: rider.zone || '', city: rider.city || '' });
      setNotifications(notifs || []);
      setPayouts(pouts || []);

      const zone = CITY_ZONE[rider.city] || rider.zone || 'MZ-DEL-04';
      try {
        const wx = await getLiveWeather(zone);
        setWeather(wx);
      } catch { /* Weather is optional */ }

      setLastTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch { /* Keep stale data */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const totalPaid = payouts.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  /* ---- helper to decide risk level ---- */
  const triggerActive = weather?.payout_triggered;
  const riskLevel = triggerActive ? '🔴 High Risk' : (weather ? '🟡 Medium Risk' : '🟢 Low Risk');
  const riskScore = triggerActive ? 0.85 : 0.42;
  const riskColor = triggerActive ? '#D32F2F' : '#D97706';

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PB_NAVY} />
        <Text style={{ color: '#666', marginTop: 12 }}>Loading updates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Updates</Text>
          <Text style={styles.headerSubtitle}>Weather · Alerts · Policy Changes</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadAll}>
          <RefreshCw size={18} color={PB_NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Live Weather */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌦 Live Weather — {weather?.zone_name ?? riderInfo?.city ?? 'Your Zone'}</Text>
            <Text style={styles.sectionMeta}>{lastTime ? `${lastTime}` : 'Loading...'}</Text>
          </View>
          {weather ? (
            <View style={styles.weatherRow}>
              {[
                { label: 'Rainfall', val: `${weather.live_rain.toFixed(1)} mm`, color: '#2563EB', bg: '#EFF6FF', Icon: CloudRain, trend: weather.live_rain > 50 ? '↑ Heavy' : weather.live_rain > 15 ? '↑ Moderate' : '→ Light' },
                { label: 'Temperature', val: `${weather.live_temp.toFixed(1)}°C`, color: '#E65100', bg: '#FFF3E0', Icon: Thermometer, trend: weather.live_temp > 38 ? '↑ Extreme' : weather.live_temp > 30 ? '↑ Hot' : '→ Normal' },
                { label: 'Wind Speed', val: `${(weather.live_wind_kmh || 0).toFixed(0)} km/h`, color: '#6B7280', bg: '#F3F4F6', Icon: Wind, trend: '→ Normal' },
              ].map(w => (
                <View key={w.label} style={[styles.weatherCard, { backgroundColor: w.bg }]}>
                  <w.Icon size={22} color={w.color} />
                  <Text style={[styles.weatherVal, { color: w.color }]}>{w.val}</Text>
                  <Text style={styles.weatherLabel}>{w.label}</Text>
                  <View style={[styles.trendPill, { borderColor: w.color }]}>
                    <Text style={[styles.trendText, { color: w.color }]}>{w.trend}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Weather data unavailable. Check your connection.</Text>
            </View>
          )}
        </View>

        {/* Claim Alerts — from real notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Recent Alerts</Text>
          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No alerts yet. You'll see weather payouts here.</Text>
            </View>
          ) : notifications.slice(0, 5).map((n: any) => {
            const isSuccess = n.type === 'CLAIM_APPROVED' || n.type === 'WEATHER_PAYOUT' || n.type === 'POLICY_ACTIVE';
            const color = isSuccess ? PB_GREEN : PB_ORANGE;
            const bg = isSuccess ? '#F0FDF4' : '#FFF5F0';
            const border = isSuccess ? '#86EFAC' : '#FDBA74';
            const icon = n.type === 'WEATHER_PAYOUT' ? '⛈️' : n.type === 'POLICY_ACTIVE' ? '✅' : n.type === 'CLAIM_APPROVED' ? '💰' : 'ℹ️';
            return (
              <View key={n._id} style={[styles.alertCard, { backgroundColor: bg, borderColor: border }]}>
                <View style={[styles.alertIconBox, { backgroundColor: bg }]}>
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.alertTitleRow}>
                    <Text style={[styles.alertTitle, { color }]}>{n.title}</Text>
                    <Text style={styles.alertTime}>{relativeTime(n.created_at)}</Text>
                  </View>
                  <Text style={styles.alertDesc}>{n.message}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Zone Status — live */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Your Zone Status</Text>
          <View style={styles.zoneCard}>
            <View style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>Zone</Text>
              <Text style={styles.zoneVal}>{weather?.zone_name ?? riderInfo?.city ?? '—'}</Text>
            </View>
            <View style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>Risk Level</Text>
              <View style={[styles.riskBadge, { backgroundColor: triggerActive ? '#FFEBEE' : '#FFFBEB' }]}>
                <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLevel}</Text>
              </View>
            </View>
            <View style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>Trigger Status</Text>
              <View style={[styles.triggerBadge, { backgroundColor: triggerActive ? '#FFEBEE' : '#F0FDF4' }]}>
                <Text style={[styles.triggerBadgeText, { color: triggerActive ? '#D32F2F' : PB_GREEN }]}>
                  {triggerActive ? `⚡ ${weather?.trigger_type?.replace(/_/g, ' ')}` : '✓ No Active Trigger'}
                </Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Risk Score</Text>
                <Text style={styles.progressVal}>{riskScore.toFixed(2)} / 1.0</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${riskScore * 100}%`, backgroundColor: riskColor }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Policy / Payout History — live */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Payout History</Text>
          {payouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No payouts yet. When a weather trigger fires in your zone, you'll be paid here automatically.</Text>
            </View>
          ) : payouts.slice(0, 5).map((p: any) => (
            <View key={String(p.id)} style={styles.policyCard}>
              <Text style={styles.policyEmoji}>💰</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>₹{p.amount} Payout Credited</Text>
                <Text style={styles.policyDesc}>Parametric trigger — Zone disruption detected automatically by RiskWire sensors.</Text>
                <Text style={styles.policyTime}>{new Date(p.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
          ))}
          {payouts.length > 0 && (
            <View style={[styles.policyCard, { borderBottomWidth: 0 }]}>
              <Text style={styles.policyEmoji}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>Lifetime Payout: ₹{totalPaid}</Text>
                <Text style={styles.policyDesc}>{payouts.length} successful parametric claim{payouts.length !== 1 ? 's' : ''} so far.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    backgroundColor: '#FFFFFF', paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: PB_NAVY },
  headerSubtitle: { fontSize: 12, color: '#8898AA', marginTop: 3 },
  refreshBtn: { padding: 10, backgroundColor: '#F4F7FB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E9F2' },
  content: { padding: 16, gap: 20 },
  section: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A24', marginBottom: 12 },
  sectionMeta: { fontSize: 11, color: PB_GREEN, fontWeight: '700' },
  weatherRow: { flexDirection: 'row', gap: 10 },
  weatherCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  weatherVal: { fontSize: 17, fontWeight: '900' },
  weatherLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  trendPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  trendText: { fontSize: 10, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#E5E9F2', alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  alertCard: {
    flexDirection: 'row', gap: 12, borderRadius: 14, padding: 14,
    borderWidth: 1, marginBottom: 10, alignItems: 'flex-start',
  },
  alertIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
  alertTime: { fontSize: 11, color: '#9CA3AF' },
  alertDesc: { fontSize: 12, color: '#444', lineHeight: 18 },
  zoneCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#E5E9F2', gap: 14,
  },
  zoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneLabel: { fontSize: 13, color: '#8898AA', fontWeight: '600' },
  zoneVal: { fontSize: 13, color: '#1A1A24', fontWeight: '700' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  riskBadgeText: { fontSize: 12, fontWeight: '700' },
  triggerBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  triggerBadgeText: { fontSize: 12, fontWeight: '700' },
  progressSection: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: '#8898AA' },
  progressVal: { fontSize: 12, fontWeight: '700', color: '#1A1A24' },
  progressBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  policyCard: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'flex-start',
  },
  policyEmoji: { fontSize: 24 },
  policyTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A24', marginBottom: 4 },
  policyDesc: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 4 },
  policyTime: { fontSize: 11, color: '#9CA3AF' },
});
