import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';

const SELLER_GREEN = '#16a34a';

const DEMO_LISTINGS = [
  { id: '1', title: '500 Units — Shirts (M/L/XL)', sector: 'clothing', price: 48000, views: 142, status: 'live', urgency: 82 },
  { id: '2', title: 'Samsung M-Series — 200 Units', sector: 'electronics', price: 280000, views: 89, status: 'live', urgency: 45 },
  { id: '3', title: 'Office Chairs — 50 Pcs', sector: 'furniture', price: 65000, views: 34, status: 'paused', urgency: 91 },
  { id: '4', title: 'Paracetamol 500mg — 10,000 strips', sector: 'pharma', price: 22000, views: 201, status: 'live', urgency: 97 },
];

const STATUS_COLOR: Record<string, string> = { live: SELLER_GREEN, paused: '#d97706', sold: '#6b7280', expired: '#dc2626' };

export default function ListingsScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const s = makeStyles(tokens);

  return (
    <View style={{ flex: 1, backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' }}>
      <NMTopbar
        title="My Listings"
        rightActions={
          <TouchableOpacity onPress={() => router.push('/(seller)/new-listing')} style={[s.addBtn, { backgroundColor: SELLER_GREEN }]}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>+</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        data={DEMO_LISTINGS}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: tokens['text-primary'] }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[s.meta, { color: tokens['text-muted'] }]}>{item.sector} · {item.views} views</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                <Text style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <View style={s.cardBottom}>
              <Text style={[s.price, { color: SELLER_GREEN }]}>₹{item.price.toLocaleString('en-IN')}</Text>
              <View style={s.urgencyRow}>
                <Text style={[s.urgencyLabel, { color: tokens['text-muted'] }]}>AI Urgency</Text>
                <View style={[s.urgencyBar, { backgroundColor: tokens.border }]}>
                  <View style={[s.urgencyFill, { width: `${item.urgency}%` as any, backgroundColor: item.urgency > 75 ? '#dc2626' : item.urgency > 50 ? '#d97706' : SELLER_GREEN }]} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: item.urgency > 75 ? '#dc2626' : SELLER_GREEN }}>{item.urgency}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
    cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    title: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 3 },
    meta: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: { fontSize: 18, fontWeight: '800' },
    urgencyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    urgencyLabel: { fontSize: 11 },
    urgencyBar: { width: 60, height: 6, borderRadius: 3, overflow: 'hidden' },
    urgencyFill: { height: '100%', borderRadius: 3 },
  });
}
