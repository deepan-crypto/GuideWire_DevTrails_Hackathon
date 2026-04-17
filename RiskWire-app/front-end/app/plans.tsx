import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Shield, Umbrella, Flame, Check, Zap } from 'lucide-react-native';
import { getDynamicPricing } from '@/utils/api';

const PLAN_META: Record<string, { name: string; icon: any; color: string; bgColor: string; borderColor: string; features: string[] }> = {
  basic: {
    name: 'Heat Shield Basic',
    icon: Shield,
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A5D6A7',
    features: ['Heat trigger protection', 'Single zone coverage', 'Instant payouts', '24/7 claim support'],
  },
  standard: {
    name: 'Rain Guard Plus',
    icon: Umbrella,
    color: '#0066CC',
    bgColor: '#EFF6FF',
    borderColor: '#93C5FD',
    features: ['Heat + Rain triggers', 'Multi-zone coverage', 'Priority support', 'Hospitalization benefit'],
  },
  pro: {
    name: 'Heat Shield Pro',
    icon: Flame,
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FCD34D',
    features: ['All weather triggers', 'Emergency assistance', 'Max coverage', 'Family accident benefit', 'Zero waiting period'],
  },
};

export default function PlansScreen() {
  const { city, platform, age, workerId } = useLocalSearchParams<{ city: string; platform: string; age: string; workerId: string }>();

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [payouts, setPayouts] = useState<Record<string, number>>({});
  const [riskMultiplier, setRiskMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getDynamicPricing('MZ-DEL-04')
      .then(data => {
        if (data.plans) {
          const p: Record<string, number> = {};
          const po: Record<string, number> = {};
          for (const [tier, detail] of Object.entries(data.plans)) {
            p[tier] = (detail as any).premium;
            po[tier] = (detail as any).daily_payout;
          }
          setPrices(p);
          setPayouts(po);
        }
        if (data.risk_multiplier) setRiskMultiplier(data.risk_multiplier);
      })
      .catch(err => {
        console.warn('Oracle pricing fetch failed, using fallbacks:', err);
        setPrices({ basic: 25, standard: 50, pro: 100 });
        setPayouts({ basic: 300, standard: 500, pro: 1000 });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleActivate = (tier: string) => {
    router.push({
      pathname: '/activate',
      params: { plan: tier, city, platform, age, workerId, premium: String(prices[tier] || 0) },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RiskWire Insurance Plans</Text>
      </View>

      {/* Risk Banner */}
      <View style={styles.riskBanner}>
        <Zap size={14} color="#FFF" />
        <Text style={styles.riskBannerText}>
          Live Risk Multiplier: {riskMultiplier}x · ML-powered dynamic pricing
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Fetching live prices from ML engine…</Text>
          </View>
        ) : (
          Object.keys(PLAN_META).map(tier => {
            const meta = PLAN_META[tier];
            const Icon = meta.icon;
            const premium = prices[tier] || 0;
            const payout = payouts[tier] || 0;
            const isSelected = selected === tier;

            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.card,
                  { borderLeftColor: meta.color },
                  isSelected && { borderColor: meta.color, backgroundColor: meta.bgColor },
                ]}
                onPress={() => setSelected(tier)}
                activeOpacity={0.85}
              >
                {tier === 'standard' && (
                  <View style={[styles.popularBadge, { backgroundColor: meta.color }]}>
                    <Text style={styles.popularText}>⭐ Most Popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.planIconBox, { backgroundColor: meta.bgColor }]}>
                    <Icon size={22} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{meta.name}</Text>
                    <Text style={styles.planTier}>{tier.toUpperCase()} TIER</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={[styles.priceText, { color: meta.color }]}>₹{premium.toFixed(0)}</Text>
                    <Text style={styles.priceUnit}>/day</Text>
                  </View>
                </View>

                {/* Payout highlight */}
                <View style={[styles.payoutRow, { backgroundColor: meta.bgColor }]}>
                  <Zap size={14} color={meta.color} />
                  <Text style={[styles.payoutText, { color: meta.color }]}>
                    ₹{payout}/day payout on trigger
                  </Text>
                </View>

                {/* Features */}
                <View style={styles.featuresList}>
                  {meta.features.map(f => (
                    <View key={f} style={styles.featureRow}>
                      <Check size={14} color={meta.color} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* Activate CTA */}
                <TouchableOpacity
                  style={[styles.activateBtn, { backgroundColor: meta.color }]}
                  onPress={() => handleActivate(tier)}
                >
                  <Text style={styles.activateBtnText}>Activate {meta.name} ›</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* ML Info */}
        <View style={styles.mlInfo}>
          <Shield size={14} color="#00529B" />
          <Text style={styles.mlInfoText}>
            Premiums dynamically computed by RiskWire ML model · Weather + AQI data from OpenWeather API · Powered by Guidewire Cloud
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A24' },

  riskBanner: {
    backgroundColor: '#0066CC', paddingVertical: 8, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  riskBannerText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  content: { padding: 16 },

  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 13, color: '#666' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E9F2',
    borderLeftWidth: 4, marginBottom: 16, overflow: 'hidden', padding: 16,
  },

  popularBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 12,
  },
  popularText: { fontSize: 11, color: '#FFF', fontWeight: '700' },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  planTier: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginTop: 2 },
  priceBox: { flexDirection: 'row', alignItems: 'baseline' },
  priceText: { fontSize: 24, fontWeight: '800' },
  priceUnit: { fontSize: 12, color: '#999', fontWeight: '600' },

  payoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12,
  },
  payoutText: { fontSize: 13, fontWeight: '700' },

  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#444' },

  activateBtn: {
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  activateBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  mlInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginTop: 8,
  },
  mlInfoText: { fontSize: 10, color: '#4B6B88', flex: 1, lineHeight: 16 },
});
