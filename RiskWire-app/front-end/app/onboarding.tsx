import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Search, Phone, User, X, Clock, CheckCircle, AlertCircle, Shield, Camera } from 'lucide-react-native';
import { isOnboardingComplete, loadOnboardingState } from '@/utils/onboardingState';

const AGES = Array.from({ length: 63 }, (_, i) => `${i + 18}`);

const POPULAR_CITIES = [
  'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Mumbai',
  'Thane', 'Gurgaon', 'Chennai', 'Ghaziabad', 'Ernakulam',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow',
];

const GIG_PLATFORMS = [
  { id: 'swiggy', name: 'Swiggy', emoji: '🟠' },
  { id: 'zomato', name: 'Zomato', emoji: '🔴' },
  { id: 'uber', name: 'Uber', emoji: '⚫' },
  { id: 'ola', name: 'Ola Cabs', emoji: '🟢' },
  { id: 'dunzo', name: 'Dunzo', emoji: '🔵' },
  { id: 'blinkit', name: 'Blinkit', emoji: '🟡' },
  { id: 'zepto', name: 'Zepto', emoji: '💜' },
  { id: 'porter', name: 'Porter', emoji: '🔶' },
  { id: 'rapido', name: 'Rapido', emoji: '🏍️' },
  { id: 'other', name: 'Other', emoji: '📦' },
];

