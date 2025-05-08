import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import StatusPanel from './StatusPanel';

export default function RightPanel() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  
  // API base URL
  const API_BASE_URL = 'http://localhost:5000';
  
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(API_BASE_URL);
    
    // Handle socket events
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsStreaming(false);
    });
    
    socketRef.current.on('video_frame', (data) => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        };
        img.src = `data:image/jpeg;base64,${data.frame}`;
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        stopStream();
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  const startStream = async () => {
    try {
      setIsLoading(true);
      setStreamError(null);
      
      socketRef.current.emit('start_stream', {}, (response) => {
        if (response.success) {
          setIsStreaming(true);
          console.log('Stream started successfully');
        } else {
          setStreamError('Failed to start stream');
          console.error('Failed to start stream');
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      setStreamError('Failed to start stream');
      setIsLoading(false);
    }
  };
  
  const stopStream = () => {
    if (socketRef.current) {
      socketRef.current.emit('stop_stream');
      setIsStreaming(false);
    }
  };

  return (
    <div className="right-panel">
      <div className="camera-feed">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Camera Feed</h2>
          <div className={`status-badge ${isStreaming ? 'bg-data-500/10 text-data-400' : 'bg-base-700/50 text-base-400'}`}>
            <span className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-data-500' : 'bg-base-500'}`} />
            {isStreaming ? 'Live' : 'Off'}
          </div>
        </div>
        
        <div className="h-[calc(100%-40px)] rounded-lg bg-base-800 border border-base-700 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
              <div className="text-gray-400 text-sm flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-control-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting stream...
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            width="640"
            height="480"
          />
          
          {!isStreaming && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4">
                {streamError ? (
                  <div className="text-critical-400 text-sm mb-3">{streamError}</div>
                ) : (
                  <div className="text-gray-400 text-sm mb-3">Camera feed not available</div>
                )}
                <button
                  className="px-4 py-2 bg-control-500 text-white text-sm rounded hover:bg-control-600 transition-colors"
                  onClick={startStream}
                  disabled={isLoading}
                >
                  Start Stream
                </button>
              </div>
            </div>
          )}
        </div>
        
        {isStreaming && (
          <div className="mt-2 flex justify-end">
            <button
              className="px-3 py-1 bg-base-700 hover:bg-base-600 text-white text-xs rounded transition-colors"
              onClick={stopStream}
            >
              Stop Stream
            </button>
          </div>
        )}
      </div>

      <div className="status-feed">
        <StatusPanel compact={true} />
      </div>
    </div>
  );
}
