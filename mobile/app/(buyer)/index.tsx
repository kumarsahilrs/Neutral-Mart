import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { NMCard } from '../../src/components/ui/NMCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';

const SECTORS = [
  { slug: '', label: '🏷️ All' },
  { slug: 'fmcg', label: '🛒 FMCG' },
  { slug: 'clothing', label: '👔 Clothing' },
  { slug: 'automobiles', label: '🚗 Auto' },
  { slug: 'pharma', label: '💊 Pharma' },
  { slug: 'furniture', label: '🛋️ Furniture' },
  { slug: 'machinery', label: '⚙️ Machinery' },
];

// Demo deals for UI preview
const DEMO_DEALS = [
  { id: '1', title: '500 Units — Shirts (M/L/XL) — Brand X', sector: 'clothing', price: 48000, mrp: 120000, discount: 60, grade: 'A', city: 'Surat', is_urgent: true, type: 'flash' },
  { id: '2', title: 'Samsung Galaxy M-Series — 200 Units', sector: 'electronics', price: 280000, mrp: 420000, discount: 33, grade: 'B', city: 'Mumbai', is_urgent: false, type: 'fixed' },
  { id: '3', title: 'Office Chairs — 50 Pcs — Near New', sector: 'furniture', price: 65000, mrp: 150000, discount: 57, grade: 'A', city: 'Delhi', is_urgent: true, type: 'auction' },
  { id: '4', title: 'Paracetamol 500mg — 10,000 strips — 8 months expiry', sector: 'pharma', price: 22000, mrp: 55000, discount: 60, grade: 'A', city: 'Ahmedabad', is_urgent: true, type: 'fixed' },
  { id: '5', title: 'Tata Ace — 2019 — 60,000 km', sector: 'automobiles', price: 320000, mrp: 480000, discount: 33, grade: 'B', city: 'Pune', is_urgent: false, type: 'best_offer' },
];

export default function BuyerHome() {
  const { tokens } = useTheme();
  const { user, language } = useAuthStore();
  const router = useRouter();
  const [sector, setSector] = useState('');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const deals = DEMO_DEALS.filter(d => !sector || d.sector === sector);
  const s = makeStyles(tokens);

  return (
    <View style={s.root}>
      <NMTopbar
        title="NirmalMandi"
        subtitle={language === 'hi' ? `नमस्ते ${user?.name?.split(' ')[0] || ''}` : `Hi ${user?.name?.split(' ')[0] || ''}!`}
        rightActions={
          <TouchableOpacity style={s.agentBtn}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </TouchableOpacity>
        }
      />

      {/* AI Match Banner */}
      <TouchableOpacity style={[s.matchBanner, { backgroundColor: tokens.primary + '15', borderColor: tokens.primary + '40' }]}>
        <Text style={{ fontSize: 18 }}>✨</Text>
        <Text style={[s.matchText, { color: tokens.primary }]}>
          {language === 'hi' ? `${deals.length} deals आपके प्रोफाइल से मैच` : `${deals.length} deals matched to your profile today`}
        </Text>
        <Text style={{ fontSize: 12, color: tokens.primary }}>→</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={[s.searchRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: tokens['text-primary'] }]}
          placeholder={language === 'hi' ? 'डील, सेक्टर, ब्रांड खोजें...' : 'Search deals, sectors, brands...'}
          placeholderTextColor={tokens['text-muted']}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={s.micBtn}>
          <Text style={{ fontSize: 18 }}>🎙️</Text>
        </TouchableOpacity>
      </View>

      {/* Sector Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll} contentContainerStyle={s.pills}>
        {SECTORS.map(sc => {
          const active = sector === sc.slug;
          return (
            <TouchableOpacity
              key={sc.slug}
              onPress={() => setSector(sc.slug)}
              style={[s.pill, { borderColor: active ? tokens.primary : tokens.border, backgroundColor: active ? tokens.primary : tokens.surface }]}
            >
              <Text style={[s.pillText, { color: active ? '#fff' : tokens['text-secondary'] }]}>{sc.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Deal Feed */}
      <FlatList
        data={deals}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.dealCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]} activeOpacity={0.92}>
            {/* Image placeholder */}
            <View style={[s.dealImage, { backgroundColor: tokens['surface-elevated'] }]}>
              <Text style={{ fontSize: 36 }}>
                {item.sector === 'clothing' ? '👔' : item.sector === 'pharma' ? '💊' : item.sector === 'furniture' ? '🛋️' : item.sector === 'automobiles' ? '🚗' : '📦'}
              </Text>
              {/* Badges */}
              <View style={s.badges}>
                {item.is_urgent && <View style={[s.badge, { backgroundColor: '#dc2626' }]}><Text style={s.badgeText}>🔥 URGENT</Text></View>}
                {item.type === 'flash' && <View style={[s.badge, { backgroundColor: '#f59e0b' }]}><Text style={s.badgeText}>⚡ FLASH</Text></View>}
                {item.type === 'auction' && <View style={[s.badge, { backgroundColor: '#7c3aed' }]}><Text style={s.badgeText}>🔨 AUCTION</Text></View>}
                {item.type === 'best_offer' && <View style={[s.badge, { backgroundColor: '#0891b2' }]}><Text style={s.badgeText}>💬 OFFER</Text></View>}
              </View>
              <View style={[s.discountChip, { backgroundColor: tokens.primary }]}>
                <Text style={s.discountText}>{item.discount}% OFF</Text>
              </View>
            </View>

            {/* Content */}
            <View style={s.dealContent}>
              <Text style={[s.dealTitle, { color: tokens['text-primary'] }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[s.dealMeta, { color: tokens['text-muted'] }]}>📍 {item.city} · Grade {item.grade}</Text>
              <View style={s.priceRow}>
                <View>
                  <Text style={[s.price, { color: tokens.primary }]}>₹{item.price.toLocaleString('en-IN')}</Text>
                  <Text style={[s.mrp, { color: tokens['text-muted'] }]}>MRP ₹{item.mrp.toLocaleString('en-IN')}</Text>
                </View>
                <TouchableOpacity style={[s.marketBtn, { backgroundColor: tokens.primary + '15', borderColor: tokens.primary + '40' }]}>
                  <Text style={[s.marketBtnText, { color: tokens.primary }]}>📣 Market</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 48 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: tokens['text-muted'], fontSize: 15 }}>No deals found</Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' },
    matchBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, mx: 16, margin: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
    matchText: { flex: 1, fontSize: 13, fontWeight: '600' },
    agentBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14 },
    micBtn: { padding: 4 },
    pillsScroll: { flexGrow: 0, marginBottom: 8 },
    pills: { paddingHorizontal: 12, gap: 8 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    pillText: { fontSize: 13, fontWeight: '500' },
    list: { paddingHorizontal: 12, paddingBottom: 100, gap: 12 },
    dealCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    dealImage: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    badges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    discountChip: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    discountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    dealContent: { padding: 14 },
    dealTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6, lineHeight: 21 },
    dealMeta: { fontSize: 12, marginBottom: 10 },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: { fontSize: 20, fontWeight: '800' },
    mrp: { fontSize: 11, textDecorationLine: 'line-through', marginTop: 1 },
    marketBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    marketBtnText: { fontSize: 12, fontWeight: '600' },
  });
}
