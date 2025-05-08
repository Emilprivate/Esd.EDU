import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Chip, 
  List, 
  ListItem, 
  ListItemText, 
  Divider 
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const FlightStatusDisplay = ({ status, onClose }) => {
  if (!status) return null;

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>Flight Status</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
          {status.success ? (
            <CheckCircleIcon color="success" sx={{ mr: 1.5 }} />
          ) : (
            <ErrorIcon color="error" sx={{ mr: 1.5 }} />
          )}
          <Typography variant="h6">{status.status}</Typography>
        </Box>
        
        {status.flight_mode && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Mode
            </Typography>
            <Chip 
              label={status.flight_mode.toUpperCase()} 
              color={status.flight_mode === "stable" ? "primary" : "secondary"}
            />
          </Box>
        )}
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Flight Logs
          </Typography>
          <Divider />
          <List sx={{ 
            maxHeight: 300, 
            overflow: 'auto', 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            border: 1,
            borderColor: 'divider'
          }}>
            {status.logs.map((log, index) => (
              <ListItem 
                key={index}
                divider={index < status.logs.length - 1}
                sx={{ 
                  py: 0.75,
                  ...(log.error && { color: 'error.main' })
                }}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 80 }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: log.error ? 500 : 400 }}>
                        {log.error || log.action}
                        {log.mode && ` (${log.mode} mode)`}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlightStatusDisplay;
