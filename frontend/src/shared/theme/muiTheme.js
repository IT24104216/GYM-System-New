import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a1a2e',
      light: '#2d2d44',
      dark: '#0d0d17',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e94560',
      light: '#ff6b80',
      dark: '#b71c3a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #e5e7eb', borderRadius: 12 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #e5e7eb' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid #e5e7eb' },
      },
    },
  },
});

export default muiTheme;
