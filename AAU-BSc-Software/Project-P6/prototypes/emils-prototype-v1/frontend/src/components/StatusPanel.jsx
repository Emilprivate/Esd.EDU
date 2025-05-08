import React, { useState, useEffect } from 'react';
import { mediaService } from '../services/mediaService';

// Mock data - will be replaced with real API data later
const mockDroneStatus = {
  media: {
    indexingState: 'INDEXED',
    mediaCount: 24,
    lastMedia: {
      type: 'VIDEO',
      datetime: '2024-03-15T14:30:00Z',
      size: 1024 * 1024 * 150, // 150MB
      duration: 1000 * 60 * 2, // 2 minutes
      gps: { latitude: 57.014337, longitude: 9.987741, altitude: 50 }
    }
  },
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
      total: 1024 * 1024 * 1024 * 32, // 32GB
      available: 1024 * 1024 * 1024 * 15 // 15GB
    },
    temperature: 42,
    uptime: 1000 * 60 * 15 // 15 minutes
  }
};

export default function StatusPanel({ compact = false }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMediaData = async () => {
      try {
        setLoading(true);
        const response = await mediaService.getMediaInfo();
        if (response.success) {
          const mediaInfo = Array.isArray(response.data) ? response.data[0] : response.data;
          setMediaData({
            indexingState: 'INDEXED',
            mediaCount: Array.isArray(response.data) ? response.data.length : (mediaInfo ? 1 : 0),
            lastMedia: mediaInfo ? {
              type: mediaInfo.type,
              datetime: mediaInfo.datetime,
              size: mediaInfo.size,
              duration: mediaInfo.duration,
            } : null
          });
        } else {
          // Use fallback data when no media is available
          setMediaData({
            indexingState: 'INDEXED',
            mediaCount: 0,
            lastMedia: null
          });
        }
      } catch (err) {
        console.error('Error fetching media data:', err);
        setError(err.message);
        // Use fallback data on error
        setMediaData({
          indexingState: 'ERROR',
          mediaCount: 0,
          lastMedia: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMediaData();
    const interval = setInterval(fetchMediaData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  // Replace mockDroneStatus with actual data
  const data = {
    media: mediaData,
    flight: {
      // This would come from another endpoint
      state: 'hovering',
      batteryLevel: 78,
      signalStrength: 95,
      gps: { latitude: 57.014337, longitude: 9.987741, altitude: 50 },
      speed: { horizontal: 0, vertical: 0 },
      orientation: { roll: 0, pitch: 0, yaw: 90 }
    },
    system: {
      // This would come from another endpoint
      storage: {
        total: 1024 * 1024 * 1024 * 32,
        available: 1024 * 1024 * 1024 * 15
      },
      temperature: 42,
      uptime: 1000 * 60 * 15
    }
  };

  if (compact) {
    return (
      <div className="p-4 space-y-3">
        {/* Compact Flight Status */}
        <div className="panel-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`status-badge ${
                data.flight.state === 'hovering' 
                  ? 'bg-control-500/10 text-control-400' 
                  : 'bg-data-500/10 text-data-400'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  data.flight.state === 'hovering' ? 'bg-control-500' : 'bg-data-500'
                }`} />
                {data.flight.state.charAt(0).toUpperCase() + data.flight.state.slice(1)}
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-control-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-white">{data.flight.batteryLevel}%</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-data-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 7h-2v2h2V7z" />
                  <path fillRule="evenodd" d="M7 2a5 5 0 00-5 5v6a5 5 0 005 5h6a5 5 0 005-5V7a5 5 0 00-5-5H7zm1 3a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5z" clipRule="evenodd" />
                </svg>
                <span className="text-white">{data.flight.signalStrength}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact GPS & Orientation */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="panel-card p-3">
            <div className="text-gray-400 mb-1">Position</div>
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Lat:</span>
                <span className="text-white">{data.flight.gps.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lon:</span>
                <span className="text-white">{data.flight.gps.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Alt:</span>
                <span className="text-white">{data.flight.gps.altitude}m</span>
              </div>
            </div>
          </div>
          <div className="panel-card p-3">
            <div className="text-gray-400 mb-1">Orientation</div>
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Roll:</span>
                <span className="text-white">{data.flight.orientation.roll}°</span>
              </div>
              <div className="flex justify-between">
                <span>Pitch:</span>
                <span className="text-white">{data.flight.orientation.pitch}°</span>
              </div>
              <div className="flex justify-between">
                <span>Yaw:</span>
                <span className="text-white">{data.flight.orientation.yaw}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact System Status */}
        <div className="panel-card p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Storage:</span>
                <span className="text-white">{formatBytes(data.system.storage.available)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Temp:</span>
                <span className="text-white">{data.system.temperature}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Media:</span>
                <span className="text-white">{data.media.mediaCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime:</span>
                <span className="text-white">{formatDuration(data.system.uptime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Section Tabs */}
      <div className="flex gap-2">
        {['overview', 'media', 'flight', 'system'].map(section => (
          <button
            key={section}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeSection === section
                ? 'bg-data-500 text-base-900'
                : 'text-gray-400 hover:text-white hover:bg-base-600'
            }`}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Flight Status */}
        <div className="panel-card p-4 col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-white">Flight Status</h3>
              <div className={`status-badge mt-1 inline-flex ${
                data.flight.state === 'hovering' 
                  ? 'bg-control-500/10 text-control-400' 
                  : 'bg-data-500/10 text-data-400'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  data.flight.state === 'hovering' ? 'bg-control-500' : 'bg-data-500'
                }`} />
                {data.flight.state.charAt(0).toUpperCase() + data.flight.state.slice(1)}
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <div className="text-gray-400">Battery</div>
                <div className="text-white font-medium">{data.flight.batteryLevel}%</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400">Signal</div>
                <div className="text-white font-medium">{data.flight.signalStrength}%</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-base-800 rounded-lg p-3">
              <div className="text-gray-400 mb-1">GPS Position</div>
              <div className="space-y-1">
                <div>Lat: {data.flight.gps.latitude.toFixed(6)}</div>
                <div>Lon: {data.flight.gps.longitude.toFixed(6)}</div>
                <div>Alt: {data.flight.gps.altitude}m</div>
              </div>
            </div>
            <div className="bg-base-800 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Speed</div>
              <div className="space-y-1">
                <div>Horizontal: {data.flight.speed.horizontal} m/s</div>
                <div>Vertical: {data.flight.speed.vertical} m/s</div>
              </div>
            </div>
            <div className="bg-base-800 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Orientation</div>
              <div className="space-y-1">
                <div>Roll: {data.flight.orientation.roll}°</div>
                <div>Pitch: {data.flight.orientation.pitch}°</div>
                <div>Yaw: {data.flight.orientation.yaw}°</div>
              </div>
            </div>
          </div>
        </div>

        {/* Media Status */}
        <div className="panel-card p-4">
          <h3 className="font-medium text-white mb-3">Media</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Indexing State</span>
              <span className="text-white">{data.media.indexingState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Media Count</span>
              <span className="text-white">{data.media.mediaCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Media Size</span>
              <span className="text-white">{formatBytes(data.media.lastMedia.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Media Duration</span>
              <span className="text-white">{formatDuration(data.media.lastMedia.duration)}</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="panel-card p-4">
          <h3 className="font-medium text-white mb-3">System</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Storage Available</span>
              <span className="text-white">
                {formatBytes(data.system.storage.available)} / {formatBytes(data.system.storage.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Temperature</span>
              <span className="text-white">{data.system.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime</span>
              <span className="text-white">{formatDuration(data.system.uptime)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
