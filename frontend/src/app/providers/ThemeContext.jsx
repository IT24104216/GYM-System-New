/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';
import muiTheme from '@/shared/theme/muiTheme';

const ThemeContext = createContext(null);

const THEME_KEY = 'gympro_theme_mode';

const MODE_PALETTE = {
  light: {
    mode: 'light',
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#6b7280',
    },
  },
  dark: {
    mode: 'dark',
    background: {
      default: '#0b1220',
      paper: '#111b2f',
    },
    text: {
      primary: '#e6edf9',
      secondary: '#9aa8c0',
    },
  },
};

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'light';
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, mode);
  }, [mode]);

  const toggleTheme = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const selectedPalette = MODE_PALETTE[mode] || MODE_PALETTE.light;

  // Merge mode-specific palette values into the base theme.
  const theme = createTheme({
    ...muiTheme,
    palette: {
      ...muiTheme.palette,
      ...selectedPalette,
      primary: {
        ...muiTheme.palette.primary,
        ...(mode === 'dark' ? { main: '#90caf9', light: '#b5e0ff', dark: '#5f9fd1' } : {}),
      },
      secondary: {
        ...muiTheme.palette.secondary,
        ...(mode === 'dark' ? { main: '#f48fb1', light: '#f8bbd0', dark: '#d66f95' } : {}),
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside <AppThemeProvider>');
  return ctx;
}

export default ThemeContext;
