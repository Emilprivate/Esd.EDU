import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Function to read the config file
function getConfig() {
  try {
    const configPath = path.resolve(__dirname, '../config.json');
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  } catch (error) {
    console.error('Error reading config file:', error);
    return { apiUrl: 'http://localhost:5000/api' }; // Default fallback
  }
}

const config = getConfig();
const apiUrl = new URL(config.apiUrl);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `${apiUrl.protocol}//${apiUrl.hostname}:${apiUrl.port}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Allow importing the config from anywhere in the app
      '../../config.json': path.resolve(__dirname, '../config.json')
    }
  }
});
