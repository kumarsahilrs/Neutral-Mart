import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { Text } from 'react-native';

export default function BuyerLayout() {
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: tokens.surface, borderTopColor: tokens.border },
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens['text-muted'],
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Deals', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏷️</Text> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
    </Tabs>
  );
}
