import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DroneControls from './components/DroneControls'
import TestPanel from './components/TestPanel'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Map from './components/Map'
import StatusPanel from './components/StatusPanel'
import RightPanel from './components/RightPanel';
import { api, endpoints } from './services/api';

// API base URL 
const API_BASE_URL = 'http://localhost:5000';

export default function App() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  const [testOutput, setTestOutput] = useState('')
  const [droneStatus, setDroneStatus] = useState('idle')
  const [activeTab, setActiveTab] = useState('controls')
  const [apiConnected, setApiConnected] = useState(false)
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  // Check API connection and fetch tests
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          setApiConnected(true);
          fetchTests();
        } else {
          setApiConnected(false);
          toast.error('Backend API server is not responding correctly');
        }
      } catch (error) {
        console.error('Error connecting to API:', error);
        setApiConnected(false);
        toast.error('Cannot connect to backend API server');
      }
    };
    
    checkApiConnection();
    const interval = setInterval(checkApiConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.tests.list);
      if (response.data) {
        setTests(response.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to generate tags based on test properties
  const getTestTags = (test) => {
    const tags = [];
    if (test.name.toLowerCase().includes('calibration')) tags.push('Calibration');
    if (test.name.toLowerCase().includes('sensor')) tags.push('Sensor');
    if (test.category.toLowerCase().includes('drone')) tags.push('Flight');
    if (test.name.toLowerCase().includes('connection')) tags.push('Network');
    return tags.length ? tags : ['General'];
  };

  const runTest = async (test) => {
    if (!test) return
    
    try {
      setLoading(true)
      setTestOutput('Running test...\n')
      setDroneStatus('testing')
      
      const response = await fetch(`${API_BASE_URL}/api/tests/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_module: test.module_path })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTestOutput(prev => prev + 'Test completed.\n\nOutput:\n' + data.stdout)
        toast.success('Test completed successfully')
      } else {
        setTestOutput(prev => prev + 'Test failed.\n\nErrors:\n' + data.stderr)
        toast.error('Test failed')
      }
    } catch (error) {
      console.error('Error running test:', error)
      setTestOutput(prev => prev + `Error: ${error.message}`)
      toast.error('Failed to run test')
    } finally {
      setLoading(false)
      setDroneStatus('idle')
    }
  }

  const executeDroneCommand = async (command) => {
    try {
      setDroneStatus('busy')
      
      const response = await fetch(`${API_BASE_URL}/api/drone/${command}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Command executed successfully`)
      } else {
        toast.error(`Command failed: ${data.message}`)
      }
    } catch (error) {
      console.error(`Error executing command: ${command}`, error)
      toast.error(`Command failed: ${error.message}`)
    } finally {
      setDroneStatus('idle')
    }
  }
  
  const moveDrone = async (moveParams) => {
    try {
      setDroneStatus('busy')
      
      const response = await fetch(`${API_BASE_URL}/api/drone/basic/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveParams)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Move command executed successfully')
      } else {
        toast.error(`Move failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Error moving drone:', error)
      toast.error(`Move failed: ${error.message}`)
    } finally {
      setDroneStatus('idle')
    }
  }

  return (
    <>
      <div className="app-container">
        <Header 
          connected={apiConnected} 
          controlsEnabled={controlsEnabled}
          onToggleControls={() => setControlsEnabled(!controlsEnabled)}
        />
        
        {/* Left Panel - Add conditional overflow */}
        <div className={`left-panel ${
          !controlsEnabled && activeTab !== 'controls' ? 'overflow-hidden' : 'overflow-y-auto'
        }`}>
          <div className="flex border-b border-base-600">
            <button 
              className={`py-3 px-6 font-medium transition-colors ${
                activeTab === 'controls' 
                  ? 'text-control-500 border-b-2 border-control-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('controls')}
            >
              Controls
            </button>
            <button 
              className={`py-3 px-6 font-medium transition-colors ${
                activeTab === 'tests' 
                  ? 'text-control-500 border-b-2 border-control-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('tests')}
            >
              Tests
            </button>
          </div>
          
          {!apiConnected ? (
            <div className="p-5">
              <div className="panel-card p-6">
                <div className="flex flex-col items-center">
                  <div className="text-critical-500 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-critical-400 mb-2">API Not Connected</h3>
                  <p className="text-gray-400 text-sm text-center">
                    Please ensure the backend server is running
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'controls' ? (
            <DroneControls 
              executeDroneCommand={executeDroneCommand} 
              moveDrone={moveDrone}
              droneStatus={droneStatus}
              controlsEnabled={controlsEnabled}
            />
          ) : (
            <TestPanel 
              tests={tests}
              loading={loading}
              selectedTest={selectedTest}
              setSelectedTest={setSelectedTest}
              runTest={runTest}
              testOutput={testOutput}
              controlsEnabled={controlsEnabled}
            />
          )}
        </div>
        
        {/* Map */}
        <div className="content">
          <Map />
        </div>

        {/* Right Panel */}
        <RightPanel />
      </div>
      
      <ToastContainer 
        position="bottom-right" 
        theme="dark" 
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        className="text-sm"
      />

      {/* Portal container for modals and overlays */}
      <div id="modal-root"></div>
    </>
  );
}
