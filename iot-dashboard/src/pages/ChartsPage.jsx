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
ChartJS.defaults.color = '#5f6368';

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
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 8 },
        border: { display: false }
      },
      y: {
        grid: { color: '#f1f3f4', drawBorder: false },
        border: { display: false, dash: [4, 4] }
      }
    }
  };

  // --- 1. LIVE ACCELEROMETER CHART (X, Y, Z) ---
  const lineChartData = {
    labels,
    datasets: [
      { label: 'X Axis', data: chartPoints.map((p) => p.x), borderColor: '#ea4335', backgroundColor: '#ea4335', tension: 0.4, pointRadius: 2 }, 
      { label: 'Y Axis', data: chartPoints.map((p) => p.y), borderColor: '#4285f4', backgroundColor: '#4285f4', tension: 0.4, pointRadius: 2 }, 
      { label: 'Z Axis', data: chartPoints.map((p) => p.z), borderColor: '#34a853', backgroundColor: '#34a853', tension: 0.4, pointRadius: 2 }, 
    ],
  };
  const lineOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: -3.0, max: 3.0, title: { display: true, text: 'Acceleration (g)', color: '#9aa0a6' } } },
    plugins: { ...commonOptions.plugins, legend: { position: 'top' }, title: { display: false } },
  };

  // --- 2. LIVE SPEED AREA CHART ---
  const speedChartData = {
    labels,
    datasets: [{
      label: 'Speed (km/h)', data: chartPoints.map((p) => p.speed),
      borderColor: '#fbbc05', backgroundColor: 'rgba(251, 188, 5, 0.15)', fill: true, tension: 0.4, pointRadius: 2 
    }],
  };
  const speedOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, beginAtZero: true, title: { display: true, text: 'Speed (km/h)', color: '#9aa0a6' } } },
    plugins: { ...commonOptions.plugins, legend: { display: false }, title: { display: false } },
  };

  // --- 3. NEW: REAL-TIME MAGNITUDE AREA CHART ---
  const magChartData = {
    labels,
    datasets: [{
      label: 'Magnitude (g)', data: magnitudes,
      borderColor: '#a142f4', backgroundColor: 'rgba(161, 66, 244, 0.15)', fill: true, tension: 0.4, pointRadius: 2 
    }],
  };
  const magOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: 0, max: 4.0, title: { display: true, text: 'Total Force (g)', color: '#9aa0a6' } } },
    plugins: { ...commonOptions.plugins, legend: { display: false }, title: { display: false } },
  };

  // --- 4. NEW: REAL-TIME JERK BAR CHART ---
  const jerkChartData = {
    labels,
    datasets: [{
      label: 'Jerk (Δg)', data: jerks,
      backgroundColor: '#ea4335', borderRadius: 4, 
    }],
  };
  const jerkOptions = {
    ...commonOptions,
    scales: { 
      x: { grid: { display: false }, border: { display: false } },
      y: { ...commonOptions.scales.y, beginAtZero: true, max: 3.0, title: { display: true, text: 'Shock Force (Δg)', color: '#9aa0a6' } } 
    },
    plugins: { ...commonOptions.plugins, legend: { display: false }, title: { display: false } },
  };

  // --- 5. ANALYTICS: BAR & DOUGHNUT CHARTS ---
  const filteredEvents = Object.entries(analytics.events || {}).filter(([key]) => key !== "normal");
  const eventLabels = filteredEvents.map(([key]) => key);
  const eventData = filteredEvents.map(([, value]) => value);
  const chartColors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#a142f4']; 

  const barChartData = {
    labels: eventLabels.map(label => label.toUpperCase()),
    datasets: [{ label: 'Event Count', data: eventData, backgroundColor: chartColors, borderRadius: 4 }],
  };
  const doughnutChartData = {
    labels: eventLabels.map(label => label.toUpperCase()),
    datasets: [{ data: eventData, backgroundColor: chartColors, borderWidth: 0, hoverOffset: 4 }],
  };
  const analyticsBarOptions = { 
    ...commonOptions, 
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: '#f1f3f4' }, border: { display: false } } }
  };
  const analyticsDoughnutOptions = { 
    responsive: true, maintainAspectRatio: false, 
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 20 } } },
    cutout: '70%' 
  };

  const cardStyle = { 
    boxShadow: 'none', 
    border: '1px solid #dadce0', 
    borderRadius: 3, 
    bgcolor: '#ffffff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
      <Grid container spacing={3}>

        {/* --- ROW 1: Raw Sensor Data (XYZ) & Speed --- */}
        <Grid item xs={12} md={8}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#5f6368', fontWeight: 600 }}>Real-Time Accelerometer</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: '300px', pt: 1 }}>
              {history.length === 0 ? <Typography color="textSecondary" align="center" mt={12}>Waiting for data...</Typography> : <Line options={lineOptions} data={lineChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
        

        {/* --- ROW 2: Derived Physics Data (Magnitude & Jerk) --- */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#5f6368', fontWeight: 600 }}>Real-Time Magnitude</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: '250px', pt: 1 }}>
              {history.length === 0 ? <Typography color="textSecondary" align="center" mt={10}>Waiting for data...</Typography> : <Line options={magOptions} data={magChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#5f6368', fontWeight: 600 }}>Real-Time Jerk (Shock Spikes)</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: '250px', pt: 1 }}>
              {history.length === 0 ? <Typography color="textSecondary" align="center" mt={10}>Waiting for data...</Typography> : <Bar options={jerkOptions} data={jerkChartData} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#5f6368', fontWeight: 600 }}>Real-Time Speed</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: '300px', pt: 1 }}>
              {history.length === 0 ? <Typography color="textSecondary" align="center" mt={12}>Waiting for data...</Typography> : <Line options={speedOptions} data={speedChartData} />}
            </CardContent>
          </Card>
        </Grid>
        {/* --- ROW 3: Database Analytics --- */}
        <Grid item xs={12} md={5}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#5f6368', fontWeight: 600 }}>Event Distribution</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: '250px', pt: 1 }}>
              {eventLabels.length === 0 ? <Typography color="textSecondary" align="center" mt={10}>No events logged yet.</Typography> : <Bar options={analyticsBarOptions} data={barChartData} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            boxShadow: 'none', 
            borderRadius: 3, 
            height: '100%', 
            minHeight: '250px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            bgcolor: '#e8f0fe', 
            color: '#1a73e8', 
            border: '1px solid #d2e3fc'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1967d2' }}>
                Average Route Speed
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-1px' }}>
                {analytics.avgSpeed} <Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>km/h</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#5f6368', fontWeight: 600 }}>Event Ratio</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: '250px', pt: 1, display: 'flex', justifyContent: 'center' }}>
              {eventLabels.length === 0 ? <Typography color="textSecondary" align="center" mt={10}>No events logged yet.</Typography> : <Doughnut options={analyticsDoughnutOptions} data={doughnutChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
        

      </Grid>
    </Box>
  );
}