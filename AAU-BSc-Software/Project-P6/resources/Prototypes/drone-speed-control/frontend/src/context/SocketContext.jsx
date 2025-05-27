import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    setSocket(socketInstance);

    const onConnect = () => {
      console.log('Socket connected!');
      setConnected(true);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected!');
      setConnected(false);
    };

    const onError = (error) => {
      console.error('Socket error:', error);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('error', onError);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('error', onError);
      socketInstance.disconnect();
    };
  }, []);

  const emitEvent = useCallback(
    (event, data) => {
      return new Promise((resolve, reject) => {
        if (!socket || !connected) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit(event, data, (response) => {
          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [socket, connected]
  );

  const calculateGrid = useCallback(
    async (data) => {
      try {
        return await emitEvent('calculate_grid', data);
      } catch (error) {
        console.error('Error calculating grid:', error.message);
        throw error;
      }
    },
    [emitEvent]
  );

  const executeFlight = useCallback(
    async (data) => {
      try {
        return await emitEvent('execute_flight', data);
      } catch (error) {
        console.error('Error executing flight:', error.message);
        throw error;
      }
    },
    [emitEvent]
  );

  const connectDrone = useCallback(
    async () => {
      try {
        return await emitEvent('connect_drone', {});
      } catch (error) {
        console.error('Error connecting to drone:', error.message);
        throw error;
      }
    },
    [emitEvent]
  );

  const disconnectDrone = useCallback(
    async () => {
      try {
        return await emitEvent('disconnect_drone', {});
      } catch (error) {
        console.error('Error disconnecting from drone:', error.message);
        throw error;
      }
    },
    [emitEvent]
  );

  const contextValue = {
    socket,
    connected,
    emitEvent,
    calculateGrid,
    executeFlight,
    connectDrone,
    disconnectDrone,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
