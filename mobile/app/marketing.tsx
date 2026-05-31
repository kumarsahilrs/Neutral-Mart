import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, ActivityIndicator, Modal, Share,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NMTopbar } from '../src/components/ui/NMTopbar';
import { useTheme } from '../src/theme/ThemeContext';

type Language = 'hi' | 'hinglish' | 'en';
type Tone = 'urgent' | 'premium' | 'casual' | 'bulk';
type Platform = 'whatsapp' | 'instagram' | 'facebook' | 'telegram';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'hi', label: 'हिन्दी' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'en', label: 'English' },
];

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'urgent', label: 'Urgent Deal', emoji: '🔥' },
  { value: 'premium', label: 'Premium', emoji: '⭐' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'bulk', label: 'Bulk Offer', emoji: '📦' },
];

const PLATFORMS: { value: Platform; label: string; emoji: string; color: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#25D366' },
  { value: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C' },
  { value: 'facebook', label: 'Facebook', emoji: '👤', color: '#1877F2' },
  { value: 'telegram', label: 'Telegram', emoji: '✈️', color: '#2CA5E0' },
];

const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

export default function MarketingScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    listing_id: string;
    title: string;
    sector: string;
    price: string;
    mrp: string;
    grade: string;
    city: string;
    state: string;
  }>();

  const [language, setLanguage] = useState<Language>('hi');
  const [tone, setTone] = useState<Tone>('urgent');
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [hook, setHook] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  const price = parseFloat(params.price || '0');
  const mrp = parseFloat(params.mrp || '0');
  const discountPct = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

  const s = makeStyles(tokens);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ai/content/caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: params.listing_id || 'demo',
          product_title: params.title || 'Product',
          sector: params.sector || 'general',
          price,
          mrp: mrp || undefined,
          grade: params.grade || 'A',
          city: params.city || '',
          state: params.state || '',
          language,
          tone,
          platform,
        }),
      });
      const json = await res.json();
      const data = json?.data ?? json;
      setCaption(data.full_caption || '');
      setHook(data.hook || '');
      setHashtags(data.hashtags || []);
      setGenerated(true);
    } catch {
      // Demo fallback when AI service is offline
      const demo = language === 'hi'
        ? `🔥 ${params.title || 'Dead Stock Deal'}\n\n₹${price.toLocaleString('en-IN')} में ${discountPct}% की छूट!\n\nग्रेड ${params.grade || 'A'} माल | ${params.city || ''}\n\nसीमित स्टॉक — अभी संपर्क करें! 📲\n\nSourced from NirmalMandi | nirmalmandi.com`
        : `🔥 ${params.title || 'Dead Stock Deal'}\n\n${discountPct}% off at ₹${price.toLocaleString('en-IN')}!\n\nGrade ${params.grade || 'A'} stock | ${params.city || ''}\n\nLimited quantity — Contact now! 📲\n\nSourced from NirmalMandi | nirmalmandi.com`;
      setCaption(demo);
      setHook(`🔥 ${discountPct}% off deal — ${params.title?.slice(0, 30) || 'Dead Stock'}!`);
      setHashtags(['#NirmalMandi', '#DeadStock', '#BusinessDeal', '#Liquidation', `#${params.sector || 'B2B'}`]);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({ message: caption });
    } catch {}
  }

  return (
    <View style={[s.root, { backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' }]}>
      <NMTopbar title="AI Marketing" subtitle="Generate captions" onBack={() => router.back()} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Product preview */}
        <View style={[s.productCard, { backgroundColor: tokens.primary + '10', borderColor: tokens.primary + '30' }]}>
          <Text style={{ fontSize: 24 }}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.productTitle, { color: tokens['text-primary'] }]} numberOfLines={2}>{params.title || 'Product'}</Text>
            <Text style={[s.productMeta, { color: tokens.primary }]}>
              ₹{price.toLocaleString('en-IN')}
              {discountPct > 0 && ` · ${discountPct}% off`}
            </Text>
          </View>
        </View>

        {/* Language */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: tokens['text-muted'] }]}>LANGUAGE</Text>
          <View style={s.pillRow}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.value}
                onPress={() => setLanguage(l.value)}
                style={[s.pill, { borderColor: language === l.value ? tokens.primary : tokens.border, backgroundColor: language === l.value ? tokens.primary + '15' : tokens.surface }]}
              >
                <Text style={[s.pillText, { color: language === l.value ? tokens.primary : tokens['text-secondary'] }]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tone */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: tokens['text-muted'] }]}>TONE</Text>
          <View style={s.grid2}>
            {TONES.map(t => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setTone(t.value)}
                style={[s.gridBtn, { borderColor: tone === t.value ? tokens.primary : tokens.border, backgroundColor: tone === t.value ? tokens.primary + '15' : tokens.surface }]}
              >
                <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                <Text style={[s.gridBtnText, { color: tone === t.value ? tokens.primary : tokens['text-primary'] }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Platform */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: tokens['text-muted'] }]}>PLATFORM</Text>
          <View style={s.grid4}>
            {PLATFORMS.map(p => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPlatform(p.value)}
                style={[s.platformBtn, { borderColor: platform === p.value ? p.color : tokens.border, backgroundColor: platform === p.value ? p.color + '15' : tokens.surface }]}
              >
                <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                <Text style={[s.platformLabel, { color: platform === p.value ? p.color : tokens['text-muted'] }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate */}
        <TouchableOpacity
          style={[s.generateBtn, { backgroundColor: tokens.primary }, loading && { opacity: 0.6 }]}
          onPress={generate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.generateBtnText}>{generated ? '🔄 Regenerate' : '✨ Generate Caption'}</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {generated && (
          <View style={s.resultSection}>
            {hook ? (
              <View style={[s.hookBox, { backgroundColor: tokens.primary + '10', borderColor: tokens.primary + '30' }]}>
                <Text style={[s.hookLabel, { color: tokens['text-muted'] }]}>HOOK</Text>
                <Text style={[s.hookText, { color: tokens.primary }]}>{hook}</Text>
              </View>
            ) : null}

            <Text style={[s.sectionLabel, { color: tokens['text-muted'] }]}>FULL CAPTION (editable)</Text>
            <TextInput
              style={[s.captionInput, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens['text-primary'] }]}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />

            {hashtags.length > 0 && platform !== 'whatsapp' && (
              <View style={s.hashtagRow}>
                {hashtags.map(tag => (
                  <View key={tag} style={[s.hashtagChip, { backgroundColor: tokens.primary + '15' }]}>
                    <Text style={[s.hashtagText, { color: tokens.primary }]}>{tag.startsWith('#') ? tag : `#${tag}`}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[s.watermarkNote, { color: tokens['text-muted'] }]}>
              ✓ Includes 'Sourced from NirmalMandi' watermark
            </Text>

            <View style={s.actionRow}>
              <TouchableOpacity style={[s.shareBtn, { backgroundColor: tokens.primary }]} onPress={handleShare}>
                <Text style={s.shareBtnText}>📤 Share Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 80, gap: 16 },
    productCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
    productTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    productMeta: { fontSize: 13, fontWeight: '700' },
    section: { gap: 8 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    pillRow: { flexDirection: 'row', gap: 8 },
    pill: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1.5 },
    pillText: { fontSize: 13, fontWeight: '600' },
    grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridBtn: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1.5 },
    gridBtnText: { fontSize: 13, fontWeight: '600' },
    grid4: { flexDirection: 'row', gap: 8 },
    platformBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 4 },
    platformLabel: { fontSize: 10, fontWeight: '600' },
    generateBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    resultSection: { gap: 12 },
    hookBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
    hookLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
    hookText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
    captionInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 22, minHeight: 180 },
    hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    hashtagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    hashtagText: { fontSize: 12, fontWeight: '600' },
    watermarkNote: { fontSize: 12, textAlign: 'center' },
    actionRow: { flexDirection: 'row' },
    shareBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
