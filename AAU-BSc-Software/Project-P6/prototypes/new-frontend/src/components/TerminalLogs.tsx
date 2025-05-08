import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { TerminalLogsProps } from '../types/components.types';

const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs }) => {
  return (
    <Box sx={{ height: '100%', bgcolor: '#1e1e1e', color: '#fff', fontFamily: 'monospace', overflow: 'auto', p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#aaa' }}>Terminal Logs</Typography>
      
      {logs.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#888', fontStyle: 'italic' }}>
          No logs to display
        </Typography>
      ) : (
        logs.map((log, index) => (
          <Box key={index} sx={{ mb: 0.5, fontSize: '0.85rem' }}>
            <Box component="span" sx={{ color: '#aaa', mr: 1 }}>
              [{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]
            </Box>
            <Box 
              component="span" 
              sx={{ 
                color: log.action === 'error' || log.level === 'error' ? '#f44336' : 
                       log.action === 'complete' ? '#4caf50' : 
                       '#2196f3',
                mr: 1
              }}
            >
              {log.action || log.level || 'INFO'}:
            </Box>
            <Box component="span">
              {log.message || JSON.stringify(log)}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
};

export default TerminalLogs;
