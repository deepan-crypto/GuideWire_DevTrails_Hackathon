import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { User, Activity, ArrowLeft } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/dashboard')} style={styles.backBtn}>
          <ArrowLeft size={22} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.profileCard}>
           <View style={styles.avatar}>
             <User size={32} color="#FFF" />
           </View>
           <Text style={styles.name}>Mathumitha S</Text>
           <Text style={styles.subtitle}>Gig Worker</Text>
        </View>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/dashboard')}
        >
          <Activity size={24} color="#0066CC" />
          <Text style={styles.menuItemText}>Worker Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0066CC' },
  content: { padding: 20, gap: 20 },
  profileCard: {
    backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E9F2',
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#0066CC',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1A1A24' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E9F2',
  },
  menuItemText: { fontSize: 16, fontWeight: '600', color: '#1A1A24' },
});
