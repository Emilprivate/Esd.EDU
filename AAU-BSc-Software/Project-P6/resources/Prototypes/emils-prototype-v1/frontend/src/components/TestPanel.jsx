import React, { useState, useMemo } from 'react';
import TerminalWindow from './TerminalWindow';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import ConfirmationModal from './ConfirmationModal';

export default function TestPanel({
  tests,
  loading,
  selectedTest,
  setSelectedTest,
  runTest,
  testOutput,
  controlsEnabled // Add this prop
}) {
  // Remove local testsEnabled state since we're using the global one
  const [activeCategory, setActiveCategory] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState({});
  const [confirmingTest, setConfirmingTest] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [timerRef, setTimerRef] = useState(null);

  const togglePanel = (panelId) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  const initiateTest = () => {
    setConfirmingTest(true);
  };

  const startCountdown = () => {
    setConfirmingTest(false);
    setCountdownActive(true);
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCountdownActive(false);
          runTest(selectedTest);
          setTimerRef(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Store timer reference for cleanup
    setTimerRef(timer);
  };

  const cancelTest = () => {
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }
    setConfirmingTest(false);
    setCountdownActive(false);
    setCountdown(5);
  };

  // Group tests by category
  const categorizedTests = useMemo(() => {
    const grouped = {};
    tests.forEach(test => {
      if (!grouped[test.category]) {
        grouped[test.category] = [];
      }
      grouped[test.category].push(test);
    });
    
    // Set initial active category
    if (!activeCategory && Object.keys(grouped).length > 0) {
      setActiveCategory(Object.keys(grouped)[0]);
    }
    
    return grouped;
  }, [tests]);

  return (
    <>
      <div className="p-4 space-y-4 relative"> {/* Match DroneControls structure */}
        {/* Safety Disabled Overlay */}
        {!controlsEnabled && (
          <div className="disabled-panel">
            <div className="w-16 h-16 rounded-full bg-critical-500/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-critical-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Safety Lock Engaged</h3>
            <p className="text-gray-400 max-w-md text-center">
              Enable the safety lock in the header to access test controls.
            </p>
          </div>
        )}

        {/* Category Selection Dropdown */}
        <div className="panel-card">
          <select 
            className="w-full px-3 py-2 bg-base-800 text-white border border-base-600 rounded-lg focus:outline-none focus:border-data-500"
            value={activeCategory || ''}
            onChange={(e) => setActiveCategory(e.target.value)}
            disabled={!controlsEnabled}
          >
            <option value="" disabled>Select category</option>
            {Object.keys(categorizedTests).map(category => (
              <option key={category} value={category}>
                {category} ({categorizedTests[category].length})
              </option>
            ))}
          </select>
        </div>

        {/* Rest of the panel content */}
        <div className={`flex-1 p-4 space-y-4 ${!controlsEnabled ? 'overflow-hidden touch-none' : 'overflow-y-auto'}`}>
          {/* Test List Panel */}
          <div className="panel-card p-4">
            <div className="space-y-3">
              {tests.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M12 20h.01M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  <div>No tests available</div>
                </div>
              ) : (
                activeCategory && categorizedTests[activeCategory]?.map((test) => (
                  <div
                    key={test.id}
                    className={`p-3 rounded-md border-l-4 cursor-pointer transition-all ${
                      selectedTest?.id === test.id 
                        ? 'border-l-data-500 bg-data-500/10 border-base-600' 
                        : 'border-l-transparent hover:border-l-data-500/30 hover:bg-data-500/5 border-base-700'
                    }`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-white">{test.name}</div>
                      <div className="flex space-x-2 items-center">
                        {test.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-base-700 text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{test.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Test Panel - Updated Layout */}
          {selectedTest && (
            <div className="panel-card">
              <div className="flex items-center justify-between p-3 border-b border-base-600 bg-base-800">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-data-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-data-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{selectedTest.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{selectedTest.category}</span>
                      <span>•</span>
                      <div className="flex gap-1.5">
                        {selectedTest.tags?.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 rounded-md bg-base-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="p-2 hover:bg-base-700 rounded-lg transition-colors text-gray-400 hover:text-data-500 ml-4"
                  onClick={() => setIsTerminalOpen(true)}
                  title="Open Terminal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-3 space-y-3">
                {/* Description */}
                <div className="text-sm text-gray-400">{selectedTest.description}</div>

                {/* Mini Output Preview */}
                <div className="font-mono text-xs h-[80px] bg-base-900 text-data-400 p-2 rounded-md border border-base-700 overflow-y-auto whitespace-pre-wrap">
                  {testOutput || '> Ready to execute diagnostic test...'}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 pt-2">
                  {countdownActive ? (
                    <>
                      <span className="text-sm font-medium text-alert-500">Starting in {countdown}s...</span>
                      <button
                        className="px-3 py-1.5 bg-critical-500/10 text-critical-400 text-sm font-medium rounded-lg hover:bg-critical-500/20"
                        onClick={cancelTest}
                      >
                        Cancel
                      </button>
                    </>
                  ) : confirmingTest ? (
                    <>
                      <button
                        className="px-3 py-1.5 bg-base-700 text-sm font-medium rounded-lg hover:bg-base-600"
                        onClick={cancelTest}
                      >
                        Cancel
                      </button>
                      <button
                        className="confirm-button group"
                        onClick={startCountdown}
                        disabled={!controlsEnabled}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Execute Selected Test
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center text-xs text-critical-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Physical movement possible
                      </div>
                      <button
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                          loading 
                            ? 'bg-base-700 text-data-500 border border-data-500/20' 
                            : 'bg-control-500 text-base-900 hover:bg-control-400'
                        }`}
                        onClick={initiateTest}
                        disabled={loading || !controlsEnabled}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="loading-spinner w-3 h-3 border-2 border-data-500/20 border-t-data-500" />
                            Running...
                          </div>
                        ) : (
                          'Execute Test'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Terminal Window */}
          <TerminalWindow
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            title={`Terminal - ${selectedTest?.name || 'Test Output'}`}
            content={testOutput}
          />
        </div>
      </div>

      {/* Confirmation Modal - Now passing more props */}
      <ConfirmationModal
        isOpen={countdownActive || confirmingTest}
        testName={selectedTest?.name}
        testDescription={selectedTest?.description}
        countdown={countdown}
        onCancel={cancelTest}
        onConfirm={startCountdown}
        isCountdownActive={countdownActive}
      />
    </>
  );
}
