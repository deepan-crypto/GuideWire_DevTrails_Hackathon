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
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Search, Phone, User, X, Clock } from 'lucide-react-native';
import { setOnboardingComplete } from '@/utils/onboardingState';

const AGES = Array.from({ length: 63 }, (_, i) => `${i + 18}`);

const POPULAR_CITIES = [
  'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Mumbai',
  'Thane', 'Gurgaon', 'Chennai', 'Ghaziabad', 'Ernakulam',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow',
];

export default function OnboardingScreen() {
  // Skip onboarding — go directly to home
  return <Redirect href="/(tabs)" />;
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showAgePicker, setShowAgePicker] = useState(false);

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Navigate to home screen to browse and choose plans
      // Onboarding is NOT marked complete yet — that happens after plan activation
      router.replace('/(tabs)' as any);
    }
  };

  const canContinue =
    (step === 1 && age !== '') ||
    (step === 2 && city !== '') ||
    (step === 3 && name.trim() !== '' && phone.length >= 10);

  const stepTitles = ['Select your age', 'Select your city', 'Save your progress'];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <LinearGradient
        colors={['#0066CC', '#0052A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          <Text style={styles.headerTitle}>RiskWire</Text>
          <TouchableOpacity style={styles.helpBtn}>
            <Phone size={13} color="#FFFFFF" />
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>{step * 25}% complete</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${step * 25}%` }]} />
          </View>
        </View>

        {/* Step title bubble */}
        <View style={styles.stepTitleBox}>
          <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Age */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.infoCard}>
              <Clock size={16} color="#0066CC" />
              <Text style={styles.infoText}>
                This will help us in calculating your{' '}
                <Text style={styles.infoHighlight}>premium & discounts</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowAgePicker(true)}
            >
              <Text style={age ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {age ? `${age} years` : 'Your age'}
              </Text>
              <ChevronDown size={20} color="#0066CC" />
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
                        <Text style={[styles.ageOptionText, age === item && styles.ageOptionTextSelected]}>
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
            <View style={styles.infoCard}>
              <Text style={styles.cityEmoji}>🏥</Text>
              <Text style={styles.infoText}>
                This will help us find the network of{' '}
                <Text style={styles.infoHighlight}>Cashless Hospitals</Text> in your city
              </Text>
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#0066CC" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your city"
                placeholderTextColor="#AAA"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <Text style={styles.sectionLabel}>Popular cities</Text>
            <View style={styles.chipGrid}>
              {filteredCities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, city === c && styles.chipSelected]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.chipText, city === c && styles.chipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: Name + Phone */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.saveSubtitle}>
              Get to plans directly next time you visit us
            </Text>

            <View style={styles.floatField}>
              <User size={16} color="#0066CC" />
              <TextInput
                style={styles.floatInput}
                placeholder="Your full name"
                placeholderTextColor="#AAA"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.floatField}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                <ChevronDown size={13} color="#666" />
              </View>
              <TextInput
                style={[styles.floatInput, { flex: 1 }]}
                placeholder="Mobile number"
                placeholderTextColor="#AAA"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              {[
                '92+ plans found',
                '19 insurers',
                'Plans starting @270/month',
                `460+ cashless hospitals in ${city || 'your city'}`,
              ].map((line) => (
                <View key={line} style={styles.summaryRow}>
                  <View style={styles.summaryCheck}>
                    <Text style={styles.summaryCheckText}>✓</Text>
                  </View>
                  <Text style={styles.summaryText}>{line}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueBtnText}>Continue ›</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = '#0066CC';
const PRIMARY_DARK = '#0052A3';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: { paddingTop: 52, paddingBottom: 0 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 34 },
  backArrow: { fontSize: 22, color: '#FFF', lineHeight: 26 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  helpText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

  // Progress
  progressContainer: { paddingHorizontal: 16, marginBottom: 0 },
  progressLabel: { fontSize: 12, color: '#E8F0FF', marginBottom: 6 },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3 },
  progressFill: { height: 5, backgroundColor: '#FFFFFF', borderRadius: 3 },

  // Step title bubble
  stepTitleBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4,
    marginTop: 20,
  },
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },

  // Body
  body: { flex: 1, backgroundColor: '#FFFFFF' },
  bodyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  stepContent: { gap: 16 },

  // Info card
  infoCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderLeftWidth: 3, borderLeftColor: PRIMARY,
  },
  cityEmoji: { fontSize: 22 },
  infoText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 20 },
  infoHighlight: { color: PRIMARY, fontWeight: '700' },

  // Dropdown
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#D0D8E8',
    paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownPlaceholder: { fontSize: 15, color: '#AAA' },
  dropdownValue: { fontSize: 15, color: '#1A1A1A', fontWeight: '600' },

  // Age modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%', paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  ageOption: {
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  ageOptionSelected: { backgroundColor: '#F0F7FF' },
  ageOptionText: { fontSize: 15, color: '#333' },
  ageOptionTextSelected: { color: PRIMARY, fontWeight: '700' },

  // City
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#D0D8E8',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D0D8E8', backgroundColor: '#FFFFFF',
  },
  chipSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextSelected: { color: '#FFF', fontWeight: '600' },

  // Name + Phone
  saveSubtitle: { fontSize: 13, color: '#666666', fontWeight: '500' },
  floatField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#D0D8E8',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  floatInput: { fontSize: 15, color: '#1A1A1A', flex: 1 },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingRight: 10, borderRightWidth: 1, borderRightColor: '#DDD',
  },
  countryCodeText: { fontSize: 13, color: '#333', fontWeight: '600' },

  // Summary card
  summaryCard: {
    backgroundColor: '#F0F7FF', borderRadius: 14, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#D4E8FF',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  summaryCheckText: { fontSize: 11, color: '#FFF', fontWeight: '800' },
  summaryText: { fontSize: 13, color: '#1A1A1A', flex: 1 },

  // Footer
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  continueBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: '#CCCCCC' },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
});
