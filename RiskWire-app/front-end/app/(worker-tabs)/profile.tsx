import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import {
  User, Shield, Edit3, ChevronRight, Phone, MapPin,
  Briefcase, IndianRupee, FileText, Check, LogOut, X,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { getCachedRiderId, clearOnboardingState } from '@/utils/onboardingState';
import { getRider, updateRider, buyPolicy, getQuote, Rider } from '@/utils/api';

const PB_NAVY = '#0F4C81';
const PB_GREEN = '#00C37B';
const PB_ORANGE = '#FF5722';

const PLANS = [
  { id: 'basic', name: 'Basic', color: '#4CAF50', premium: '₹14/wk', cover: '₹300/day' },
  { id: 'standard', name: 'Standard', color: '#0066CC', premium: '₹24/wk', cover: '₹500/day' },
  { id: 'pro', name: 'Pro', color: '#7B2FF7', premium: '₹45/wk', cover: '₹1,000/day' },
];

export default function ProfileTab() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, { premium: number; daily_payout: number }> | null>(null);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPlatform, setEditPlatform] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('standard');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const id = getCachedRiderId();
      if (id) {
        const [data, quoteData] = await Promise.all([
          getRider(id),
          getQuote(id).catch(() => null)
        ]);
        setRider(data);
        setQuotes(quoteData);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
        setEditCity(data.city || '');
        setEditPlatform(data.platform || '');
        setSelectedPlan((data.policyTier || 'STANDARD').toLowerCase());
      }
    } catch { /* show whatever we have */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const handleSaveDetails = async () => {
    if (!rider) return;
    setSaving(true);
    try {
      const updated = await updateRider(rider.id, {
        name: editName, phone: editPhone, city: editCity, platform: editPlatform,
      });
      setRider(updated);
      setEditModal(false);
    } catch { /* silently keep modal open */ }
    finally { setSaving(false); }
  };

  const handleChangePlan = async () => {
    if (!rider) return;
    setSaving(true);
    try {
      const updated = await buyPolicy(rider.id, selectedPlan);
      setRider(updated);
      setPlanModal(false);
    } catch { /* silently keep modal open */ }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await clearOnboardingState();
    router.replace('/(tabs)' as any);
  };

  const curPlan = PLANS.find(p => p.id === selectedPlan) ?? PLANS[1];
  const displayName = rider?.name ?? '—';
  const displayInitial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={PB_NAVY} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.editHeaderBtn} onPress={() => setEditModal(true)}>
          <Edit3 size={16} color={PB_NAVY} />
          <Text style={styles.editHeaderText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayInitial}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>Gig Worker · {rider?.platform ?? '—'}</Text>
          <View style={styles.profileBadge}>
            <Check size={12} color={PB_GREEN} />
            <Text style={styles.profileBadgeText}>Verified Member</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          {[
            { icon: Phone, label: 'Mobile', val: rider?.phone ? `+91 ${rider.phone}` : '—' },
            { icon: MapPin, label: 'City', val: rider?.city ?? '—' },
            { icon: Briefcase, label: 'Platform', val: rider?.platform ?? '—' },
            { icon: IndianRupee, label: 'Wallet', val: `₹${rider?.walletBalance ?? 0}` },
            { icon: FileText, label: 'Rider ID', val: rider ? `RDR-${String(rider.id).padStart(6, '0')}` : '—' },
          ].map(row => (
            <View key={row.label} style={styles.detailRow}>
              <View style={styles.detailIconBox}><row.icon size={15} color={PB_NAVY} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailVal}>{row.val}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditModal(true)}>
            <Edit3 size={15} color='#FFF' />
            <Text style={styles.editBtnText}>Edit Details</Text>
          </TouchableOpacity>
        </View>

        {/* Current Plan */}
        <View style={styles.planCard}>
          <Text style={styles.cardTitle}>Current Plan</Text>
          <View style={[styles.currentPlanBox, { borderColor: curPlan.color }]}>
            <View style={[styles.planIconBox, { backgroundColor: `${curPlan.color}18` }]}>
              <Shield size={24} color={curPlan.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currentPlanName, { color: curPlan.color }]}>
                {rider?.policyTier ?? curPlan.name} Plan
              </Text>
              <Text style={styles.currentPlanPremium}>
                ₹{quotes?.[selectedPlan]?.premium ?? curPlan.premium.replace('₹', '').split('/')[0]}/wk · ₹{quotes?.[selectedPlan]?.daily_payout ?? curPlan.cover.replace('₹', '').split('/')[0]}/day
              </Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>{rider?.isPolicyActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.changePlanBtn} onPress={() => setPlanModal(true)}>
            <Text style={styles.changePlanText}>Change Plan</Text>
            <ChevronRight size={16} color={PB_ORANGE} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color='#EF4444' />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Edit Details Modal ── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Details</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <X size={24} color='#666' />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {[
              { label: 'Full Name', val: editName, setter: setEditName, kb: 'default' as const },
              { label: 'Mobile Number', val: editPhone, setter: setEditPhone, kb: 'phone-pad' as const },
              { label: 'City', val: editCity, setter: setEditCity, kb: 'default' as const },
              { label: 'Delivery Platform', val: editPlatform, setter: setEditPlatform, kb: 'default' as const },
            ].map(f => (
              <View key={f.label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.val}
                  onChangeText={f.setter}
                  keyboardType={f.kb}
                  placeholderTextColor='#9CA3AF'
                />
              </View>
            ))}
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveDetails} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Change Plan Modal ── */}
      <Modal visible={planModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Your Plan</Text>
            <TouchableOpacity onPress={() => setPlanModal(false)}>
              <X size={24} color='#666' />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {PLANS.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planOption,
                  { borderColor: selectedPlan === plan.id ? plan.color : '#E5E5E5' },
                  selectedPlan === plan.id && { backgroundColor: `${plan.color}10` },
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={[styles.planOptionIcon, { backgroundColor: `${plan.color}18` }]}>
                  <Shield size={22} color={plan.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planOptionName, { color: plan.color }]}>{plan.name}</Text>
                  <Text style={styles.planOptionDetails}>
                    ₹{quotes?.[plan.id]?.premium ?? plan.premium.replace('₹', '').split('/')[0]}/wk · ₹{quotes?.[plan.id]?.daily_payout ?? plan.cover.replace('₹', '').split('/')[0]}/day
                  </Text>
                </View>
                <View style={[styles.radioBtn, selectedPlan === plan.id && { borderColor: plan.color }]}>
                  {selectedPlan === plan.id && <View style={[styles.radioDot, { backgroundColor: plan.color }]} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleChangePlan} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Updating...' : 'Confirm Plan Change'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#666' },
  header: {
    backgroundColor: '#FFFFFF', paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E5E9F2',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: PB_NAVY },
  editHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#EFF6FF', borderRadius: 20 },
  editHeaderText: { fontSize: 13, color: PB_NAVY, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E9F2',
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: PB_NAVY, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  profileName: { fontSize: 22, fontWeight: '900', color: '#1A1A24', marginBottom: 4 },
  profileRole: { fontSize: 14, color: '#8898AA', marginBottom: 10 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  profileBadgeText: { fontSize: 12, color: PB_GREEN, fontWeight: '700' },
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E9F2' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A24', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  detailIconBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11, color: '#8898AA', marginBottom: 2 },
  detailVal: { fontSize: 14, fontWeight: '600', color: '#1A1A24' },
  editBtn: {
    backgroundColor: PB_NAVY, borderRadius: 12, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  editBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E9F2' },
  currentPlanBox: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderRadius: 14, padding: 14, marginBottom: 12 },
  planIconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  currentPlanName: { fontSize: 17, fontWeight: '800' },
  currentPlanPremium: { fontSize: 13, color: '#666', marginTop: 2 },
  activePill: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activePillText: { fontSize: 12, color: PB_GREEN, fontWeight: '700' },
  changePlanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#FFF5F0', borderRadius: 12 },
  changePlanText: { fontSize: 14, color: PB_ORANGE, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A24' },
  modalContent: { padding: 20, gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  input: {
    backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1A1A24', borderWidth: 1, borderColor: '#E5E5E5',
  },
  saveBtn: { backgroundColor: PB_ORANGE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  planOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 2, borderRadius: 16, padding: 16, marginBottom: 12,
  },
  planOptionIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planOptionName: { fontSize: 17, fontWeight: '800' },
  planOptionDetails: { fontSize: 13, color: '#666', marginTop: 2 },
  radioBtn: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
});
