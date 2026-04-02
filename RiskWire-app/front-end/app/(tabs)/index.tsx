import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Shield, Umbrella, Flame, Zap, Star, Phone, ArrowRight, TrendingUp, CloudRain, Thermometer,
} from 'lucide-react-native';
import { router } from 'expo-router';

const PLANS = [
  { id: 'basic',    name: 'Heat Shield Basic',  icon: Shield,  color: '#059669', bg: '#ECFDF5', accent: '#D1FAE5', tier: 'basic' },
  { id: 'standard', name: 'Rain Guard Plus',     icon: Umbrella, color: '#0066CC', bg: '#EFF6FF', accent: '#DBEAFE', tier: 'standard' },
  { id: 'pro',      name: 'Heat Shield Pro',     icon: Flame,   color: '#D97706', bg: '#FFFBEB', accent: '#FEF3C7', tier: 'pro' },
];

const PLAN_FEATURES: Record<string, string[]> = {
  basic:    ['Heat trigger protection', '₹300/day payout', 'Single zone coverage'],
  standard: ['Heat + Rain triggers', '₹500/day payout', 'Multi-zone coverage'],
  pro:      ['All weather triggers', '₹1000/day payout', 'Priority payouts'],
};

const FALLBACK_PRICES: Record<string, number> = { basic: 95, standard: 143, pro: 218 };

const TRUST = [
  { val: '10K+', label: 'Gig Workers' },
  { val: '₹2.6L', label: 'Claims Paid' },
  { val: '2.8s', label: 'Avg Payout' },
];

