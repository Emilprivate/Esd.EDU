import { Paper, Typography, Box, Chip, useTheme, Divider } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import FlightIcon from '@mui/icons-material/Flight';

function ProjectInfo() {
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
      <Box sx={{ 
        p: 1.5, 
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(0, 0, 0, 0.2)',
      }}>
        <Box sx={{ 
          width: 14,
          height: 14,
          borderRadius: '50%',
          bgcolor: theme.palette.info.main,
          mr: 1.5,
        }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
          P6-SCAN
        </Typography>
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
      }}>
        <Box sx={{ 
          textAlign: 'center', 
          p: 1.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <Typography 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.secondary.main,
              letterSpacing: 1,
            }}
          >
            SELF-CONTROLLED AERIAL NAVIGATION
          </Typography>
        </Box>
        
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ 
              display: 'block', 
              mb: 1,
              color: 'text.secondary',
              letterSpacing: '0.3px',
            }}>
              An autonomous drone navigation system combining:
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
              <StorageIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.success.main }} />
              <Typography variant="caption">Backend computation server</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
              <DeveloperBoardIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.info.main }} />
              <Typography variant="caption">Mission planning UI</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FlightIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.warning.main }} />
              <Typography variant="caption">Automated drone execution</Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 1.5, opacity: 0.2 }} />
          
          <Box sx={{ 
            p: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(144, 202, 249, 0.2)',
          }}>
            <Typography variant="caption" sx={{ 
              fontStyle: 'italic', 
              color: theme.palette.secondary.light,
              lineHeight: 1.5,
              letterSpacing: '0.3px',
              fontSize: '0.7rem',
              display: 'block',
            }}>
              "Users define regions on the map for autonomous flight path optimization, considering camera field of view, elevation, and environmental parameters."
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default ProjectInfo;
