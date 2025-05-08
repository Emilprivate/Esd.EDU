import { Paper, Typography, Box, useTheme } from '@mui/material';

function DroneStatus() {
  const theme = useTheme();
  
  return (
    <Paper sx={{ 
      height: '100%', 
      p: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, letterSpacing: 0.5 }}>
          DRONE STATUS
        </Typography>
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'text.secondary',
        p: 2,
        bgcolor: 'rgba(0, 0, 0, 0.2)',
      }}>
        <Typography variant="body1" sx={{ letterSpacing: 1 }}>NO DRONE CONNECTED</Typography>
      </Box>
    </Paper>
  );
}

export default DroneStatus;
