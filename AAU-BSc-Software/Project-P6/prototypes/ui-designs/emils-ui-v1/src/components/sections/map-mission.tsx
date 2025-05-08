import { useState, useRef } from 'react';
import { 
  Box, Paper, Typography, Button, Slider, ButtonGroup, useTheme, Chip, Tooltip, 
  TextField, InputAdornment, CircularProgress, Popover, MenuItem, Select, FormControl,
  InputLabel, IconButton, Switch, FormControlLabel, Divider
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TerrainIcon from '@mui/icons-material/Terrain';
import RoomIcon from '@mui/icons-material/Room';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodingService } from '../../services/geocoding-service';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Position {
  lat: number;
  lng: number;
  elev?: number;
}

interface MapSectionProps {
  disabled?: boolean;
}

type MapTheme = 'satellite' | 'light' | 'dark' | 'streets' | 'topo';

const MAP_THEMES: Record<MapTheme, { url: string, name: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    name: 'Light'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: 'Dark'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Streets'
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    name: 'Topographic'
  }
};

// Waypoint color schemes
type ColorScheme = 'blue' | 'red' | 'green' | 'orange' | 'purple';

const COLOR_SCHEMES: Record<ColorScheme, { 
  boundary: string, 
  route: string, 
  name: string 
}> = {
  blue: {
    boundary: '#2196F3',
    route: '#1976D2',
    name: 'Blue'
  },
  red: {
    boundary: '#f44336',
    route: '#d32f2f',
    name: 'Red'
  },
  green: {
    boundary: '#4caf50',
    route: '#2e7d32',
    name: 'Green'
  },
  orange: {
    boundary: '#ff9800',
    route: '#e65100',
    name: 'Orange'
  },
  purple: {
    boundary: '#9c27b0',
    route: '#7b1fa2',
    name: 'Purple'
  }
};

