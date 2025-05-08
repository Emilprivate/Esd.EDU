import { Paper, Typography, Box, useTheme } from '@mui/material';
import { useEffect, useRef } from 'react';
import VideocamIcon from '@mui/icons-material/Videocam';

function CameraFeed() {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const generateStaticNoise = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.floor(Math.random() * 55); // Darker noise pattern
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      ctx.fillStyle = 'rgba(50, 50, 50, 0.1)';
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 1);
      }
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
      ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2 - 20);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 + 20);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.beginPath();
      ctx.arc(canvas.width - 20, 20, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      const date = new Date();
      const timeString = date.toISOString().replace('T', ' ').substring(0, 19);
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(timeString, 10, canvas.height - 10);
      
      ctx.font = '20px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('NO SIGNAL', canvas.width / 2 - 60, canvas.height / 2 - 50);
    };
    
    const interval = setInterval(generateStaticNoise, 100);
    return () => clearInterval(interval);
  }, []);

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
      }}>
        <VideocamIcon sx={{ mr: 1, color: 'error.main' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 500, letterSpacing: 0.5 }}>
          LIVE CAMERA FEED
        </Typography>
        <Box sx={{ 
          ml: 'auto',
          display: 'inline-flex',
          px: 0.75,
          py: 0.25,
          border: '1px solid',
          borderColor: 'error.main',
          color: 'error.main',
          alignItems: 'center',
        }}>
          <Typography variant="caption">REC</Typography>
        </Box>
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden',
        bgcolor: '#000000',
        position: 'relative',
      }}>
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={360}
          style={{ width: '100%', height: 'auto', maxHeight: '100%' }}
        />
      </Box>
    </Paper>
  );
}

export default CameraFeed;
