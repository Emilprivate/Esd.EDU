import React, { useState, useEffect, useRef } from "react";
import { 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  IconButton, 
  Typography, 
  useTheme 
} from "@mui/material";
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// No need to import terminal.css anymore

function TerminalLogs({ logs }) {
  console.log("TerminalLogs: Received logs prop:", logs);
  const theme = useTheme();
  const [filter, setFilter] = useState("flight"); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();

  // Filter the logs received via props
  const filtered = logs.filter((log) => {
    if (filter === "flight") return true; 
    if (filter === "all") return true;
    return false;
  });

  console.log("TerminalLogs: Filtered logs:", filtered);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filtered]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleChange = (event, newValue) => {
    setFilter(newValue);
  };

  return (
    <Paper 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        bgcolor: '#1e1e1e', 
        color: '#f0f0f0',
        borderRadius: 1,
        overflow: 'hidden',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100%' : 'auto',
        height: isFullscreen ? '100%' : '100%',
        zIndex: isFullscreen ? 9999 : 'auto',
        transition: 'all 0.3s ease'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#252525', borderBottom: '1px solid #333' }}>
        <Tabs 
          value={filter} 
          onChange={handleChange}
          sx={{ 
            minHeight: 36,
            '& .MuiTab-root': { 
              color: '#ccc', 
              minHeight: 36, 
              py: 0.5,
              px: 2,
              fontSize: '0.9rem'
            },
            '& .Mui-selected': { 
              color: '#fff' 
            },
            '& .MuiTabs-indicator': { 
              bgcolor: theme.palette.primary.main 
            }
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Flight" value="flight" />
        </Tabs>
        <IconButton 
          onClick={toggleFullscreen} 
          size="small" 
          sx={{ color: '#ccc', m: 0.5 }}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Box>
      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          p: 1.25,
          fontFamily: '"Consolas", "Courier New", monospace',
          fontSize: 13,
          lineHeight: 1.5,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#1e1e1e'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#555',
            borderRadius: '4px'
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#555 #1e1e1e'
        }}
      >
        {filtered.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#777',
            fontStyle: 'italic'
          }}>
            No logs to display for this filter
          </Box>
        ) : (
          filtered.map((log, i) => (
            <Box 
              key={i} 
              sx={{ 
                mb: 0.5,
                py: 0.25,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                borderRadius: '2px',
                width: '100%',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              <Typography 
                component="span" 
                sx={{ 
                  color: '#888',
                  mr: 1,
                  fontSize: '0.85em',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </Typography>
              
              <Typography 
                component="span" 
                sx={{ 
                  mr: 1,
                  fontWeight: 600,
                  flexShrink: 0,
                  minWidth: 50,
                  whiteSpace: 'nowrap',
                  color: (log.action?.toLowerCase() === 'error' || log.level?.toLowerCase() === 'error') 
                    ? '#e01b24' 
                    : (log.action?.toLowerCase() === 'warning' || log.level?.toLowerCase() === 'warning')
                      ? '#f9c440'
                      : (log.action?.toLowerCase() === 'info' || log.level?.toLowerCase() === 'info')
                        ? '#68b723'
                        : (log.action?.toLowerCase() === 'debug' || log.level?.toLowerCase() === 'debug')
                          ? '#8ab4f8'
                          : '#f0f0f0'
                }}
              >
                {log.action || log.level || 'INFO'}
              </Typography>
              
              <Typography 
                component="span" 
                sx={{ 
                  color: '#64baff',
                  mr: 1,
                  flexShrink: 0, 
                  whiteSpace: 'nowrap'
                }}
              >
                {log.logger || 'flight'}:
              </Typography>
              
              <Typography 
                component="span" 
                sx={{ 
                  color: '#f0f0f0',
                  flex: '1 1 100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0
                }}
              >
                {log.message}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}

export default TerminalLogs;
