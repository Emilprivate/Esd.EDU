import React, { useState, useRef, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Slider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Stepper, 
  Step, 
  StepLabel, 
  LinearProgress, 
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { useSocket } from '../context/SocketContext';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FlightPlannerProps, GridData, FlightStep } from '../types/flight.types';

const FlightPlanner: React.FC<FlightPlannerProps> = ({ mapRef, polygon, onClearAll }) => {
  const { connected, droneConnected, gps, calculateGrid, executeFlight } = useSocket();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [altitude, setAltitude] = useState<number>(20);
  const [overlap, setOverlap] = useState<number>(20);
  const [coverage, setCoverage] = useState<number>(80);
  const [flightMode, setFlightMode] = useState<string>('stable');
  const [startPoint, setStartPoint] = useState<number[] | null>(null);
  const [droneStartPoint, setDroneStartPoint] = useState<number[] | null>(null);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [flightStep, setFlightStep] = useState<FlightStep>('idle');
  const [error, setError] = useState<string | null>(null);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('flightPlannerState');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.altitude) setAltitude(parsedData.altitude);
        if (parsedData.overlap) setOverlap(parsedData.overlap);
        if (parsedData.coverage) setCoverage(parsedData.coverage);
        if (parsedData.flightMode) setFlightMode(parsedData.flightMode);
        if (parsedData.activeStep) setActiveStep(parsedData.activeStep);
        if (parsedData.gridData) setGridData(parsedData.gridData);
        
        console.log('Loaded saved flight planner state:', parsedData);
      } catch (e) {
        console.error('Error loading saved flight planner state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever relevant parts change
  useEffect(() => {
    const stateToSave = {
      altitude,
      overlap,
      coverage,
      flightMode,
      activeStep,
      gridData
    };
    localStorage.setItem('flightPlannerState', JSON.stringify(stateToSave));
  }, [altitude, overlap, coverage, flightMode, activeStep, gridData]);

  // Function to calculate grid coverage
  const handleCalculateGrid = async () => {
    if (!polygon || polygon.length < 3) {
      setError('Please draw a valid area first (minimum 3 points).');
      return;
    }
    
    let actualDroneStartPoint = gps && 
      typeof gps.latitude === 'number' && 
      typeof gps.longitude === 'number' ? 
      [gps.latitude, gps.longitude] as [number, number] : 
      null;
    
    if (!actualDroneStartPoint) {
      setError('Could not determine drone\'s starting position. Please ensure GPS is valid.');
      return;
    }
    
    setDroneStartPoint(actualDroneStartPoint);
    setLoading(true);
    setError(null);
    
    try {
      // Create the payload exactly matching what's known to work
      const payload = {
        coordinates: polygon,
        altitude: altitude,  // NOTE: Using raw values, not converted with Number()
        overlap: overlap,    // Let the backend do type conversion
        coverage: coverage,
        drone_start_point: { 
          lat: actualDroneStartPoint[0], 
          lon: actualDroneStartPoint[1] 
        }
      };
      
      // Debug the payload
      console.log('Raw payload:', JSON.stringify(payload));
      
      // Send the exact payload to calculateGrid
      const response = await calculateGrid(payload);
      
      setGridData(response);
      setActiveStep(2); // Move to next step
      
      // Save the grid data to localStorage
      localStorage.setItem('savedGridData', JSON.stringify(response));
      localStorage.setItem('savedPolygon', JSON.stringify(polygon));
    } catch (error) {
      setError(`Error generating grid layout: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to execute flight
  const handleExecuteFlight = async () => {
    if (!gridData || !gridData.waypoints || gridData.waypoints.length < 1) {
      setError('Please calculate grid coverage first');
      return;
    }
    
    if (!confirm(`Are you sure you want to execute this flight plan in ${flightMode.toUpperCase()} mode? The drone will take off and follow the planned path.`)) {
      return;
    }
    
    setFlightStep('in_progress');
    setError(null);
    
    try {
      const payload = {
        waypoints: gridData.waypoints,
        altitude: altitude,
        start_point: gridData.start_point,
        drone_start_point: gridData.drone_start_point,
        flight_mode: flightMode
      };
      
      console.log('Executing flight with payload:', JSON.stringify(payload));
      
      await executeFlight(payload);
      // The flightStep will be set to "complete" when the "complete" log arrives
    } catch (error) {
      setFlightStep('idle');
      setError(`Flight execution error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Function to clear everything and start over
  const handleClearAll = () => {
    setStartPoint(null);
    setDroneStartPoint(null);
    setGridData(null);
    setActiveStep(0);
    setFlightStep('idle');
    setError(null);
    
    // Clear saved data
    localStorage.removeItem('savedGridData');
    localStorage.removeItem('savedPolygon');
    
    // Call the parent's onClearAll function
    if (onClearAll) {
      onClearAll();
    }
  };

  // Handle flight mode change
  const handleFlightModeChange = (event: SelectChangeEvent) => {
    setFlightMode(event.target.value);
  };

  // Format time helper function
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        border: '1px solid rgba(0,0,0,0.08)',
        bgcolor: 'background.paper' 
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight={500}>
        Flight Planner
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        <Step>
          <StepLabel>Draw Area</StepLabel>
        </Step>
        <Step>
          <StepLabel>Configure</StepLabel>
        </Step>
        <Step>
          <StepLabel>Execute</StepLabel>
        </Step>
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {flightStep === 'in_progress' ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h6" gutterBottom>Flight in Progress</Typography>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            The drone is executing the flight plan
          </Typography>
        </Box>
      ) : flightStep === 'complete' ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h6" gutterBottom color="success.main">
            Flight Complete
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={handleClearAll}
            sx={{ mt: 1 }}
          >
            Start New Flight
          </Button>
        </Box>
      ) : (
        <>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Flight Parameters
            </Typography>
            
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <Box sx={{ width: '48%', mb: 1 }}>
                <TextField
                  label="Altitude (m)"
                  type="number"
                  value={altitude}
                  onChange={(e) => setAltitude(Number(e.target.value))}
                  InputProps={{ 
                    inputProps: { min: 1, max: 40 },
                    onBlur: (e) => {
                      const val = Number(e.target.value);
                      if (isNaN(val)) setAltitude(20);
                      else setAltitude(Math.max(1, Math.min(40, val)));
                    }
                  }}
                  size="small"
                  fullWidth
                />
              </Box>
              <Box sx={{ width: '48%', mb: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Flight Mode</InputLabel>
                  <Select
                    value={flightMode}
                    label="Flight Mode"
                    onChange={handleFlightModeChange}
                  >
                    <MenuItem value="stable">Stable</MenuItem>
                    <MenuItem value="rapid">Rapid</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <Typography variant="body2" gutterBottom>
              Photo Overlap: {overlap}%
            </Typography>
            <Slider
              value={typeof overlap === 'number' ? overlap : 20}
              onChange={(_, newValue) => setOverlap(newValue as number)}
              min={0}
              max={90}
              step={5}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" gutterBottom>
              Minimum Coverage: {coverage}%
            </Typography>
            <Slider
              value={typeof coverage === 'number' ? coverage : 80}
              onChange={(_, newValue) => setCoverage(newValue as number)}
              min={0}
              max={90}
              step={5}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              onClick={handleCalculateGrid}
              disabled={loading || !polygon || polygon.length < 3}
              fullWidth
            >
              {loading ? "Calculating..." : "Calculate Grid Coverage"}
            </Button>
          </Box>
          
          {gridData && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Flight Plan Summary
              </Typography>
              
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Box sx={{ width: '48%', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Grids
                  </Typography>
                  <Typography variant="body1">
                    {gridData.grid_count}
                  </Typography>
                </Box>
                <Box sx={{ width: '48%', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Altitude
                  </Typography>
                  <Typography variant="body1">
                    {altitude} meters
                  </Typography>
                </Box>
                <Box sx={{ width: '48%', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Path Distance
                  </Typography>
                  <Typography variant="body1">
                    {(gridData.path_metrics.total_distance / 1000).toFixed(2)} km
                  </Typography>
                </Box>
                <Box sx={{ width: '48%', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Est. Flight Time
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(gridData.path_metrics.estimated_flight_time)}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<FlightTakeoffIcon />}
                onClick={handleExecuteFlight}
                disabled={flightStep !== 'idle'}
                fullWidth
                sx={{ mb: 1 }}
              >
                Execute Flight Plan ({flightMode.toUpperCase()})
              </Button>
            </Box>
          )}
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearAll}
            disabled={flightStep !== 'idle'}
            fullWidth
            sx={{ mt: 2 }}
          >
            Clear All & Start Over
          </Button>
        </>
      )}
    </Paper>
  );
};

export default FlightPlanner;
