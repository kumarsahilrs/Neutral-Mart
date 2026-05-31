'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Panel = 'buyer' | 'seller';
type ColorMode = 'light' | 'dark';

interface ThemeContextValue {
  panel: Panel;
  colorMode: ColorMode;
  setPanel: (panel: Panel) => void;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  panel: 'buyer',
  colorMode: 'light',
  setPanel: () => {},
  toggleColorMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [panel, setCurrentPanel] = useState<Panel>('buyer');
  const [colorMode, setColorMode] = useState<ColorMode>('light');

  useEffect(() => {
    const storedPanel = localStorage.getItem('nm_panel') as Panel | null;
    const storedMode = localStorage.getItem('nm_mode') as ColorMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedPanel === 'buyer' || storedPanel === 'seller') setCurrentPanel(storedPanel);
    setColorMode(storedMode === 'dark' || storedMode === 'light' ? storedMode : prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-panel', panel);
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [panel, colorMode]);

  const setPanel = useCallback((p: Panel) => {
    setCurrentPanel(p);
    localStorage.setItem('nm_panel', p);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('nm_mode', next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ panel, colorMode, setPanel, toggleColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
