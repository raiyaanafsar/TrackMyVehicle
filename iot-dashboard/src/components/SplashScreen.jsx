import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const radarRing = keyframes`
  0%   { transform: scale(0.3); opacity: 0.7; }
  100% { transform: scale(2.4); opacity: 0;   }
`;

const iconGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 10px rgba(34,211,238,0.4)); }
  50%       { filter: drop-shadow(0 0 36px rgba(34,211,238,1)); }
`;

const progressFill = keyframes`
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
`;

const scanLine = keyframes`
  0%   { top: 0%; opacity: 0.6; }
  100% { top: 100%; opacity: 0; }
`;

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1500);
    const t2 = setTimeout(() => onDone(), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      {/* Scan line */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)',
          animation: `${scanLine} 2s linear infinite`,
          pointerEvents: 'none',
        }}
      />

      {/* Radar pulse rings */}
      {[0, 0.7, 1.4].map((delay, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '1.5px solid rgba(34,211,238,0.45)',
            animation: `${radarRing} 2.2s ease-out ${delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* GPS pin icon */}
      <Box
        sx={{
          animation: `${iconGlow} 2s ease-in-out infinite`,
          mb: 2.5,
          lineHeight: 0,
        }}
      >
        <svg width="68" height="68" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9.5" r="8" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#22d3ee"
          />
          <circle cx="12" cy="9" r="2.5" fill="#0a0e1a" />
        </svg>
      </Box>

      {/* Main title */}
      <Typography
        sx={{
          fontWeight: 800,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem' },
          animation: `${fadeInUp} 0.7s ease 0.15s both`,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        <Box component="span" sx={{ color: '#22d3ee' }}>Track</Box>
        <Box component="span" sx={{ color: '#e2e8f0' }}>My</Box>
        <Box component="span" sx={{ color: '#94a3b8' }}>Vehicle</Box>
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          color: '#475569',
          letterSpacing: '3.5px',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
          mt: 2,
          animation: `${fadeInUp} 0.7s ease 0.4s both`,
          userSelect: 'none',
        }}
      >
        Real-time IoT Vehicle Monitoring System
      </Typography>

      {/* Dot separator */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 4,
          animation: `${fadeInUp} 0.7s ease 0.7s both`,
        }}
      >
        {[0, 0.3, 0.6].map((delay, i) => (
          <Box
            key={i}
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: i === 1 ? '#22d3ee' : 'rgba(34,211,238,0.3)',
            }}
          />
        ))}
      </Box>

      {/* Corner brackets */}
      {[
        { top: 28, left: 28, borderTop: true, borderLeft: true },
        { top: 28, right: 28, borderTop: true, borderRight: true },
        { bottom: 24, left: 28, borderBottom: true, borderLeft: true },
        { bottom: 24, right: 28, borderBottom: true, borderRight: true },
      ].map((pos, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 32,
            height: 32,
            ...(pos.top !== undefined && { top: pos.top }),
            ...(pos.bottom !== undefined && { bottom: pos.bottom }),
            ...(pos.left !== undefined && { left: pos.left }),
            ...(pos.right !== undefined && { right: pos.right }),
            ...(pos.borderTop && { borderTop: '2px solid rgba(34,211,238,0.35)' }),
            ...(pos.borderBottom && { borderBottom: '2px solid rgba(34,211,238,0.35)' }),
            ...(pos.borderLeft && { borderLeft: '2px solid rgba(34,211,238,0.35)' }),
            ...(pos.borderRight && { borderRight: '2px solid rgba(34,211,238,0.35)' }),
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Progress bar at bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          bgcolor: '#0f172a',
        }}
      >
        <Box
          sx={{
            height: '100%',
            bgcolor: '#22d3ee',
            transformOrigin: 'left center',
            animation: `${progressFill} 2s linear forwards`,
            boxShadow: '0 0 10px rgba(34,211,238,0.7)',
          }}
        />
      </Box>
    </Box>
  );
}
