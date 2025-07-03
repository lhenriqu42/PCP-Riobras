import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff', 
      light: '#6dacef',
      dark: '#0056b3',
      contrastText: '#fff',
    },
    secondary: {
      main: '#6c757d', 
      light: '#8e98a0',
      dark: '#494e52',
      contrastText: '#fff',
    },
    error: {
      main: '#dc3545', 
    },
    warning: {
      main: '#ffc107', 
    },
    info: {
      main: '#17a2b8', 
    },
    success: {
      main: '#28a745', 
    },
    background: {
      default: '#f8f9fa', 
      paper: '#ffffff',   
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif', 
    h1: { fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem' },
    h2: { fontSize: '2rem', fontWeight: 600, marginBottom: '0.8rem' },
    h3: { fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.7rem' },
    h4: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.6rem' },
    h5: { fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' },
    h6: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.4rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8, 
        },
      },
    },
  },
});

export default theme;