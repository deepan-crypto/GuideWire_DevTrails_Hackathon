import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {
  CloudRain, Thermometer, Wind, Bell, AlertTriangle,
  CheckCircle2, RefreshCw, Zap, ArrowRight,
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { getCachedRiderId, loadOnboardingState } from '@/utils/onboardingState';
import { getClaimTracker, ClaimTrackerResponse } from '@/utils/api';

const PB_NAVY   = '#0F4C81';
const PB_GREEN  = '#00C37B';
const PB_ORANGE = '#FF5722';

const PIPELINE_STEPS = [
  { key: 'monitoring_weather', label: 'Monitoring Weather',  icon: '🌦', color: '#2563EB' },
  { key: 'trigger_met',       label: 'Trigger Met',         icon: '⚡', color: '#E65100' },
  { key: 'validating_shift',  label: 'Validating Shift',    icon: '🔍', color: '#7B2FF7' },
  { key: 'payout_sent',       label: 'Payout Sent',         icon: '💰', color: PB_GREEN },
];

const WEATHER = [
  { label: 'Rainfall',    val: '93.8 mm', color: '#2563EB', bg: '#EFF6FF', icon: CloudRain,   trend: '↑ High' },
  { label: 'Temperature', val: '31.2°C',  color: '#E65100', bg: '#FFF3E0', icon: Thermometer, trend: '↑ Hot' },
  { label: 'Wind Speed',  val: '18 km/h', color: '#6B7280', bg: '#F3F4F6', icon: Wind,        trend: '→ Normal' },
];

const ALERTS = [
  { id: '1', type: 'warning', icon: CloudRain,    color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', title: 'Heavy Rain Alert',    desc: 'Rainfall of 93.8mm detected in your zone. Claim trigger active.', time: '2 hrs ago' },
  { id: '2', type: 'success', icon: CheckCircle2, color: PB_GREEN,  bg: '#F0FDF4', border: '#86EFAC', title: 'Payout Triggered',     desc: 'Claim approved. Payout will be credited within 24 hours.',        time: 'Today' },
  { id: '3', type: 'alert',   icon: AlertTriangle,color: PB_ORANGE, bg: '#FFF5F0', border: '#FDBA74', title: 'Extreme Heat Warning',  desc: 'Temperature above 38°C for 3 consecutive days. Monitor your plan.', time: '1 day ago' },
];

const POLICY_UPDATES = [
  { emoji: '📋', title: 'Coverage renewed automatically', desc: 'Your plan has been renewed for the next billing cycle.', time: '3 days ago' },
  { emoji: '💡', title: 'New risk zone mapped',           desc: 'Your zone risk level may adjust. Premium may change.', time: '1 week ago' },
  { emoji: '🎉', title: 'Loyalty bonus unlocked',         desc: "You've been with RiskWire for 3 months. 5% premium discount applied!", time: '2 weeks ago' },
];

export default function UpdatesTab() {
  const [tracker, setTracker] = useState<ClaimTrackerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTracker = useCallback(async () => {
    setLoading(true);
    try {
      await loadOnboardingState();
      const riderId = getCachedRiderId();
      if (riderId) {
        const data = await getClaimTracker(riderId);
        setTracker(data);
      }
    } catch (e) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTracker(); }, [loadTracker]));

  const getPipelineStatus = (key: string): boolean => {
    if (!tracker?.pipeline) return key === 'monitoring_weather';
    return (tracker.pipeline as any)[key] === true;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Updates</Text>
          <Text style={styles.headerSubtitle}>Weather · Claims · Policy</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadTracker}>
          <RefreshCw size={18} color={PB_NAVY} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Zero-Touch Claim Tracker Pipeline ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Claim Pipeline — Live</Text>
            {loading && <ActivityIndicator size="small" color={PB_NAVY} />}
          </View>

          <View style={styles.pipelineCard}>
            <View style={styles.pipelineSteps}>
              {PIPELINE_STEPS.map((step, idx) => {
                const active = getPipelineStatus(step.key);
                const isCurrent = active && (idx === PIPELINE_STEPS.length - 1 || !getPipelineStatus(PIPELINE_STEPS[idx + 1].key));
                return (
                  <View key={step.key} style={styles.pipelineRow}>
                    <View style={styles.pipelineLeft}>
                      <View style={[
                        styles.pipelineDot,
                        active ? { backgroundColor: step.color } : { backgroundColor: '#E5E9F2' },
                        isCurrent && styles.pipelineDotPulse,
                      ]}>
                        <Text style={styles.pipelineEmoji}>{active ? '✓' : step.icon}</Text>
                      </View>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <View style={[
                          styles.pipelineLine,
                          active ? { backgroundColor: step.color } : { backgroundColor: '#E5E9F2' },
                        ]} />
                      )}
                    </View>
                    <View style={styles.pipelineContent}>
                      <Text style={[
                        styles.pipelineLabel,
                        active ? { color: '#1A1A24', fontWeight: '800' } : { color: '#9CA3AF' },
                      ]}>
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: `${step.color}15`, borderColor: step.color }]}>
                          <Text style={[styles.currentBadgeText, { color: step.color }]}>
                            {step.key === 'payout_sent' ? 'Complete' : 'In Progress'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {tracker?.payout_amount && (
              <View style={styles.payoutResultBox}>
                <Text style={styles.payoutResultLabel}>Payout Amount</Text>
                <Text style={styles.payoutResultValue}>₹{tracker.payout_amount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Live Weather ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌦 Live Weather</Text>
            <Text style={styles.sectionMeta}>Updated just now</Text>
          </View>
          <View style={styles.weatherRow}>
            {WEATHER.map(w => (
              <View key={w.label} style={[styles.weatherCard, { backgroundColor: w.bg }]}>
                <w.icon size={22} color={w.color} />
                <Text style={[styles.weatherVal, { color: w.color }]}>{w.val}</Text>
                <Text style={styles.weatherLabel}>{w.label}</Text>
                <View style={[styles.trendPill, { borderColor: w.color }]}>
                  <Text style={[styles.trendText, { color: w.color }]}>{w.trend}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Claim Alerts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Claim Alerts</Text>
          {ALERTS.map(a => (
            <View key={a.id} style={[styles.alertCard, { backgroundColor: a.bg, borderColor: a.border }]}>
              <View style={[styles.alertIconBox, { backgroundColor: a.bg }]}>
                <a.icon size={20} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, { color: a.color }]}>{a.title}</Text>
                  <Text style={styles.alertTime}>{a.time}</Text>
                </View>
                <Text style={styles.alertDesc}>{a.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Zone Status ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Your Zone Status</Text>
          <View style={styles.zoneCard}>
            <View style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>Zone</Text>
              <Text style={styles.zoneVal}>{tracker?.zone ?? 'Loading...'}</Text>
            </View>
            <View style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>Risk Level</Text>
              <View style={styles.riskBadge}>
                <Text style={styles.riskBadgeText}>🟡 Medium Risk</Text>
              </View>
            </View>
            <View style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>Trigger Status</Text>
              <View style={styles.triggerBadge}>
                <Text style={styles.triggerBadgeText}>
                  {tracker?.current_stage === 'MONITORING' ? '🔍 Monitoring' : '⚡ Active Trigger'}
                </Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Risk Score</Text>
                <Text style={styles.progressVal}>0.61 / 1.0</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Policy Updates ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Policy Updates</Text>
          {POLICY_UPDATES.map(p => (
            <View key={p.title} style={styles.policyCard}>
              <Text style={styles.policyEmoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>{p.title}</Text>
                <Text style={styles.policyDesc}>{p.desc}</Text>
                <Text style={styles.policyTime}>{p.time}</Text>
              </View>
            </View>
          ))}
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

  // ── Pipeline ──
  pipelineCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E5E9F2',
  },
  pipelineSteps: { gap: 0 },
  pipelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pipelineLeft: { alignItems: 'center', width: 36 },
  pipelineDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  pipelineDotPulse: {
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 4,
  },
  pipelineEmoji: { fontSize: 14, color: '#FFF', fontWeight: '900' },
  pipelineLine: { width: 3, height: 28, borderRadius: 2, marginVertical: 4 },
  pipelineContent: { flex: 1, paddingTop: 6, paddingBottom: 16, gap: 6 },
  pipelineLabel: { fontSize: 14 },
  currentBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  currentBadgeText: { fontSize: 11, fontWeight: '700' },
  payoutResultBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  payoutResultLabel: { fontSize: 13, color: '#333', fontWeight: '600' },
  payoutResultValue: { fontSize: 22, fontWeight: '900', color: PB_GREEN },

  // ── Weather ──
  weatherRow: { flexDirection: 'row', gap: 10 },
  weatherCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  weatherVal: { fontSize: 17, fontWeight: '900' },
  weatherLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  trendPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  trendText: { fontSize: 10, fontWeight: '700' },

  // ── Alerts ──
  alertCard: {
    flexDirection: 'row', gap: 12, borderRadius: 14, padding: 14,
    borderWidth: 1, marginBottom: 10, alignItems: 'flex-start',
  },
  alertIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
  alertTime: { fontSize: 11, color: '#9CA3AF' },
  alertDesc: { fontSize: 12, color: '#444', lineHeight: 18 },

  // ── Zone ──
  zoneCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#E5E9F2', gap: 14,
  },
  zoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneLabel: { fontSize: 13, color: '#8898AA', fontWeight: '600' },
  zoneVal: { fontSize: 13, color: '#1A1A24', fontWeight: '700' },
  riskBadge: { backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  riskBadgeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  triggerBadge: { backgroundColor: '#FFF5F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  triggerBadgeText: { fontSize: 12, fontWeight: '700', color: PB_ORANGE },
  progressSection: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: '#8898AA' },
  progressVal: { fontSize: 12, fontWeight: '700', color: '#1A1A24' },
  progressBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { width: '61%', height: '100%', backgroundColor: '#FFC107', borderRadius: 4 },

  // ── Policy Updates ──
  policyCard: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'flex-start',
  },
  policyEmoji: { fontSize: 24 },
  policyTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A24', marginBottom: 4 },
  policyDesc: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 4 },
  policyTime: { fontSize: 11, color: '#9CA3AF' },
});
