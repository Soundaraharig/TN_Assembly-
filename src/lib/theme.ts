import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('tn_theme') as Theme | null;
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light'; // Default to clean professional Light Theme
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('tn_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
