import { View, Text, StyleSheet } from 'react-native';
import { NMTopbar } from '../../src/components/ui/NMTopbar';
import { useTheme } from '../../src/theme/ThemeContext';

export default function SearchScreen() {
  const { tokens } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tokens.surface }}>
      <NMTopbar title="Search" />
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
        <Text style={{ color: tokens['text-muted'], fontSize: 15 }}>Search coming soon</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
