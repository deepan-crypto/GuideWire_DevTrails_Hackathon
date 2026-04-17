import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {
  Bell, CheckCircle2, CloudRain, AlertCircle,
  MapPin, Briefcase, IndianRupee, FileText, Activity, RefreshCw,
} from 'lucide-react-native';
import { useFocusEffect, router } from 'expo-router';
import { getCachedRiderId } from '@/utils/onboardingState';
import { getRider, getPayouts, getNotifications, getLiveWeather, Rider, PayoutLog } from '@/utils/api';

const PB_NAVY = '#0F4C81';

// City → zone code mapping (must match ZONE_REGISTRY in pricing engine)
const CITY_ZONE: Record<string, string> = {
  'Delhi': 'MZ-DEL-04', 'New Delhi': 'MZ-DEL-04',
  'Mumbai': 'MZ-MUM-01', 'Bengaluru': 'MZ-BLR-02', 'Bangalore': 'MZ-BLR-02',
  'Chennai': 'MZ-CHN-03', 'Hyderabad': 'MZ-HYD-05',
  'Pune': 'MZ-PUN-06', 'Kolkata': 'MZ-KOL-07', 'Ahmedabad': 'MZ-AMD-08',
};

function getRiskLabel(multiplier: number): string {
  if (multiplier >= 1.8) return 'High Risk';
  if (multiplier >= 1.2) return 'Medium Risk';
  return 'Low Risk';
}

function getRiskColor(multiplier: number): string {
  if (multiplier >= 1.8) return '#F44336';
  if (multiplier >= 1.2) return '#FFB300';
  return '#4CAF50';
}

