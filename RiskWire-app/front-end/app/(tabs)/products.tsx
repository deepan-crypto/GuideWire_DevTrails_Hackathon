import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, Check, ChevronRight, Phone, Star } from 'lucide-react-native';
import { router } from 'expo-router';

const PB_GREEN  = '#00C37B';
const PB_NAVY   = '#0F4C81';
const PB_ORANGE = '#FF5722';

const PLANS = [
  {
    id: 'basic', name: 'Basic', tagline: 'Essential cover for everyday risk',
    color: '#4CAF50', bgColor: '#F1FFF4', borderColor: '#A5D6A7',
    avgClaim: '₹25', perDay: '₹300',
    features: ['₹300 daily income cover', '₹25 avg claim payout', 'Accident & injury cover', '24/7 claim support'],
  },
  {
    id: 'standard', name: 'Standard', tagline: 'Balanced protection for working riders',
    color: '#0066CC', bgColor: '#EFF6FF', borderColor: '#93C5FD',
    popular: true, avgClaim: '₹50', perDay: '₹500',
    features: ['₹500 daily income cover', '₹50 avg claim payout', 'Accident, injury & illness', 'Priority claim handling', 'Hospitalization benefit'],
  },
  {
    id: 'pro', name: 'Pro', tagline: 'Maximum protection, maximum peace of mind',
    color: '#7B2FF7', bgColor: '#F5F0FF', borderColor: '#C4B5FD',
    avgClaim: '₹100', perDay: '₹1,000',
    features: ['₹1,000 daily income cover', '₹100 avg claim payout', 'Comprehensive coverage', 'Dedicated claims manager', 'Family accident benefit', 'Zero waiting period'],
  },
];

export default function ProductsScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
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

      {/* Green strip */}
      <View style={styles.strip}>
        <Text style={styles.stripText}>⚡  Parametric Payouts · No paperwork · Claim in minutes</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTag}>DAILY INCOME PROTECTION</Text>
        <Text style={styles.heroTitle}>Micro-Insurance{'\n'}<Text style={styles.heroHighlight}>Plans for Gig Workers</Text></Text>
        <Text style={styles.heroDesc}>
          If you're injured or ill and can't work, we pay you a fixed daily benefit directly — no questions asked.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Compare strip */}
        <View style={styles.compareHeader}>
          <Text style={[styles.compareCell, { flex: 2 }]}>Plan</Text>
          <Text style={[styles.compareCell, { flex: 1, textAlign: 'center' }]}>Avg Claim</Text>
          <Text style={[styles.compareCell, { flex: 1, textAlign: 'center' }]}>Per Day</Text>
        </View>
        {PLANS.map(p => (
          <View key={p.id} style={[styles.compareRow, selected === p.id && { backgroundColor: p.bgColor }]}>
            <Text style={[styles.compareName, { flex: 2, color: p.color }]}>{p.name}</Text>
            <Text style={[styles.compareVal, { flex: 1, textAlign: 'center' }]}>{p.avgClaim}</Text>
            <Text style={[styles.compareVal, { flex: 1, textAlign: 'center' }]}>{p.perDay}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Select Your Plan</Text>

        {PLANS.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              { borderColor: selected === plan.id ? plan.color : plan.borderColor },
              selected === plan.id && { backgroundColor: plan.bgColor },
            ]}
            onPress={() => setSelected(plan.id)}
            activeOpacity={0.85}
          >
            {plan.popular && (
              <View style={[styles.popularBadge, { backgroundColor: PB_ORANGE }]}>
                <Text style={styles.popularText}>⭐ Most Popular</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={[styles.planIconBox, { backgroundColor: plan.bgColor, borderColor: plan.borderColor }]}>
                <Shield size={22} color={plan.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
              </View>
              <View style={[styles.radio, selected === plan.id && { borderColor: plan.color }]}>
                {selected === plan.id && <View style={[styles.radioDot, { backgroundColor: plan.color }]} />}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: plan.color }]}>{plan.avgClaim}</Text>
                <Text style={styles.statLbl}>Avg Claim</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: plan.color }]}>{plan.perDay}</Text>
                <Text style={styles.statLbl}>Per Day</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map(f => (
                <View key={f} style={styles.featureRow}>
                  <Check size={13} color={PB_GREEN} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Trust strip */}
        <View style={styles.trustStrip}>
          {[1,2,3,4].map(s => <Star key={s} size={14} color="#F59E0B" fill="#F59E0B"/>)}
          <Star size={14} color="#F59E0B" fill="none"/>
          <Text style={styles.trustText}>  13.2 crore customers · 53 insurance partners</Text>
        </View>

        <TouchableOpacity
          style={[styles.buyBtn, !selected && styles.buyBtnDisabled]}
          disabled={!selected}
          onPress={() => {
            const plan = PLANS.find(p => p.id === selected);
            if (plan) router.push({ pathname: '/activate', params: { plan: plan.name } });
          }}
        >
          <Text style={styles.buyBtnText}>
            {selected ? `Get ${PLANS.find(p => p.id === selected)?.name} Plan ›` : 'Select a Plan to Continue'}
          </Text>
          {selected && <ChevronRight size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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

  strip: { backgroundColor: PB_GREEN, paddingVertical: 8, paddingHorizontal: 16 },
  stripText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  hero: { backgroundColor: '#F8FAFF', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E8EDF5' },
  heroTag: { fontSize: 11, color: PB_GREEN, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  heroTitle: { fontSize: 26, fontWeight: '300', color: '#555', lineHeight: 36, marginBottom: 10 },
  heroHighlight: { fontWeight: '800', color: '#1A1A1A' },
  heroDesc: { fontSize: 13, color: '#666', lineHeight: 20 },

  content: { padding: 20 },

  compareHeader: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
    backgroundColor: PB_NAVY, borderRadius: 8, marginBottom: 2,
  },
  compareCell: { fontSize: 11, fontWeight: '700', color: '#FFF', textTransform: 'uppercase' },
  compareRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6, marginBottom: 2 },
  compareName: { fontSize: 13, fontWeight: '700' },
  compareVal: { fontSize: 13, color: '#1A1A1A', fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginTop: 20, marginBottom: 14 },

  planCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 16, backgroundColor: '#FAFAFA' },
  popularBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  popularText: { fontSize: 11, color: '#FFF', fontWeight: '700' },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 18, fontWeight: '800' },
  planTagline: { fontSize: 12, color: '#666', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 12, marginBottom: 14, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 11, color: '#666', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#DDD' },

  featuresList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#1A1A1A' },

  trustStrip: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  trustText: { fontSize: 11, color: '#666' },

  buyBtn: {
    backgroundColor: PB_ORANGE, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 40,
  },
  buyBtnDisabled: { backgroundColor: '#FECACA' },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
