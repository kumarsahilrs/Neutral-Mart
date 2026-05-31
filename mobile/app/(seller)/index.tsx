import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';

const SELLER_GREEN = '#16a34a';

const DEMO_STATS = {
  active_listings: 8,
  pending_orders: 3,
  escrow_balance: 124000,
  total_earned: 680000,
  views_this_week: 412,
};

const DEMO_ORDERS = [
  { id: '1', order_number: 'NM-2024-001', buyer: 'Ramesh Traders', amount: 48000, status: 'paid', units: 50 },
  { id: '2', order_number: 'NM-2024-002', buyer: 'Global Surplus Co.', amount: 125000, status: 'shipped', units: 200 },
  { id: '3', order_number: 'NM-2024-003', buyer: 'Delhi Resellers', amount: 32000, status: 'pending', units: 30 },
];

const STATUS_COLOR: Record<string, string> = {
  paid: '#d97706', shipped: '#2563eb', pending: '#6b7280', completed: '#16a34a', disputed: '#dc2626',
};

export default function SellerDashboard() {
  const { tokens } = useTheme();
  const { user, language } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const s = makeStyles(tokens);

  return (
    <View style={s.root}>
      <NMTopbar
        title="Seller Dashboard"
        subtitle={language === 'hi' ? `नमस्ते ${user?.name?.split(' ')[0] || ''}` : `Hi ${user?.name?.split(' ')[0] || ''}!`}
        rightActions={
          <TouchableOpacity style={s.agentBtn}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SELLER_GREEN} />}
      >
        {/* AI Pricing Alert */}
        <TouchableOpacity style={[s.alertBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b40' }]}>
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={[s.alertText, { color: '#92400e' }]}>
            3 listings not sold in 30+ days — AI suggests price drop
          </Text>
          <Text style={{ color: '#d97706', fontSize: 12 }}>→</Text>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          {[
            { label: 'Active Listings', value: DEMO_STATS.active_listings, icon: '📋', highlight: false },
            { label: 'Pending Orders', value: DEMO_STATS.pending_orders, icon: '⏳', highlight: true },
            { label: 'Escrow Balance', value: `₹${(DEMO_STATS.escrow_balance / 1000).toFixed(0)}K`, icon: '🔒', highlight: false },
            { label: 'Total Earned', value: `₹${(DEMO_STATS.total_earned / 1000).toFixed(0)}K`, icon: '💰', highlight: false },
          ].map((stat) => (
            <TouchableOpacity
              key={stat.label}
              style={[s.statCard, { backgroundColor: stat.highlight ? SELLER_GREEN + '10' : tokens.surface, borderColor: stat.highlight ? SELLER_GREEN + '40' : tokens.border }]}
            >
              <Text style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</Text>
              <Text style={[s.statValue, { color: stat.highlight ? SELLER_GREEN : tokens['text-primary'] }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: tokens['text-muted'] }]}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[s.sectionTitle, { color: tokens['text-primary'] }]}>Quick Actions</Text>
        <View style={s.actionsRow}>
          {[
            { icon: '📦', label: 'Add Stock', onPress: () => router.push('/(seller)/new-listing') },
            { icon: '🤖', label: 'AI Caption', onPress: () => {} },
            { icon: '📊', label: 'Analytics', onPress: () => {} },
            { icon: '💳', label: 'Payouts', onPress: () => {} },
          ].map(action => (
            <TouchableOpacity key={action.label} style={[s.actionBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]} onPress={action.onPress}>
              <Text style={{ fontSize: 26, marginBottom: 4 }}>{action.icon}</Text>
              <Text style={[s.actionLabel, { color: tokens['text-secondary'] }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: tokens['text-primary'] }]}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(seller)/orders')}>
            <Text style={{ color: SELLER_GREEN, fontSize: 13, fontWeight: '600' }}>View all →</Text>
          </TouchableOpacity>
        </View>
        {DEMO_ORDERS.map(order => (
          <TouchableOpacity key={order.id} style={[s.orderRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.orderNum, { color: tokens['text-primary'] }]}>{order.order_number}</Text>
              <Text style={[s.orderMeta, { color: tokens['text-muted'] }]}>{order.buyer} · {order.units} units</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.orderAmount, { color: SELLER_GREEN }]}>₹{order.amount.toLocaleString('en-IN')}</Text>
              <View style={[s.statusChip, { backgroundColor: STATUS_COLOR[order.status] + '20' }]}>
                <Text style={[s.statusText, { color: STATUS_COLOR[order.status] }]}>{order.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' },
    scroll: { flex: 1 },
    scrollContent: { padding: 14, paddingBottom: 100, gap: 12 },
    agentBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
    alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },
    statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 },
    actionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
    orderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
    orderNum: { fontWeight: '600', fontSize: 14, marginBottom: 2 },
    orderMeta: { fontSize: 12 },
    orderAmount: { fontWeight: '800', fontSize: 16, marginBottom: 4 },
    statusChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  });
}
