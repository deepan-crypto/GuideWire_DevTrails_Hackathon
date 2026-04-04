import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Bell, CheckCircle2, CloudRain, AlertCircle,
  MapPin, Briefcase, IndianRupee, FileText, Activity,
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { getCachedRiderId, loadOnboardingState } from '@/utils/onboardingState';
import { getRider, getPayouts, Rider, PayoutLog } from '@/utils/api';

const PB_NAVY = '#0F4C81';
const API = 'https://backend-guidewire-devtrails-hackathon.onrender.com/api/v1';

const PLAN_COVER: Record<string, string> = {
  BASIC: '₹300', STANDARD: '₹500', PRO: '₹1,000',
  basic:  '₹300', standard:  '₹500', pro:  '₹1,000',
};
const PLAN_PREMIUM: Record<string, string> = {
  BASIC: '₹14/wk', STANDARD: '₹24/wk', PRO: '₹45/wk',
  basic:  '₹14/wk', standard:  '₹24/wk', pro:  '₹45/wk',
};

export default function WorkerDashboardTab() {
  const [rider, setRider]       = useState<Rider | null>(null);
  const [payouts, setPayouts]   = useState<PayoutLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [weather, setWeather]   = useState<{ rainfall: string; temp: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure riderId is loaded from SecureStore into cache
      await loadOnboardingState();
      const id = getCachedRiderId();
      if (!id) { setLoading(false); return; }

      // Fetch rider + payouts in parallel
      const [riderData, payoutData] = await Promise.all([
        getRider(id),
        getPayouts(id).catch(() => [] as PayoutLog[]),
      ]);
      setRider(riderData);
      setPayouts(payoutData);

      // Fetch live weather for rider's zone
      fetch(`${API}/insurance/quote?riderId=${id}`)
        .then(r => r.json())
        .then(d => {
          // use quote response as a proxy to confirm backend is alive
          // weather would come from a dedicated endpoint; use placeholder for now
          setWeather({ rainfall: '—', temp: '—' });
        })
        .catch(() => {});
    } catch {
      // keep whatever we have
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PB_NAVY} />
        <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>Loading dashboard...</Text>
      </View>
    );
  }

  const name        = rider?.name       ?? '—';
  const initial     = name.charAt(0).toUpperCase();
  const city        = rider?.city       ?? '—';
  const platform    = rider?.platform   ?? '—';
  const wallet      = rider?.walletBalance ?? 0;
  const tier        = rider?.policyTier ?? 'STANDARD';
  const cover       = PLAN_COVER[tier]    ?? '₹500';
  const premium     = PLAN_PREMIUM[tier]  ?? '₹24/wk';
  const isPolicyActive = rider?.isPolicyActive ?? false;

  const totalPayouts   = payouts.length;
  const totalPaid      = payouts.reduce((s, p) => s + p.amount, 0);
  const latestPayout   = payouts[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Worker Dashboard</Text>
          <Text style={styles.headerSubtitle}>RiskWire Parametric Insurance</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell size={20} color="#666" />
          {totalPayouts > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{Math.min(totalPayouts, 9)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Alerts */}
        <View style={styles.alertsContainer}>
          {isPolicyActive ? (
            <View style={[styles.alertBox, styles.alertGreen]}>
              <CheckCircle2 size={16} color="#2E7D32" />
              <Text style={[styles.alertText, { color: '#2E7D32' }]}>
                Policy Active — {tier.toUpperCase()} tier · {cover}/day coverage
              </Text>
            </View>
          ) : (
            <View style={[styles.alertBox, styles.alertOrange]}>
              <AlertCircle size={16} color="#E65100" />
              <Text style={[styles.alertText, { color: '#E65100' }]}>No active policy. Tap Profile to purchase one.</Text>
            </View>
          )}
          {latestPayout && (
            <View style={[styles.alertBox, styles.alertGreen]}>
              <CheckCircle2 size={16} color="#2E7D32" />
              <Text style={[styles.alertText, { color: '#2E7D32' }]}>
                Last payout ₹{latestPayout.amount} credited to your wallet.
              </Text>
            </View>
          )}
        </View>

        {/* Top Row Cards */}
        <View style={styles.row}>
          {/* Profile Card */}
          <View style={[styles.card, { flex: 1.2 }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.profileName}>{name}</Text>
                  {rider?.verified && <CheckCircle2 size={14} color="#4CAF50" />}
                </View>
                <Text style={styles.profileType}>Gig Worker</Text>
              </View>
            </View>
            <View style={styles.profileDetailsRow}><MapPin size={14} color="#666" /><Text style={styles.profileDetailText}>{city}</Text></View>
            <View style={styles.profileDetailsRow}><Briefcase size={14} color="#666" /><Text style={styles.profileDetailText}>{platform}</Text></View>
            <View style={styles.profileDetailsRow}><IndianRupee size={14} color="#666" /><Text style={styles.profileDetailText}>Wallet ₹{wallet}</Text></View>
            {rider && (
              <View style={styles.profileDetailsRow}>
                <FileText size={14} color="#666" />
                <Text style={styles.profileDetailText}>RDR-{String(rider.id).padStart(6, '0')}</Text>
              </View>
            )}
          </View>

          {/* Policy Card */}
          <View style={[styles.card, styles.darkCard, { flex: 1.5 }]}>
            <View style={styles.darkCardHeader}>
              <Text style={styles.darkCardTitle}>POLICY DETAILS</Text>
              <View style={styles.activeTag}>
                <CheckCircle2 size={12} color={isPolicyActive ? '#4CAF50' : '#888'} />
                <Text style={[styles.activeTagText, { color: isPolicyActive ? '#4CAF50' : '#888' }]}>
                  {isPolicyActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Weekly Premium</Text>
              <Text style={styles.darkCardValueLarge}>{premium}</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Coverage Amount</Text>
              <Text style={styles.darkCardValue}>{cover}/day</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Platform</Text>
              <Text style={styles.darkCardValue}>{platform}</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Zone</Text>
              <Text style={styles.darkCardValue}>{rider?.zone ?? city}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.row}>
          {/* Payout Summary */}
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.cardHeaderFlex}>
              <View style={styles.cardTitleRow}>
                <Activity size={18} color="#0066CC" />
                <Text style={styles.cardTitle}>Payout Summary</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statMiniBox}>
                <Text style={styles.statMiniValue}>{totalPayouts}</Text>
                <Text style={styles.statMiniLabel}>Total</Text>
              </View>
              <View style={styles.statMiniBox}>
                <Text style={[styles.statMiniValue, { color: '#4CAF50' }]}>{totalPayouts}</Text>
                <Text style={styles.statMiniLabel}>Approved</Text>
              </View>
              <View style={styles.statMiniBox}>
                <Text style={[styles.statMiniValue, { color: '#2196F3' }]}>₹{totalPaid}</Text>
                <Text style={styles.statMiniLabel}>Received</Text>
              </View>
            </View>
          </View>

          {/* Claim Statistics */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Claim Statistics</Text>
            {[
              { label: 'Total Claims',       val: String(totalPayouts), color: '#1A1A24', bg: '#F0F4F8', icon: FileText },
              { label: 'Approved',           val: String(totalPayouts), color: '#4CAF50', bg: '#E8F5E9', icon: CheckCircle2 },
              { label: 'Flagged',            val: '0',                  color: '#F44336', bg: '#FFEBEE', icon: AlertCircle },
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
  notificationBtn: { position: 'relative', padding: 4 },
  notificationBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#F44336', width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  alertsContainer: { gap: 8 },
  alertBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 10 },
  alertGreen:  { backgroundColor: '#F1FDF5', borderColor: '#C8E6C9' },
  alertOrange: { backgroundColor: '#FFF3E0', borderColor: '#FFCCBC' },
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
  activeTagText: { fontSize: 11, fontWeight: 'bold' },
  darkCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  darkCardLabel: { color: '#8898AA', fontSize: 13 },
  darkCardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  darkCardValueLarge: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statMiniBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statMiniValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1A24', marginBottom: 4 },
  statMiniLabel: { fontSize: 11, color: '#8898AA' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24', marginBottom: 12 },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  claimRowBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  claimLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  claimIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  claimLbl: { fontSize: 13, color: '#525F7F' },
  claimVal: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24' },
});
