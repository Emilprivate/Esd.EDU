import { AppBar, Box, FormControlLabel, Switch, Toolbar, Typography, useTheme } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

interface HeaderProps {
  safetyEnabled: boolean;
  onSafetyToggle: () => void;
}

function Header({ safetyEnabled, onSafetyToggle }: HeaderProps) {
  const theme = useTheme();
  
  return (
    <AppBar position="static" sx={{ 
      height: '48px', 
      minHeight: 'auto',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Toolbar variant="dense" sx={{ 
        minHeight: 'auto', 
        height: '100%', 
        px: 2,
      }}>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          '&::before': {
            content: '""',
            display: 'block',
            width: '8px',
            height: '24px',
            backgroundColor: safetyEnabled ? theme.palette.success.main : theme.palette.error.main,
            mr: 2,
          }
        }}>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 700,
            letterSpacing: 1 
          }}>
            P6-SCAN
          </Typography>
          <Typography variant="subtitle2" sx={{ 
            ml: 1, 
            color: 'text.secondary',
            fontWeight: 400 
          }}>
            DRONE CONTROL FRONTEND
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon 
            color={safetyEnabled ? "success" : "error"} 
            sx={{ mr: 1 }}
          />
          <FormControlLabel
            control={
              <Switch 
                checked={safetyEnabled}
                onChange={onSafetyToggle}
                color="secondary"
                size="small"
                sx={{ 
                  '& .MuiSwitch-track': { 
                    borderRadius: 0 
                  },
                  '& .MuiSwitch-thumb': { 
                    borderRadius: 0 
                  } 
                }}
              />
            }
            label={
              <Typography variant="caption" sx={{ 
                fontSize: '0.75rem',
                color: safetyEnabled ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 500
              }}>
                {safetyEnabled ? "SAFETY ENABLED" : "SAFETY DISABLED"}
              </Typography>
            }
            sx={{ mr: 0 }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
