import { useState, useEffect } from 'react';
import { Paper, Typography, Button, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, useTheme, List, ListItem, Tabs, Tab } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import { testApi, droneApi, Test, TestResult } from '../../services/api-service';

interface ControlPanelProps {
  disabled?: boolean;
}

function ControlPanel({ disabled = false }: ControlPanelProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    takeoff: false,
    land: false,
    tests: false,
    testRun: false
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    countDown: 5,
    testToRun: null as Test | null
  });

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    
    if (confirmDialog.open && confirmDialog.countDown > 0) {
      timer = window.setTimeout(() => {
        setConfirmDialog(prev => ({
          ...prev,
          countDown: prev.countDown - 1
        }));
      }, 1000);
    } else if (confirmDialog.open && confirmDialog.countDown === 0) {
      handleConfirmRunTest();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [confirmDialog]);

  const fetchTests = async () => {
    setLoading(prev => ({ ...prev, tests: true }));
    try {
      const testsData = await testApi.getTests();
      setTests(testsData);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(prev => ({ ...prev, tests: false }));
    }
  };

  const handleTakeoff = async () => {
    setLoading(prev => ({ ...prev, takeoff: true }));
    try {
      await droneApi.takeoff();
    } catch (error) {
      console.error('Error taking off:', error);
    } finally {
      setLoading(prev => ({ ...prev, takeoff: false }));
    }
  };

  const handleLand = async () => {
    setLoading(prev => ({ ...prev, land: true }));
    try {
      await droneApi.land();
    } catch (error) {
      console.error('Error landing:', error);
    } finally {
      setLoading(prev => ({ ...prev, land: false }));
    }
  };

  const selectTest = (test: Test) => {
    setSelectedTest(test);
    setTestResult(null);
  };

  const initiateRunTest = () => {
    if (!selectedTest) return;
    
    setConfirmDialog({
      open: true,
      countDown: 5,
      testToRun: selectedTest
    });
  };

  const handleConfirmRunTest = async () => {
    setConfirmDialog({ open: false, countDown: 5, testToRun: null });
    
    if (!selectedTest) return;
    
    setLoading(prev => ({ ...prev, testRun: true }));
    
    try {
      const result = await testApi.runTest(selectedTest.path);
      setTestResult(result);
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setLoading(prev => ({ ...prev, testRun: false }));
    }
  };

  const handleCancelTest = () => {
    setConfirmDialog({ open: false, countDown: 5, testToRun: null });
  };

  // Group tests by category
  const testsByCategory = tests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, Test[]>);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Paper sx={{ 
      height: '100%', 
      p: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            minHeight: '36px',
            '& .MuiTab-root': {
              minHeight: '36px',
              py: 0.5,
              fontSize: '0.8rem',
              fontWeight: 600,
            }
          }}
        >
          <Tab label="MANUAL CONTROL" />
          <Tab label="TEST EXECUTION" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Manual Control Tab */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          sx={{ 
            height: '100%',
            display: activeTab !== 0 ? 'none' : 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Simplified Manual Control - only Takeoff and Land buttons */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2, 
            alignItems: 'center',
            justifyContent: 'center', // Center buttons vertically
            height: '100%' // Use full height
          }}>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleTakeoff}
              disabled={loading.takeoff}
              startIcon={<FlightTakeoffIcon />}
              sx={{
                borderColor: theme.palette.success.main,
                color: theme.palette.success.main,
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  borderColor: theme.palette.success.main,
                },
                height: '48px',
                maxWidth: '300px',
              }}
            >
              {loading.takeoff ? <CircularProgress size={24} /> : 'Takeoff'}
            </Button>
            
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleLand}
              disabled={loading.land}
              startIcon={<FlightLandIcon />}
              sx={{
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  borderColor: theme.palette.error.main,
                },
                height: '48px',
                maxWidth: '300px',
              }}
            >
              {loading.land ? <CircularProgress size={24} /> : 'Land'}
            </Button>
          </Box>
        </Box>

        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          sx={{ 
            height: '100%',
            display: activeTab !== 1 ? 'none' : 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            height: '100%',
            overflow: 'hidden',
          }}>
            <Box sx={{ 
              width: '30%', 
              borderRight: '1px solid rgba(255, 255, 255, 0.1)', 
              overflow: 'auto',
              height: '100%',
            }}>
              {loading.tests ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <List dense disablePadding>
                  {Object.entries(testsByCategory).map(([category, categoryTests]) => (
                    <Box key={category} sx={{ mb: 0.5 }}>
                      <ListItem 
                        dense 
                        sx={{ 
                          py: 0.25, 
                          px: 1,
                          bgcolor: 'rgba(0, 0, 0, 0.2)', 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Typography variant="caption" sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          opacity: 0.7,
                        }}>
                          {category}
                        </Typography>
                      </ListItem>
                      
                      {categoryTests.map((test) => (
                        <ListItem 
                          key={test.path} 
                          button 
                          dense
                          selected={selectedTest?.path === test.path}
                          onClick={() => selectTest(test)}
                          sx={{ 
                            py: 0.25,
                            px: 1,
                            borderLeft: selectedTest?.path === test.path 
                              ? `2px solid ${theme.palette.secondary.main}` 
                              : '2px solid transparent',
                            '&.Mui-selected': {
                              bgcolor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            noWrap 
                            sx={{ 
                              fontSize: '0.7rem',
                              fontWeight: selectedTest?.path === test.path ? 500 : 400,
                              opacity: selectedTest?.path === test.path ? 1 : 0.7,
                            }}
                          >
                            {test.name}
                          </Typography>
                        </ListItem>
                      ))}
                    </Box>
                  ))}
                </List>
              )}
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {selectedTest ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  overflow: 'hidden',
                }}>
                  <Box sx={{ 
                    p: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedTest.name}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                      }}>
                        {selectedTest.description}
                      </Typography>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={initiateRunTest}
                      disabled={loading.testRun}
                      sx={{ 
                        minWidth: 'auto',
                        height: '26px',
                        px: 1,
                        ml: 1,
                        fontSize: '0.7rem',
                        borderColor: theme.palette.info.main,
                        color: theme.palette.info.main,
                      }}
                    >
                      {loading.testRun ? <CircularProgress size={12} /> : 'Run'}
                    </Button>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                    {testResult ? (
                      <Box 
                        sx={{ 
                          fontFamily: 'monospace',
                          backgroundColor: '#121212',
                          color: '#ABB2BF',
                          height: '100%',
                          overflow: 'auto',
                        }}
                      >
                        <Box sx={{ 
                          py: 0.5,
                          px: 1,
                          borderLeft: `3px solid ${testResult.success ? theme.palette.success.main : theme.palette.error.main}`,
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                        }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: testResult.success ? theme.palette.success.main : theme.palette.error.main,
                              fontWeight: 500,
                              fontSize: '0.65rem',
                            }}
                          >
                            {testResult.success ? 'TEST PASSED' : 'TEST FAILED'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 1 }}>
                          <pre 
                            style={{ 
                              margin: 0, 
                              whiteSpace: 'pre-wrap', 
                              wordBreak: 'break-all',
                              fontSize: '0.65rem',
                              lineHeight: 1.4,
                            }}
                          >
                            {JSON.stringify(testResult.result, null, 2)}
                          </pre>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                      }}>
                        <Typography variant="caption" sx={{ 
                          fontStyle: 'italic',
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                          userSelect: 'none',
                        }}>
                          Select "Run" to execute test
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: 'text.secondary',
                }}>
                  <Typography variant="caption">Select a test from the list</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelTest}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none',
            minWidth: '320px',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
          py: 1.5,
          px: 2
        }}>
          Execute Test
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText color="text.primary">
            Are you sure you want to run this test?
            <Box component="span" sx={{ 
              display: 'block', 
              mt: 1, 
              color: 'warning.main', 
              fontWeight: 500 
            }}>
              This will control the drone automatically.
            </Box>
          </DialogContentText>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            textAlign: 'center', 
            bgcolor: 'rgba(0, 0, 0, 0.2)' 
          }}>
            <Typography variant="h4">
              {confirmDialog.countDown}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          px: 2,
          py: 1.5, 
        }}>
          <Button onClick={handleCancelTest} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmRunTest} variant="contained">
            Run Now
          </Button>
        </DialogActions>
      </Dialog>
      
      {disabled && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all',
        }}>
          <Box sx={{ 
            p: 3, 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <Typography variant="subtitle1" sx={{ color: 'error.main' }}>SAFETY DISABLED</Typography>
            <Typography variant="body2">Enable safety switch to access controls</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default ControlPanel;
