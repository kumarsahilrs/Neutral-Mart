import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const { tokens } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/splash');
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.surface }}>
      <NMTopbar title="My Profile" />
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: tokens.primary }]}>
          <Text style={{ fontSize: 32, color: '#fff', fontWeight: '700' }}>
            {user?.name?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: tokens['text-primary'] }]}>{user?.name || 'Demo User'}</Text>
        <Text style={[styles.phone, { color: tokens['text-muted'] }]}>{user?.phone || '+91 98765 43210'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: tokens.primary + '20' }]}>
          <Text style={{ color: tokens.primary, fontWeight: '600', textTransform: 'capitalize' }}>{user?.role || 'buyer'}</Text>
        </View>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#dc2626' }]} onPress={handleLogout}>
          <Text style={{ color: '#dc2626', fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { alignItems: 'center', padding: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  phone: { fontSize: 14, marginBottom: 12 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 32 },
  logoutBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
});