function MapSection({ disabled = false }: MapSectionProps) {
  const theme = useTheme();
  const [waypoints, setWaypoints] = useState<Position[]>([]);
  const [route, setRoute] = useState<Position[]>([]);
  const [elevation, setElevation] = useState<number>(30);
  const [isPlacingWaypoint, setIsPlacingWaypoint] = useState(false);
  const [mapTheme, setMapTheme] = useState<MapTheme>('satellite');
  
  // Add new customization state
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue');
  const [showElevation, setShowElevation] = useState(true);
  const [routeThickness, setRouteThickness] = useState<number>(3);
  
  // Add search-related state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Position | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Settings popover state
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const settingsOpen = Boolean(settingsAnchorEl);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const calculateScanningRoute = (points: Position[], elev: number) => {
    if (points.length < 3) return [];
    
    const bounds = points.reduce((acc, point) => ({
      minLat: Math.min(acc.minLat, point.lat),
      maxLat: Math.max(acc.maxLat, point.lat),
      minLng: Math.min(acc.minLng, point.lng),
      maxLng: Math.max(acc.maxLng, point.lng),
    }), { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity });

    const coverage = (elev / 10) * 0.0001;
    const route: Position[] = [];
    let currentLat = bounds.minLat;
    let direction = 1;

    while (currentLat <= bounds.maxLat) {
      if (direction === 1) {
        route.push({ lat: currentLat, lng: bounds.minLng, elev });
        route.push({ lat: currentLat, lng: bounds.maxLng, elev });
      } else {
        route.push({ lat: currentLat, lng: bounds.maxLng, elev });
        route.push({ lat: currentLat, lng: bounds.minLng, elev });
      }
      
      currentLat += coverage;
      direction *= -1;
    }

    return route;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await geocodingService.search(searchQuery);
      if (result) {
        setSearchResult({ lat: result.lat, lng: result.lng });
        
        // Center the map on the search result
        if (mapRef.current) {
          mapRef.current.setView([result.lat, result.lng], 15);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  function MapController() {
    const map = useMap();
    mapRef.current = map;
    return null;
  }

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (isPlacingWaypoint) {
          setWaypoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
        }
      }
    });
    return null;
  }

  const handleFinalize = () => {
    if (waypoints.length >= 3) {
      const scanRoute = calculateScanningRoute(waypoints, elevation);
      setRoute(scanRoute);
      setIsPlacingWaypoint(false);
    }
  };

  const handleReset = () => {
    setWaypoints([]);
    setRoute([]);
    setIsPlacingWaypoint(false);
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

      <Box sx={{ 
        p: 0.5, 
        pb: 0.5, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>

        <Typography variant="subtitle2" sx={{ 
          fontWeight: 500, 
          letterSpacing: 0.5, 
          fontSize: '0.75rem',
          minWidth: 'max-content',
          mr: 0.5
        }}>
          MISSION
        </Typography>

        <ButtonGroup 
          size="small" 
          sx={{ 
            height: '28px',
            '& .MuiButton-root': { 
              px: 0.5, 
              py: 0, 
              height: '28px',
              fontSize: '0.65rem',
              minWidth: 'unset',
            } 
          }}
        >
          <Button 
            variant={isPlacingWaypoint ? "contained" : "outlined"}
            onClick={() => setIsPlacingWaypoint(!isPlacingWaypoint)}
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.23)',
              bgcolor: isPlacingWaypoint ? 'primary.main' : 'transparent',
              color: isPlacingWaypoint ? 'background.paper' : 'primary.main',
            }}
          >
            Place
          </Button>
          <Button 
            onClick={handleReset}
            sx={{ borderColor: 'rgba(255, 255, 255, 0.23)' }}
          >
            Reset
          </Button>
          <Button 
            onClick={handleFinalize}
            disabled={waypoints.length < 3}
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.23)',
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Final
          </Button>
        </ButtonGroup>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Search location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: isSearching ? (
                <InputAdornment position="end">
                  <CircularProgress size={14} />
                </InputAdornment>
              ) : null,
              sx: {
                fontSize: '0.7rem',
                py: 0,
                height: '28px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }
              }
            }}
            fullWidth
            disabled={disabled}
            sx={{
              '& .MuiInputBase-root': {
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                color: theme.palette.text.secondary,
                height: '28px',
              }
            }}
          />
        </Box>

        <ButtonGroup 
          size="small" 
          sx={{ 
            height: '28px',
            '& .MuiButton-root': { 
              px: 0.75, 
              py: 0,
              height: '28px',
              fontSize: '0.65rem',
            } 
          }}
        >
          <Tooltip title="Execute Mission (placeholder)">
            <Button
              variant="outlined"
              startIcon={<PlayCircleOutlineIcon sx={{ fontSize: '0.8rem' }} />}
              disabled
              sx={{
                borderColor: theme.palette.success.main,
                color: theme.palette.success.main,
                opacity: 0.8,
                borderWidth: '1px',
              }}
            >
              Exec
              <Chip
                label="DEMO"
                size="small"
                sx={{ 
                  ml: 0.25, 
                  height: 12, 
                  fontSize: '0.5rem',
                  bgcolor: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            </Button>
          </Tooltip>
          
          <Tooltip title="Abort Mission (placeholder)">
            <Button
              variant="outlined"
              startIcon={<CancelIcon sx={{ fontSize: '0.8rem' }} />}
              disabled
              sx={{
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                opacity: 0.8,
                borderWidth: '1px',
              }}
            >
              Abort
            </Button>
          </Tooltip>
        </ButtonGroup>

        <IconButton 
          size="small" 
          onClick={handleSettingsClick}
          sx={{ 
            border: '1px solid rgba(255, 255, 255, 0.23)',
            height: '28px',
            width: '28px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <SettingsIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>

        <Popover
          open={settingsOpen}
          anchorEl={settingsAnchorEl}
          onClose={handleSettingsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              p: 1.5,
              bgcolor: 'background.paper',
              width: 180,
              maxHeight: '200px', 
              height: 'auto',
              overflowY: 'auto',
              '& .MuiTypography-root': {
                fontSize: '0.75rem'
              }
            }
          }}

          marginThreshold={8}
        >
          <Typography variant="subtitle2" sx={{ 
            mb: 1, 
            fontWeight: 500,
            fontSize: '0.75rem', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            pb: 0.5
          }}>
            Map Settings
          </Typography>
          
          <Box sx={{ mb: 1 }}>
            <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
              <InputLabel id="map-theme-label" sx={{ fontSize: '0.7rem' }}>Theme</InputLabel>
              <Select
                labelId="map-theme-label"
                value={mapTheme}
                label="Theme"
                onChange={(e) => setMapTheme(e.target.value as MapTheme)}
                sx={{ 
                  fontSize: '0.7rem',
                  '& .MuiSelect-select': {
                    py: 0.5,
                  },
                  height: '32px'
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 200 }
                  }
                }}
              >
                {Object.entries(MAP_THEMES).map(([key, { name }]) => (
                  <MenuItem key={key} value={key} sx={{ fontSize: '0.7rem', minHeight: '30px' }}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                Elevation
              </Typography>
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem',
                bgcolor: 'rgba(0,0,0,0.1)',
                px: 0.5,
                borderRadius: 0.5,
                fontWeight: 500
              }}>
                {elevation}m
              </Typography>
            </Box>
            <Slider
              value={elevation}
              onChange={(_, value) => setElevation(value as number)}
              min={10}
              max={100}
              step={5}
              size="small"
              sx={{ 
                color: theme.palette.primary.main,
                height: 3,
                py: 0,
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '& .MuiSlider-thumb': {
                  height: 8,
                  width: 8,
                },
              }}
            />
          </Box>
        </Popover>
      </Box>
      
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <MapContainer 
          center={[55.3617, 10.4236]} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url={MAP_THEMES[mapTheme].url}
            attribution=''
          />
          <MapClickHandler />
          <MapController />
          <AttributionControl 
            position="bottomleft" 
            prefix={false}
          />
          {waypoints.map((waypoint, idx) => (
            <Marker key={`waypoint-${idx}`} position={[waypoint.lat, waypoint.lng]} />
          ))}
          {searchResult && (
            <Marker 
              position={[searchResult.lat, searchResult.lng]}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            />
          )}
          {waypoints.length > 2 && (
            <Polyline 
              positions={[...waypoints, waypoints[0]].map(p => [p.lat, p.lng])}
              color={COLOR_SCHEMES[colorScheme].boundary}
              weight={2}
            />
          )}
          {route.length > 0 && (
            <Polyline 
              positions={route.map(p => [p.lat, p.lng])} 
              color={COLOR_SCHEMES[colorScheme].route}
              weight={routeThickness}
              dashArray={showElevation ? "5,5" : ""}
            />
          )}
        </MapContainer>
      </Box>
      
      <Popover
        open={settingsOpen}
        anchorEl={settingsAnchorEl}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            p: 1.5,
            bgcolor: 'background.paper',
            width: 180,
            maxHeight: '300px',
            height: 'auto',
            overflowY: 'auto',
            '& .MuiTypography-root': {
              fontSize: '0.75rem'
            }
          }
        }}
        marginThreshold={8}
      >
        <Typography variant="subtitle2" sx={{ 
          mb: 1, 
          fontWeight: 500,
          fontSize: '0.75rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 0.5,
          display: 'flex',
          alignItems: 'center',
        }}>
          <SettingsIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
          Map Settings
        </Typography>
        
        <Box sx={{ mb: 1 }}>
          <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
            <InputLabel id="map-theme-label" sx={{ fontSize: '0.7rem' }}>Theme</InputLabel>
            <Select
              labelId="map-theme-label"
              value={mapTheme}
              label="Theme"
              onChange={(e) => setMapTheme(e.target.value as MapTheme)}
              sx={{ 
                fontSize: '0.7rem',
                '& .MuiSelect-select': {
                  py: 0.5,
                },
                height: '32px'
              }}
              MenuProps={{
                PaperProps: {
                  sx: { maxHeight: 200 }
                }
              }}
            >
              {Object.entries(MAP_THEMES).map(([key, { name }]) => (
                <MenuItem key={key} value={key} sx={{ fontSize: '0.7rem', minHeight: '30px' }}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ColorLensIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Route Colors
            </Typography>
          </Box>
          <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
            <Select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
              sx={{ 
                fontSize: '0.7rem',
                '& .MuiSelect-select': {
                  py: 0.5,
                },
                height: '32px'
              }}
              MenuProps={{
                PaperProps: {
                  sx: { maxHeight: 200 }
                }
              }}
            >
              {Object.entries(COLOR_SCHEMES).map(([key, { name }]) => (
                <MenuItem key={key} value={key} sx={{ 
                  fontSize: '0.7rem', 
                  minHeight: '30px',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: COLOR_SCHEMES[key as ColorScheme].boundary,
                      mr: 1
                    }}
                  />
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Divider sx={{ my: 1, opacity: 0.2 }} />
        
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>
              <RoomIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
              Route width
            </Typography>
            <Typography variant="caption" sx={{ 
              fontSize: '0.7rem',
              px: 0.5,
            }}>
              {routeThickness}px
            </Typography>
          </Box>
          <Slider
            value={routeThickness}
            onChange={(_, value) => setRouteThickness(value as number)}
            min={1}
            max={5}
            step={1}
            size="small"
            sx={{ 
              color: theme.palette.primary.main,
              height: 3,
              py: 0,
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              '& .MuiSlider-thumb': {
                height: 8,
                width: 8,
              },
            }}
          />
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ 
              fontSize: '0.7rem', 
              display: 'flex', 
              alignItems: 'center'
            }}>
              <TerrainIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
              Elevation
            </Typography>
            <Typography variant="caption" sx={{ 
              fontSize: '0.7rem',
              bgcolor: 'rgba(0,0,0,0.1)',
              px: 0.5,
              borderRadius: 0.5,
              fontWeight: 500
            }}>
              {elevation}m
            </Typography>
          </Box>
          <Slider
            value={elevation}
            onChange={(_, value) => setElevation(value as number)}
            min={10}
            max={100}
            step={5}
            size="small"
            sx={{ 
              color: theme.palette.primary.main,
              height: 3,
              py: 0,
              '& .MuiSlider-rail': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              '& .MuiSlider-thumb': {
                height: 8,
                width: 8,
              },
            }}
          />
        </Box>
        
        {/* Dashed line toggle */}
        <FormControlLabel
          control={
            <Switch 
              checked={showElevation}
              onChange={() => setShowElevation(!showElevation)}
              size="small"
              sx={{ 
                '& .MuiSwitch-thumb': { 
                  width: 12, 
                  height: 12 
                },
                '& .MuiSwitch-switchBase': {
                  p: 0.3,
                }
              }}
            />
          }
          label={
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Show dashed line
            </Typography>
          }
          sx={{ 
            m: 0, 
            '& .MuiFormControlLabel-label': { 
              ml: 1 
            } 
          }}
        />
      </Popover>
      
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
            <SecurityIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: 'error.main' }}>SAFETY DISABLED</Typography>
            <Typography variant="body2">Enable safety switch to access mission planning</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default MapSection;
