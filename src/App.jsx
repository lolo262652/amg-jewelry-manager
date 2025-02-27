import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fr } from 'dayjs/locale/fr';
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes'
import { useState, useMemo } from 'react'

function App() {
  const [mode, setMode] = useState('light')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#7E57C2', // Violet élégant
            light: '#B085F5',
            dark: '#4D2C91',
          },
          secondary: {
            main: '#FFB74D', // Orange doux
            light: '#FFE97D',
            dark: '#C88719',
          },
          background: {
            default: mode === 'light' ? '#F5F5F7' : '#121212',
            paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 600,
            letterSpacing: '-0.5px',
          },
          h2: {
            fontWeight: 600,
            letterSpacing: '-0.5px',
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: '16px',
                boxShadow: mode === 'light' 
                  ? '0 4px 6px rgba(0,0,0,0.02), 0 1px 3px rgba(0,0,0,0.05)' 
                  : '0 4px 6px rgba(0,0,0,0.4)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode],
  )

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <CssBaseline />
            <AuthProvider>
              <AppRoutes toggleColorMode={() => setMode(mode === 'light' ? 'dark' : 'light')} />
              <Toaster position="top-right" />
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  )
}

export default App
