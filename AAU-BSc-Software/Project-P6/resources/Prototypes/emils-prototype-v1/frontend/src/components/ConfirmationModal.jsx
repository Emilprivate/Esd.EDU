import React from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  testName, 
  testDescription,
  countdown, 
  onCancel,
  onConfirm,
  isCountdownActive
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-base-900/90 backdrop-blur-md">
      <div className="bg-base-800 border border-base-600 rounded-2xl p-10 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Warning Icon with Pulse Effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-critical-500/20 rounded-full animate-ping"></div>
            <div className="w-24 h-24 rounded-full bg-critical-500/10 flex items-center justify-center relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-critical-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white">
              {isCountdownActive ? 'Starting Test' : 'Confirm Test Execution'}
            </h2>
            <p className="text-xl text-gray-300 font-medium">{testName}</p>
            <p className="text-gray-400 max-w-md mx-auto">{testDescription}</p>
          </div>

          {isCountdownActive ? (
            <>
              {/* Countdown with Animation */}
              <div className="flex flex-col items-center space-y-4">
                <div className="text-6xl font-bold text-alert-500 tabular-nums">{countdown}</div>
                <p className="text-gray-400">Test will begin in {countdown} seconds</p>
              </div>

              {/* Warning Box - Updated Layout */}
              <div className="bg-critical-500/10 text-critical-400 p-6 rounded-xl text-sm max-w-md">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Safety Warning
                  </div>
                  <p className="text-center">
                    This test may cause physical drone movement. Please ensure the area is clear.
                  </p>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                className="px-8 py-3 bg-critical-500/10 text-critical-400 rounded-lg hover:bg-critical-500/20 transition-colors font-medium"
                onClick={onCancel}
              >
                Cancel Test
              </button>
            </>
          ) : (
            /* Confirmation Buttons */
            <div className="flex items-center gap-4">
              <button
                className="px-8 py-3 bg-base-700 text-white rounded-lg hover:bg-base-600 transition-colors font-medium"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="px-8 py-3 bg-control-500 text-base-900 rounded-lg hover:bg-control-400 transition-colors font-medium"
                onClick={onConfirm}
              >
                Start Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
