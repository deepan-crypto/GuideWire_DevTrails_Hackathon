import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Platform as OSPlatform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Check, Shield, Smartphone, IndianRupee } from 'lucide-react-native';
import { getCachedRiderId } from '@/utils/onboardingState';
import { buyPolicy } from '@/utils/api';

const PB_NAVY = '#0F4C81';
const PB_GREEN = '#00C37B';

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay',  color: '#4285F4', icon: '🔵' },
  { id: 'phonepe', name: 'PhonePe',     color: '#5F259F', icon: '🟣' },
  { id: 'paytm',   name: 'Paytm',       color: '#00BAF2', icon: '🔷' },
  { id: 'upi',     name: 'UPI ID',      color: '#3E8E41', icon: '💳' },
];

type PaymentState = 'SELECT' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';

export default function PaymentScreen() {
  const { tier, premium, payout } = useLocalSearchParams<{
    tier: string;
    premium: string;
    payout: string;
  }>();

  const [selectedApp, setSelectedApp] = useState('');
  const [state, setState] = useState<PaymentState>('SELECT');
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const startSpinner = () => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 1200,
        easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  };

  const playSuccess = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, friction: 3, tension: 100, useNativeDriver: true,
    }).start();
  };

  const handlePay = async () => {
    if (!selectedApp) return;
    setState('PROCESSING');
    startSpinner();

    const txn = `RW-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setTransactionId(txn);

    // Simulate payment processing (2 seconds)
    await new Promise(r => setTimeout(r, 2000));

    try {
      const riderId = getCachedRiderId();
      if (!riderId) throw new Error('No rider ID');

      // Call buyPolicy on the backend
      await buyPolicy(riderId, tier || 'standard');

      setState('SUCCESS');
      playSuccess();

      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        router.replace('/(worker-tabs)' as any);
      }, 2500);
    } catch (e: any) {
      setState('FAILURE');
      setError(e.message || 'Payment failed. Please try again.');
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '360deg'],
  });

  const tierLabel = (tier || 'standard').charAt(0).toUpperCase() + (tier || 'standard').slice(1);
  const amount = premium || '50';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <View style={styles.body}>
        {/* ── SELECT STATE ── */}
        {state === 'SELECT' && (
          <>
            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Shield size={22} color={PB_NAVY} />
                <Text style={styles.summaryTitle}>Order Summary</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Plan</Text>
                <Text style={styles.summaryValue}>{tierLabel} Plan</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>1 Week</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coverage</Text>
                <Text style={styles.summaryValue}>₹{payout || '500'}/day</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{amount}</Text>
              </View>
            </View>

            {/* UPI Apps */}
            <Text style={styles.sectionTitle}>Pay with UPI</Text>
            <View style={styles.upiGrid}>
              {UPI_APPS.map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={[
                    styles.upiCard,
                    selectedApp === app.id && { borderColor: app.color, backgroundColor: `${app.color}08` },
                  ]}
                  onPress={() => setSelectedApp(app.id)}
                >
                  <Text style={styles.upiIcon}>{app.icon}</Text>
                  <Text style={styles.upiName}>{app.name}</Text>
                  {selectedApp === app.id && (
                    <View style={[styles.upiCheck, { backgroundColor: app.color }]}>
                      <Check size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Stripe-style QR */}
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Shield size={16} color={PB_NAVY} />
                <Text style={styles.qrTitle}>Stripe QR (Mock)</Text>
              </View>
              <View style={styles.qrBox}>
                <View style={styles.qrPixel} />
                <View style={[styles.qrPixel, { top: 8, left: 44 }]} />
                <View style={[styles.qrPixel, { top: 28, left: 16 }]} />
                <View style={[styles.qrPixel, { top: 36, left: 52 }]} />
                <View style={[styles.qrPixel, { top: 52, left: 24 }]} />
                <View style={[styles.qrPixel, { top: 60, left: 60 }]} />
                <View style={[styles.qrPixel, { top: 12, left: 12 }]} />
                <View style={[styles.qrPixel, { top: 12, left: 64 }]} />
                <View style={[styles.qrPixel, { top: 64, left: 12 }]} />
              </View>
              <Text style={styles.qrMeta}>Scan to pay ₹{amount} · Expires in 02:00</Text>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[styles.payBtn, !selectedApp && styles.payBtnDisabled]}
              onPress={handlePay}
              disabled={!selectedApp}
            >
              <CreditCard size={20} color="#FFF" />
              <Text style={styles.payBtnText}>Pay Now · ₹{amount}</Text>
            </TouchableOpacity>

            <View style={styles.securityRow}>
              <Shield size={14} color="#8898AA" />
              <Text style={styles.securityText}>
                256-bit SSL encrypted · RBI compliant · Instant confirmation
              </Text>
            </View>
          </>
        )}

        {/* ── PROCESSING STATE ── */}
        {state === 'PROCESSING' && (
          <View style={styles.statusContainer}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
              <View style={styles.spinnerDot} />
            </Animated.View>
            <Text style={styles.statusTitle}>Processing Payment...</Text>
            <Text style={styles.statusDesc}>
              Connecting to {UPI_APPS.find(a => a.id === selectedApp)?.name ?? 'UPI'}
            </Text>
            <View style={styles.processingSteps}>
              <Text style={styles.processingStep}>✓ Verifying account</Text>
              <Text style={styles.processingStep}>✓ Connecting to UPI</Text>
              <Text style={styles.processingStep}>✓ Generating QR session</Text>
              <Text style={[styles.processingStep, { color: '#FF9800' }]}>⏳ Awaiting confirmation...</Text>
            </View>
            <Text style={styles.txnText}>Transaction ID: {transactionId}</Text>
          </View>
        )}

        {/* ── SUCCESS STATE ── */}
        {state === 'SUCCESS' && (
          <View style={styles.statusContainer}>
            <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
              <Check size={48} color="#FFF" />
            </Animated.View>
            <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
            <Text style={styles.statusDesc}>
              Your {tierLabel} plan is now active
            </Text>
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount Paid</Text>
                <Text style={styles.receiptValue}>₹{amount}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Transaction ID</Text>
                <Text style={styles.receiptValue}>{transactionId}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Plan</Text>
                <Text style={styles.receiptValue}>{tierLabel}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Coverage</Text>
                <Text style={styles.receiptValue}>₹{payout || '500'}/day</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <Text style={[styles.receiptValue, { color: PB_GREEN }]}>Active ✓</Text>
              </View>
            </View>
            <Text style={styles.redirectText}>Redirecting to dashboard...</Text>
          </View>
        )}

        {/* ── FAILURE STATE ── */}
        {state === 'FAILURE' && (
          <View style={styles.statusContainer}>
            <View style={styles.failCircle}>
              <Text style={styles.failIcon}>✕</Text>
            </View>
            <Text style={styles.failTitle}>Payment Failed</Text>
            <Text style={styles.statusDesc}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setState('SELECT'); setError(''); }}
            >
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: OSPlatform.OS === 'ios' ? 54 : 36,
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A24' },
  body: { flex: 1, padding: 20 },

  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E9F2',
    marginBottom: 18,
  },
  qrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  qrTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A24' },
  qrBox: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A1A24',
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#F8FAFF',
    position: 'relative',
  },
  qrPixel: {
    width: 10,
    height: 10,
    backgroundColor: '#1A1A24',
    position: 'absolute',
    top: 20,
    left: 20,
    borderRadius: 2,
  },
  qrMeta: { textAlign: 'center', fontSize: 11, color: '#6B7280' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E5E9F2', marginBottom: 24,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A24' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#8898AA' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1A1A24' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A24' },
  totalValue: { fontSize: 22, fontWeight: '900', color: PB_NAVY },

  // UPI
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A24', marginBottom: 12 },
  upiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  upiCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: '#E5E9F2', position: 'relative',
  },
  upiIcon: { fontSize: 28 },
  upiName: { fontSize: 13, fontWeight: '700', color: '#1A1A24' },
  upiCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // Pay button
  payBtn: {
    backgroundColor: PB_NAVY, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 16,
  },
  payBtnDisabled: { backgroundColor: '#CBD5E1' },
  payBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securityText: { fontSize: 11, color: '#8898AA', textAlign: 'center' },

  // Status states
  statusContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  statusTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A24' },
  statusDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  txnText: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 10 },

  // Spinner
  spinner: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 4, borderColor: '#E5E9F2', borderTopColor: PB_NAVY,
    marginBottom: 8,
  },
  spinnerDot: {},

  processingSteps: { gap: 8, marginTop: 12 },
  processingStep: { fontSize: 13, color: PB_GREEN, fontWeight: '600' },

  // Success
  successCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: PB_GREEN,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: PB_GREEN },
  receiptCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#E5E9F2', gap: 10, marginTop: 8,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { fontSize: 13, color: '#8898AA' },
  receiptValue: { fontSize: 13, fontWeight: '700', color: '#1A1A24' },
  redirectText: { fontSize: 12, color: '#8898AA', marginTop: 8 },

  // Failure
  failCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  failIcon: { fontSize: 40, color: '#FFF', fontWeight: '900' },
  failTitle: { fontSize: 22, fontWeight: '900', color: '#EF4444' },
  retryBtn: {
    backgroundColor: PB_NAVY, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40,
    marginTop: 8,
  },
  retryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
