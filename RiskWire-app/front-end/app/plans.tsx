import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Check, Zap, Cloud, Flame, Star, ChevronRight } from 'lucide-react-native';
import { getCachedRiderId } from '@/utils/onboardingState';
import { getQuote } from '@/utils/api';

const PB_NAVY = '#0F4C81';

const TIER_CONFIG = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Heat Shield Basic',
    color: '#4CAF50',
    gradient: ['#43A047', '#66BB6A'],
    icon: Shield,
    basePremium: 25,
    basePayout: 300,
    features: [
      'Weather disruption coverage',
      'Automatic claim trigger',
      '₹300/day payout',
      'Basic zone monitoring',
    ],
    recommended: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Rain Guard Plus',
    color: '#0066CC',
    gradient: ['#1565C0', '#42A5F5'],
    icon: Cloud,
    basePremium: 50,
    basePayout: 500,
    features: [
      'All Basic features',
      'Rain + Heat coverage',
      '₹500/day payout',
      'Priority claim processing',
      'Real-time weather alerts',
    ],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Heat Shield Pro',
    color: '#7B2FF7',
    gradient: ['#6200EA', '#9C27B0'],
    icon: Flame,
    basePremium: 100,
    basePayout: 1000,
    features: [
      'All Standard features',
      'Multi-peril coverage',
      '₹1,000/day payout',
      'Instant zero-delay payout',
      'Priority fraud clearance',
      'Referral bonus 2x',
    ],
    recommended: false,
  },
];

export default function PlansScreen() {
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, { premium: number; daily_payout: number }> | null>(null);
  const [riskMultiplier, setRiskMultiplier] = useState(1.0);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const riderId = getCachedRiderId();
      if (riderId) {
        const data = await getQuote(riderId);
        setPrices(data);
        // Extract first plan premium to estimate multiplier
        if (data?.basic?.premium) {
          setRiskMultiplier(Math.round((data.basic.premium / 25) * 100) / 100);
        }
      }
    } catch (e) {
      // Use base pricing
    } finally {
      setLoading(false);
    }
  };

  const getPremium = (tier: string): number => {
    if (prices && prices[tier]) return Math.round(prices[tier].premium);
    const base = TIER_CONFIG.find(t => t.id === tier)?.basePremium ?? 50;
    return Math.round(base * riskMultiplier);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <Text style={styles.headerSubtitle}>AI-adjusted weekly micro-insurance</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PB_NAVY} />
          <Text style={styles.loadingText}>Calculating AI-adjusted premiums...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Risk Multiplier Badge */}
          <View style={styles.multiplierBadge}>
            <Zap size={16} color="#FF9800" />
            <Text style={styles.multiplierText}>
              AI Risk Multiplier: <Text style={styles.multiplierValue}>{riskMultiplier}x</Text>
              {'  '}· Prices adjusted for your zone
            </Text>
          </View>

          {/* Plan Cards */}
          {TIER_CONFIG.map((tier) => {
            const premium = getPremium(tier.id);
            const TierIcon = tier.icon;
            return (
              <View
                key={tier.id}
                style={[
                  styles.planCard,
                  tier.recommended && styles.planCardRecommended,
                  { borderColor: tier.recommended ? tier.color : '#E5E9F2' },
                ]}
              >
                {tier.recommended && (
                  <View style={[styles.recommendedBadge, { backgroundColor: tier.color }]}>
                    <Star size={12} color="#FFF" fill="#FFF" />
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.planIconBox, { backgroundColor: `${tier.color}15` }]}>
                    <TierIcon size={28} color={tier.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: tier.color }]}>{tier.name}</Text>
                    <Text style={styles.planTagline}>{tier.tagline}</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={[styles.priceValue, { color: tier.color }]}>₹{premium}</Text>
                    <Text style={styles.priceUnit}>/week</Text>
                  </View>
                </View>

                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Daily Payout:</Text>
                  <Text style={[styles.payoutValue, { color: tier.color }]}>₹{tier.basePayout}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.featuresList}>
                  {tier.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Check size={14} color={tier.color} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.selectBtn, { backgroundColor: tier.color }]}
                  onPress={() =>
                    router.push({
                      pathname: '/payment',
                      params: { tier: tier.id, premium: String(premium), payout: String(tier.basePayout) },
                    })
                  }
                >
                  <Text style={styles.selectBtnText}>Select {tier.name} Plan</Text>
                  <ChevronRight size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Info Section */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🤖 How AI Pricing Works</Text>
            <Text style={styles.infoText}>
              Our Gradient Boosting model analyzes 5-day weather forecasts, zone risk history, and shift
              exposure to calculate a dynamic risk multiplier. Higher risk = slightly higher premium,
              but you're protected when it matters most.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A24' },
  headerSubtitle: { fontSize: 12, color: '#8898AA', marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: '#666' },
  content: { padding: 16, gap: 16 },

  multiplierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FFE082',
  },
  multiplierText: { fontSize: 13, color: '#5D4037', flex: 1 },
  multiplierValue: { fontWeight: '900', color: '#E65100' },

  planCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    borderWidth: 2, borderColor: '#E5E9F2', position: 'relative', overflow: 'hidden',
  },
  planCardRecommended: {
    shadowColor: '#0066CC', shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  recommendedBadge: {
    position: 'absolute', top: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  recommendedText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  planIconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  planName: { fontSize: 20, fontWeight: '900' },
  planTagline: { fontSize: 12, color: '#8898AA', marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  priceValue: { fontSize: 26, fontWeight: '900' },
  priceUnit: { fontSize: 12, color: '#8898AA', marginTop: -2 },

  payoutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  payoutLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
  payoutValue: { fontSize: 18, fontWeight: '900' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 14 },

  featuresList: { gap: 10, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { fontSize: 13, color: '#444', flex: 1, lineHeight: 18 },

  selectBtn: {
    borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  selectBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  infoCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 18,
    borderLeftWidth: 4, borderLeftColor: PB_NAVY,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: PB_NAVY, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#444', lineHeight: 20 },
});
