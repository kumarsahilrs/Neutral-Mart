import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useRef } from 'react';
import { useTheme } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { panel } = useLocalSearchParams<{ panel: 'buyer' | 'seller' }>();
  const { tokens, setPanel } = useTheme();
  const { setAuth, setLanguage, language } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const isPanelSeller = panel === 'seller';
  const primaryColor = isPanelSeller ? '#16a34a' : '#2563eb';

  async function sendOtp() {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid number', 'Enter a 10-digit mobile number');
      return;
    }
    setLoading(true);
    // TODO: wire to auth service
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setTimeout(() => otpRef.current?.focus(), 300);
    }, 800);
  }

  async function verifyOtp() {
    if (otp.length !== 6) { Alert.alert('Enter 6-digit OTP'); return; }
    setLoading(true);
    // TODO: wire to auth service
    setTimeout(() => {
      setLoading(false);
      setPanel(panel || 'buyer');
      setAuth(
        { id: 'demo', name: 'Demo User', phone, role: panel || 'buyer', profile_id: 'demo' },
        'demo-token',
        'demo-refresh',
      );
      router.replace(isPanelSeller ? '/(seller)' : '/(buyer)');
    }, 800);
  }

  const s = makeStyles(tokens, primaryColor);

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        {/* Header */}
        <View style={s.header}>
          <View style={[s.badge, { backgroundColor: primaryColor }]}>
            <Text style={s.badgeText}>{isPanelSeller ? 'Seller' : 'Buyer'}</Text>
          </View>
          <Text style={s.title}>NirmalMandi</Text>
          <Text style={s.sub}>
            {language === 'hi' ? 'अपना मोबाइल नंबर दर्ज करें' : 'Enter your mobile number to continue'}
          </Text>
        </View>

        {step === 'phone' ? (
          <>
            <Text style={s.label}>{language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
            <View style={s.phoneRow}>
              <View style={s.countryCode}>
                <Text style={s.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={s.phoneInput}
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                placeholder="98765 43210"
                placeholderTextColor={tokens['text-muted']}
                returnKeyType="done"
                onSubmitEditing={sendOtp}
              />
            </View>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: primaryColor }, loading && s.btnDisabled]}
              onPress={sendOtp}
              disabled={loading || phone.length < 10}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>{language === 'hi' ? 'OTP भेजें' : 'Send OTP'}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.label}>
              {language === 'hi' ? `OTP भेजा गया +91${phone} पर` : `OTP sent to +91 ${phone}`}
            </Text>
            <TextInput
              ref={otpRef}
              style={[s.otpInput, { borderColor: primaryColor }]}
              value={otp}
              onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="— — — — — —"
              placeholderTextColor={tokens['text-muted']}
              textAlign="center"
            />
            <TouchableOpacity
              style={[s.btn, { backgroundColor: primaryColor }, (loading || otp.length !== 6) && s.btnDisabled]}
              onPress={verifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>{language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }} style={s.back}>
              <Text style={[s.backText, { color: primaryColor }]}>
                {language === 'hi' ? '← नंबर बदलें' : '← Change number'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Language toggle */}
        <View style={s.langRow}>
          {(['en', 'hi'] as const).map(l => (
            <TouchableOpacity key={l} onPress={() => setLanguage(l)} style={[s.langPill, language === l && { backgroundColor: primaryColor }]}>
              <Text style={[s.langText, language === l && { color: '#fff' }]}>{l === 'en' ? 'EN' : 'हिन्दी'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(tokens: any, primaryColor: string) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: primaryColor, justifyContent: 'center', padding: 24 },
    card: { backgroundColor: tokens.surface, borderRadius: 24, padding: 28 },
    header: { alignItems: 'center', marginBottom: 28 },
    badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    title: { fontSize: 26, fontWeight: '800', color: tokens['text-primary'], marginBottom: 6 },
    sub: { fontSize: 14, color: tokens['text-secondary'], textAlign: 'center' },
    label: { fontSize: 13, fontWeight: '600', color: tokens['text-secondary'], marginBottom: 8 },
    phoneRow: { flexDirection: 'row', marginBottom: 16, borderWidth: 1, borderColor: tokens.border, borderRadius: 12, overflow: 'hidden' },
    countryCode: { backgroundColor: tokens['surface-elevated'], paddingHorizontal: 14, justifyContent: 'center', borderRightWidth: 1, borderRightColor: tokens.border },
    countryCodeText: { fontWeight: '600', color: tokens['text-secondary'], fontSize: 15 },
    phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, color: tokens['text-primary'], fontSize: 16 },
    otpInput: { borderWidth: 2, borderRadius: 12, paddingVertical: 16, fontSize: 28, fontWeight: '700', letterSpacing: 12, color: tokens['text-primary'], marginBottom: 16 },
    btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    back: { alignItems: 'center', paddingVertical: 10 },
    backText: { fontSize: 14, fontWeight: '500' },
    langRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
    langPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: tokens.border },
    langText: { fontSize: 13, fontWeight: '600', color: tokens['text-secondary'] },
  });
}
