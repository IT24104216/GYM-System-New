import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AppThemeProvider, useAppTheme } from '@/app/providers/ThemeContext';
import { AuthProvider } from '@/features/auth/model/AuthContext';
import AppRouter from '@/app/router/AppRouter';
import '@/App.css';

// Inner component that can access the dynamic theme from ThemeContext
function ThemedApp() {
  const { theme } = useAppTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppThemeProvider>
        <ThemedApp />
      </AppThemeProvider>
    </BrowserRouter>
  );
}

export default App;
