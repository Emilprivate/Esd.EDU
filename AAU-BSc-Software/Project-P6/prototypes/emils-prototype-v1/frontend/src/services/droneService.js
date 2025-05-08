import axios from 'axios';

const API_URL = 'http://localhost:5000/drone';

export const droneService = {
    getStatus: async () => {
        // This would be implemented when you add the status endpoint
        // const response = await axios.get(`${API_URL}/status`);
        // return response.data;
        
        // For now, return mock data for the parts we haven't implemented yet
        return {
            flight: {
                state: 'hovering',
                batteryLevel: 78,
                signalStrength: 95,
                gps: { latitude: 57.014337, longitude: 9.987741, altitude: 50 },
                speed: { horizontal: 0, vertical: 0 },
                orientation: { roll: 0, pitch: 0, yaw: 90 }
            },
            system: {
                storage: {
                    total: 1024 * 1024 * 1024 * 32,
                    available: 1024 * 1024 * 1024 * 15
                },
                temperature: 42,
                uptime: 1000 * 60 * 15
            }
        };
    }
};
