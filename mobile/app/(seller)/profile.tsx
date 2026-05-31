import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';

const SELLER_GREEN = '#16a34a';

export default function SellerProfileScreen() {
  const { tokens } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const s = makeStyles(tokens);

  return (
    <View style={{ flex: 1, backgroundColor: tokens['surface-elevated'] ?? '#f8fafc' }}>
      <NMTopbar title="My Profile" />
      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: SELLER_GREEN }]}>
          <Text style={s.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
        </View>
        <Text style={[s.name, { color: tokens['text-primary'] }]}>{user?.name || 'Demo Seller'}</Text>
        <Text style={[s.phone, { color: tokens['text-muted'] }]}>{user?.phone || '+91 98765 43210'}</Text>
        <View style={[s.verifiedBadge, { backgroundColor: SELLER_GREEN + '20' }]}>
          <Text style={{ color: SELLER_GREEN, fontWeight: '700', fontSize: 12 }}>✓ Verified Seller</Text>
        </View>

        {/* Stats strip */}
        <View style={[s.statsRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          {[{ label: 'Listings', value: '8' }, { label: 'GMV', value: '₹6.8L' }, { label: 'Rating', value: '4.8★' }].map((s2, i) => (
            <View key={s2.label} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: tokens.border }]}>
              <Text style={[s.statValue, { color: tokens['text-primary'] }]}>{s2.value}</Text>
              <Text style={[s.statLabel, { color: tokens['text-muted'] }]}>{s2.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu items */}
        {[
          { icon: '🏦', label: 'Bank Account', sub: 'HDFC ••••4521' },
          { icon: '📄', label: 'GST Certificate', sub: 'Verified' },
          { icon: '📍', label: 'Warehouse Locations', sub: '1 location' },
          { icon: '📊', label: 'Analytics', sub: 'View performance' },
          { icon: '⚙️', label: 'Settings', sub: 'Notifications, security' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={[s.menuItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={{ fontSize: 22, width: 32 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.menuLabel, { color: tokens['text-primary'] }]}>{item.label}</Text>
              <Text style={[s.menuSub, { color: tokens['text-muted'] }]}>{item.sub}</Text>
            </View>
            <Text style={{ color: tokens['text-muted'], fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.logoutBtn, { borderColor: '#dc2626' }]}
          onPress={() => { logout(); router.replace('/splash'); }}
        >
          <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 15 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(tokens: any) {
  return StyleSheet.create({
    content: { alignItems: 'center', padding: 24, gap: 12, paddingBottom: 100 },
    avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
    name: { fontSize: 22, fontWeight: '700' },
    phone: { fontSize: 14 },
    verifiedBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    statsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, width: '100%', overflow: 'hidden' },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: 14, borderWidth: 1 },
    menuLabel: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
    menuSub: { fontSize: 12 },
    logoutBtn: { marginTop: 8, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  });
}