export default function WorkerDashboardTab() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [weather, setWeather] = useState<{
    live_rain: number; live_temp: number; live_aqi: number;
    payout_triggered: boolean; trigger_type: string | null;
    zone_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    const riderId = getCachedRiderId();
    if (!riderId) { setLoading(false); return; }

    try {
      const [riderData, payoutData, notifData] = await Promise.all([
        getRider(riderId),
        getPayouts(riderId),
        getNotifications(riderId, 50),
      ]);
      setRider(riderData);
      setPayouts(payoutData);
      setUnreadCount(notifData.filter((n: any) => !n.is_read).length);

      // Fetch live weather for the rider's zone
      const zone = CITY_ZONE[riderData.city] || riderData.zone || 'MZ-DEL-04';
      try {
        const wx = await getLiveWeather(zone);
        setWeather(wx);
      } catch { /* Weather optional */ }

      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch { /* Keep old state on error */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const totalPaid = payouts.reduce((s, p) => s + p.amount, 0);
  const approvedCount = payouts.length;
  const riskMultiplier = weather ? (weather.payout_triggered ? 1.8 : 1.0) : 1.0;
  const riskScore = Math.round(riskMultiplier * 50) / 100;

  const displayName = rider?.name ?? '—';
  const displayInitial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PB_NAVY} />
        <Text style={{ color: '#666', marginTop: 12 }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Worker Dashboard</Text>
          <Text style={styles.headerSubtitle}>RiskWire Parametric Insurance</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadAll}>
            <RefreshCw size={16} color={PB_NAVY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications' as any)}>
            <Bell size={20} color="#666" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Alerts from live data */}
        <View style={styles.alertsContainer}>
          {weather?.payout_triggered && (
            <View style={[styles.alertBox, styles.alertBlue]}>
              <Bell size={16} color="#0066CC" />
              <Text style={[styles.alertText, { color: '#0066CC' }]}>
                {weather.trigger_type?.replace(/_/g, ' ')} detected in {weather.zone_name}.
              </Text>
            </View>
          )}
          {payouts.slice(0, 2).map(p => (
            <View key={String(p.id)} style={[styles.alertBox, styles.alertGreen]}>
              <CheckCircle2 size={16} color="#2E7D32" />
              <Text style={[styles.alertText, { color: '#2E7D32' }]}>
                Payout ₹{p.amount} credited — {new Date(p.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          ))}
          {!weather?.payout_triggered && payouts.length === 0 && (
            <View style={[styles.alertBox, { backgroundColor: '#F8F9FA', borderColor: '#E5E9F2' }]}>
              <CheckCircle2 size={16} color="#4CAF50" />
              <Text style={[styles.alertText, { color: '#4CAF50' }]}>No active weather triggers in your zone.</Text>
            </View>
          )}
        </View>

        {/* Top Row Cards */}
        <View style={styles.row}>
          {/* Profile Card — live */}
          <View style={[styles.card, { flex: 1.2 }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayInitial}</Text>
              </View>
              <View>
                <Text style={styles.profileName}>{rider?.name ?? '—'}</Text>
                <Text style={styles.profileType}>Gig Worker</Text>
              </View>
            </View>
            <View style={styles.profileDetailsRow}><MapPin size={14} color="#666" /><Text style={styles.profileDetailText}>{rider?.zone || rider?.city || '—'}</Text></View>
            <View style={styles.profileDetailsRow}><Briefcase size={14} color="#666" /><Text style={styles.profileDetailText}>{rider?.platform ?? '—'}</Text></View>
            <View style={styles.profileDetailsRow}><IndianRupee size={14} color="#666" /><Text style={styles.profileDetailText}>Wallet ₹{rider?.walletBalance ?? 0}</Text></View>
            <View style={styles.profileDetailsRow}><FileText size={14} color="#666" /><Text style={styles.profileDetailText}>
              POL-GW-{new Date().getFullYear()}-{String(rider?.id ?? '').slice(-6).padStart(6, '0')}
            </Text></View>
          </View>

          {/* Policy Card — live */}
          <View style={[styles.card, styles.darkCard, { flex: 1.5 }]}>
            <View style={styles.darkCardHeader}>
              <Text style={styles.darkCardTitle}>POLICY DETAILS</Text>
              <View style={styles.activeTag}>
                <CheckCircle2 size={12} color={rider?.isPolicyActive ? '#4CAF50' : '#FF9800'} />
                <Text style={[styles.activeTagText, { color: rider?.isPolicyActive ? '#4CAF50' : '#FF9800' }]}>
                  {rider?.isPolicyActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Plan Tier</Text>
              <Text style={styles.darkCardValueLarge}>{rider?.policyTier ?? '—'}</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Platform</Text>
              <Text style={styles.darkCardValue}>{rider?.platform ?? '—'}</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Zone</Text>
              <Text style={styles.darkCardValue}>{rider?.zone || rider?.city || '—'}</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Total Paid Out</Text>
              <Text style={styles.darkCardValue}>₹{totalPaid}</Text>
            </View>
          </View>
        </View>

        {/* Risk Indicator — live from weather */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardSectionTitle}>RISK INDICATOR</Text>
            <View style={styles.riskHeaderRow}>
              <Text style={styles.riskLabel}>Risk Score</Text>
              <Text style={[styles.riskBadge, { color: getRiskColor(riskMultiplier), backgroundColor: `${getRiskColor(riskMultiplier)}15` }]}>
                {getRiskLabel(riskMultiplier)}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(riskMultiplier / 2.5 * 100, 100)}%`, backgroundColor: getRiskColor(riskMultiplier) }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>0</Text>
              <Text style={[styles.progressLabelText, { color: '#1A1A24', fontWeight: 'bold' }]}>{riskScore.toFixed(2)}</Text>
              <Text style={styles.progressLabelText}>1.0</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statMiniBox}><Text style={styles.statMiniValue}>{approvedCount}</Text><Text style={styles.statMiniLabel}>Total</Text></View>
              <View style={styles.statMiniBox}><Text style={[styles.statMiniValue, { color: '#4CAF50' }]}>{approvedCount}</Text><Text style={styles.statMiniLabel}>Approved</Text></View>
              <View style={styles.statMiniBox}><Text style={[styles.statMiniValue, { color: '#FF9800' }]}>0</Text><Text style={styles.statMiniLabel}>Flagged</Text></View>
            </View>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.row}>
          {/* Disruption Monitor — live weather */}
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.cardHeaderFlex}>
              <View style={styles.cardTitleRow}>
                <Activity size={18} color="#0066CC" />
                <Text style={styles.cardTitle}>Disruption Monitor</Text>
              </View>
              <View style={styles.cachedTag}>
                <Text style={styles.cachedTagText}>{weather ? 'LIVE' : 'N/A'}</Text>
              </View>
            </View>
            <Text style={styles.updateText}>
              {lastUpdated ? `Updated ${lastUpdated} · auto-refreshes on focus` : 'Not yet loaded'}
            </Text>
            {weather ? (
              <>
                {weather.payout_triggered && (
                  <View style={styles.disruptionAlert}>
                    <MapPin size={12} color="#D32F2F" />
                    <Text style={styles.disruptionAlertText}>
                      {weather.trigger_type?.replace(/_/g, ' ')} — {weather.zone_name}
                    </Text>
                  </View>
                )}
                <View style={styles.weatherBox}>
                  <View style={styles.weatherRow}><CloudRain size={16} color="#0066CC" /><Text style={styles.weatherLabel}>Rainfall</Text></View>
                  <Text style={styles.weatherValueBlue}>{weather.live_rain.toFixed(1)} mm</Text>
                </View>
                <View style={[styles.weatherBox, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
                  <View style={styles.weatherRow}><Text style={styles.tempIcon}>🌡️</Text><Text style={[styles.weatherLabel, { color: '#E65100' }]}>Temperature</Text></View>
                  <Text style={styles.weatherValueOrange}>{weather.live_temp.toFixed(1)}°C</Text>
                </View>
              </>
            ) : (
              <Text style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                Weather data unavailable
              </Text>
            )}
          </View>

          {/* Claim Statistics — live from payouts */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Claim Statistics</Text>
            {[
              { label: 'Total Claims', val: String(approvedCount), color: '#1A1A24', bg: '#F0F4F8', icon: FileText },
              { label: 'Approved', val: String(approvedCount), color: '#4CAF50', bg: '#E8F5E9', icon: CheckCircle2 },
              { label: 'Flagged', val: '0', color: '#F44336', bg: '#FFEBEE', icon: AlertCircle },
            ].map(r => (
              <View key={r.label} style={styles.claimRow}>
                <View style={styles.claimLeft}>
                  <View style={[styles.claimIcon, { backgroundColor: r.bg }]}><r.icon size={14} color={r.color} /></View>
                  <Text style={styles.claimLbl}>{r.label}</Text>
                </View>
                <Text style={[styles.claimVal, { color: r.color }]}>{r.val}</Text>
              </View>
            ))}
            <View style={styles.claimRowBorder}>
              <View style={styles.claimLeft}>
                <View style={[styles.claimIcon, { backgroundColor: '#E3F2FD' }]}><IndianRupee size={14} color="#2196F3" /></View>
                <Text style={styles.claimLbl}>Total Compensation</Text>
              </View>
              <Text style={[styles.claimVal, { color: '#2196F3' }]}>₹{totalPaid}</Text>
            </View>
          </View>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A24' },
  headerSubtitle: { fontSize: 12, color: '#8898AA', marginTop: 2 },
  refreshBtn: { padding: 8, backgroundColor: '#F4F7FB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E9F2' },
  notificationBtn: { position: 'relative', padding: 4 },
  notificationBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#F44336', width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  content: { padding: 16, gap: 16 },
  alertsContainer: { gap: 8 },
  alertBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 10 },
  alertBlue: { backgroundColor: '#F0F7FF', borderColor: '#D4E8FF' },
  alertGreen: { backgroundColor: '#F1FDF5', borderColor: '#C8E6C9' },
  alertText: { fontSize: 13, fontWeight: '500', flex: 1 },
  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E9F2', minWidth: 280 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: PB_NAVY, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24' },
  profileType: { fontSize: 12, color: '#8898AA' },
  profileDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  profileDetailText: { fontSize: 13, color: '#525F7F' },
  darkCard: { backgroundColor: '#1C2536', borderColor: '#1C2536' },
  darkCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  darkCardTitle: { color: '#8898AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(76,175,80,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeTagText: { color: '#4CAF50', fontSize: 11, fontWeight: 'bold' },
  darkCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  darkCardLabel: { color: '#8898AA', fontSize: 13 },
  darkCardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  darkCardValueLarge: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  darkCardValueUnit: { fontSize: 14, fontWeight: 'normal', color: '#8898AA' },
  cardSectionTitle: { color: '#8898AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 16 },
  riskHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  riskLabel: { fontSize: 14, color: '#525F7F', fontWeight: '500' },
  riskBadge: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  progressBarBg: { height: 8, backgroundColor: '#F4F7FB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  progressLabelText: { fontSize: 11, color: '#8898AA' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statMiniBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statMiniValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1A24', marginBottom: 4 },
  statMiniLabel: { fontSize: 11, color: '#8898AA' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24', marginBottom: 12 },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cachedTag: { backgroundColor: '#F4F7FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E5E9F2' },
  cachedTagText: { fontSize: 10, fontWeight: 'bold', color: '#8898AA' },
  updateText: { fontSize: 11, color: '#8898AA', marginBottom: 12, marginTop: 4 },
  disruptionAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, marginBottom: 12 },
  disruptionAlertText: { fontSize: 12, color: '#D32F2F', flex: 1 },
  weatherBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D4E8FF', marginBottom: 8 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weatherLabel: { fontSize: 13, color: '#0066CC', fontWeight: '500' },
  tempIcon: { fontSize: 16 },
  weatherValueBlue: { fontSize: 16, fontWeight: 'bold', color: '#0066CC' },
  weatherValueOrange: { fontSize: 16, fontWeight: 'bold', color: '#E65100' },
  claimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  claimRowBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  claimLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  claimIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  claimLbl: { fontSize: 13, color: '#525F7F' },
  claimVal: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24' },
});
