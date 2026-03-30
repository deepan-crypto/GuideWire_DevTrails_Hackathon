import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check, ChevronDown, BriefcaseMedical } from 'lucide-react-native';

const PLANS = [
  {
    id: 'bupa',
    insurer: 'Niva Bupa Health Insurance',
    logoText: 'niva bupa',
    logoColor: '#0066CC',
    name: 'ReAssure 3.0 Elite',
    hospitals: 225,
    features: ['Single Private AC room', '₹ 5 Lakh Renewal bonus', 'Unlimited Restoration of cover'],
    cover: '₹5 Lakh',
    monthly: '₹498',
    annually: '₹5,972',
    discount: 'Inclusive of 5% online discount *'
  },
  {
    id: 'hdfc',
    insurer: 'HDFC ERGO',
    logoText: 'HDFC ERGO',
    logoColor: '#D32F2F',
    name: 'Optima Select',
    hospitals: 218,
    features: ['Guaranteed 2X increase in cover amount after 4 renewals', 'Single pvt AC Room', '₹1.25 lakh Renewal Bonus', 'Unlimited Restoration of cover'],
    cover: '₹5 Lakh',
    monthly: '₹524',
    annually: '₹6,283',
    discount: 'Inclusive of 5% online discount *'
  },
  {
    id: 'icici',
    insurer: 'ICICI Lombard',
    logoText: 'ICICI Lombard',
    logoColor: '#E65100',
    name: 'Elevate',
    hospitals: 134,
    features: ['Enjoy comprehensive coverage with industry first OPD rider with no sub-limits', 'Single pvt AC Room', '₹1 lakh No Claim Bonus', 'Unlimited Restoration of cover'],
    cover: '₹5 Lakh',
    monthly: '₹499',
    annually: '₹5,981',
  }
];

export default function PlansScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Insurance Plans</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {PLANS.map((plan, index) => (
          <View key={plan.id} style={styles.cardWrapper}>
             <View style={styles.card}>
               
               <View style={styles.topSection}>
                 <View style={styles.leftCol}>
                   <View style={styles.logoRow}>
                      <View style={[styles.logoBox, { borderColor: plan.logoColor }]}>
                        <Text style={[styles.logoText, { color: plan.logoColor }]}>{plan.logoText}</Text>
                      </View>
                      <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={styles.hospitalRow}>
                          <BriefcaseMedical size={12} color="#00A25B" />
                          <Text style={styles.hospitalText}>
                            <Text style={styles.hospitalBold}>{plan.hospitals}</Text> Cashless hospitals. <Text style={styles.hospitalLink}>View list ›</Text>
                          </Text>
                        </View>
                      </View>
                   </View>
                   
                   <View style={styles.featuresList}>
                     {plan.features.map((f, i) => (
                       <View key={i} style={styles.featureRow}>
                         {i === 0 && plan.id !== 'bupa' ? (
                           <Text style={styles.featureHeart}>❤️</Text>
                         ) : (
                           <Check size={14} color="#00A25B" />
                         )}
                         <Text style={styles.featureText}>{f}</Text>
                       </View>
                     ))}
                   </View>
                   
                   <TouchableOpacity>
                     <Text style={styles.viewFeaturesLink}>View all features ›</Text>
                   </TouchableOpacity>
                 </View>
                 
                 <View style={styles.rightCol}>
                   <View style={styles.pricingGrid}>
                     <View>
                       <Text style={styles.pricingLabel}>Cover amount</Text>
                       <Text style={styles.coverValue}>{plan.cover}</Text>
                     </View>
                     <View>
                       <Text style={styles.pricingLabel}>Starting from</Text>
                       <Text style={styles.monthlyValue}>{plan.monthly}<Text style={styles.monthlyUnit}>/month</Text></Text>
                       <Text style={styles.annuallyValue}>{plan.annually} annually</Text>
                     </View>
                   </View>
                   
                   <TouchableOpacity 
                     style={styles.actionBtn}
                     onPress={() => router.push({ pathname: '/activate', params: { plan: plan.name } })}
                   >
                     <Text style={styles.actionBtnText}>Activate ›</Text>
                   </TouchableOpacity>
                   
                   {plan.discount && (
                     <Text style={styles.discountText}>% {plan.discount}</Text>
                   )}
                 </View>
               </View>

               <View style={styles.cardFooter}>
                 <View style={{flex: 1}} />
                 <TouchableOpacity style={styles.compareBtn}>
                   <View style={styles.compareRadio} />
                   <Text style={styles.compareText}>Add to compare</Text>
                 </TouchableOpacity>
               </View>

             </View>
             
             {/* Dropdown handle below card */}
             <View style={styles.cardHandleWrapper}>
               <View style={styles.cardHandle}>
                 <Text style={styles.handleText}>View {index === 0 ? '25 more' : '1 more'} plans</Text>
                 <ChevronDown size={14} color="#00A25B" />
               </View>
             </View>
          </View>
        ))}
        <View style={{height: 40}} />
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
  
  content: { padding: 16 },
  
  cardWrapper: { marginBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E9F2',
    overflow: 'hidden',
  },
  topSection: { flexDirection: 'row', padding: 20, paddingBottom: 16 },
  
  leftCol: { flex: 6, paddingRight: 16 },
  rightCol: { flex: 4, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: '#F0F0F0' },
  
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  logoBox: { width: 70, height: 40, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
  
  planName: { fontSize: 18, fontWeight: '700', color: '#31446B', marginBottom: 4 },
  hospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hospitalText: { fontSize: 12, color: '#666' },
  hospitalBold: { fontWeight: 'bold', color: '#333' },
  hospitalLink: { color: '#00A25B', fontWeight: 'bold' },
  
  featuresList: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureHeart: { fontSize: 12 },
  featureText: { fontSize: 12, color: '#666', flex: 1, lineHeight: 18 },
  
  viewFeaturesLink: { color: '#00A25B', fontSize: 12, fontWeight: 'bold' },
  
  pricingGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  pricingLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  coverValue: { fontSize: 16, fontWeight: 'bold', color: '#31446B' },
  monthlyValue: { fontSize: 16, fontWeight: 'bold', color: '#31446B' },
  monthlyUnit: { fontSize: 12, fontWeight: 'normal' },
  annuallyValue: { fontSize: 11, color: '#888', marginTop: 2 },
  
  actionBtn: { backgroundColor: '#FF5722', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  discountText: { fontSize: 11, color: '#00A25B', textAlign: 'center' },
  
  cardFooter: { backgroundColor: '#F0FDF4', paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  compareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#CCC', backgroundColor: '#FFF' },
  compareText: { fontSize: 12, color: '#666' },
  
  cardHandleWrapper: { alignItems: 'center', marginTop: -1, zIndex: -1 },
  cardHandle: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E9F2', borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 20, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  handleText: { fontSize: 12, color: '#00A25B', fontWeight: '600' },
});
