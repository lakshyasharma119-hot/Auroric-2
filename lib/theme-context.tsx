'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// NOTE: The `users` database schema has a `settingsTheme` attribute (max 10 chars, stores 'dark'/'light').
// It could sync mode preference cross-device in a future pass. Currently it is not wired up to this UI.

export type ThemeMode = 'light' | 'dark';

export type ThemeId =
  | 'standard_dark'
  | 'standard_light'
  | 'obsidian_crimson'
  | 'fiery_sunset'
  | 'quiet_luxury'
  | 'modern_editorial';

/** Themes that require Auroric Plus or Prime subscription */
export const PREMIUM_THEMES: ThemeId[] = ['obsidian_crimson', 'quiet_luxury'];

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  mode: ThemeMode; 
  swatch: string[]; 
  isCustom: boolean; 
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  standard_dark:     { id: 'standard_dark',     label: 'Dark',               description: 'Standard dark mode',          mode: 'dark',  swatch: ['#0a0a0a', '#1a1a1a', '#ffffff'], isCustom: false },
  standard_light:    { id: 'standard_light',    label: 'Light',              description: 'Standard light mode',         mode: 'light', swatch: ['#ffffff', '#f4f4f4', '#0a0a0a'], isCustom: false },
  obsidian_crimson:  { id: 'obsidian_crimson',  label: 'Obsidian & Crimson', description: 'Dark obsidian with bright red accents', mode: 'dark',  swatch: ['#000000', '#e0263a', '#2b2b33', '#e7e2dd', '#54545c'], isCustom: true },
  fiery_sunset:      { id: 'fiery_sunset',      label: 'Fiery Sunset',       description: 'Deep burgundy with crimson and peach warmth', mode: 'dark',  swatch: ['#3a0d10', '#9c1c2e', '#c4243a', '#ffffff', '#e08a63'], isCustom: true },
  quiet_luxury:      { id: 'quiet_luxury',      label: 'Quiet Luxury',       description: 'Earthy light theme with alabaster and cognac', mode: 'light', swatch: ['#ffffff', '#ffffff', '#5a4632', '#9c6b3f', '#e7e2dd'], isCustom: true },
  modern_editorial:  { id: 'modern_editorial',  label: 'Modern Editorial',   description: 'Slate and sage with cool modern tones', mode: 'dark',  swatch: ['#11151c', '#1c2230', '#e7edf2', '#3f7a5f', '#454c58'], isCustom: true },
};

interface ThemeContextValue {
  themeId: ThemeId;
  mode: ThemeMode;
  setTheme: (id: ThemeId) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'auroric-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('standard_dark');

  // 1. AUTO-DETECTION on first visit
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES[stored]) {
      setThemeId(stored);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeId(prefersDark ? 'standard_dark' : 'standard_light');
  }, []);

  // 2. Keep OS-level changes in sync ONLY if the user has never explicitly chosen
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const hasExplicitChoice = localStorage.getItem(STORAGE_KEY);
      if (!hasExplicitChoice) {
        setThemeId(e.matches ? 'standard_dark' : 'standard_light');
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    const currentMode = THEMES[themeId].mode;
    document.documentElement.setAttribute('data-mode', currentMode);
    
    if (currentMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeId]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const toggleMode = useCallback(() => {
    const nextMode: ThemeMode = THEMES[themeId].mode === 'dark' ? 'light' : 'dark';
    setTheme(nextMode === 'dark' ? 'standard_dark' : 'standard_light');
  }, [themeId, setTheme]);

  return (
    <ThemeContext.Provider value={{ 
      themeId, 
      mode: THEMES[themeId].mode, 
      setTheme, 
      toggleMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
