import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import L from "leaflet";
import "leaflet-draw";
import DroneTracker from "./DroneTracker";
import { Box, Button, Paper, Typography, Select, MenuItem, FormControl, CircularProgress } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MapIcon from '@mui/icons-material/Map';

// Fix for marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const MAP_THEMES = {
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  },
  streets: {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

const vertexIcon = new L.DivIcon({
  html: '<div style="width: 10px; height: 10px; background-color: white; border: 2px solid #444; border-radius: 50%;"></div>',
  className: "leaflet-div-icon-vertex",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const waypointIcon = L.divIcon({
  html: '<div style="width: 8px; height: 8px; background-color: #0066ff; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>',
  className: "waypoint-icon",
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const startPointIcon = L.divIcon({
  html: '<div style="background-color: #4CAF50; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
  className: "start-point-icon",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const droneStartIcon = L.divIcon({
  html: '<div style="background-color: #ff9800; width: 16px; height: 16px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
  className: "drone-start-icon",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const droneIcon = new L.Icon({
  iconUrl: "/drone.svg", // Use the SVG from public folder
  iconSize: [24, 24], // Make it small
  iconAnchor: [12, 12],
});

const MapComponent = forwardRef(
  (
    {
      onPolygonCreated,
      onStartPointSet,
      onStepComplete,
      gridData,
      polygon,
      startPoint,
      droneStartPoint, // NEW: always from GPS
      currentStep,
      droneGps,
      connected,
      droneConnected,
      gps,
      gpsSignal,
      flightStep,
      droneTrailResetKey, // Add prop for resetting drone trail
      photoMap = {}, // Add photoMap prop with default
    },
    ref
  ) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const gridsLayerRef = useRef(null);
    const polygonLayerRef = useRef(null);
    const pathLayerRef = useRef(null);
    const waypointsLayerRef = useRef(null);
    const tempMarkersRef = useRef([]);
    const tempPolylinesRef = useRef([]);
    const startPointRef = useRef(null);
    const tileLayerRef = useRef(null);

    const isDrawingRef = useRef(false);
    const isEditingRef = useRef(false);

    // Keep React state for component rendering
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [mapTheme, setMapTheme] = useState("satellite"); // Default to satellite theme
    const mapClickHandlerRef = useRef(null);

    // Add state to expose map instance to children
    const [mapInstance, setMapInstance] = useState(null);
    const [showSetStartPoint, setShowSetStartPoint] = useState(false);
    const [pendingStartPoint, setPendingStartPoint] = useState(null);

    // Add React states to control button disabled state directly
    const [confirmButtonDisabled, setConfirmButtonDisabled] = useState(true);
    const [drawButtonDisabled, setDrawButtonDisabled] = useState(false);

    // Define hasValidGps before it's used in useEffect
    const hasValidGps = gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number" &&
      !(gps.latitude === 0 && gps.longitude === 0) &&
      !gpsSignal;

    useImperativeHandle(ref, () => ({
      fitBounds: (bounds) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds);
        }
      },
      clearAll: (options = {}) => {
        if (mapInstanceRef.current) {
          // Options can include preserveDrone: true to keep the drone marker
          const { preserveDrone = false } = options;
          
          // Remove all drawn layers
          if (polygonLayerRef.current) {
            mapInstanceRef.current.removeLayer(polygonLayerRef.current);
            polygonLayerRef.current = null;
          }
          
          // Clear all grid and path layers, but not the drone marker
          if (gridsLayerRef.current) gridsLayerRef.current.clearLayers();
          if (pathLayerRef.current) pathLayerRef.current.clearLayers();
          if (waypointsLayerRef.current) waypointsLayerRef.current.clearLayers();
          
          if (startPointRef.current) {
            mapInstanceRef.current.removeLayer(startPointRef.current);
            startPointRef.current = null;
          }
          
          // Remove temp markers/lines
          tempMarkersRef.current.forEach((marker) =>
            mapInstanceRef.current.removeLayer(marker)
          );
          tempPolylinesRef.current.forEach((line) =>
            mapInstanceRef.current.removeLayer(line)
          );
          tempMarkersRef.current = [];
          tempPolylinesRef.current = [];
        }
      },
    }));

    // Track if map has centered on drone
    const hasCenteredOnDroneRef = useRef(false);

    // Change map tile layer based on selected theme
    const updateMapTheme = (theme) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const selectedTheme = MAP_THEMES[theme];
      tileLayerRef.current = L.tileLayer(selectedTheme.url, {
        attribution: selectedTheme.attribution,
        maxZoom: selectedTheme.maxZoom,
      }).addTo(map);
    };

    useEffect(() => {
      if (!mapContainerRef.current) return;

      console.log("Initializing map...");
      const map = L.map(mapContainerRef.current).setView(
        [57.013722, 9.974037],
        15
      );

      // Save map reference immediately
      mapInstanceRef.current = map;
      setMapInstance(map); // Update state with map instance

      // Set up initial map layer (satellite by default)
      updateMapTheme("satellite");

      // Initialize layers
      const gridsLayer = L.featureGroup().addTo(map);
      const pathLayer = L.featureGroup().addTo(map);
      const waypointsLayer = L.featureGroup().addTo(map);

      gridsLayerRef.current = gridsLayer;
      pathLayerRef.current = pathLayer;
      waypointsLayerRef.current = waypointsLayer;

      // Define the click handler function
      const handleMapClick = (e) => {
        console.log("Map clicked", isDrawingRef.current); // Use ref, not state
        if (!isDrawingRef.current) return;

        console.log("Adding marker at", e.latlng);
        const marker = L.marker(e.latlng, {
          icon: vertexIcon,
          draggable: true,
        }).addTo(map);

        // Store reference to the marker
        tempMarkersRef.current.push(marker);

        // Update lines when marker is dragged
        marker.on("drag", () => updateLines(map));
        marker.on("dragend", () => updateLines(map));

        updateLines(map);
      };

      map.on("click", handleMapClick); // Add the click handler immediately

      // Clean up function
      return () => {
        console.log("Cleaning up map...");

        // Remove event listeners
        if (mapClickHandlerRef.current) {
          map.off("click", mapClickHandlerRef.current);
        }

        map.remove();
      };
    }, []);

    // Modify the main map click handler
    useEffect(() => {
      if (!mapInstanceRef.current) return;

      const handleMapClick = (e) => {
        if (currentStep === "draw-area" && isDrawingRef.current) {
          // Drawing mode for area
          const marker = L.marker(e.latlng, {
            icon: vertexIcon,
            draggable: true,
          }).addTo(mapInstanceRef.current);

          marker.on("drag", () => updateLines(mapInstanceRef.current));
          marker.on("dragend", () => updateLines(mapInstanceRef.current));

          tempMarkersRef.current.push(marker);
          updateLines(mapInstanceRef.current);
        } else if (currentStep === "set-start") {
          // Set start point mode
          const { lat, lng } = e.latlng;

          if (startPointRef.current) {
            mapInstanceRef.current.removeLayer(startPointRef.current);
          }

          startPointRef.current = L.marker([lat, lng], {
            icon: startPointIcon,
          })
            .addTo(mapInstanceRef.current)
            .bindTooltip("Start/End Point");

          onStartPointSet([lat, lng]);

          // Automatically proceed to the next step after setting the start point
          onStepComplete();
        }
      };

      // Store the handler in the ref so we can remove it in cleanup
      mapClickHandlerRef.current = handleMapClick;
      mapInstanceRef.current.on("click", handleMapClick);

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off("click", handleMapClick);
        }
      };
    }, [currentStep, onStartPointSet, onStepComplete]);

    const startDrawing = (map) => {
      if (currentStep !== "draw-area") return;

      console.log("Starting drawing mode");
      setIsDrawing(true);
      isDrawingRef.current = true;
      setIsEditing(false);
      isEditingRef.current = false;

      // Update button states with React state
      setDrawButtonDisabled(true);
      setConfirmButtonDisabled(true);

      // Change cursor
      map.getContainer().classList.add("crosshair-cursor");

      // Clear existing drawings
      clearDrawingData(map);
    };

    const confirmDrawing = (map) => {
      if (currentStep === "draw-area") {
        if (tempMarkersRef.current.length < 3) return;

        console.log("Confirming area drawing");
        setIsDrawing(false);
        isDrawingRef.current = false;

        const positions = tempMarkersRef.current.map((marker) => {
          const pos = marker.getLatLng();
          return [pos.lat, pos.lng];
        });

        onPolygonCreated(positions);
        clearTempLayers(map);

        // Update button states
        setDrawButtonDisabled(false);
        setConfirmButtonDisabled(true);

        map.getContainer().classList.remove("crosshair-cursor");

        onStepComplete();
      } else if (currentStep === "set-start") {
        if (!startPointRef.current) return;

        console.log("Confirming start point");
        onStepComplete();
      }
    };

    const clearDrawing = (map) => {
      console.log("Clearing drawing");
      setIsDrawing(false);
      isDrawingRef.current = false; // Update ref
      setIsEditing(false);
      isEditingRef.current = false; // Update ref

      // Update button states
      setDrawButtonDisabled(false);
      setConfirmButtonDisabled(true);

      // Reset cursor
      map.getContainer().classList.remove("crosshair-cursor");

      // Clear all layers and data
      clearDrawingData(map);

      // Remove click handler
      if (mapClickHandlerRef.current) {
        map.off("click", mapClickHandlerRef.current);
      }
    };

    const updateLines = (map) => {
      // Clear existing lines
      tempPolylinesRef.current.forEach((line) => map.removeLayer(line));
      tempPolylinesRef.current = [];

      // Draw lines between points
      if (tempMarkersRef.current.length > 1) {
        for (let i = 0; i < tempMarkersRef.current.length; i++) {
          const marker1 = tempMarkersRef.current[i];
          const marker2 =
            tempMarkersRef.current[(i + 1) % tempMarkersRef.current.length];

          const line = L.polyline([marker1.getLatLng(), marker2.getLatLng()], {
            color: "green",
            weight: 2,
          }).addTo(map);

          tempPolylinesRef.current.push(line);
        }
      }

      // Update confirm button state based on marker count
      setConfirmButtonDisabled(tempMarkersRef.current.length < 3);
    };

    const clearTempLayers = (map) => {
      // Remove temporary markers and lines
      tempMarkersRef.current.forEach((marker) => map.removeLayer(marker));
      tempPolylinesRef.current.forEach((line) => map.removeLayer(line));

      tempMarkersRef.current = [];
      tempPolylinesRef.current = [];
    };

    const clearDrawingData = (map) => {
      // Clear temporary markers and lines
      clearTempLayers(map);

      // Clear polygon
      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }

      // Clear grids and path
      if (gridsLayerRef.current) {
        gridsLayerRef.current.clearLayers();
      }

      if (pathLayerRef.current) {
        pathLayerRef.current.clearLayers();
      }

      if (waypointsLayerRef.current) {
        waypointsLayerRef.current.clearLayers();
      }

      if (startPointRef.current) {
        map.removeLayer(startPointRef.current);
        startPointRef.current = null;
      }

      // Clear parent data
      onPolygonCreated([]);
    };

    // Handle polygon updates from props
    useEffect(() => {
      if (!mapInstanceRef.current || !polygon) return;

      // Don't recreate polygon if in edit mode
      if (isEditingRef.current) return; // Use ref, not state

      console.log("Updating polygon from props", polygon);

      // Remove existing polygon
      if (polygonLayerRef.current) {
        mapInstanceRef.current.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }

      // Create new polygon if we have enough points
      if (polygon.length >= 3) {
        polygonLayerRef.current = L.polygon(polygon, {
          color: "green",
          fillOpacity: 0.2,
        }).addTo(mapInstanceRef.current);

        // Fit map to the polygon
        mapInstanceRef.current.fitBounds(polygonLayerRef.current.getBounds());
      }
    }, [polygon]);

    // Handle grid data updates
    useEffect(() => {
      if (!mapInstanceRef.current || !gridData) return;

      console.log("Updating grid data", gridData);

      // Clear previous layers
      gridsLayerRef.current.clearLayers();
      pathLayerRef.current.clearLayers();
      waypointsLayerRef.current.clearLayers();

      // Draw grid polygons if present
      if (gridData.grids && gridData.grids.length > 0) {
        // Create grid rectangles
        const gridBounds = [];

        gridData.grids.forEach((grid, index) => {
          // Extract corner coordinates
          const corners = grid.corners.map((corner) => [
            corner.lat,
            corner.lon,
          ]);
          // If a photo exists for this grid index, overlay the photo as an ImageOverlay
          if (photoMap && photoMap[index] && photoMap[index].photo_base64) {
            const detected = !!photoMap[index].detected;
            const borderColor = detected ? "#4caf50" : "#f44336";
            // Compute bounds for the grid (SW and NE corners)
            // Find min/max lat/lon
            const lats = corners.map((c) => c[0]);
            const lons = corners.map((c) => c[1]);
            const southWest = [Math.min(...lats), Math.min(...lons)];
            const northEast = [Math.max(...lats), Math.max(...lons)];
            const bounds = [southWest, northEast];

            // Create a div for border overlay
            // We'll use a custom pane to ensure the border is above the image
            if (!mapInstanceRef.current.getPane("photoBorderPane")) {
              mapInstanceRef.current.createPane("photoBorderPane");
              mapInstanceRef.current.getPane(
                "photoBorderPane"
              ).style.zIndex = 650;
            }

            // Add the image overlay
            const imgOverlay = L.imageOverlay(
              `data:image/jpeg;base64,${photoMap[index].photo_base64}`,
              bounds,
              {
                opacity: 1,
                interactive: true,
              }
            ).addTo(gridsLayerRef.current);

            // Add a rectangle border overlay on top of the image
            const borderRect = L.rectangle(bounds, {
              color: borderColor,
              weight: 2,
              fill: false,
              pane: "photoBorderPane",
            }).addTo(gridsLayerRef.current);

            // Add popup to the border rectangle (so clicking border or image works)
            borderRect.bindPopup(
              `<div style="text-align:center">
                <div style="font-size:13px;font-weight:500;margin-bottom:2px;">
                  Photo for Grid #${index + 1}
                </div>
                <img src="data:image/jpeg;base64,${
                  photoMap[index].photo_base64
                }" style="width:100%;max-width:800px;object-fit:cover;border-radius:4px;" />
                <div style="font-size:11px;color:#555;margin-top:4px;">
                  Detected: ${detected ? "Yes" : "No"}
                </div>
                <div style="font-size:11px;color:#555;">${
                  photoMap[index].filename
                }</div>
              </div>`,
              { maxWidth: 800 }
            );
            imgOverlay.bindPopup(borderRect.getPopup());

            // Store bounds for later (simulate a grid area for fitBounds)
            gridBounds.push(L.latLngBounds(bounds));
          } else {
            // Create a polygon for the grid
            const gridPolygon = L.polygon(corners, {
              color: "blue",
              weight: 1,
              fillColor: "#3388ff",
              fillOpacity: 0.2,
              className: `grid-${index}`,
            }).addTo(gridsLayerRef.current);
            gridPolygon.bindTooltip(`Grid #${index + 1}`);
            gridBounds.push(gridPolygon.getBounds());
          }
        });

        // Draw the path using startPoint and waypoints
        if (gridData.waypoints && gridData.waypoints.length > 0) {
          // Use both startPoint and droneStartPoint if present
          let pathPoints = [];
          
          // Helper function to normalize coordinate formats
          const normalizeCoord = (coord) => {
            if (Array.isArray(coord)) {
              return [coord[0], coord[1]];
            } else if (coord && typeof coord === 'object') {
              if ('lat' in coord && 'lon' in coord) {
                return [coord.lat, coord.lon];
              } else if ('lat' in coord && 'lng' in coord) {
                return [coord.lat, coord.lng];
              } else if ('latitude' in coord && 'longitude' in coord) {
                return [coord.latitude, coord.longitude];
              }
            }
            return null;
          };

          // Add drone start point if available
          if (droneStartPoint) {
            const normalized = normalizeCoord(droneStartPoint);
            if (normalized) {
              pathPoints.push(normalized);
            }
          }

          // Add custom start point if available and different from drone start
          if (startPoint) {
            const normalizedStart = normalizeCoord(startPoint);
            const normalizedDroneStart = normalizeCoord(droneStartPoint);
            
            if (normalizedStart) {
              // Only add if different from drone start point
              if (!normalizedDroneStart || 
                  normalizedStart[0] !== normalizedDroneStart[0] || 
                  normalizedStart[1] !== normalizedDroneStart[1]) {
                pathPoints.push(normalizedStart);
              }
            }
          }

          // Add waypoints
          gridData.waypoints.forEach(wp => {
            const normalized = normalizeCoord(wp);
            if (normalized) {
              pathPoints.push(normalized);
            } else {
              // Fallback direct extraction
              pathPoints.push([wp.lat, wp.lon]);
            }
          });

          // Return to drone start point
          if (droneStartPoint) {
            const normalized = normalizeCoord(droneStartPoint);
            if (normalized) {
              pathPoints.push(normalized);
            }
          }

          // Add waypoint markers
          gridData.waypoints.forEach((waypoint, idx) => {
            const marker = L.marker([waypoint.lat, waypoint.lon], {
              icon: waypointIcon,
            }).addTo(waypointsLayerRef.current);

            marker.bindTooltip(`Waypoint #${idx + 1}`);
          });

          // Add path polyline
          const pathLine = L.polyline(pathPoints, {
            color: "yellow",
            weight: 3,
            opacity: 0.7,
            dashArray: "10, 5",
            lineJoin: "round",
          }).addTo(pathLayerRef.current);

          // Add start marker (search start)
          if (startPoint) {
            const normalized = normalizeCoord(startPoint);
            if (normalized) {
              L.marker(normalized, { icon: startPointIcon })
                .bindTooltip("Search Start Point")
                .addTo(pathLayerRef.current);
            }
          }

          // Add drone start/end marker
          if (droneStartPoint) {
            const normalized = normalizeCoord(droneStartPoint);
            if (normalized) {
              L.marker(normalized, { icon: droneStartIcon })
                .bindTooltip("Drone Start/End Point")
                .addTo(pathLayerRef.current);
            }
          }
        }

        // Create a bounds object that includes all grids
        if (gridBounds.length > 0) {
          const allBounds = L.latLngBounds(gridBounds[0]);
          gridBounds.forEach((bounds) => {
            allBounds.extend(bounds);
          });
          mapInstanceRef.current.fitBounds(allBounds);
        }
      }
    }, [gridData, startPoint, droneStartPoint, photoMap]);

    // Update button states based on current step
    useEffect(() => {
      if (currentStep === "draw-area") {
        setConfirmButtonDisabled(tempMarkersRef.current.length < 3);
        setDrawButtonDisabled(isDrawingRef.current);
      } else if (currentStep === "set-start") {
        setConfirmButtonDisabled(startPointRef.current === null && pendingStartPoint === null);
        setDrawButtonDisabled(true);
      } else {
        setConfirmButtonDisabled(true);
        setDrawButtonDisabled(true);
      }
    }, [
      currentStep,
      tempMarkersRef.current.length,
      isDrawingRef.current,
      startPointRef.current,
      pendingStartPoint
    ]);

    // Update button states based on GPS validity
    useEffect(() => {
      setDrawButtonDisabled(
        !hasValidGps || isDrawingRef.current || !connected || !droneConnected
      );
    }, [hasValidGps, isDrawingRef.current, connected, droneConnected]);

    // --- Add effect to show set-start step after area is confirmed ---
    useEffect(() => {
      if (currentStep === "set-start") {
        setShowSetStartPoint(true);
        setPendingStartPoint(null);
        // Remove any previous marker
        if (startPointRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(startPointRef.current);
          startPointRef.current = null;
        }
      } else {
        setShowSetStartPoint(false);
        setPendingStartPoint(null);
      }
    }, [currentStep]);

    // --- Handle map click for set-start step ---
    useEffect(() => {
      if (!mapInstanceRef.current) return;

      const handleSetStartClick = (e) => {
        if (currentStep !== "set-start") return;
        const { lat, lng } = e.latlng;
        setPendingStartPoint([lat, lng]);
        // Remove previous marker
        if (startPointRef.current) {
          mapInstanceRef.current.removeLayer(startPointRef.current);
        }
        // Add/move marker
        startPointRef.current = L.marker([lat, lng], {
          icon: startPointIcon,
        })
          .addTo(mapInstanceRef.current)
          .bindTooltip("Custom Start Point");
      };

      if (currentStep === "set-start") {
        mapInstanceRef.current.on("click", handleSetStartClick);
      }
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.off("click", handleSetStartClick);
        }
      };
    }, [currentStep]);

    // --- Confirm start point handler ---
    const handleConfirmStartPoint = () => {
      if (pendingStartPoint) {
        onStartPointSet(pendingStartPoint);
      } else {
        onStartPointSet(null); // User skipped setting a start point
      }
      setShowSetStartPoint(false);
      setPendingStartPoint(null);
      // Remove marker after confirm
      if (startPointRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(startPointRef.current);
        startPointRef.current = null;
      }
      onStepComplete();
    };

    // Center and zoom on drone when GPS becomes valid
    useEffect(() => {
      if (
        mapInstanceRef.current &&
        gps &&
        typeof gps.latitude === "number" &&
        typeof gps.longitude === "number" &&
        !(gps.latitude === 0 && gps.longitude === 0) &&
        !gpsSignal &&
        !hasCenteredOnDroneRef.current
      ) {
        mapInstanceRef.current.setView([gps.latitude, gps.longitude], 18, {
          animate: true,
        });
        hasCenteredOnDroneRef.current = true;
      }
      // Reset if GPS becomes invalid again
      if (
        (!gps || 
         (gps.latitude === 0 && gps.longitude === 0) || 
         gpsSignal) &&
        hasCenteredOnDroneRef.current
      ) {
        hasCenteredOnDroneRef.current = false;
      }
    }, [gps, gpsSignal]);

    return (
      <Box
        className="map-wrapper"
        sx={{ position: "relative", width: "100%", height: "100%" }}
      >
        {/* Blur overlay if not connected */}
        {(!connected || !droneConnected) && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2000,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={48} color="primary" />
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 500 }}>
                {!connected
                  ? "Waiting for server connection"
                  : "Waiting for drone connection"}
              </Typography>
            </Box>
          </Box>
        )}
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
            filter:
              !connected || !droneConnected
                ? "blur(4px) grayscale(0.7)"
                : "none",
            pointerEvents: !connected || !droneConnected ? "none" : "auto",
            transition: "filter 0.2s",
          }}
        />
        {mapInstance && (
          <DroneTracker map={mapInstance} resetKey={droneTrailResetKey} />
        )}
        
        {/* Custom Map Controls */}
        <Box 
          id="custom-map-controls" 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 1000, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1
          }}
        >
          {currentStep === "draw-area" && (
            <Paper sx={{ p: 0.5, boxShadow: 2 }}>
              <Button
                id="start-drawing-btn"
                variant={isDrawing ? "contained" : "outlined"}
                color="primary"
                onClick={() => startDrawing(mapInstanceRef.current)}
                disabled={drawButtonDisabled}
                startIcon={<EditIcon />}
                size="small"
                sx={{ 
                  width: '100%', // Make button fill the full width of container
                  minWidth: '100px',
                  justifyContent: 'flex-start' // Align content to the left
                }}
              >
                Draw
              </Button>
            </Paper>
          )}
          
          {(isDrawing || currentStep === "set-start") && (
            <Paper sx={{ p: 0.5, boxShadow: 2 }}>
              <Button
                id="confirm-drawing-btn"
                variant="contained"
                color="success"
                onClick={() => confirmDrawing(mapInstanceRef.current)}
                disabled={confirmButtonDisabled}
                startIcon={<CheckCircleIcon />}
                size="small"
                sx={{ 
                  width: '100%', // Make button fill the full width of container
                  minWidth: '100px',
                  justifyContent: 'flex-start' // Align content to the left
                }}
              >
                Confirm
              </Button>
            </Paper>
          )}
          
          <Paper sx={{ p: 0.5, boxShadow: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ width: '100%', minWidth: 120 }}>
              <Select
                id="map-theme-selector"
                value={mapTheme}
                onChange={(e) => {
                  setMapTheme(e.target.value);
                  updateMapTheme(e.target.value);
                }}
                displayEmpty
                sx={{ height: 32 }}
                startAdornment={<MapIcon sx={{ mr: 0.5, ml: -0.5, fontSize: 20 }} />}
              >
                <MenuItem value="satellite">Satellite</MenuItem>
                <MenuItem value="streets">Streets</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Box>
        
        {/* Conditionally render instructions based on currentStep AND flightStep */}
        {flightStep === "idle" && (currentStep === "draw-area" || currentStep === "set-start" || currentStep === "complete") && (
          <Paper 
            elevation={2} 
            sx={{ 
              position: 'absolute', 
              top: 10, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              px: 3, 
              py: 1, 
              zIndex: 1000, 
              borderRadius: 2 
            }}
          >
            <Typography variant="body1">
              {currentStep === "draw-area" && !isDrawing && !hasValidGps && "Waiting for drone GPS..."}
              {currentStep === "draw-area" && !isDrawing && hasValidGps && 'Click the "Draw" button to start drawing the area.'}
              {currentStep === "draw-area" && isDrawing && "Click on the map to draw the area. Minimum 3 points required."}
              {currentStep === "set-start" && "Click on the map to set a custom start point, or confirm to skip."}
              {currentStep === "complete" && "Adjust altitude and overlap settings, then calculate grid coverage."}
            </Typography>
          </Paper>
        )}
        
        {/* Set Start Point UI - replace with MUI components */}
        {showSetStartPoint && (
          <Paper 
            elevation={3}
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1200,
              p: 3,
              minWidth: 260,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Set Custom Start Point (Optional)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Click on the map to place the start point.
              <br />
              Or just click Confirm to skip.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmStartPoint}
              sx={{ minWidth: 120 }}
            >
              Confirm
            </Button>
          </Paper>
        )}
      </Box>
    );
  }
);

export default MapComponent;
