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
    { text: 'Live Map', path: '/', icon: <MapIcon /> },
    { text: 'Telemetry Charts', path: '/charts', icon: <TimelineIcon /> },
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
          bgcolor: '#ffffff', 
          color: '#202124',
          boxShadow: 'none',
          borderBottom: '1px solid #dadce0'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>

          {/* LEFT: Title */}
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500, letterSpacing: '-0.5px' }}>
            ESP32 Vehicle Tracker
          </Typography>

          {/* MIDDLE: Critical Alerts*/}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {latestData?.event === 'tow' && (
              <Chip
                label="⚠️ TOWING DETECTED"
                sx={{ fontWeight: 'bold', bgcolor: '#fce8e6', color: '#d93025', border: '1px solid #f28b82' }}
              />
            )}
            {latestData?.event === 'toppling' && (
              <Chip
                label="🚨 TOPPLING DETECTED"
                sx={{ fontWeight: 'bold', bgcolor: '#fce8e6', color: '#d93025', border: '1px solid #f28b82' }}
              />
            )}
          </Box>

          {/* RIGHT: Combined Status Area */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f1f3f4', 
              borderRadius: 8,
              px: 2,
              py: 0.75,
              gap: 2,
              border: '1px solid #dadce0'
            }}
          >
            {/* 1. Server Connection */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {isConnected ? (
                <WifiIcon sx={{ fontSize: 18, color: '#1e8e3e' }} /> 
              ) : (
                <WifiOffIcon sx={{ fontSize: 18, color: '#d93025' }} /> 
              )}
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#5f6368', letterSpacing: 0.5 }}>
                SERVER
              </Typography>
            </Box>

            <Box sx={{ width: '1px', height: '16px', bgcolor: '#bdc1c6' }} />

            {/* 2. ESP32 Device Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: isDeviceActive ? '#1e8e3e' : '#d93025',
                  boxShadow: isDeviceActive ? '0 0 4px rgba(30,142,62,0.4)' : '0 0 4px rgba(217,48,37,0.4)',
                  transition: 'all 0.3s ease'
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: '#5f6368',
                  letterSpacing: 0.5
                }}
              >
                {isDeviceActive ? 'DEVICE ONLINE' : 'DEVICE OFFLINE'}
              </Typography>
            </Box>
          </Box>

        </Toolbar>
      </AppBar>

      {/* LEFT SIDEBAR  */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            bgcolor: '#ffffff', 
            color: '#3c4043',
            borderRight: '1px solid #dadce0'
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar sx={{ mb: 1, mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#202124', letterSpacing: '-0.5px' }}>
            IoT Dashboard
          </Typography>
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
                    borderRadius: '24px', 
                    '&.Mui-selected': { 
                      bgcolor: '#e8f0fe', 
                      color: '#1a73e8', 
                      '&:hover': { bgcolor: '#d2e3fc' }
                    },
                    '&:hover': { 
                      bgcolor: '#f1f3f4', 
                      color: '#202124'
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 40,
                      color: isSelected ? '#1a73e8' : '#5f6368' 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.95rem'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8f9fa',
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
          sx: { borderRadius: 3, p: 1 } 
        }}
      >
        <DialogTitle sx={{ color: '#d93025', fontWeight: 'bold', pb: 1 }}>
          CRITICAL ALERT
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#3c4043' }}>
            A vehicle collision has been detected! Please check the live map and take immediate action.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pr: 2, pb: 2 }}>
          <Button 
            onClick={() => setCollisionAlertOpen(false)} 
            variant="contained" 
            sx={{ 
              bgcolor: '#d93025', 
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#b3261e', boxShadow: 'none' }
            }}
          >
            Acknowledge & Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}