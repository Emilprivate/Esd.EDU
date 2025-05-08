import React from 'react';

export default function Header({ connected = false, controlsEnabled, onToggleControls }) {
  return (
    <header className="app-header flex items-center justify-between h-full px-6 bg-base-800 border-b border-base-600 shadow-md">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-control-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l9 2-9-18-9 18 9-2z"></path>
          </svg>
          <div>
            <h1 className="text-xl font-bold text-white">P6.scan</h1>
            <p className="text-xs text-gray-400">Self-Controlled Aerial Navigation</p>
          </div>
        </div>

        <div className="h-8 w-px bg-base-600 mx-2"></div>

        <div className={`status-badge ${
          connected 
            ? 'bg-control-500/10 text-control-400' 
            : 'bg-critical-500/10 text-critical-400'
        }`}>
          <span className={`h-2 w-2 rounded-full ${
            connected 
              ? 'bg-control-500 animate-pulse' 
              : 'bg-critical-500'
          }`}></span>
          {connected ? 'System Online' : 'System Offline'}
        </div>
      </div>

      {/* Right section - Safety Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-white">Safety Lock</div>
            <div className="text-xs text-gray-400">Controls & Test Execution</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={controlsEnabled}
              onChange={onToggleControls}
            />
            <div className={`safety-switch ${controlsEnabled ? 'enabled' : ''}`}></div>
          </label>
        </div>
      </div>
    </header>
  );
}