export default function HomeScreen() {
  const [prices, setPrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live prices from the pricing engine
    fetch('https://backend-guidewire-devtrails-hackathon.onrender.com/api/v1/insurance/quote?riderId=1')
      .then(res => res.json())
      .then(data => {
        const p: Record<string, number> = {};
        for (const [tier, detail] of Object.entries(data)) {
          p[tier] = (detail as any).premium;
        }
        if (Object.keys(p).length > 0) setPrices(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>RiskWire</Text>
          <Text style={styles.brandTag}>MICRO-INSURANCE</Text>
        </View>
        <TouchableOpacity style={styles.helpPill}>
          <Phone size={13} color="#0066CC" />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* ── Alert strip ── */}
      <View style={styles.strip}>
        <Text style={styles.stripText}>⚡ Parametric payouts — Zero documents · Zero waiting · Instant to wallet</Text>
      </View>

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Text style={styles.heroSub}>WEATHER-TRIGGERED MICRO-INSURANCE</Text>
        <Text style={styles.heroTitle}>
          Income protection{'\n'}
          <Text style={styles.heroHighlight}>for Gig Workers</Text>
        </Text>
        <Text style={styles.heroDesc}>
          Automatic payouts when heat or rain disrupts your earnings. No claims to file.
        </Text>

        {/* Trust row */}
        <View style={styles.trustRow}>
          {TRUST.map(t => (
            <View key={t.val} style={styles.trustItem}>
              <Text style={styles.trustVal}>{t.val}</Text>
              <Text style={styles.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── How It Works ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.howGrid}>
          {[
            { icon: Thermometer, color: '#DC2626', bg: '#FEF2F2', label: 'Weather\nMonitored', step: '01' },
            { icon: Zap, color: '#D97706', bg: '#FFFBEB', label: 'Trigger\nDetected', step: '02' },
            { icon: TrendingUp, color: '#059669', bg: '#ECFDF5', label: 'Auto\nPayout', step: '03' },
          ].map(h => (
            <View key={h.step} style={styles.howItem}>
              <View style={[styles.howIcon, { backgroundColor: h.bg }]}>
                <Text style={styles.howStep}>{h.step}</Text>
                <h.icon size={22} color={h.color} />
              </View>
              <Text style={styles.howLabel}>{h.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Plan Cards ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0066CC" style={{ paddingVertical: 30 }} />
        ) : (
          PLANS.map(plan => {
            const price = prices[plan.tier] || FALLBACK_PRICES[plan.tier];
            const features = PLAN_FEATURES[plan.tier];
            const Icon = plan.icon;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, { borderLeftColor: plan.color }]}
                onPress={() => router.push({ pathname: '/activate', params: { plan: plan.name } })}
                activeOpacity={0.85}
              >
                <View style={styles.planHeader}>
                  <View style={[styles.planIconBox, { backgroundColor: plan.bg }]}>
                    <Icon size={22} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planTier}>{plan.tier.toUpperCase()} TIER</Text>
                  </View>
                  <View style={styles.planPriceBox}>
                    <Text style={[styles.planPrice, { color: plan.color }]}>₹{price}</Text>
                    <Text style={styles.planPriceUnit}>/day</Text>
                  </View>
                </View>
                <View style={styles.planFeatures}>
                  {features.map(f => (
                    <View key={f} style={styles.planFeatureRow}>
                      <View style={[styles.planDot, { backgroundColor: plan.color }]} />
                      <Text style={styles.planFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.planCta, { backgroundColor: plan.accent }]}>
                  <Text style={[styles.planCtaText, { color: plan.color }]}>Activate Plan</Text>
                  <ArrowRight size={14} color={plan.color} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── Why RiskWire ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why RiskWire?</Text>
        {[
          { emoji: '⚡', title: 'Instant Parametric Payouts', desc: 'Money hits your wallet in seconds when weather triggers activate.' },
          { emoji: '📡', title: 'Real-Time Weather Monitoring', desc: 'IoT sensors + satellite data monitor your zone 24/7.' },
          { emoji: '🤖', title: 'Zero Human Intervention', desc: 'Fully automated — no documents, no calls, no claims to file.' },
          { emoji: '🔒', title: 'IRDAI Compliant', desc: 'Registered, audited, and fully transparent.' },
        ].map(w => (
          <View key={w.title} style={styles.whyCard}>
            <Text style={styles.whyEmoji}>{w.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.whyTitle}>{w.title}</Text>
              <Text style={styles.whyDesc}>{w.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const PB_GREEN = '#00C37B';
const PB_NAVY  = '#0F4C81';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  brand: { fontSize: 22, fontWeight: '900', color: PB_NAVY, fontStyle: 'italic' },
  brandTag: { fontSize: 9, color: PB_NAVY, fontWeight: '700', opacity: 0.6 },
  helpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  helpText: { fontSize: 13, color: '#0066CC', fontWeight: '600' },

  strip: { backgroundColor: '#0066CC', paddingVertical: 8, paddingHorizontal: 16 },
  stripText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  hero: {
    backgroundColor: '#F8FAFF', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#E8EDF5',
  },
  heroSub: { fontSize: 10, color: '#0066CC', fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  heroTitle: { fontSize: 26, color: '#555', fontWeight: '300', lineHeight: 36, marginBottom: 8 },
  heroHighlight: { color: '#1A1A1A', fontWeight: '800' },
  heroDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },

  trustRow: { flexDirection: 'row', gap: 28 },
  trustItem: {},
  trustVal: { fontSize: 18, fontWeight: '800', color: PB_NAVY },
  trustLabel: { fontSize: 10, color: '#666', marginTop: 2 },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 16 },

  howGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  howItem: { alignItems: 'center', width: '30%' },
  howIcon: {
    width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  howStep: { fontSize: 9, fontWeight: '800', color: '#999', marginBottom: 2 },
  howLabel: { fontSize: 11, fontWeight: '600', color: '#444', textAlign: 'center', lineHeight: 16 },

  planCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E9F2',
    borderLeftWidth: 4, marginBottom: 14, overflow: 'hidden',
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  planIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  planTier: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginTop: 2 },
  planPriceBox: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 22, fontWeight: '800' },
  planPriceUnit: { fontSize: 12, color: '#999', fontWeight: '600' },
  planFeatures: { paddingHorizontal: 16, paddingBottom: 12 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planDot: { width: 6, height: 6, borderRadius: 3 },
  planFeatureText: { fontSize: 12, color: '#555' },
  planCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  planCtaText: { fontSize: 13, fontWeight: '700' },

  whyCard: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'flex-start',
  },
  whyEmoji: { fontSize: 24 },
  whyTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  whyDesc: { fontSize: 12, color: '#666', lineHeight: 18 },
});
