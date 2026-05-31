/**
 * Theme context — buyer/seller panel + light/dark mode.
 * Persists preferences to AsyncStorage.
 * Respects system preference on first launch.
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './tokens';

type Mode = 'light' | 'dark';
type Panel = 'buyer' | 'seller';

interface ThemeContextType {
  mode: Mode;
  panel: Panel;
  colors: typeof Colors.light;
  primaryColor: string;
  isDark: boolean;
  toggleTheme: () => void;
  setPanel: (panel: Panel) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  panel: 'buyer',
  colors: Colors.light,
  primaryColor: Colors.primary,
  isDark: false,
  toggleTheme: () => {},
  setPanel: () => {},
});

export function ThemeProvider({ children, initialPanel = 'buyer' }: { children: React.ReactNode; initialPanel?: Panel }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<Mode>(systemScheme === 'dark' ? 'dark' : 'light');
  const [panel, setCurrentPanel] = useState<Panel>(initialPanel);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('nm_theme'),
      AsyncStorage.getItem('nm_panel'),
    ]).then(([storedTheme, storedPanel]) => {
      if (storedTheme === 'dark' || storedTheme === 'light') setMode(storedTheme);
      if (storedPanel === 'buyer' || storedPanel === 'seller') setCurrentPanel(storedPanel);
    });
  }, []);

  function toggleTheme() {
    const next: Mode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    AsyncStorage.setItem('nm_theme', next);
  }

  function setPanel(p: Panel) {
    setCurrentPanel(p);
    AsyncStorage.setItem('nm_panel', p);
  }

  const isDark = mode === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const primaryColor = panel === 'seller' ? Colors.sellerPrimary : Colors.primary;

  const value = useMemo<ThemeContextType>(
    () => ({ mode, panel, colors, primaryColor, isDark, toggleTheme, setPanel }),
    [mode, panel, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
