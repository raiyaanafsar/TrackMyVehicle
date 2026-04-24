import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import MapPage from './pages/MapPage';
import ChartsPage from './pages/ChartsPage';
import LogsPage from './pages/LogsPage';
import { WebSocketProvider } from './context/WebSocketContext';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22d3ee',
      light: '#67e8f9',
      dark: '#0891b2',
      contrastText: '#0a0e1a',
    },
    secondary: {
      main: '#a78bfa',
      contrastText: '#0a0e1a',
    },
    error: {
      main: '#f87171',
    },
    warning: {
      main: '#fb923c',
    },
    success: {
      main: '#4ade80',
    },
    background: {
      default: '#0a0e1a',
      paper: '#111827',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      disabled: '#475569',
    },
    divider: '#1e293b',
    action: {
      hover: 'rgba(34, 211, 238, 0.08)',
      selected: 'rgba(34, 211, 238, 0.12)',
      focus: 'rgba(34, 211, 238, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0e1a',
          scrollbarColor: '#1e293b #0a0e1a',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#0a0e1a' },
          '&::-webkit-scrollbar-thumb': {
            background: '#1e293b',
            borderRadius: '4px',
            '&:hover': { background: '#334155' },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
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
    MuiTableCell: {
      styleOverrides: {
        stickyHeader: {
          backgroundColor: '#111827',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111827',
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {showSplash ? (
        <SplashScreen onDone={() => setShowSplash(false)} />
      ) : (
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<MapPage />} />
                <Route path="charts" element={<ChartsPage />} />
                <Route path="logs" element={<LogsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      )}
    </ThemeProvider>
  );
}

export default App;
