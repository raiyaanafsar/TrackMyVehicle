import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Tabs, Tab, CircularProgress, Pagination
} from '@mui/material';

import { useWebSocket } from '../context/WebSocketContext';

const getEventStyle = (event) => {
  switch (event) {
    case 'normal':
      return { bgcolor: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' };
    case 'tow':
      return { bgcolor: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' };
    case 'rash_driving':
    case 'collision':
    case 'toppling':
      return { bgcolor: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' };
    default:
      return { bgcolor: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' };
  }
};

const LogTable = ({ logs, isLoading }) => (
  <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
    <Table stickyHeader size="medium">
      <TableHead>
        <TableRow>
          {['Timestamp', 'Event', 'Speed (km/h)', 'Coordinates (Lat, Lon)', 'Accel (X, Y, Z)'].map((headCell) => (
            <TableCell
              key={headCell}
              sx={{
                fontWeight: 600,
                color: '#94a3b8',
                bgcolor: '#111827',
                borderBottom: '1px solid #1e293b',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px'
              }}
            >
              {headCell}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 8, borderBottom: 'none' }}>
              <CircularProgress size={32} sx={{ color: '#22d3ee' }} />
            </TableCell>
          </TableRow>
        ) : logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#94a3b8', borderBottom: 'none' }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>No data available...</Typography>
            </TableCell>
          </TableRow>
        ) : (
          logs.map((row) => {
            const rowStyle = getEventStyle(row.event);
            return (
              <TableRow
                key={row.id || row._id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell sx={{ color: '#cbd5e1', fontWeight: 500, borderColor: '#1e293b' }}>
                  {row.timestamp || new Date(row.time).toLocaleTimeString()}
                </TableCell>
                <TableCell sx={{ borderColor: '#1e293b' }}>
                  <Chip
                    label={row.event?.toUpperCase() || 'UNKNOWN'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      letterSpacing: '0.5px',
                      bgcolor: rowStyle.bgcolor,
                      color: rowStyle.color,
                      border: rowStyle.border,
                      borderRadius: '6px'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#cbd5e1', borderColor: '#1e293b' }}>{row.speed ?? 'N/A'}</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.85rem', borderColor: '#1e293b' }}>
                  {row.lat !== undefined && row.lon !== undefined
                    ? `${row.lat.toFixed(4)}, ${row.lon.toFixed(4)}`
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.85rem', borderColor: '#1e293b' }}>
                  {row.x !== undefined
                    ? `${row.x}, ${row.y}, ${row.z}`
                    : 'N/A'}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export default function LogsPage() {
  const { sessionLogs: liveLogs } = useWebSocket();

  const [tabIndex, setTabIndex] = useState(0);
  const [storedLogs, setStoredLogs] = useState([]);
  const [isLoadingStored, setIsLoadingStored] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (tabIndex === 1 || tabIndex === 2) {
      const fetchStoredLogs = async () => {
        setIsLoadingStored(true);
        try {
          const filterParam = tabIndex === 2 ? '&filter=anomalies' : '';
          const response = await fetch(`http://localhost:8000/api/logs?page=${page}&limit=15${filterParam}`);
          const data = await response.json();

          setStoredLogs(data.logs);
          setTotalPages(data.totalPages);
        } catch (error) {
          console.error("❌ Error fetching stored logs:", error);
        } finally {
          setIsLoadingStored(false);
        }
      };

      fetchStoredLogs();
    }
  }, [tabIndex, page]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    if (newValue !== tabIndex) setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const tabStyle = (index) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: tabIndex === index ? '#22d3ee' : '#94a3b8',
    '&.Mui-selected': { color: '#22d3ee' }
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.5px' }}>
        System Logs
      </Typography>

      <Card
        sx={{
          flexGrow: 1,
          boxShadow: 'none',
          border: '1px solid #1e293b',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#111827'
        }}
      >
        <Box sx={{ borderBottom: '1px solid #1e293b', bgcolor: '#111827', flexShrink: 0 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#22d3ee',
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              }
            }}
          >
            <Tab label="Live Log (Session)" sx={tabStyle(0)} />
            <Tab label="Stored Log (All)" sx={tabStyle(1)} />
            <Tab label="Event Log (Anomalies)" sx={tabStyle(2)} />
          </Tabs>
        </Box>

        {tabIndex === 0 ? (
          <LogTable logs={liveLogs} isLoading={false} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <LogTable logs={storedLogs} isLoading={isLoadingStored} />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2,
                borderTop: '1px solid #1e293b',
                bgcolor: '#111827',
                flexShrink: 0
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontWeight: 500,
                    color: '#94a3b8',
                    borderColor: '#1e293b',
                  },
                  '& .Mui-selected': {
                    bgcolor: 'rgba(34,211,238,0.12) !important',
                    color: '#22d3ee',
                    fontWeight: 'bold'
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}
