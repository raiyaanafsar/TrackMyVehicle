import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import {
  Box, Card, Typography, Switch, FormControlLabel, Paper, IconButton
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

const getEventConfig = (event) => {
  switch (event) {
    case 'collision':    return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'COLLISION',    border: 'rgba(248,113,113,0.35)' };
    case 'rash_driving': return { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'RASH DRIVING', border: 'rgba(251,146,60,0.35)' };
    case 'tow':          return { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'TOWING',       border: 'rgba(251,146,60,0.35)' };
    case 'toppling':     return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'TOPPLING',     border: 'rgba(248,113,113,0.35)' };
    default:             return { color: '#4ade80', bg: 'rgba(74,222,128,0.10)',  label: 'NORMAL',       border: 'rgba(74,222,128,0.30)' };
  }
};

// Reusable widget panel
function Panel({ accentColor, label, children, sx = {} }) {
  return (
    <Box
      sx={{
        border: '1px solid #1e293b',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 3,
        bgcolor: '#111827',
        p: 2,
        ...sx,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: '#475569', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.63rem' }}
      >
        {label}
      </Typography>
      <Box sx={{ mt: 1.25 }}>{children}</Box>
    </Box>
  );
}

export default function MapPage() {
  const { latestData, history, showPath, setShowPath, localPath } = useWebSocket();

  const currentLat   = latestData?.lat   || 29.8649;
  const currentLon   = latestData?.lon   || 77.8966;
  const currentSpeed = latestData?.speed ?? 0;

  const lastBearing = useRef(0);
  const mapRef      = useRef(null);

  const getBearing = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  useEffect(() => {
    if (history.length > 1 && currentSpeed > 0) {
      lastBearing.current = getBearing(
        history[1].lat, history[1].lon,
        history[0].lat, history[0].lon
      );
    }
  }, [history, currentSpeed]);

  const isMoving = currentSpeed > 2;

  const customIcon = new L.divIcon({
    className: 'custom-vehicle-marker',
    html: isMoving
      ? `<div style="transform:rotate(${lastBearing.current}deg);display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
           <svg viewBox="0 0 24 24" fill="#22d3ee" style="width:32px;height:32px;filter:drop-shadow(0 0 8px rgba(34,211,238,0.9));">
             <path d="M12 2L4 22L12 18L20 22L12 2Z"/>
           </svg>
         </div>`
      : `<div style="background-color:#22d3ee;border:3px solid #0a0e1a;border-radius:50%;width:18px;height:18px;box-shadow:0 0 10px rgba(34,211,238,0.9);"></div>`,
    iconSize:   isMoving ? [32, 32] : [18, 18],
    iconAnchor: isMoving ? [16, 16] : [9,  9],
  });

  const handleRecenter = () => {
    if (mapRef.current) mapRef.current.setView([currentLat, currentLon], 16, { animate: true });
  };

  // Derived values for panel
  const speedColor  = currentSpeed > 80 ? '#f87171' : currentSpeed > 40 ? '#fbbc05' : '#4ade80';
  const speedLabel  = currentSpeed === 0 ? 'Stationary' : currentSpeed > 80 ? 'Overspeeding' : currentSpeed > 40 ? 'Moderate' : 'Slow';
  const eventCfg    = getEventConfig(latestData?.event);
  const tripPoints  = localPath.length;

  const axes = [
    { key: 'X', value: latestData?.x ?? 0, color: '#ea4335' },
    { key: 'Y', value: latestData?.y ?? 0, color: '#4285f4' },
    { key: 'Z', value: latestData?.z ?? 0, color: '#34a853' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', gap: 2, overflow: 'hidden' }}>

      {/* ── MAP COLUMN (65%) ── */}
      <Box sx={{ flex: '2 1 0', minWidth: 0, height: '100%' }}>
        <Card
          sx={{
            height: '100%',
            boxShadow: 'none',
            border: '1px solid #1e293b',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Glassmorphism header strip */}
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
              bgcolor: 'rgba(17,24,39,0.82)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(30,41,59,0.7)',
              px: 2.5, py: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem' }}>
              Live Tracking
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 7, height: 7, borderRadius: '50%',
                bgcolor: latestData ? '#4ade80' : '#475569',
                boxShadow: latestData ? '0 0 7px #4ade80' : 'none',
              }} />
              <Typography variant="caption" sx={{ color: latestData ? '#4ade80' : '#475569', fontWeight: 600, letterSpacing: '1px', fontSize: '0.65rem' }}>
                {latestData ? 'SIGNAL ACTIVE' : 'NO SIGNAL'}
              </Typography>
            </Box>
          </Box>

          {/* Path toggle — bottom-left */}
          <Box sx={{ position: 'absolute', bottom: 18, left: 16, zIndex: 1000 }}>
            <Paper elevation={0} sx={{
              px: 1.5, py: 0.5, borderRadius: '20px',
              bgcolor: 'rgba(17,24,39,0.88)', border: '1px solid rgba(30,41,59,0.8)',
              backdropFilter: 'blur(8px)',
            }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showPath}
                    onChange={(e) => setShowPath(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#22d3ee' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#22d3ee' },
                    }}
                  />
                }
                label={<Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', letterSpacing: '1px', fontSize: '0.68rem' }}>SHOW PATH</Typography>}
                sx={{ m: 0 }}
              />
            </Paper>
          </Box>

          {/* Recenter — bottom-right */}
          <Box sx={{ position: 'absolute', bottom: 18, right: 16, zIndex: 1000 }}>
            <Paper elevation={0} sx={{
              borderRadius: '50%',
              bgcolor: 'rgba(17,24,39,0.88)', border: '1px solid rgba(30,41,59,0.8)',
              backdropFilter: 'blur(8px)',
            }}>
              <IconButton onClick={handleRecenter} sx={{ p: 1.1, color: '#22d3ee', '&:hover': { bgcolor: 'rgba(34,211,238,0.1)' } }}>
                <MyLocationIcon fontSize="small" />
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
              <Polyline positions={localPath} color="#22d3ee" weight={4} opacity={0.85} />
            )}
          </MapContainer>
        </Card>
      </Box>

      {/* ── RIGHT INFO PANEL (35%) ── */}
      <Box sx={{ flex: '1 1 0', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>

        {/* Speed Gauge */}
        <Panel accentColor={speedColor} label="Live Speed">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            {/* Circular gauge */}
            <Box sx={{
              width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
              border: '5px solid', borderColor: speedColor,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 22px ${speedColor}45`,
              transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#e2e8f0', lineHeight: 1 }}>
                {currentSpeed}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.58rem', color: '#64748b', letterSpacing: '1.5px', mt: 0.25 }}>
                KM/H
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: speedColor, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                {speedLabel}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', mt: 0.5, display: 'block' }}>
                {isMoving ? 'Vehicle in motion' : 'Engine idle / stopped'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#334155', mt: 0.25, display: 'block' }}>
                {tripPoints} points tracked
              </Typography>
            </Box>
          </Box>
        </Panel>

        {/* GPS Position */}
        <Panel accentColor="#22d3ee" label="GPS Position">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { label: 'LATITUDE',  value: currentLat.toFixed(6) },
              { label: 'LONGITUDE', value: currentLon.toFixed(6) },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" sx={{ color: '#334155', fontWeight: 700, letterSpacing: '1.5px', fontSize: '0.6rem' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600, color: '#22d3ee' }}>
                    {value}
                  </Typography>
                </Box>
                <Box sx={{ height: '1px', bgcolor: '#1e293b', mt: 0.75 }} />
              </Box>
            ))}
          </Box>
        </Panel>

        {/* Drive Status */}
        <Panel accentColor={eventCfg.color} label="Drive Status">
          <Box sx={{
            px: 2, py: 1.25, borderRadius: 2,
            bgcolor: eventCfg.bg,
            border: `1px solid ${eventCfg.border}`,
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Box sx={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              bgcolor: eventCfg.color,
              boxShadow: `0 0 8px ${eventCfg.color}, 0 0 16px ${eventCfg.color}60`,
            }} />
            <Typography sx={{ fontWeight: 700, color: eventCfg.color, letterSpacing: '2px', fontSize: '0.82rem' }}>
              {eventCfg.label}
            </Typography>
          </Box>
        </Panel>

        {/* Accelerometer — fills remaining space */}
        <Panel accentColor="#a142f4" label="Accelerometer (G-Force)" sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {axes.map(({ key, value, color }) => {
              const pct = Math.min((Math.abs(value) / 3) * 100, 100);
              return (
                <Box key={key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color, fontSize: '0.8rem' }}>
                      {key}-Axis
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {(+value).toFixed(2)}g
                    </Typography>
                  </Box>
                  <Box sx={{ height: 7, bgcolor: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%',
                      width: `${pct}%`,
                      bgcolor: color,
                      borderRadius: 4,
                      transition: 'width 0.35s ease',
                      boxShadow: `0 0 8px ${color}70`,
                    }} />
                  </Box>
                </Box>
              );
            })}

            {/* Divider + magnitude */}
            <Box sx={{ borderTop: '1px solid #1e293b', pt: 1.5, mt: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#475569', letterSpacing: '1.5px', fontWeight: 600, fontSize: '0.62rem' }}>
                  RESULTANT MAGNITUDE
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 700, color: '#a142f4' }}>
                  {Math.sqrt(
                    (latestData?.x ?? 0) ** 2 +
                    (latestData?.y ?? 0) ** 2 +
                    (latestData?.z ?? 0) ** 2
                  ).toFixed(3)}g
                </Typography>
              </Box>
            </Box>
          </Box>
        </Panel>

      </Box>
    </Box>
  );
}
