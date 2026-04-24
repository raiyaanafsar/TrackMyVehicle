import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, AppBar, Toolbar, Chip, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Button
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import TimelineIcon from '@mui/icons-material/Timeline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

import { useWebSocket } from '../context/WebSocketContext';

const drawerWidth = 260;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { latestData, isConnected } = useWebSocket();
  const { isDeviceActive } = useWebSocket();

  const [rashAlertOpen, setRashAlertOpen] = useState(false);
  const [collisionAlertOpen, setCollisionAlertOpen] = useState(false);

  useEffect(() => {
    if (!latestData) return;

    if (latestData.event === 'rash_driving') {
      setRashAlertOpen(true);
    }

    if (latestData.event === 'collision') {
      setCollisionAlertOpen(true);
    }
  }, [latestData?.event]);

  const menuItems = [
    { text: 'Live Tracking', path: '/', icon: <MapIcon /> },
    { text: 'Sensor Analytics', path: '/charts', icon: <TimelineIcon /> },
    { text: 'System Logs', path: '/logs', icon: <ListAltIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>

      {/* TOP HEADER */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: '#111827',
          color: '#e2e8f0',
          boxShadow: 'none',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>

          {/* LEFT: Title */}
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, letterSpacing: '0.5px', color: '#22d3ee' }}>
            TrackMyVehicle
          </Typography>

          {/* MIDDLE: Critical Alerts */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {latestData?.event === 'tow' && (
              <Chip
                label="⚠️ TOWING DETECTED"
                sx={{ fontWeight: 'bold', bgcolor: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.4)' }}
              />
            )}
            {latestData?.event === 'toppling' && (
              <Chip
                label="🚨 TOPPLING DETECTED"
                sx={{ fontWeight: 'bold', bgcolor: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}
              />
            )}
          </Box>

          {/* RIGHT: Combined Status Area */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#0f172a',
              borderRadius: 8,
              px: 2,
              py: 0.75,
              gap: 2,
              border: '1px solid #1e293b'
            }}
          >
            {/* 1. Server Connection */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {isConnected ? (
                <WifiIcon sx={{ fontSize: 18, color: '#4ade80' }} />
              ) : (
                <WifiOffIcon sx={{ fontSize: 18, color: '#f87171' }} />
              )}
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5 }}>
                SERVER
              </Typography>
            </Box>

            <Box sx={{ width: '1px', height: '16px', bgcolor: '#334155' }} />

            {/* 2. ESP32 Device Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: isDeviceActive ? '#4ade80' : '#f87171',
                  boxShadow: isDeviceActive
                    ? '0 0 6px #4ade80, 0 0 12px rgba(74,222,128,0.4)'
                    : '0 0 6px #f87171, 0 0 12px rgba(248,113,113,0.4)',
                  transition: 'all 0.3s ease'
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: '#94a3b8',
                  letterSpacing: 0.5
                }}
              >
                {isDeviceActive ? 'DEVICE ONLINE' : 'DEVICE OFFLINE'}
              </Typography>
            </Box>
          </Box>

        </Toolbar>
      </AppBar>

      {/* LEFT SIDEBAR */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#111827',
            color: '#94a3b8',
            borderRight: '1px solid #1e293b'
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar sx={{ mb: 1, mt: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#22d3ee', letterSpacing: '1px', fontSize: '1rem' }}>
              TrackMyVehicle
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', letterSpacing: '2px', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Vehicle Monitor
            </Typography>
          </Box>
        </Toolbar>
        <List sx={{ px: 1.5 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isSelected}
                  sx={{
                    borderRadius: '12px',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(34,211,238,0.12)',
                      color: '#22d3ee',
                      '&:hover': { bgcolor: 'rgba(34,211,238,0.18)' }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.04)',
                      color: '#e2e8f0'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? '#22d3ee' : '#64748b'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.95rem',
                      color: isSelected ? '#22d3ee' : '#94a3b8'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Bottom accent line */}
        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid #1e293b' }}>
          <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
            Real-time telemetry via WebSocket
          </Typography>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#0a0e1a',
          p: 3,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar />

        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', pr: 1 }}>
          <Outlet />
        </Box>
      </Box>

      {/* ALERTS */}
      <Snackbar
        open={rashAlertOpen}
        autoHideDuration={5000}
        onClose={() => setRashAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setRashAlertOpen(false)} severity="warning" variant="filled" sx={{ width: '100%', fontWeight: 500 }}>
          Warning: Rash Driving Detected!
        </Alert>
      </Snackbar>

      <Dialog
        open={collisionAlertOpen}
        disableEscapeKeyDown
        PaperProps={{
          sx: { borderRadius: 3, p: 1, border: '1px solid rgba(248,113,113,0.3)' }
        }}
      >
        <DialogTitle sx={{ color: '#f87171', fontWeight: 'bold', pb: 1 }}>
          CRITICAL ALERT
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
            A vehicle collision has been detected! Please check the live map and take immediate action.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pr: 2, pb: 2 }}>
          <Button
            onClick={() => setCollisionAlertOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#f87171',
              color: '#0a0e1a',
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' }
            }}
          >
            Acknowledge & Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
