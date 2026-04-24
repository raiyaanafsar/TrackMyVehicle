import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import { useWebSocket } from '../context/WebSocketContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend);

ChartJS.defaults.font.family = '"Roboto", "Helvetica", "Arial", sans-serif';
ChartJS.defaults.color = '#94a3b8';

const darkTooltip = {
  backgroundColor: '#1e293b',
  titleColor: '#e2e8f0',
  bodyColor: '#94a3b8',
  borderColor: '#334155',
  borderWidth: 1,
};

// Card with colored top accent stripe
const accentCard = (color) => ({
  boxShadow: 'none',
  border: '1px solid #1e293b',
  borderTop: `3px solid ${color}`,
  borderRadius: 2,
  bgcolor: '#111827',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

// Card title row with optional badge
function CardHeader({ title, badge, badgeColor = '#22d3ee' }) {
  return (
    <Box
      sx={{
        px: 2,
        pt: 1.5,
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
      }}
    >
      <Typography variant="subtitle2" sx={{ color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.3px' }}>
        {title}
      </Typography>
      {badge && (
        <Box
          sx={{
            px: 1,
            py: 0.2,
            borderRadius: '4px',
            bgcolor: `${badgeColor}18`,
            border: `1px solid ${badgeColor}40`,
            color: badgeColor,
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          {badge}
        </Box>
      )}
    </Box>
  );
}

// Section block: heading bar + charts grid inside one bordered container
function Section({ label, accentColor, children }) {
  return (
    <Box
      sx={{
        border: '1px solid #1e293b',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Section heading bar */}
      <Box
        sx={{
          px: 3,
          py: 1.25,
          bgcolor: '#0d1321',
          borderBottom: '1px solid #1e293b',
          borderLeft: `4px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
        <Typography
          variant="caption"
          sx={{
            color: accentColor,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            fontWeight: 700,
            fontSize: '0.72rem',
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Charts inside */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {children}
        </Grid>
      </Box>
    </Box>
  );
}

const noData = (msg = 'Awaiting signal...') => (
  <Typography color="textSecondary" align="center" sx={{ pt: 9 }}>{msg}</Typography>
);

export default function ChartsPage() {
  const { history, analytics } = useWebSocket();

  const chartPoints = history.slice(0, 15).reverse();
  const labels = chartPoints.map((point) => point.timestamp);

  const magnitudes = chartPoints.map((p) => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z));
  const jerks = magnitudes.map((mag, i) => i === 0 ? 0 : Math.abs(mag - magnitudes[i - 1]));

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: darkTooltip,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 8 },
        border: { display: false },
      },
      y: {
        grid: { color: '#1e293b', drawBorder: false },
        border: { display: false, dash: [4, 4] },
      },
    },
  };

  // --- Vehicle Velocity ---
  const velocityData = {
    labels,
    datasets: [{
      label: 'Speed (km/h)',
      data: chartPoints.map((p) => p.speed),
      borderColor: '#fbbc05',
      backgroundColor: 'rgba(251,188,5,0.15)',
      fill: true, tension: 0.4, pointRadius: 2,
    }],
  };
  const velocityOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, beginAtZero: true, title: { display: true, text: 'km/h', color: '#64748b' } } },
    plugins: { ...commonOptions.plugins, legend: { display: false } },
  };

  // --- 3-Axis Motion Feed ---
  const motionFeedData = {
    labels,
    datasets: [
      { label: 'X Axis', data: chartPoints.map((p) => p.x), borderColor: '#ea4335', backgroundColor: '#ea4335', tension: 0.4, pointRadius: 2 },
      { label: 'Y Axis', data: chartPoints.map((p) => p.y), borderColor: '#4285f4', backgroundColor: '#4285f4', tension: 0.4, pointRadius: 2 },
      { label: 'Z Axis', data: chartPoints.map((p) => p.z), borderColor: '#34a853', backgroundColor: '#34a853', tension: 0.4, pointRadius: 2 },
    ],
  };
  const motionFeedOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: -3.0, max: 3.0, title: { display: true, text: 'Acceleration (g)', color: '#64748b' } } },
    plugins: { ...commonOptions.plugins, legend: { position: 'top' } },
  };

  // --- Resultant G-Force ---
  const gForceData = {
    labels,
    datasets: [{
      label: 'G-Force (g)',
      data: magnitudes,
      borderColor: '#a142f4',
      backgroundColor: 'rgba(161,66,244,0.15)',
      fill: true, tension: 0.4, pointRadius: 2,
    }],
  };
  const gForceOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: 0, max: 4.0, title: { display: true, text: 'Total Force (g)', color: '#64748b' } } },
    plugins: { ...commonOptions.plugins, legend: { display: false } },
  };

  // --- Impact Intensity ---
  const impactData = {
    labels,
    datasets: [{
      label: 'Impact (Δg)',
      data: jerks,
      backgroundColor: '#ea4335',
      borderRadius: 4,
    }],
  };
  const impactOptions = {
    ...commonOptions,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { ...commonOptions.scales.y, beginAtZero: true, max: 3.0, title: { display: true, text: 'Shock (Δg)', color: '#64748b' } },
    },
    plugins: { ...commonOptions.plugins, legend: { display: false } },
  };

  // --- Analytics ---
  const filteredEvents = Object.entries(analytics.events || {}).filter(([key]) => key !== 'normal');
  const eventLabels = filteredEvents.map(([key]) => key);
  const eventData = filteredEvents.map(([, value]) => value);
  const chartColors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#a142f4'];

  const incidentBarData = {
    labels: eventLabels.map((l) => l.toUpperCase()),
    datasets: [{ label: 'Count', data: eventData, backgroundColor: chartColors, borderRadius: 4 }],
  };
  const riskProfileData = {
    labels: eventLabels.map((l) => l.toUpperCase()),
    datasets: [{ data: eventData, backgroundColor: chartColors, borderWidth: 0, hoverOffset: 4 }],
  };
  const incidentBarOptions = {
    ...commonOptions,
    plugins: { ...commonOptions.plugins, legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: '#1e293b' }, border: { display: false } },
    },
  };
  const riskProfileOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, padding: 16, color: '#94a3b8' } },
      tooltip: darkTooltip,
    },
    cutout: '70%',
  };

  return (
    <Box sx={{ pb: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Page title */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.5px' }}>
        Sensor Analytics
      </Typography>

      {/* ── SECTION 1: LIVE TELEMETRY ── */}
      <Section label="Live Telemetry" accentColor="#22d3ee">

        {/* Vehicle Velocity — half */}
        <Grid item xs={12} md={6}>
          <Card sx={accentCard('#fbbc05')}>
            <CardHeader title="Vehicle Velocity" badge="LIVE" badgeColor="#fbbc05" />
            <CardContent sx={{ flexGrow: 1, height: '260px', pt: 1.5 }}>
              {history.length === 0 ? noData() : <Line options={velocityOptions} data={velocityData} />}
            </CardContent>
          </Card>
        </Grid>

        {/* 3-Axis Motion Feed — half */}
        <Grid item xs={12} md={6}>
          <Card sx={accentCard('#22d3ee')}>
            <CardHeader title="3-Axis Motion Feed" badge="LIVE" badgeColor="#22d3ee" />
            <CardContent sx={{ flexGrow: 1, height: '260px', pt: 1.5 }}>
              {history.length === 0 ? noData() : <Line options={motionFeedOptions} data={motionFeedData} />}
            </CardContent>
          </Card>
        </Grid>

      </Section>

      {/* ── SECTION 2: MOTION ANALYSIS ── */}
      <Section label="Motion Analysis" accentColor="#a142f4">

        {/* Resultant G-Force — half */}
        <Grid item xs={12} md={6}>
          <Card sx={accentCard('#a142f4')}>
            <CardHeader title="Resultant G-Force" badge="LIVE" badgeColor="#a142f4" />
            <CardContent sx={{ flexGrow: 1, height: '240px', pt: 1.5 }}>
              {history.length === 0 ? noData() : <Line options={gForceOptions} data={gForceData} />}
            </CardContent>
          </Card>
        </Grid>

        {/* Impact Intensity — half */}
        <Grid item xs={12} md={6}>
          <Card sx={accentCard('#ea4335')}>
            <CardHeader title="Impact Intensity" badge="LIVE" badgeColor="#ea4335" />
            <CardContent sx={{ flexGrow: 1, height: '240px', pt: 1.5 }}>
              {history.length === 0 ? noData() : <Bar options={impactOptions} data={impactData} />}
            </CardContent>
          </Card>
        </Grid>

      </Section>

      {/* ── SECTION 3: JOURNEY INTELLIGENCE ── */}
      <Section label="Journey Intelligence" accentColor="#fb923c">

        {/* Incident Breakdown — one third */}
        <Grid item xs={12} md={4}>
          <Card sx={accentCard('#fb923c')}>
            <CardHeader title="Incident Breakdown" badge="DB" badgeColor="#fb923c" />
            <CardContent sx={{ flexGrow: 1, height: '230px', pt: 1.5 }}>
              {eventLabels.length === 0
                ? noData('No incidents recorded yet.')
                : <Bar options={incidentBarOptions} data={incidentBarData} />}
            </CardContent>
          </Card>
        </Grid>

        {/* Mean Trip Speed — one third */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            boxShadow: 'none',
            borderRadius: 2,
            height: '100%',
            minHeight: '230px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(34,211,238,0.05)',
            border: '1px solid rgba(34,211,238,0.2)',
            borderTop: '3px solid #22d3ee',
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#475569', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
                Mean Trip Speed
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: '-2px', color: '#22d3ee', mt: 1.5, lineHeight: 1 }}>
                {analytics.avgSpeed}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>km/h</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Profile — one third */}
        <Grid item xs={12} md={4}>
          <Card sx={accentCard('#4285f4')}>
            <CardHeader title="Risk Profile" badge="DB" badgeColor="#4285f4" />
            <CardContent sx={{ flexGrow: 1, height: '230px', pt: 1.5, display: 'flex', justifyContent: 'center' }}>
              {eventLabels.length === 0
                ? noData('No incidents recorded yet.')
                : <Doughnut options={riskProfileOptions} data={riskProfileData} />}
            </CardContent>
          </Card>
        </Grid>

      </Section>

    </Box>
  );
}