// STEP 1 = Gig platform selection (verification)
// STEP 2 = Worker ID verification
// STEP 3 = Age selection
// STEP 4 = City selection
// STEP 5 = (go to plans page)
const TOTAL_STEPS = 4;
const STEP_TITLES = [
  'Verify your gig platform',
  'Enter your worker ID',
  'Tell us your age',
  'Where are you based?',
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showAgePicker, setShowAgePicker] = useState(false);

  // If already onboarded, skip to home
  useEffect(() => {
    loadOnboardingState().then((done) => {
      if (done) router.replace('/(worker-tabs)' as any);
    });
  }, []);

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const selectedPlatform = GIG_PLATFORMS.find(p => p.id === platform);

  const canContinue =
    (step === 1 && platform !== '') ||
    (step === 2 && verified) ||
    (step === 3 && age !== '') ||
    (step === 4 && city !== '');

  const handleVerifyId = async () => {
    if (!workerId.trim()) return;
    setVerifying(true);
    setVerifyError('');
    // Simulate API verification (mock — backend accepts any 6+ char ID)
    await new Promise(r => setTimeout(r, 1800));
    if (workerId.trim().length >= 4) {
      setVerified(true);
    } else {
      setVerifyError('Worker ID not found. Check your partner app.');
    }
    setVerifying(false);
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Done with onboarding — go to plans page (passing city & platform & age info)
      router.push({
        pathname: '/plans' as any,
        params: { city, platform, age, workerId },
      });
    }
  };

  const progress = (step / (TOTAL_STEPS + 1)) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>RiskWire</Text>
          <Text style={styles.logoTagline}>MICRO-INSURANCE</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {step}/{TOTAL_STEPS}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(progress)}% complete</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>{STEP_TITLES[step - 1]}</Text>

        {/* STEP 1: Gig Platform Selection */}
        {step === 1 && (
          <View>
            <Text style={styles.stepSubtitle}>
              Select the platform you work with. We'll verify your gig worker status.
            </Text>
            <View style={styles.platformGrid}>
              {GIG_PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.platformCard, platform === p.id && styles.platformCardSel]}
                  onPress={() => setPlatform(p.id)}
                >
                  <Text style={styles.platformEmoji}>{p.emoji}</Text>
                  <Text style={[styles.platformName, platform === p.id && styles.platformNameSel]}>{p.name}</Text>
                  {platform === p.id && (
                    <View style={styles.platformCheck}>
                      <CheckCircle size={14} color="#00A25B" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {platform && (
              <View style={styles.verificationBanner}>
                <Shield size={16} color="#00529B" />
                <Text style={styles.verificationBannerText}>
                  We'll verify your {selectedPlatform?.name} worker ID in the next step
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 2: Worker ID Verification */}
        {step === 2 && (
          <View>
            <Text style={styles.stepSubtitle}>
              Enter your {selectedPlatform?.name} worker / delivery partner ID to verify your gig worker status.
            </Text>
            <View style={styles.verifyBox}>
              <View style={[styles.platformBadge]}>
                <Text style={styles.platformEmoji2}>{selectedPlatform?.emoji}</Text>
                <Text style={styles.platformBadgeName}>{selectedPlatform?.name} Partner</Text>
              </View>
              <View style={styles.idField}>
                <Text style={styles.idLabel}>Worker / Partner ID</Text>
                <TextInput
                  style={[styles.idInput, verified && styles.idInputVerified]}
                  placeholder="e.g. SWG-78432 or ZOM-99123"
                  placeholderTextColor="#AAA"
                  value={workerId}
                  onChangeText={(t) => { setWorkerId(t); setVerified(false); setVerifyError(''); }}
                  autoCapitalize="characters"
                  editable={!verified}
                />
                {verified && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={14} color="#00A25B" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              {!!verifyError && (
                <View style={styles.errorRow}>
                  <AlertCircle size={13} color="#DC2626" />
                  <Text style={styles.errorText}>{verifyError}</Text>
                </View>
              )}
              {!verified && (
                <TouchableOpacity
                  style={[styles.verifyBtn, (!workerId.trim() || verifying) && styles.verifyBtnDisabled]}
                  onPress={handleVerifyId}
                  disabled={!workerId.trim() || verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify Worker ID</Text>
                  )}
                </TouchableOpacity>
              )}
              {verified && (
                <View style={styles.successBox}>
                  <CheckCircle size={20} color="#00A25B" />
                  <View>
                    <Text style={styles.successTitle}>Identity Confirmed!</Text>
                    <Text style={styles.successSub}>You are eligible for gig worker micro-insurance</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* STEP 3: Age */}
        {step === 3 && (
          <View>
            <Text style={styles.stepSubtitle}>
              Your age helps us calculate your personalized premium.
            </Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowAgePicker(true)}
            >
              <Text style={styles.dropdownLabel}>Your age</Text>
              <View style={styles.dropdownValue}>
                <Text style={age ? styles.dropdownValueText : styles.dropdownPlaceholder}>
                  {age ? `${age} years old` : 'Select your age'}
                </Text>
                <ChevronDown size={18} color="#555" />
              </View>
            </TouchableOpacity>
            <Modal
              visible={showAgePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowAgePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Age</Text>
                    <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                      <X size={22} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={AGES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.ageOption, age === item && styles.ageOptionSelected]}
                        onPress={() => { setAge(item); setShowAgePicker(false); }}
                      >
                        <Text style={[styles.ageOptionText, age === item && styles.ageOptionTextSel]}>
                          {item} years
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>
        )}

        {/* STEP 4: City */}
        {step === 4 && (
          <View>
            <Text style={styles.stepSubtitle}>
              Your city determines local AQI and weather risk zones.
            </Text>
            <View style={styles.searchBox}>
              <Search size={16} color="#555" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your city"
                placeholderTextColor="#AAA"
                value={citySearch}
                onChangeText={setCitySearch}
              />
              {citySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCitySearch('')}>
                  <X size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.sectionLabel}>Popular cities</Text>
            <View style={styles.chipGrid}>
              {filteredCities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, city === c && styles.chipSelected]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.chipText, city === c && styles.chipTextSel]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Continue / Finish Button */}
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueBtnText}>
            {step === TOTAL_STEPS ? 'Browse Insurance Plans →' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        {/* Back */}
        {step > 1 && (
          <TouchableOpacity style={styles.backLink} onPress={() => setStep(step - 1)}>
            <Text style={styles.backLinkText}>‹ Go back</Text>
          </TouchableOpacity>
        )}

        {/* Trust footer */}
        <View style={styles.trustFooter}>
          <Shield size={14} color="#00529B" />
          <Text style={styles.trustText}>
            RiskWire · Powered by Guidewire Cloud · IRDAI Compliant
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const PRIMARY = '#E63946';
const BRAND_BLUE = '#00529B';
const BORDER = '#D1D5DB';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#FFF',
  },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  logoText: { fontSize: 22, fontWeight: '900', color: BRAND_BLUE, letterSpacing: -0.5, fontStyle: 'italic' },
  logoTagline: { fontSize: 9, color: BRAND_BLUE, fontWeight: '600', opacity: 0.7, marginLeft: 6, alignSelf: 'flex-end', marginBottom: 2 },
  stepBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: BRAND_BLUE },

  progressBarContainer: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF' },
  progressTrack: { height: 6, backgroundColor: '#E0E7FF', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#00A25B', borderRadius: 3 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#00A25B' },

  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  stepTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 6, lineHeight: 30 },
  stepSubtitle: { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 20 },

  // Gig platform grid
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  platformCard: {
    width: '30%', borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 6, backgroundColor: '#FFF',
  },
  platformCardSel: { borderColor: '#00A25B', backgroundColor: '#F0FFF8' },
  platformEmoji: { fontSize: 24 },
  platformName: { fontSize: 11, fontWeight: '600', color: '#444', textAlign: 'center' },
  platformNameSel: { color: '#00A25B' },
  platformCheck: { position: 'absolute', top: 6, right: 6 },
  verificationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  verificationBannerText: { fontSize: 12, color: BRAND_BLUE, flex: 1, fontWeight: '600' },

  // Worker ID verification
  verifyBox: { gap: 14 },
  platformBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8F9FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF' },
  platformEmoji2: { fontSize: 28 },
  platformBadgeName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  idField: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 6 },
  idLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  idInput: { fontSize: 16, color: '#1A1A2E', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  idInputVerified: { color: '#00A25B' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#00A25B' },
  verifyBtn: {
    backgroundColor: BRAND_BLUE, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  verifyBtnDisabled: { backgroundColor: '#93B5D8' },
  verifyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0FFF8', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#86EFAC' },
  successTitle: { fontSize: 14, fontWeight: '800', color: '#14532D' },
  successSub: { fontSize: 11, color: '#166534', marginTop: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 12, color: '#DC2626', fontWeight: '600', flex: 1 },

  // Age picker
  dropdown: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#FFF' },
  dropdownLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  dropdownValue: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  dropdownValueText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  dropdownPlaceholder: { fontSize: 16, color: '#AAA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  ageOption: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  ageOptionSelected: { backgroundColor: '#FFF5F5' },
  ageOptionText: { fontSize: 15, color: '#333' },
  ageOptionTextSel: { color: PRIMARY, fontWeight: '700' },

  // City
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FFF' },
  chipSelected: { backgroundColor: '#F0FFF8', borderColor: '#00A25B' },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextSel: { color: '#00A25B', fontWeight: '700' },

  // Continue button
  continueBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  continueBtnDisabled: { backgroundColor: '#FECACA' },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center', paddingVertical: 8, marginBottom: 16 },
  backLinkText: { color: '#666', fontSize: 14 },

  trustFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingTop: 8 },
  trustText: { fontSize: 10, color: '#999' },
});
