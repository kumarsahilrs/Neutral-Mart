import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';

const SELLER_GREEN = '#16a34a';
const STATUS_COLOR: Record<string, string> = { paid: '#d97706', shipped: '#2563eb', pending: '#6b7280', completed: SELLER_GREEN, disputed: '#dc2626' };

const DEMO_ORDERS = [
  { id: '1', number: 'NM-2024-001', buyer: 'Ramesh Traders Pvt Ltd', product: '500 Shirts M/L/XL', amount: 48000, units: 50, status: 'paid', date: '28 May 2026' },
  { id: '2', number: 'NM-2024-002', buyer: 'Global Surplus Co.', product: 'Samsung M-Series 200 units', amount: 125000, units: 200, status: 'shipped', date: '26 May 2026' },
  { id: '3', number: 'NM-2024-003', buyer: 'Delhi Resellers', product: 'Office Chairs 30 pcs', amount: 32000, units: 30, status: 'pending', date: '25 May 2026' },
];

export default function SellerOrders() {
  const { tokens } = useTheme();
  const s = makeStyles(tokens);

  return (
    <View style={{ flex: 1, backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' }}>
      <NMTopbar title="My Orders" />
      <FlatList
        data={DEMO_ORDERS}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={s.top}>
              <View style={{ flex: 1 }}>
                <Text style={[s.number, { color: tokens['text-primary'] }]}>{item.number}</Text>
                <Text style={[s.buyer, { color: tokens['text-muted'] }]}>{item.buyer}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={[s.product, { color: tokens['text-secondary'] }]} numberOfLines={1}>{item.product} · {item.units} units</Text>
            <View style={s.bottom}>
              <Text style={[s.amount, { color: SELLER_GREEN }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
              <Text style={[s.date, { color: tokens['text-muted'] }]}>{item.date}</Text>
            </View>
            {item.status === 'paid' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: SELLER_GREEN }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Mark as Shipped</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    number: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    buyer: { fontSize: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    product: { fontSize: 13 },
    bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 18, fontWeight: '800' },
    date: { fontSize: 12 },
    actionBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  });
}
