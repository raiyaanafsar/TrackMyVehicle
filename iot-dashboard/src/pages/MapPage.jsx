import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { 
  Box, Card, Typography, Switch, FormControlLabel, Paper, 
  ToggleButtonGroup, ToggleButton, IconButton 
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useWebSocket } from '../context/WebSocketContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function MapPage() {
  const { 
    latestData, history, simActive, simType, updateSimulation,
    showPath, setShowPath, localPath 
  } = useWebSocket();

  const currentLat = latestData?.lat || 29.8649; 
  const currentLon = latestData?.lon || 77.8966;
  const currentSpeed = latestData?.speed ?? 0;
  
  const lastBearing = useRef(0);
  const mapRef = useRef(null);

  const getBearing = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  useEffect(() => {
    if (history.length > 1 && currentSpeed > 0) {
      const bearing = getBearing(history[1].lat, history[1].lon, history[0].lat, history[0].lon);
      lastBearing.current = bearing;
    }
  }, [history, currentSpeed]);

  const isMoving = currentSpeed > 2;

  const customIcon = new L.divIcon({
    className: 'custom-vehicle-marker',
    html: isMoving
      ? `<div style="transform: rotate(${lastBearing.current}deg); display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
           <svg viewBox="0 0 24 24" fill="#1a73e8" style="width: 32px; height: 32px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
             <path d="M12 2L4 22L12 18L20 22L12 2Z" />
           </svg>
         </div>`
      : `<div style="background-color: #1a73e8; border: 3px solid white; border-radius: 50%; width: 18px; height: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: isMoving ? [32, 32] : [18, 18],
    iconAnchor: isMoving ? [16, 16] : [9, 9],
  });

  const handleRecenter = () => {
    if (mapRef.current && currentLat && currentLon) {
      mapRef.current.setView([currentLat, currentLon], 16, { animate: true });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Card 
        sx={{ 
          flexGrow: 1, 
          boxShadow: 'none', 
          border: '1px solid #dadce0', 
          borderRadius: 3, 
          position: 'relative', 
          overflow: 'hidden' 
        }}
      >
        {/* TOP RIGHT: Dummy Data Controls */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              px: 2, 
              py: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end', 
              gap: 1.5, 
              borderRadius: 3,
              border: '1px solid #dadce0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px rgba(60,64,67,0.3)'
            }}
          >
            <FormControlLabel
              control={
                <Switch 
                  size="small"
                  checked={simActive} 
                  onChange={(e) => updateSimulation(e.target.checked, simType)} 
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a73e8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1a73e8' },
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600, color: simActive ? '#1a73e8' : '#5f6368' }}>Dummy GPS Data</Typography>}
              sx={{ m: 0 }}
            />
            {simActive && (
              <ToggleButtonGroup 
                size="small" 
                value={simType} 
                exclusive 
                onChange={(e, newVal) => { if (newVal) updateSimulation(simActive, newVal); }}
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid #dadce0',
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#5f6368',
                    px: 1.5,
                    py: 0.25,
                    fontSize: '0.8rem',
                    '&.Mui-selected': {
                      bgcolor: '#e8f0fe',
                      color: '#1a73e8',
                      '&:hover': { bgcolor: '#d2e3fc' }
                    }
                  }
                }}
              >
                <ToggleButton value="stationary">Stationary</ToggleButton>
                <ToggleButton value="moving">Moving</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Paper>
        </Box>

        {/* BOTTOM LEFT: Speed & Path Controls */}
        <Box sx={{ position: 'absolute', bottom: 30, left: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              width: 72, 
              height: 72, 
              borderRadius: '50%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              border: '4px solid', 
              borderColor: currentSpeed > 80 ? '#d93025' : '#1e8e3e', 
              bgcolor: '#ffffff',
              boxShadow: '0 2px 6px rgba(60,64,67,0.3)'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#202124', lineHeight: 1 }}>{currentSpeed}</Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#5f6368' }}>km/h</Typography>
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              px: 2, 
              py: 0.5, 
              borderRadius: '24px', 
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px rgba(60,64,67,0.3)',
              border: '1px solid #dadce0'
            }}
          >
            <FormControlLabel
              control={
                <Switch 
                  size="small" 
                  checked={showPath} 
                  onChange={(e) => setShowPath(e.target.checked)} 
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a73e8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1a73e8' },
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>Show Path</Typography>}
              sx={{ m: 0 }}
            />
          </Paper>
        </Box>

        {/* BOTTOM RIGHT: Recenter Button */}
        <Box sx={{ position: 'absolute', bottom: 30, right: 20, zIndex: 1000 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: '50%', 
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px rgba(60,64,67,0.3)',
              border: '1px solid #dadce0'
            }}
          >
            <IconButton 
              onClick={handleRecenter} 
              sx={{ 
                p: 1.5, 
                color: '#1a73e8',
                '&:hover': { bgcolor: '#f8f9fa' } 
              }}
            >
              <MyLocationIcon />
            </IconButton>
          </Paper>
        </Box>

        <MapContainer ref={mapRef} center={[currentLat, currentLon]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {latestData && <Marker position={[latestData.lat, latestData.lon]} icon={customIcon} />}
          {showPath && localPath.length > 1 && (
            <Polyline positions={localPath} color="#1a73e8" weight={5} opacity={0.8} />
          )}
        </MapContainer>
      </Card>
    </Box>
  );
}