import { io } from 'socket.io-client';

class ApiClient {
  constructor() {
    // Connect to the backend, use either:
    // - relative path for development with proxy
    // - full URL for production deployments
    const SOCKET_URL = import.meta.env.PROD 
      ? import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
      : '';
      
    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
    
    this.eventHandlers = {};
    
    // Debug socket connection
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket.id);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  // Connection management
  onConnect(callback) {
    this.socket.on('connect', callback);
  }

  onDisconnect(callback) {
    this.socket.on('disconnect', callback);
  }

  // Register event handlers
  on(event, callback) {
    this.socket.on(event, (data) => {
      console.log(`Received ${event} event:`, data);
      callback(data);
    });
    
    // Store reference to unregister later if needed
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  // Unregister specific event handler
  off(event, callback) {
    this.socket.off(event, callback);
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        handler => handler !== callback
      );
    }
  }

  // Drone control methods
  getDroneStatus(callback) {
    this.socket.emit('get_drone_status', {}, callback);
  }

  connectDrone(callback) {
    this.socket.emit('connect_drone', {}, callback);
  }

  establishGpsFix(callback) {
    this.socket.emit('establish_gps_fix', {}, callback);
  }

  disconnectDrone(callback) {
    this.socket.emit('disconnect_drone', {}, callback);
  }

  getPosition(callback) {
    this.socket.emit('get_position', {}, callback);
  }
  
  // Grid planning and flight execution
  calculateGrid(data, callback) {
    this.socket.emit('calculate_grid', data, callback);
  }

  executeFlight(data, callback) {
    this.socket.emit('execute_flight', data, callback);
  }

  // Cleanup resources
  disconnect() {
    // Unregister all handlers
    Object.entries(this.eventHandlers).forEach(([event, handlers]) => {
      handlers.forEach(handler => {
        this.socket.off(event, handler);
      });
    });
    this.eventHandlers = {};
    
    // Disconnect socket
    this.socket.disconnect();
  }
}

// Create singleton instance
const apiClient = new ApiClient();
export default apiClient;
