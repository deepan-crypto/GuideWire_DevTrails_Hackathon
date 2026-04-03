import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform as OSPlatform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, Search, X, Check, Star, MapPin, Briefcase } from 'lucide-react-native';
import * as Location from 'expo-location';
import { setOnboardingComplete, isOnboardingComplete, loadOnboardingState } from '@/utils/onboardingState';
import { registerRider, buyPolicy } from '@/utils/api';

// ── Data ────────────────────────────────────────────────────────────────────
const AGES = Array.from({ length: 63 }, (_, i) => `${i + 18}`);

const CITIES = [
  'Chennai', 'Coimbatore', 'Kanchipuram', 'Tiruvallur', 'Vellore',
  'Salem', 'Madurai', 'Tiruchirapalli', 'Erode', 'Namakkal',
  'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Mumbai',
  'Thane', 'Gurgaon', 'Ghaziabad', 'Kolkata', 'Ahmedabad',
];

const PLATFORMS = ['Swiggy', 'Zomato', 'Uber', 'Ola', 'Rapido', 'Dunzo', 'Zepto', 'Porter', 'Other'];

const STEP_TITLES = ['Select your age', 'Select your city', 'Where do you work?', 'Location Permission', 'Save your progress'];
const TOTAL_STEPS = 5;

// ── Component ────────────────────────────────────────────────────────────────
export default function ActivateScreen() {
  const { plan } = useLocalSearchParams<{ plan: string }>();

  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [platform, setPlatform] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guard: if user already created, go straight to home
  useEffect(() => {
    loadOnboardingState().then((done) => {
      if (done) router.replace('/(worker-tabs)' as any);
    });
  }, []);

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const canContinue =
    (step === 1 && age !== '') ||
    (step === 2 && city !== '') ||
    (step === 3 && platform !== '') ||
    (step === 4 && locationGranted) ||
    (step === 5 && name.trim() !== '' && phone.length >= 10);

  const handleContinue = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setError('');
      try {
        // Map city to a micro-zone ID matching the backend actuarial engine zones
        const cityZoneMap: Record<string, string> = {
          'Delhi': 'MZ-DEL-04', 'Gurgaon': 'MZ-DEL-09', 'Ghaziabad': 'MZ-DEL-09',
          'Mumbai': 'MZ-MUM-12', 'Thane': 'MZ-MUM-12',
          'Bengaluru': 'MZ-BLR-07',
          'Hyderabad': 'MZ-HYD-03',
          'Chennai': 'MZ-CHN-05', 'Kanchipuram': 'MZ-CHN-05', 'Tiruvallur': 'MZ-CHN-11',
          'Pune': 'MZ-PUN-02',
          'Kolkata': 'MZ-KOL-01',
          'Ahmedabad': 'MZ-HYD-08',
        };
        const zone = cityZoneMap[city] || 'MZ-DEL-04';
        // 1. Register the rider
        const rider = await registerRider({
          name: name.trim(),
          phone: phone.trim(),
          city,
          zone,
          platform: platform || 'General',
          age: parseInt(age, 10),
        });
        // 2. Buy the selected plan tier
        const tier = (plan || 'standard').toLowerCase();
        await buyPolicy(rider.id, tier);
        // 3. Persist onboarding state with riderId
        await setOnboardingComplete(rider.id);
        router.replace('/(worker-tabs)' as any);
      } catch (e: any) {
        setError('Could not connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const progress = (step / (TOTAL_STEPS + 1)) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={OSPlatform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>RiskWire</Text>
          <Text style={styles.logoTagline}>MICRO-INSURANCE</Text>
        </View>
        <View style={styles.helpBtn}>
          <Text style={styles.helpText}>🤝 Help</Text>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
        <Text style={styles.progressLabel}>{Math.round(progress)}% complete</Text>
      </View>

      {/* ── Main Content ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainRow}>
          {/* Left: Form */}
          <View style={styles.formCol}>
            <Text style={styles.stepTitle}>{STEP_TITLES[step - 1]}</Text>

            {/* STEP 1: Age */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowAgePicker(true)}
                >
                  <Text style={styles.dropdownLabel}>Your age</Text>
                  <View style={styles.dropdownValue}>
                    <Text style={age ? styles.dropdownValueText : styles.dropdownPlaceholder}>
                      {age ? `${age} yr` : 'Select'}
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

            {/* STEP 2: City */}
            {step === 2 && (
              <View style={styles.stepContent}>
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

            {/* STEP 3: Platform */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionLabel}>Select your main platform</Text>
                <View style={styles.chipGrid}>
                  {PLATFORMS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, platform === p && styles.chipSelected]}
                      onPress={() => setPlatform(p)}
                    >
                      <Text style={[styles.chipText, platform === p && styles.chipTextSel]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* STEP 4: Location Permission */}
            {step === 4 && (
              <View style={styles.stepContent}>
                <View style={styles.locationCard}>
                  <MapPin size={40} color="#0066CC" style={{ marginBottom: 16 }} />
                  <Text style={styles.locationTitle}>Location Required</Text>
                  <Text style={styles.locationDesc}>
                    RiskWire's actuarial engine uses hyper-local weather data to calculate your dynamic premium (e.g. ₹2 less dynamically if you are in a safe zone).
                  </Text>
                  <Text style={styles.locationDesc}>
                    We need your location permission to map you to the correct micro-zone and provide parametric triggers.
                  </Text>
                  
                  {loading && !locationGranted ? (
                    <ActivityIndicator size="small" color="#0066CC" style={{ marginTop: 20 }} />
                  ) : locationGranted ? (
                    <View style={styles.locationSuccessBox}>
                      <Check size={20} color="#00A25B" />
                      <Text style={styles.locationSuccessText}>Location access granted!</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.locationBtn} 
                      onPress={async () => {
                        setLoading(true);
                        try {
                          let { status } = await Location.requestForegroundPermissionsAsync();
                          if (status === 'granted') {
                            setLocationGranted(true);
                          } else {
                            setError('Location permission is required for accurate risk pricing.');
                          }
                        } catch (e) {
                          setError('Failed to request location. Please try again.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <Text style={styles.locationBtnText}>Grant Permission</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 5: Name + Phone */}
            {step === 5 && (
              <View style={styles.stepContent}>
                <View style={styles.floatField}>
                  <Text style={styles.floatLabel}>Your full name</Text>
                  <TextInput
                    style={styles.floatInput}
                    placeholder="Enter your name"
                    placeholderTextColor="#AAA"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.floatField}>
                  <Text style={styles.floatLabel}>Enter mobile number</Text>
                  <View style={styles.phoneRow}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryFlag}>🇮🇳</Text>
                      <ChevronDown size={13} color="#555" />
                      <Text style={styles.countryDial}>+91</Text>
                    </View>
                    <TextInput
                      style={[styles.floatInput, { flex: 1, borderWidth: 0 }]}
                      placeholder="Mobile number"
                      placeholderTextColor="#AAA"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                    {phone.length >= 10 && <Check size={18} color="#00A25B" />}
                  </View>
                </View>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueBtn, (!canContinue || loading) && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!canContinue || loading}
            >
              <Text style={styles.continueBtnText}>
                {loading ? 'Creating Account...' : 'Continue ›'}
              </Text>
            </TouchableOpacity>

            {/* Error message */}
            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Back link */}
            {step > 1 && (
              <TouchableOpacity style={styles.backLink} onPress={() => setStep(step - 1)}>
                <Text style={styles.backLinkText}>‹ Go back</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right: Info card */}
          <View style={styles.infoCol}>
            {step === 1 && (
              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>🏷️</Text>
                  <Text style={styles.infoBadge}>BEST{'\n'}PRICE</Text>
                </View>
                <Text style={styles.infoCardTitle}>Get best pricing</Text>
                <Text style={styles.infoCardDesc}>
                  This will help us in calculating your premium &amp; discounts
                </Text>
              </View>
            )}

            {step === 2 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoEmoji}>🏥</Text>
                <Text style={styles.infoCardDesc}>
                  This will help us find the network of{' '}
                  <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>Cashless Hospitals</Text>{' '}
                  in your city
                </Text>
              </View>
            )}

            {step === 3 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoEmoji}>🛵</Text>
                <Text style={styles.infoCardDesc}>
                  Whether you deliver food or drive passengers, we customize your risk profile and premium according to your job nature!
                </Text>
              </View>
            )}

            {step === 4 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoEmoji}>📍</Text>
                <Text style={styles.infoCardDesc}>
                  Location helps the <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>AI Pricing Model</Text> determine if you operate in a safe zone from water logging or extreme heat.
                </Text>
              </View>
            )}

            {step === 5 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoEmoji}>💡</Text>
                {[
                  '92+ plans found',
                  '19 insurers',
                  'Plans starting @270/month',
                  `460+ cashless hospital network in ${city || 'your city'}`,
                ].map((line) => (
                  <View key={line} style={styles.infoCheckRow}>
                    <Check size={14} color="#00A25B" />
                    <Text style={styles.infoCheckText}>{line}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Trust Footer ── */}
        <View style={styles.trustFooter}>
          <View style={styles.trustLeft}>
            <Text style={styles.trustText}>
              RiskWire is <Text style={{ fontWeight: '700' }}>India's trusted</Text>
              {' '}micro-insurance platform for gig workers
            </Text>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4].map((s) => (
              <Star key={s} size={18} color="#F59E0B" fill="#F59E0B" />
            ))}
            <Star size={18} color="#F59E0B" fill="none" />
          </View>
          <View style={styles.trustStats}>
            <View style={styles.trustStat}>
              <Text style={styles.trustStatValue}>13.2 crore</Text>
              <Text style={styles.trustStatLabel}>Registered Consumers</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={styles.trustStatValue}>53</Text>
              <Text style={styles.trustStatLabel}>Insurance Partners</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={styles.trustStatValue}>6.29 crore</Text>
              <Text style={styles.trustStatLabel}>Policies Sold</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const PRIMARY = '#E63946';
const BORDER = '#D1D5DB';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top bar
  topBar: {
    paddingTop: OSPlatform.OS === 'ios' ? 52 : 36,
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
  logoBox: { flexDirection: 'row', alignItems: 'flex-start' },
  logoText: { fontSize: 22, fontWeight: '900', color: '#0066CC', letterSpacing: -0.5, fontStyle: 'italic' },
  logoTagline: { fontSize: 9, color: '#0066CC', fontWeight: '600', opacity: 0.7, marginLeft: 6, alignSelf: 'flex-end', marginBottom: 2 },
  helpBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: BORDER, borderRadius: 20,
  },
  helpText: { fontSize: 13, color: '#333', fontWeight: '600' },

  // Progress
  progressBar: {
    height: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  progressFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: '#4CAF50', borderRadius: 0,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#2E7D32', zIndex: 1 },

  // Body
  body: { flex: 1, backgroundColor: '#F8F9FF' },
  bodyContent: { padding: 20, paddingBottom: 40 },
  mainRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },

  // Form column
  formCol: { flex: 6 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginBottom: 24, lineHeight: 32 },
  stepContent: { gap: 16, marginBottom: 24 },

  // Dropdown (age)
  dropdown: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#FFF',
  },
  dropdownLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  dropdownValue: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  dropdownValueText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  dropdownPlaceholder: { fontSize: 16, color: '#AAA' },

  // Age modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  ageOption: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  ageOptionSelected: { backgroundColor: '#FFF5F5' },
  ageOptionText: { fontSize: 15, color: '#333' },
  ageOptionTextSel: { color: PRIMARY, fontWeight: '700' },

  // City search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 8,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FFF',
  },
  chipSelected: { backgroundColor: '#FFF', borderColor: '#00A25B' },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextSel: { color: '#00A25B', fontWeight: '700' },

  // Name+phone
  floatField: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
    backgroundColor: '#FFF',
  },
  floatLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  floatInput: { fontSize: 15, color: '#1A1A1A', paddingVertical: 0 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryCode: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 8, borderRightWidth: 1, borderRightColor: '#DDD' },
  countryFlag: { fontSize: 16 },
  countryDial: { fontSize: 14, fontWeight: '600', color: '#333' },

  // Continue button
  continueBtn: {
    backgroundColor: PRIMARY, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  continueBtnDisabled: { backgroundColor: '#FECACA' },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { color: '#666', fontSize: 14 },

  // Info card (right column)
  infoCol: { flex: 4 },
  infoCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E9F2',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 3, gap: 10,
  },
  infoIcon: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIconText: { fontSize: 28 },
  infoBadge: {
    backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4,
    fontSize: 10, fontWeight: '800', color: '#92400E', textAlign: 'center',
  },
  infoEmoji: { fontSize: 32 },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  infoCardDesc: { fontSize: 12, color: '#555', lineHeight: 18 },
  infoCheckRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoCheckText: { fontSize: 12, color: '#1A1A1A', flex: 1 },

  // Trust footer
  trustFooter: {
    backgroundColor: '#F0F4FF', borderRadius: 16, padding: 20,
    gap: 16,
  },
  trustLeft: {},
  trustText: { fontSize: 13, color: '#444', lineHeight: 20 },
  starsRow: { flexDirection: 'row', gap: 4 },
  trustStats: { flexDirection: 'row', justifyContent: 'space-between' },
  trustStat: { alignItems: 'center' },
  trustStatValue: { fontSize: 16, fontWeight: '800', color: '#0066CC' },
  trustStatLabel: { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 2 },
  errorText: { fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 8, fontWeight: '600' },
  locationCard: {
    padding: 24, paddingVertical: 32, alignItems: 'center', 
    backgroundColor: '#FAFCFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#D0E3F5',
  },
  locationTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16, textAlign: 'center' },
  locationDesc: { fontSize: 13, color: '#444', textAlign: 'center', marginBottom: 12, lineHeight: 20 },
  locationBtn: {
    backgroundColor: '#0066CC', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 8, marginTop: 16, width: '100%', alignItems: 'center'
  },
  locationBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  locationSuccessBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24,
    backgroundColor: '#E8F5E9', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#A5D6A7'
  },
  locationSuccessText: { color: '#2E7D32', fontWeight: '700', fontSize: 14 }
});
