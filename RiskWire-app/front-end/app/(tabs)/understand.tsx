import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  CircleCheck as CheckCircle2, Circle as XCircle,
  Phone, Thermometer, CloudRain, Zap, TrendingUp,
  Shield, MapPin, Clock, Wallet, Bot, Globe,
} from 'lucide-react-native';

const PB_GREEN  = '#00C37B';
const PB_NAVY   = '#0F4C81';
const PB_ORANGE = '#FF5722';
const PRIMARY   = '#0066CC';

export default function UnderstandScreen() {
  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>RiskWire</Text>
          <Text style={styles.brandTag}>HOW IT WORKS</Text>
        </View>
        <TouchableOpacity style={styles.helpPill}>
          <Phone size={13} color={PRIMARY} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Strip */}
      <View style={styles.strip}>
        <Text style={styles.stripText}>🔬  100% Parametric · Zero Human Intervention · Fully Automated Insurance</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTag}>PARAMETRIC MICRO-INSURANCE</Text>
        <Text style={styles.heroTitle}>What is{'\n'}<Text style={styles.heroHighlight}>RiskWire?</Text></Text>
        <Text style={styles.heroDesc}>
          RiskWire is India's first fully automated, weather-triggered micro-insurance platform built for gig economy workers. No claims to file. No documents. No waiting.
        </Text>
      </View>

      <View style={styles.content}>

        {/* ── THE PROBLEM ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>❓  THE PROBLEM WE SOLVE</Text>
        </View>
        <Text style={styles.bodyText}>
          Gig workers (delivery riders, drivers) lose income during extreme weather — heatwaves shut down operations, heavy rain causes cancellations. Traditional insurance doesn't cover this:
        </Text>
        <View style={styles.problemGrid}>
          {[
            { emoji: '📝', issue: 'Traditional insurance requires lengthy paperwork' },
            { emoji: '⏳', issue: 'Claims take 15–30 days to process' },
            { emoji: '❌', issue: 'Weather-related income loss is not covered' },
            { emoji: '💸', issue: 'Premiums are too expensive for daily wage workers' },
          ].map(p => (
            <View key={p.issue} style={styles.problemCard}>
              <Text style={styles.problemEmoji}>{p.emoji}</Text>
              <Text style={styles.problemText}>{p.issue}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── HOW RISKWIRE IS DIFFERENT ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>⚡  HOW RISKWIRE IS DIFFERENT</Text>
        </View>
        <Text style={styles.sectionTitle}>Dynamic Parametric Insurance</Text>
        <Text style={styles.bodyText}>
          Unlike traditional insurance, RiskWire uses real-time weather data to automatically trigger payouts. No human reviews. No claims forms. No delays.
        </Text>

        {/* Comparison table */}
        <View style={styles.compTable}>
          <View style={styles.compHead}>
            <Text style={[styles.compHeadCell, { flex: 3 }]}>Feature</Text>
            <Text style={[styles.compHeadCell, { flex: 1.5, textAlign: 'center' }]}>RiskWire</Text>
            <Text style={[styles.compHeadCell, { flex: 1.5, textAlign: 'center' }]}>Traditional</Text>
          </View>
          {[
            { feature: 'Claim filing', us: 'Automatic', them: 'Manual forms' },
            { feature: 'Processing time', us: '2.8 seconds', them: '15-30 days' },
            { feature: 'Documents needed', us: 'Zero', them: 'Multiple' },
            { feature: 'Human intervention', us: 'None', them: 'Required' },
            { feature: 'Weather coverage', us: '✓ Yes', them: '✗ No' },
            { feature: 'Gig worker focus', us: '✓ Yes', them: '✗ No' },
            { feature: 'Daily premium option', us: '✓ From ₹95', them: '✗ Annual only' },
          ].map((row, i) => (
            <View key={row.feature} style={[styles.compRow, i % 2 === 1 && { backgroundColor: '#F8FAFF' }]}>
              <Text style={[styles.compCell, { flex: 3, fontWeight: '600' }]}>{row.feature}</Text>
              <Text style={[styles.compCell, { flex: 1.5, textAlign: 'center', color: PB_GREEN, fontWeight: '700' }]}>{row.us}</Text>
              <Text style={[styles.compCell, { flex: 1.5, textAlign: 'center', color: '#999' }]}>{row.them}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── HOW THE ENGINE WORKS ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>🔧  HOW THE ENGINE WORKS</Text>
        </View>
        <Text style={styles.sectionTitle}>End-to-End Automated Pipeline</Text>

        {[
          { step: '01', icon: MapPin, color: '#0066CC', bg: '#EFF6FF', title: 'Micro-Zone Monitoring', desc: 'Each city is divided into micro-zones (e.g., MZ-DEL-04 = Connaught Place). IoT weather sensors + satellite APIs monitor temperature and rainfall in real-time.' },
          { step: '02', icon: Thermometer, color: '#DC2626', bg: '#FEF2F2', title: 'Threshold Detection', desc: 'When temperature exceeds 45°C (Heat Trigger) or rainfall exceeds 80mm (Rain Trigger) in a micro-zone, the system flags a parametric event.' },
          { step: '03', icon: Bot, color: '#7C3AED', bg: '#F5F3FF', title: 'ML Oracle Pricing', desc: 'Our Python ML Oracle API dynamically calculates premiums based on zone risk, weather forecasts, and historical disruption patterns. Prices update in real-time.' },
          { step: '04', icon: Zap, color: '#D97706', bg: '#FFFBEB', title: 'Auto-Approval Engine', desc: 'The Spring Boot actuarial engine runs every hour. When a trigger is detected, claims are auto-approved with zero human intervention in ~2.8 seconds.' },
          { step: '05', icon: Wallet, color: '#059669', bg: '#ECFDF5', title: 'Instant Wallet Payout', desc: 'Approved payouts are instantly credited to the rider\'s digital wallet. Basic: ₹300/day, Standard: ₹500/day, Pro: ₹1000/day.' },
        ].map((s, i) => (
          <View key={s.step} style={styles.pipelineCard}>
            <View style={styles.pipelineLeft}>
              <View style={[styles.pipelineIcon, { backgroundColor: s.bg }]}>
                <s.icon size={20} color={s.color} />
              </View>
              {i < 4 && <View style={styles.pipelineLine} />}
            </View>
            <View style={styles.pipelineContent}>
              <Text style={styles.pipelineStep}>STEP {s.step}</Text>
              <Text style={styles.pipelineTitle}>{s.title}</Text>
              <Text style={styles.pipelineDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* ── WHY DYNAMIC ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>📊  WHY DYNAMIC PRICING?</Text>
        </View>
        <Text style={styles.sectionTitle}>Prices That Adapt to Risk</Text>
        <Text style={styles.bodyText}>
          Traditional insurance charges the same premium regardless of actual risk. RiskWire's ML Oracle analyzes:
        </Text>
        {[
          { emoji: '🌡️', factor: 'Real-time weather forecasts', detail: 'Premiums adjust based on upcoming heat/rain predictions' },
          { emoji: '📍', factor: 'Zone-specific risk data', detail: 'Delhi riders pay more in summer, Mumbai riders in monsoon' },
          { emoji: '📈', factor: 'Historical disruption patterns', detail: 'Machine learning identifies high-risk periods per zone' },
          { emoji: '👥', factor: 'Pool risk distribution', detail: 'Actuarial models balance premiums across the rider pool' },
        ].map(d => (
          <View key={d.factor} style={styles.dynamicCard}>
            <Text style={styles.dynamicEmoji}>{d.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dynamicTitle}>{d.factor}</Text>
              <Text style={styles.dynamicDesc}>{d.detail}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* ── TECH STACK ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>🏗️  OUR TECHNOLOGY</Text>
        </View>
        <View style={styles.techGrid}>
          {[
            { label: 'Spring Boot', desc: 'Actuarial Engine', color: '#059669' },
            { label: 'Python ML', desc: 'Oracle Pricing API', color: '#D97706' },
            { label: 'React Native', desc: 'Worker Mobile App', color: '#0066CC' },
            { label: 'React Admin', desc: 'Guidewire Dashboard', color: '#DC2626' },
            { label: 'MySQL + JPA', desc: 'Policy Database', color: '#7C3AED' },
            { label: 'IoT + Satellite', desc: 'Weather Sensors', color: '#0891B2' },
          ].map(t => (
            <View key={t.label} style={[styles.techCard, { borderTopColor: t.color }]}>
              <Text style={[styles.techLabel, { color: t.color }]}>{t.label}</Text>
              <Text style={styles.techDesc}>{t.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── KEY METRICS ── */}
        <View style={[styles.sectionLabel, { marginTop: 24 }]}>
          <Text style={styles.sectionLabelText}>📈  KEY METRICS</Text>
        </View>
        <View style={styles.metricsGrid}>
          {[
            { val: '2.8s', label: 'Avg Claim Processing', color: PRIMARY },
            { val: '97.3%', label: 'Auto-Approval Rate', color: PB_GREEN },
            { val: '9', label: 'Micro-Zones Monitored', color: '#D97706' },
            { val: '₹0', label: 'Documents Required', color: '#DC2626' },
          ].map(m => (
            <View key={m.label} style={styles.metricCard}>
              <Text style={[styles.metricVal, { color: m.color }]}>{m.val}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ── MULTILINGUAL SUPPORT ── */}
        <View style={styles.finalCta}>
          <Globe size={24} color="#FFF" />
          <Text style={styles.finalCtaTitle}>Available in 8 Languages</Text>
          <Text style={styles.finalCtaDesc}>English · हिन्दी · தமிழ் · తెలుగు · ಕನ್ನಡ · മലയാളം · বাংলা · मराठी</Text>
          <Text style={styles.finalCtaDesc}>Our AI chatbot speaks your language. Zero human intervention.</Text>
        </View>
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
  helpText: { fontSize: 13, color: PRIMARY, fontWeight: '600' },

  strip: { backgroundColor: PRIMARY, paddingVertical: 8, paddingHorizontal: 16 },
  stripText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  hero: { backgroundColor: '#F8FAFF', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E8EDF5' },
  heroTag: { fontSize: 10, color: PRIMARY, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  heroTitle: { fontSize: 26, fontWeight: '300', color: '#555', lineHeight: 36, marginBottom: 8 },
  heroHighlight: { fontWeight: '800', color: '#1A1A1A' },
  heroDesc: { fontSize: 13, color: '#666', lineHeight: 20 },

  content: { padding: 20, paddingBottom: 40 },

  sectionLabel: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 16 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', color: PB_NAVY, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 10, marginTop: 4 },
  bodyText: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 14 },

  problemGrid: { gap: 8, marginBottom: 4 },
  problemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#DC2626',
  },
  problemEmoji: { fontSize: 18 },
  problemText: { flex: 1, fontSize: 12, color: '#7F1D1D', fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 24 },

  compTable: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 4 },
  compHead: { flexDirection: 'row', backgroundColor: PB_NAVY, paddingVertical: 10, paddingHorizontal: 12 },
  compHeadCell: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  compRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  compCell: { fontSize: 11, color: '#333' },

  pipelineCard: { flexDirection: 'row', marginBottom: 0 },
  pipelineLeft: { width: 48, alignItems: 'center' },
  pipelineIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  pipelineLine: { width: 2, flex: 1, backgroundColor: '#E5E9F2', marginVertical: -2 },
  pipelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  pipelineStep: { fontSize: 9, fontWeight: '800', color: '#999', letterSpacing: 1, marginBottom: 4 },
  pipelineTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  pipelineDesc: { fontSize: 12, color: '#666', lineHeight: 18 },

  dynamicCard: {
    flexDirection: 'row', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  dynamicEmoji: { fontSize: 22 },
  dynamicTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  dynamicDesc: { fontSize: 12, color: '#666', lineHeight: 17 },

  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  techCard: {
    width: '47%', backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12,
    borderTopWidth: 3,
  },
  techLabel: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  techDesc: { fontSize: 11, color: '#666' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '47%', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E9F2',
  },
  metricVal: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  metricLabel: { fontSize: 10, color: '#666', fontWeight: '600', textAlign: 'center' },

  finalCta: {
    backgroundColor: PB_NAVY, borderRadius: 16, padding: 22,
    alignItems: 'center', marginTop: 24, gap: 8,
  },
  finalCtaTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  finalCtaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18 },
});
