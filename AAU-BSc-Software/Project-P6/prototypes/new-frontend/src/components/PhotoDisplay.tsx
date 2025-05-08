import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { useSocket } from '../context/SocketContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const PhotoDisplay: React.FC = () => {
  const { latestPhotoBase64, latestPhotoDetected } = useSocket();

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        border: '1px solid rgba(0,0,0,0.08)',
        bgcolor: 'background.paper',
        ...(latestPhotoDetected && {
          border: '2px solid #4caf50'
        })
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" fontWeight={500}>
          Latest Photo
        </Typography>
        
        {latestPhotoBase64 && (
          <Chip
            icon={latestPhotoDetected ? <CheckCircleIcon /> : <CancelIcon />}
            label={latestPhotoDetected ? "Detection Found" : "No Detection"}
            color={latestPhotoDetected ? "success" : "default"}
            size="small"
          />
        )}
      </Box>
      
      <Box 
        sx={{ 
          width: '100%', 
          minHeight: 200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#222',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        {latestPhotoBase64 ? (
          <img 
            src={`data:image/jpeg;base64,${latestPhotoBase64}`} 
            alt="Latest drone capture" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: 300,
              objectFit: 'contain',
              display: 'block'
            }} 
          />
        ) : (
          <Typography variant="body1" color="rgba(255,255,255,0.7)">
            No photos captured yet
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default PhotoDisplay;