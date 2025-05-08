import React from 'react';

export default function DroneControls({
  executeDroneCommand,
  moveDrone,
  droneStatus,
  controlsEnabled // Add this prop
}) {
  // Remove local controlsEnabled state since we're using the global one
  const isDisabled = droneStatus === 'busy' || droneStatus === 'testing' || !controlsEnabled;

  return (
    <div className="p-4 space-y-4 relative">
      {/* Safety Disabled Overlay */}
      {!controlsEnabled && (
        <div className="disabled-panel">
          <div className="w-16 h-16 rounded-full bg-critical-500/20 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-critical-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Controls Locked</h3>
          <p className="text-gray-400 max-w-md text-center">
            Enable the safety lock in the header to access drone controls.
          </p>
        </div>
      )}

      {/* Basic Controls */}
      <div className="panel-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Basic Controls</h2>
            <p className="text-sm text-gray-400">Takeoff and Landing</p>
          </div>
          <div className={`status-badge ${
            droneStatus === 'idle' ? 'bg-control-500/10 text-control-400' :
            droneStatus === 'busy' ? 'bg-alert-500/10 text-alert-400' :
            'bg-critical-500/10 text-critical-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              droneStatus === 'idle' ? 'bg-control-500' :
              droneStatus === 'busy' ? 'bg-alert-500' :
              'bg-critical-500'
            }`}></span>
            <span className="capitalize">{droneStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            className="control-button"
            onClick={() => executeDroneCommand('basic/takeoff')}
            disabled={isDisabled}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
              </svg>
              Takeoff
            </div>
          </button>
          
          <button 
            className="critical-button"
            onClick={() => executeDroneCommand('basic/land')}
            disabled={isDisabled}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
              </svg>
              Land
            </div>
          </button>
        </div>
      </div>

      {/* Movement Controls */}
      <div className="panel-card p-4">
        <h3 className="font-semibold text-white mb-4">Movement Controls</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            className="control-button"
            onClick={() => moveDrone({ x: 1, y: 0, z: 0, angle: 0 })}
            disabled={isDisabled}
          >
            Forward (1m)
          </button>
          <button
            className="control-button"
            onClick={() => moveDrone({ x: -1, y: 0, z: 0, angle: 0 })}
            disabled={isDisabled}
          >
            Backward (1m)
          </button>
          <button
            className="control-button"
            onClick={() => moveDrone({ x: 0, y: -1, z: 0, angle: 0 })}
            disabled={isDisabled}
          >
            Left (1m)
          </button>
          <button
            className="control-button"
            onClick={() => moveDrone({ x: 0, y: 1, z: 0, angle: 0 })}
            disabled={isDisabled}
          >
            Right (1m)
          </button>
        </div>
      </div>

      {/* Sequence Controls */}
      <div className="panel-card p-4">
        <h3 className="font-semibold text-white mb-4">Flight Sequences</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            className="data-button"
            onClick={() => executeDroneCommand('sequence/test-flight')}
            disabled={isDisabled}
          >
            Test Flight
          </button>
          <button
            className="data-button"
            onClick={() => executeDroneCommand('sequence/square-flight')}
            disabled={isDisabled}
          >
            Square Pattern
          </button>
        </div>
      </div>
    </div>
  );
}