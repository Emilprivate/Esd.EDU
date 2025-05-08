import React from 'react';
import { Box, Paper, Typography, Divider, Stack } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import FlightIcon from '@mui/icons-material/Flight';
import { StatusItemProps } from '../types/components.types';

const DroneStatusPanel: React.FC = () => {
  const { 
    connected, 
    droneConnected, 
    motionState, 
    batteryPercent, 
    gps, 
    gpsSignal 
  } = useSocket();

  const hasValidGps = gps && 
    typeof gps.latitude === "number" && 
    typeof gps.longitude === "number" && 
    !(gps.latitude === 0 && gps.longitude === 0) && 
    !gpsSignal;

  // Status Item component for repeated use
  const StatusItem = ({ 
    icon, 
    label, 
    value, 
    color 
  }: StatusItemProps) => (
    <Box sx={{ width: '48%', mb: 2 }}>
      <Box display="flex" alignItems="center" mb={1}>
        <Box sx={{ mr: 1, color: color }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
      <Typography fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        border: '1px solid rgba(0,0,0,0.08)',
        bgcolor: 'background.paper' 
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={500}>
        Drone Status
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <StatusItem 
          icon={<SignalCellularAltIcon />}
          label="Connection"
          value={connected ? (droneConnected ? 'Connected' : 'Disconnected') : 'Server Offline'}
          color={droneConnected ? 'success.main' : 'text.disabled'}
        />
        
        <StatusItem 
          icon={<FlightIcon />}
          label="Motion"
          value={motionState
            ? motionState.charAt(0).toUpperCase() + motionState.slice(1)
            : "Unknown"}
          color={motionState ? 'primary.main' : 'text.disabled'}
        />
        
        <StatusItem 
          icon={<BatteryFullIcon />}
          label="Battery"
          value={batteryPercent !== null ? `${batteryPercent}%` : "Unknown"}
          color={batteryPercent !== null ? (
            batteryPercent > 40 ? 'success.main' : 
            batteryPercent > 20 ? 'warning.main' : 'error.main'
          ) : 'text.disabled'}
        />
        
        <StatusItem 
          icon={hasValidGps ? <GpsFixedIcon /> : <GpsNotFixedIcon />}
          label="GPS Signal"
          value={hasValidGps ? "Valid" : gpsSignal || "No Signal"}
          color={hasValidGps ? 'success.main' : 'warning.main'}
        />
      </Box>
      
      {hasValidGps && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="body2" color="text.secondary">Latitude</Typography>
              <Typography fontWeight={500}>{gps.latitude.toFixed(6)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Longitude</Typography>
              <Typography fontWeight={500}>{gps.longitude.toFixed(6)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Altitude</Typography>
              <Typography fontWeight={500}>{gps.altitude.toFixed(2)}m</Typography>
            </Box>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default DroneStatusPanel;