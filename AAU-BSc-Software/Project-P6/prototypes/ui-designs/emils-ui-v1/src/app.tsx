import { Box } from '@mui/material';
import { useState } from 'react';
import MapSection from './components/sections/map-mission';
import CameraFeed from './components/sections/camera-feed';
import ControlPanel from './components/sections/control-panel';
import DroneStatus from './components/sections/drone-status';
import Header from './components/header';
import ProjectInfo from './components/sections/project-info';

function App() {
  const [safetyEnabled, setSafetyEnabled] = useState(false);
  
  const handleSafetyToggle = () => {
    setSafetyEnabled(!safetyEnabled);
  };

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      m: 0,
      p: 0,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#121212',
    }}>
      <Header safetyEnabled={safetyEnabled} onSafetyToggle={handleSafetyToggle} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        <Box sx={{ display: 'flex', height: '55%', p: 0.5, pb: 0.25 }}>
          <Box sx={{ width: '50%', pr: 0.25 }}>
            <MapSection disabled={!safetyEnabled} />
          </Box>
          <Box sx={{ width: '50%', pl: 0.25 }}>
            <CameraFeed />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', height: '45%', p: 0.5, pt: 0.25 }}>

          <Box sx={{ width: '50%', pr: 0.25 }}>
            <ControlPanel disabled={!safetyEnabled} />
          </Box>
          
          <Box sx={{ width: '50%', pl: 0.25, display: 'flex', flexDirection: 'row' }}>

            <Box sx={{ width: '50%', pr: 0.25 }}>
              <DroneStatus />
            </Box>

            <Box sx={{ width: '50%', pl: 0.25 }}>
              <ProjectInfo />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
