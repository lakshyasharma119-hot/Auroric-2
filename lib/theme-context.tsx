'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemeId = 'crimson' | 'fiery-sunset' | 'quiet-luxury' | 'modern-editorial';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  swatches: string[]; // 5 preview colors
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'crimson',
    name: 'Obsidian & Crimson',
    description: 'Dark obsidian with bright red accents',
    swatches: ['#0d0f11', '#ea3a3a', '#1c2028', '#e6e0d8', '#3b3d47'],
  },
  {
    id: 'fiery-sunset',
    name: 'Fiery Sunset',
    description: 'Deep burgundy with crimson and peach warmth',
    swatches: ['#280000', '#B10F2E', '#570000', '#FDFFFF', '#DE7C5A'],
  },
  {
    id: 'quiet-luxury',
    name: 'Quiet Luxury',
    description: 'Earthy light theme with alabaster and cognac',
    swatches: ['#F7F5F0', '#FFFFFF', '#2D2824', '#8A6046', '#DCD7D2'],
  },
  {
    id: 'modern-editorial',
    name: 'Modern Editorial',
    description: 'Slate and sage with cool modern tones',
    swatches: ['#0D1117', '#161B22', '#E6EDF3', '#5B8A72', '#30363D'],
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeInfo[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'auroric-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('crimson');

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some(t => t.id === stored)) {
      setThemeState(stored);
      applyTheme(stored);
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: ThemeId) {
  const root = document.documentElement;
  if (theme === 'crimson') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'crimson' as ThemeId, setTheme: () => {}, themes: THEMES };
  }
  return context;
}
