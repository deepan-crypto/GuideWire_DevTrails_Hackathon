import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, Bell, CheckCircle2, CloudRain, AlertCircle, 
  MapPin, Briefcase, IndianRupee, FileText, ChevronRight, Activity 
} from 'lucide-react-native';

import { UserCircle } from 'lucide-react-native';

export default function WorkerDashboardScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.headerTitle}>Worker Dashboard</Text>
            <Text style={styles.headerSubtitle}>RiskWire Parametric Insurance</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={20} color="#666" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <UserCircle size={28} color="#0066CC" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Alerts Section */}
        <View style={styles.alertsContainer}>
          <View style={[styles.alertBox, styles.alertBlue]}>
            <Bell size={16} color="#0066CC" />
            <Text style={[styles.alertText, { color: '#0066CC' }]}>Heavy Rain detected in Coimbatore.</Text>
          </View>
          <View style={[styles.alertBox, styles.alertGreen]}>
            <CheckCircle2 size={16} color="#2E7D32" />
            <Text style={[styles.alertText, { color: '#2E7D32' }]}>Claim triggered automatically — CLM-1773238801401-3818.</Text>
          </View>
          <View style={[styles.alertBox, styles.alertGreen]}>
            <CheckCircle2 size={16} color="#2E7D32" />
            <Text style={[styles.alertText, { color: '#2E7D32' }]}>Payout ₹350 initiated.</Text>
          </View>
        </View>

        {/* Top Row Cards */}
        <View style={styles.row}>
          {/* Profile Card */}
          <View style={[styles.card, { flex: 1.2 }]}>
             <View style={styles.profileHeader}>
               <View style={styles.avatar}>
                 <Text style={styles.avatarText}>M</Text>
               </View>
               <View>
                 <Text style={styles.profileName}>Mathumitha S</Text>
                 <Text style={styles.profileType}>Gig Worker</Text>
               </View>
             </View>
             <View style={styles.profileDetailsRow}>
               <MapPin size={14} color="#666" />
               <Text style={styles.profileDetailText}>Urban</Text>
             </View>
             <View style={styles.profileDetailsRow}>
               <Briefcase size={14} color="#666" />
               <Text style={styles.profileDetailText}>Amazon</Text>
             </View>
             <View style={styles.profileDetailsRow}>
               <IndianRupee size={14} color="#666" />
               <Text style={styles.profileDetailText}>Avg Income ₹500/day</Text>
             </View>
             <View style={styles.profileDetailsRow}>
               <FileText size={14} color="#666" />
               <Text style={styles.profileDetailText}>POL-1773238789619-6557</Text>
             </View>
          </View>

          {/* Policy Details Card (Dark) */}
          <View style={[styles.card, styles.darkCard, { flex: 1.5 }]}>
            <View style={styles.darkCardHeader}>
              <Text style={styles.darkCardTitle}>POLICY DETAILS</Text>
              <View style={styles.activeTag}>
                <CheckCircle2 size={12} color="#4CAF50" />
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Weekly Premium</Text>
              <Text style={styles.darkCardValueLarge}>₹24<Text style={styles.darkCardValueUnit}>/wk</Text></Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Coverage Amount</Text>
              <Text style={styles.darkCardValue}>₹350</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Platform</Text>
              <Text style={styles.darkCardValue}>amazon</Text>
            </View>
            <View style={styles.darkCardRow}>
              <Text style={styles.darkCardLabel}>Zone</Text>
              <Text style={styles.darkCardValue}>urban</Text>
            </View>
          </View>
        </View>

        {/* Middle Row */}
        <View style={styles.row}>
          {/* Risk Indicator */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardSectionTitle}>RISK INDICATOR</Text>
            <View style={styles.riskHeaderRow}>
              <Text style={styles.riskLabel}>Risk Score</Text>
              <Text style={styles.riskBadge}>Medium Risk</Text>
            </View>
            
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '61%' }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>0</Text>
              <Text style={[styles.progressLabelText, { color: '#1A1A1A', fontWeight: 'bold' }]}>0.61</Text>
              <Text style={styles.progressLabelText}>1.0</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statMiniBox}>
                <Text style={styles.statMiniValue}>1</Text>
                <Text style={styles.statMiniLabel}>Total</Text>
              </View>
              <View style={styles.statMiniBox}>
                <Text style={[styles.statMiniValue, { color: '#4CAF50' }]}>1</Text>
                <Text style={styles.statMiniLabel}>Approved</Text>
              </View>
              <View style={styles.statMiniBox}>
                <Text style={[styles.statMiniValue, { color: '#FF9800' }]}>0</Text>
                <Text style={styles.statMiniLabel}>Flagged</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.row}>
          {/* Disruption Monitor */}
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.cardHeaderFlex}>
              <View style={styles.cardTitleRow}>
                <Activity size={18} color="#0066CC" />
                <Text style={styles.cardTitle}>Disruption Monitor</Text>
              </View>
              <View style={styles.cachedTagTitle}>
                <Text style={styles.cachedTagTitleText}>CACHED</Text>
              </View>
            </View>
            <Text style={styles.updateText}>Updated 07:50:17 pm - auto refreshes every 30s</Text>

            <View style={styles.disruptionAlert}>
              <MapPin size={12} color="#D32F2F" />
              <Text style={styles.disruptionAlertText}>Regional Weather Disruption — Heavy Rainfall Reported</Text>
            </View>

            <View style={styles.weatherBox}>
              <View style={styles.weatherRow}>
                <CloudRain size={16} color="#0066CC" />
                <Text style={styles.weatherLabel}>Rainfall</Text>
              </View>
              <Text style={styles.weatherValueBlue}>93.8 mm</Text>
            </View>

            <View style={[styles.weatherBox, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
              <View style={styles.weatherRow}>
                <Text style={styles.tempIcon}>🌡️</Text>
                <Text style={[styles.weatherLabel, { color: '#E65100' }]}>Temperature</Text>
              </View>
              <Text style={styles.weatherValueOrange}>31.2°C</Text>
            </View>
          </View>

          {/* Claim Statistics */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Claim Statistics</Text>
            
            <View style={styles.claimStatRow}>
              <View style={styles.claimStatLeft}>
                <View style={[styles.claimIconBox, { backgroundColor: '#F0F4F8' }]}>
                  <FileText size={14} color="#666" />
                </View>
                <Text style={styles.claimStatLabel}>Total Claims</Text>
              </View>
              <Text style={styles.claimStatValue}>1</Text>
            </View>
            
            <View style={styles.claimStatRow}>
              <View style={styles.claimStatLeft}>
                <View style={[styles.claimIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <CheckCircle2 size={14} color="#4CAF50" />
                </View>
                <Text style={styles.claimStatLabel}>Approved</Text>
              </View>
              <Text style={[styles.claimStatValue, { color: '#4CAF50' }]}>1</Text>
            </View>

            <View style={styles.claimStatRow}>
              <View style={styles.claimStatLeft}>
                <View style={[styles.claimIconBox, { backgroundColor: '#FFEBEE' }]}>
                  <AlertCircle size={14} color="#F44336" />
                </View>
                <Text style={styles.claimStatLabel}>Flagged / Rejected</Text>
              </View>
              <Text style={[styles.claimStatValue, { color: '#F44336' }]}>0</Text>
            </View>
            
            <View style={styles.claimStatRowBorder}>
              <View style={styles.claimStatLeft}>
                <View style={[styles.claimIconBox, { backgroundColor: '#E3F2FD' }]}>
                  <IndianRupee size={14} color="#2196F3" />
                </View>
                <Text style={styles.claimStatLabel}>Total Compensation</Text>
              </View>
              <Text style={[styles.claimStatValue, { color: '#2196F3' }]}>₹350</Text>
            </View>
          </View>
          
          {/* Payout Trend */}
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.cardTitleRow}>
               <Activity size={18} color="#4CAF50" />
               <Text style={styles.cardTitle}>Payout Trend</Text>
            </View>

            <View style={styles.chartArea}>
              {/* Dummy bar chart */}
              <View style={styles.chartBars}>
                <View style={styles.chartCol}><View style={[styles.bar, { height: 0 }]} /><Text style={styles.chartLabel}>W-4</Text></View>
                <View style={styles.chartCol}><View style={[styles.bar, { height: 0 }]} /><Text style={styles.chartLabel}>W-3</Text></View>
                <View style={styles.chartCol}><View style={[styles.bar, { height: 0 }]} /><Text style={styles.chartLabel}>W-2</Text></View>
                <View style={styles.chartCol}><View style={[styles.bar, { height: 0 }]} /><Text style={styles.chartLabel}>W-1</Text></View>
                <View style={styles.chartCol}><View style={[styles.bar, { height: 60, backgroundColor: '#448AFF' }]} /><Text style={styles.chartLabel}>Now</Text></View>
              </View>
            </View>

            <View style={styles.lifetimeRow}>
              <Text style={styles.lifetimeLabel}>Lifetime payout</Text>
              <Text style={styles.lifetimeValue}>₹350</Text>
            </View>
          </View>

        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A24' },
  headerSubtitle: { fontSize: 12, color: '#8898AA', marginTop: 2 },
  notificationBtn: { position: 'relative', padding: 4 },
  notificationBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#F44336', width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  content: { padding: 16, gap: 16 },

  // Alerts
  alertsContainer: { gap: 8 },
  alertBox: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 8, borderWidth: 1, gap: 10,
  },
  alertBlue: { backgroundColor: '#F0F7FF', borderColor: '#D4E8FF' },
  alertGreen: { backgroundColor: '#F1FDF5', borderColor: '#C8E6C9' },
  alertText: { fontSize: 13, fontWeight: '500' },

  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E5E9F2', minWidth: 280,
  },
  
  // Profile Card
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0066CC',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24' },
  profileType: { fontSize: 12, color: '#8898AA' },
  profileDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  profileDetailText: { fontSize: 13, color: '#525F7F' },

  // Policy Details (Dark Card)
  darkCard: { backgroundColor: '#1C2536', borderColor: '#1C2536' },
  darkCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  darkCardTitle: { color: '#8898AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(76,175,80,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeTagText: { color: '#4CAF50', fontSize: 11, fontWeight: 'bold' },
  darkCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  darkCardLabel: { color: '#8898AA', fontSize: 13 },
  darkCardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  darkCardValueLarge: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  darkCardValueUnit: { fontSize: 14, fontWeight: 'normal', color: '#8898AA' },

  // Risk Indicator
  cardSectionTitle: { color: '#8898AA', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 16 },
  riskHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  riskLabel: { fontSize: 14, color: '#525F7F', fontWeight: '500' },
  riskBadge: { backgroundColor: '#FFF8E1', color: '#FFB300', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  progressBarBg: { height: 8, backgroundColor: '#F4F7FB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#FFC107', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  progressLabelText: { fontSize: 11, color: '#8898AA' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statMiniBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statMiniValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1A24', marginBottom: 4 },
  statMiniLabel: { fontSize: 11, color: '#8898AA' },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24' },
  
  // Disruption Monitor
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cachedTagTitle: { backgroundColor: '#F4F7FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E5E9F2' },
  cachedTagTitleText: { fontSize: 10, fontWeight: 'bold', color: '#8898AA' },
  updateText: { fontSize: 11, color: '#8898AA', marginBottom: 16, marginTop: -8 },
  disruptionAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, marginBottom: 16 },
  disruptionAlertText: { fontSize: 12, color: '#D32F2F', flex: 1 },
  weatherBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D4E8FF', marginBottom: 10 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weatherLabel: { fontSize: 13, color: '#0066CC', fontWeight: '500' },
  tempIcon: { fontSize: 16 },
  weatherValueBlue: { fontSize: 16, fontWeight: 'bold', color: '#0066CC' },
  weatherValueOrange: { fontSize: 16, fontWeight: 'bold', color: '#E65100' },

  // Claims
  claimStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  claimStatRowBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  claimStatLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  claimIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  claimStatLabel: { fontSize: 13, color: '#525F7F' },
  claimStatValue: { fontSize: 15, fontWeight: 'bold', color: '#1A1A24' },

  // Trend
  chartArea: { height: 120, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 16, justifyContent: 'flex-end', paddingTop: 20 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%' },
  chartCol: { alignItems: 'center', gap: 8 },
  bar: { width: 40, backgroundColor: '#E5E9F2', borderRadius: 4 },
  chartLabel: { fontSize: 10, color: '#8898AA' },
  lifetimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lifetimeLabel: { fontSize: 12, color: '#8898AA' },
  lifetimeValue: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
});
