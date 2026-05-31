import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';

const SELLER_GREEN = '#16a34a';
const STEPS = ['Describe', 'Category', 'Pricing', 'Preview'];

export default function NewListingScreen() {
  const { tokens } = useTheme();
  const { language } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const s = makeStyles(tokens);

  async function handlePromptSubmit() {
    if (!prompt.trim()) return;
    setAiLoading(true);
    // TODO: wire to ai-service /ai/listing/prompt
    setTimeout(() => {
      setAiLoading(false);
      setAiResponse('Detected sector: Clothing (92% confidence)\n\nExtracted fields:\n• Type: Excess stock\n• Quantity: 500 units\n• Sizes: M, L, XL\n• Condition: Grade A\n\nQuestion: What is the MRP printed on the tags?');
      setStep(1);
    }, 1500);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' }}>
        <NMTopbar title="List Dead Stock" onBack={() => router.back()} />

        {/* Step indicator */}
        <View style={s.stepRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={s.stepItem}>
              <View style={[s.stepDot, { backgroundColor: i <= step ? SELLER_GREEN : tokens.border }]}>
                <Text style={[s.stepNum, { color: i <= step ? '#fff' : tokens['text-muted'] }]}>{i + 1}</Text>
              </View>
              <Text style={[s.stepLabel, { color: i === step ? SELLER_GREEN : tokens['text-muted'] }]}>{label}</Text>
              {i < STEPS.length - 1 && <View style={[s.stepLine, { backgroundColor: i < step ? SELLER_GREEN : tokens.border }]} />}
            </View>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View style={s.section}>
              {/* AI Prompt Label */}
              <View style={[s.aiBanner, { backgroundColor: SELLER_GREEN + '12', borderColor: SELLER_GREEN + '30' }]}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
                <Text style={[s.aiBannerText, { color: SELLER_GREEN }]}>
                  {language === 'hi'
                    ? 'अपना माल हिंदी या English में describe करें — AI बाकी करेगा'
                    : 'Describe your dead stock in your own words — AI will do the rest'}
                </Text>
              </View>

              <Text style={[s.label, { color: tokens['text-secondary'] }]}>
                {language === 'hi' ? 'आपका माल क्या है?' : 'What stock do you want to sell?'}
              </Text>
              <TextInput
                style={[s.promptInput, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens['text-primary'] }]}
                placeholder={language === 'hi'
                  ? 'जैसे: मेरे पास 500 shirts हैं, size M L XL, brand X, Surat में, 2 साल से नहीं बिके...'
                  : 'e.g. I have 500 shirts sizes M L XL brand X in Surat warehouse unsold for 2 years...'}
                placeholderTextColor={tokens['text-muted']}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={s.promptActions}>
                <TouchableOpacity style={[s.voiceBtn, { borderColor: SELLER_GREEN }]}>
                  <Text style={{ fontSize: 20 }}>🎙️</Text>
                  <Text style={[s.voiceBtnText, { color: SELLER_GREEN }]}>
                    {language === 'hi' ? 'बोलकर बताएं' : 'Speak instead'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.btn, { backgroundColor: SELLER_GREEN }, (!prompt.trim() || aiLoading) && s.btnDisabled]}
                onPress={handlePromptSubmit}
                disabled={!prompt.trim() || aiLoading}
              >
                {aiLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={s.btnText}>AI is analyzing...</Text>
                  </View>
                ) : (
                  <Text style={s.btnText}>
                    {language === 'hi' ? 'AI से List करें →' : 'Generate Listing with AI →'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && aiResponse !== '' && (
            <View style={s.section}>
              <View style={[s.aiBanner, { backgroundColor: SELLER_GREEN + '12', borderColor: SELLER_GREEN + '30' }]}>
                <Text style={{ fontSize: 20 }}>✅</Text>
                <Text style={[s.aiBannerText, { color: SELLER_GREEN }]}>AI extracted your listing details</Text>
              </View>

              <View style={[s.aiResponseBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Text style={[s.aiResponseText, { color: tokens['text-primary'] }]}>{aiResponse}</Text>
              </View>

              <TextInput
                style={[s.replyInput, { backgroundColor: tokens.surface, borderColor: SELLER_GREEN, color: tokens['text-primary'] }]}
                placeholder="Type your answer..."
                placeholderTextColor={tokens['text-muted']}
              />

              <View style={s.navRow}>
                <TouchableOpacity style={[s.backBtn, { borderColor: tokens.border }]} onPress={() => setStep(0)}>
                  <Text style={{ color: tokens['text-secondary'], fontWeight: '600' }}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.nextBtn, { backgroundColor: SELLER_GREEN }]} onPress={() => setStep(2)}>
                  <Text style={s.btnText}>Next: Pricing →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={s.section}>
              <Text style={[s.stepHeading, { color: tokens['text-primary'] }]}>Pricing & Mode</Text>
              <View style={[s.aiPriceCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b40' }]}>
                <Text style={{ fontSize: 18 }}>💡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#92400e', fontWeight: '700', fontSize: 13 }}>AI Pricing Recommendation</Text>
                  <Text style={{ color: '#78350f', fontSize: 13, marginTop: 2 }}>₹42,000 – ₹54,000 · 67% probability to sell in 14 days</Text>
                </View>
              </View>
              {['Fixed Price', 'Best Offer', 'Auction', 'Flash Sale'].map(mode => (
                <TouchableOpacity key={mode} style={[s.modeOption, { backgroundColor: tokens.surface, borderColor: mode === 'Fixed Price' ? SELLER_GREEN : tokens.border }]}>
                  <Text style={{ fontSize: 18 }}>{mode === 'Fixed Price' ? '🏷️' : mode === 'Best Offer' ? '💬' : mode === 'Auction' ? '🔨' : '⚡'}</Text>
                  <Text style={[s.modeText, { color: mode === 'Fixed Price' ? SELLER_GREEN : tokens['text-primary'] }]}>{mode}</Text>
                  {mode === 'Fixed Price' && <Text style={{ color: SELLER_GREEN, fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <View style={s.navRow}>
                <TouchableOpacity style={[s.backBtn, { borderColor: tokens.border }]} onPress={() => setStep(1)}>
                  <Text style={{ color: tokens['text-secondary'], fontWeight: '600' }}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.nextBtn, { backgroundColor: SELLER_GREEN }]} onPress={() => setStep(3)}>
                  <Text style={s.btnText}>Preview →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={s.section}>
              <Text style={[s.stepHeading, { color: tokens['text-primary'] }]}>Preview & Go Live</Text>
              <View style={[s.previewCard, { backgroundColor: tokens.surface, borderColor: SELLER_GREEN + '40' }]}>
                <View style={[s.previewImage, { backgroundColor: tokens['surface-elevated'] }]}>
                  <Text style={{ fontSize: 48 }}>👔</Text>
                </View>
                <View style={{ padding: 14 }}>
                  <Text style={[s.previewTitle, { color: tokens['text-primary'] }]}>500 Units — Shirts (M/L/XL) — Brand X</Text>
                  <Text style={[s.previewMeta, { color: tokens['text-muted'] }]}>Clothing · Grade A · Surat, Gujarat</Text>
                  <Text style={[s.previewPrice, { color: SELLER_GREEN }]}>₹48,000</Text>
                  <View style={[s.liveTag, { backgroundColor: SELLER_GREEN }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>● LIVE after submission</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={[s.btn, { backgroundColor: SELLER_GREEN }]} onPress={() => router.replace('/(seller)')}>
                <Text style={s.btnText}>🚀 Go Live Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.backBtn, { borderColor: tokens.border, alignSelf: 'center', marginTop: 8 }]} onPress={() => setStep(2)}>
                <Text style={{ color: tokens['text-secondary'], fontWeight: '600' }}>← Edit Pricing</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: tokens.surface, borderBottomWidth: 1, borderBottomColor: tokens.border },
    stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    stepNum: { fontSize: 11, fontWeight: '700' },
    stepLabel: { fontSize: 10, fontWeight: '600' },
    stepLine: { flex: 1, height: 2, marginHorizontal: 6, borderRadius: 1 },
    content: { padding: 16, gap: 12, paddingBottom: 80 },
    section: { gap: 12 },
    aiBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
    aiBannerText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    promptInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120, lineHeight: 21 },
    promptActions: { flexDirection: 'row' },
    voiceBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
    voiceBtnText: { fontSize: 13, fontWeight: '600' },
    btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    aiResponseBox: { borderWidth: 1, borderRadius: 12, padding: 14 },
    aiResponseText: { fontSize: 14, lineHeight: 22 },
    replyInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 14 },
    navRow: { flexDirection: 'row', gap: 10 },
    backBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    nextBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    stepHeading: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    aiPriceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
    modeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
    modeText: { flex: 1, fontSize: 15, fontWeight: '600' },
    previewCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5 },
    previewImage: { height: 150, alignItems: 'center', justifyContent: 'center' },
    previewTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    previewMeta: { fontSize: 12, marginBottom: 8 },
    previewPrice: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
    liveTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  });
}
