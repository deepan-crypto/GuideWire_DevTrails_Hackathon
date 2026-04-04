import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IndianRupee, CheckCircle2, Clock, ChevronRight, TrendingUp, RefreshCw } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { getCachedRiderId } from '@/utils/onboardingState';
import { getPayouts, PayoutLog } from '@/utils/api';

const PB_NAVY   = '#0F4C81';
const PB_GREEN  = '#00C37B';
const PB_ORANGE = '#FF5722';

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

export default function PayoutsTab() {
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayouts = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    if (!isPolling) setError('');
    try {
      const riderId = getCachedRiderId();
      if (riderId) {
        const data = await getPayouts(riderId);
        setPayouts(data);
      }
    } catch (e) {
      if (!isPolling) setError('Could not load payouts. Check your connection.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { 
    loadPayouts(false); 
    const interval = setInterval(() => loadPayouts(true), 3000);
    return () => clearInterval(interval);
  }, [loadPayouts]));

  const totalPaid = payouts.filter(p => true).reduce((s, p) => s + p.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payout History</Text>
          <Text style={styles.headerSubtitle}>All your triggered claim payouts</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadPayouts(false)}>
          <RefreshCw size={18} color={PB_NAVY} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PB_NAVY} />
          <Text style={styles.loadingText}>Loading payouts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadPayouts(false)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryVal, { color: PB_GREEN }]}>₹{totalPaid}</Text>
              <Text style={styles.summaryLabel}>Total Received</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryVal, { color: PB_NAVY }]}>{payouts.length}</Text>
              <Text style={styles.summaryLabel}>Total Payouts</Text>
            </View>
          </View>

          {/* Total bar */}
          <View style={styles.totalBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Lifetime Payout</Text>
              <Text style={styles.totalVal}>₹{totalPaid}</Text>
            </View>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color={PB_GREEN} />
              <Text style={styles.trendText}>{payouts.length} payouts</Text>
            </View>
          </View>

          {payouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyTitle}>No payouts yet</Text>
              <Text style={styles.emptyDesc}>Your payout history will appear here when a disruption trigger is detected in your zone.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              {payouts.map(p => (
                <View key={p.id} style={styles.payoutCard}>
                  <View style={styles.payoutTop}>
                    <View style={styles.payoutIconBox}>
                      <IndianRupee size={20} color={PB_GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payoutId}>CLM-{String(p.id).padStart(6, '0')}</Text>
                      <Text style={styles.payoutDate}>{formatDate(p.timestamp)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                      <CheckCircle2 size={12} color={PB_GREEN} />
                      <Text style={[styles.statusText, { color: PB_GREEN }]}>Paid</Text>
                    </View>
                  </View>
                  <View style={styles.payoutBottom}>
                    <Text style={styles.triggerText}>
                      {p.triggerType === 'MANUAL_ADMIN' 
                        ? '👨‍💼 Manual Claim — Admin Approved' 
                        : '📍 Parametric trigger — Zone disruption detected'}
                    </Text>
                    <Text style={[styles.payoutAmount, { color: PB_GREEN }]}>₹{p.amount}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>⚡ How Parametric Payouts Work</Text>
            <Text style={styles.infoText}>
              RiskWire automatically detects weather disruptions using satellite data.
              When a trigger event is detected in your zone, your claim is approved and paid instantly — no forms, no waiting.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#666' },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { backgroundColor: PB_NAVY, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#FFF', fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E9F2',
  },
  summaryVal: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: '#8898AA', textAlign: 'center' },
  totalBar: {
    backgroundColor: PB_NAVY, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  totalVal: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,195,123,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  trendText: { fontSize: 12, color: PB_GREEN, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A24' },
  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A24' },
  emptyDesc: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  payoutCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E5E9F2',
  },
  payoutTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  payoutIconBox: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#F4F7FB',
    alignItems: 'center', justifyContent: 'center',
  },
  payoutId: { fontSize: 14, fontWeight: '700', color: '#1A1A24' },
  payoutDate: { fontSize: 12, color: '#8898AA', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  payoutBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  triggerText: { fontSize: 12, color: '#666', flex: 1 },
  payoutAmount: { fontSize: 22, fontWeight: '900' },
  infoCard: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: PB_NAVY,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: PB_NAVY, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#444', lineHeight: 20 },
});
