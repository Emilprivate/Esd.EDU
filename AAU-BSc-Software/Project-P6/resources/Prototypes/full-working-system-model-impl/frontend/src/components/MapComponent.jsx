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

    useImperativeHandle(ref, () => ({
      fitBounds: (bounds) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds);
        }
      },
      clearAll: () => {
        if (mapInstanceRef.current) {
          // Remove all drawn layers
          if (polygonLayerRef.current) {
            mapInstanceRef.current.removeLayer(polygonLayerRef.current);
            polygonLayerRef.current = null;
          }
          if (gridsLayerRef.current) gridsLayerRef.current.clearLayers();
          if (pathLayerRef.current) pathLayerRef.current.clearLayers();
          if (waypointsLayerRef.current)
            waypointsLayerRef.current.clearLayers();
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

        // Enable confirm button if we have at least 3 points
        const confirmBtn = document.getElementById("confirm-drawing-btn");
        if (confirmBtn && tempMarkersRef.current.length >= 3) {
          confirmBtn.disabled = false;
        }

        updateLines(map);
      };

      map.on("click", handleMapClick); // Add the click handler immediately

      // Create custom control panel
      const drawingControls = L.control({ position: "topright" });

      drawingControls.onAdd = function () {
        const container = L.DomUtil.create("div", "custom-control-container");
        container.innerHTML = `
          <div class="custom-control-panel">
            <button id="start-drawing-btn" class="control-btn" title="Start Drawing">✏️ Draw</button>
            <button id="confirm-drawing-btn" class="control-btn" title="Confirm Drawing" disabled>✅ Confirm</button>
          </div>
        `;

        // Prevent map click events when interacting with controls
        L.DomEvent.disableClickPropagation(container);

        return container;
      };

      drawingControls.addTo(map);

      // Create map theme selector control
      const themeControl = L.control({ position: "topleft" });

      themeControl.onAdd = function () {
        const container = L.DomUtil.create("div", "map-theme-control");
        container.innerHTML = `
          <select id="map-theme-selector" class="map-theme-select">
            <option value="satellite" selected>Satellite</option>
            <option value="streets">Streets</option>
            <option value="terrain">Terrain</option>
          </select>
        `;

        L.DomEvent.disableClickPropagation(container);

        // Add event listener for theme changes
        setTimeout(() => {
          document
            .getElementById("map-theme-selector")
            .addEventListener("change", (e) => {
              const newTheme = e.target.value;
              setMapTheme(newTheme);
              updateMapTheme(newTheme);
            });
        }, 0);

        return container;
      };

      themeControl.addTo(map);

      // Add event listeners to buttons
      document
        .getElementById("start-drawing-btn")
        .addEventListener("click", () => {
          startDrawing(map);
        });

      document
        .getElementById("confirm-drawing-btn")
        .addEventListener("click", () => {
          confirmDrawing(map);
        });

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

          // Enable confirm button if we have at least 3 points
          const confirmBtn = document.getElementById("confirm-drawing-btn");
          if (confirmBtn && tempMarkersRef.current.length >= 3) {
            confirmBtn.disabled = false;
          }
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

      // Update UI
      document
        .getElementById("start-drawing-btn")
        .classList.add("control-active");
      document.getElementById("start-drawing-btn").disabled = true;
      document.getElementById("confirm-drawing-btn").disabled = true;

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

        document
          .getElementById("start-drawing-btn")
          .classList.remove("control-active");
        document.getElementById("start-drawing-btn").disabled = false;
        document.getElementById("confirm-drawing-btn").disabled = true;
        map.getContainer().classList.remove("crosshair-cursor");

        onStepComplete();
      } else if (currentStep === "set-start") {
        // FIXED: Make this work for the set-start step
        if (!startPointRef.current) return;

        console.log("Confirming start point");

        // Signal step completion and move to next step
        onStepComplete();
      }
    };

    const clearDrawing = (map) => {
      console.log("Clearing drawing");
      setIsDrawing(false);
      isDrawingRef.current = false; // Update ref
      setIsEditing(false);
      isEditingRef.current = false; // Update ref

      // Update UI
      document
        .getElementById("start-drawing-btn")
        .classList.remove("control-active");
      document.getElementById("start-drawing-btn").disabled = false;
      document.getElementById("confirm-drawing-btn").disabled = true;

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

      // Enable confirm button if we have at least 3 points
      const confirmBtn = document.getElementById("confirm-drawing-btn");
      if (confirmBtn && tempMarkersRef.current.length >= 3) {
        confirmBtn.disabled = false;
      }
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

        // Enable edit button
        const editBtn = document.getElementById("edit-drawing-btn");
        if (editBtn) editBtn.disabled = false;
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
          // If a photo exists for this grid index, replace the grid with the photo
          if (photoMap && photoMap[index] && photoMap[index].photo_base64) {
            const center = [grid.center.lat, grid.center.lon];
            const imgHtml = `<img src="data:image/jpeg;base64,${photoMap[index].photo_base64}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />`;
            // Create a custom DivIcon with the photo as the grid
            const photoIcon = L.divIcon({
              html: `<div style="width:64px;height:48px;overflow:hidden;border:2px solid #4caf50;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.15);background:#fff;">${imgHtml}</div>`,
              className: "photo-grid-icon",
              iconSize: [64, 48],
              iconAnchor: [32, 24],
            });
            // Place a marker at the grid center with the photo
            const photoMarker = L.marker(center, {
              icon: photoIcon,
              zIndexOffset: 1000,
            })
              .addTo(gridsLayerRef.current)
              .bindPopup(
                `<div style="text-align:center;">
                  <div style="font-size:13px;font-weight:500;margin-bottom:2px;">Photo for Grid #${
                    index + 1
                  }</div>
                  ${imgHtml}
                  <div style="font-size:11px;color:#555;">${
                    photoMap[index].filename
                  }</div>
                </div>`,
                { maxWidth: 180, minWidth: 120 }
              );
            // Store bounds for later (simulate a grid area for fitBounds)
            gridBounds.push(L.latLngBounds(center, center));
          } else {
            // Extract corner coordinates
            const corners = grid.corners.map((corner) => [
              corner.lat,
              corner.lon,
            ]);
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
        if (gridData.waypoints && gridData.waypoints.length > 0 && startPoint) {
          const pathPoints = [
            [startPoint.lat || startPoint[0], startPoint.lon || startPoint[1]],
            ...gridData.waypoints.map((wp) => [wp.lat, wp.lon]),
            [startPoint.lat || startPoint[0], startPoint.lon || startPoint[1]],
          ];

          // Add waypoint markers
          gridData.waypoints.forEach((waypoint, idx) => {
            const marker = L.marker([waypoint.lat, waypoint.lon], {
              icon: waypointIcon,
            }).addTo(waypointsLayerRef.current);

            marker.bindTooltip(`Waypoint #${idx + 1}`);
          });

          // Add path polyline
          const pathLine = L.polyline(pathPoints, {
            color: "red",
            weight: 3,
            opacity: 0.7,
            dashArray: "10, 5",
            lineJoin: "round",
          }).addTo(pathLayerRef.current);

          // Add start marker
          const startIcon = L.divIcon({
            html: '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%;"></div>',
            className: "start-icon",
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
          L.marker(pathPoints[0], { icon: startIcon })
            .bindTooltip("Start/End")
            .addTo(pathLayerRef.current);

          // Add end marker (same as start, but for clarity)
          const endIcon = L.divIcon({
            html: '<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%;"></div>',
            className: "end-icon",
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
          L.marker(pathPoints[pathPoints.length - 2], { icon: endIcon })
            .bindTooltip("Last Waypoint")
            .addTo(pathLayerRef.current);
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
    }, [gridData, startPoint, photoMap]);

    // Update confirm button based on current step
    useEffect(() => {
      const confirmBtn = document.getElementById("confirm-drawing-btn");
      if (confirmBtn) {
        if (currentStep === "set-start" && startPointRef.current) {
          confirmBtn.disabled = false;
        } else if (
          currentStep === "draw-area" &&
          tempMarkersRef.current.length >= 3
        ) {
          confirmBtn.disabled = false;
        } else {
          confirmBtn.disabled = true;
        }
      }
    }, [currentStep, startPointRef.current, tempMarkersRef.current.length]);

    // Update button states based on current step
    useEffect(() => {
      const drawBtn = document.getElementById("start-drawing-btn");
      const confirmBtn = document.getElementById("confirm-drawing-btn");

      if (drawBtn && confirmBtn) {
        if (currentStep === "draw-area") {
          drawBtn.disabled = isDrawingRef.current;
          confirmBtn.disabled = tempMarkersRef.current.length < 3;
        } else if (currentStep === "set-start") {
          drawBtn.disabled = true;
          confirmBtn.disabled = !startPointRef.current;
        } else {
          drawBtn.disabled = true;
          confirmBtn.disabled = true;
        }
      }
    }, [
      currentStep,
      isDrawingRef.current,
      tempMarkersRef.current.length,
      startPointRef.current,
    ]);

    // FIXED: Single clear consolidated effect to manage button states
    useEffect(() => {
      const drawBtn = document.getElementById("start-drawing-btn");
      const confirmBtn = document.getElementById("confirm-drawing-btn");

      if (drawBtn && confirmBtn) {
        if (currentStep === "draw-area") {
          drawBtn.disabled = isDrawingRef.current;
          confirmBtn.disabled = tempMarkersRef.current.length < 3;
        } else if (currentStep === "set-start") {
          drawBtn.disabled = true;
          confirmBtn.disabled = startPointRef.current === null;

          // FIXED: Debug log to verify button state
          console.log(
            "Set-start step, startPoint exists:",
            startPointRef.current !== null,
            "confirm disabled:",
            confirmBtn.disabled
          );
        } else {
          drawBtn.disabled = true;
          confirmBtn.disabled = true;
        }
      }
    }, [currentStep, isDrawingRef.current, tempMarkersRef.current.length]);

    // Add a direct effect to monitor start point changes
    // FIXED: Add new effect that specifically watches for start point changes
    useEffect(() => {
      const confirmBtn = document.getElementById("confirm-drawing-btn");
      if (confirmBtn && currentStep === "set-start" && startPointRef.current) {
        console.log("Start point set, enabling confirm button");
        confirmBtn.disabled = false;
      }
    }, [startPointRef.current, currentStep]);

    // Update UI based on current step
    useEffect(() => {
      const drawBtn = document.getElementById("start-drawing-btn");
      const confirmBtn = document.getElementById("confirm-drawing-btn");

      if (drawBtn && confirmBtn) {
        if (currentStep === "draw-area") {
          // Show buttons for drawing step
          drawBtn.style.display = "flex";
          confirmBtn.style.display = "flex";
          drawBtn.disabled = isDrawingRef.current;
          confirmBtn.disabled = tempMarkersRef.current.length < 3;
        } else if (currentStep === "set-start") {
          // Hide buttons for start point selection
          drawBtn.style.display = "none";
          confirmBtn.style.display = "none";
        } else {
          // Hide buttons in final step
          drawBtn.style.display = "none";
          confirmBtn.style.display = "none";
        }
      }
    }, [currentStep, isDrawingRef.current, tempMarkersRef.current.length]);

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
        (!gps || (gps.latitude === 0 && gps.longitude === 0) || gpsSignal) &&
        hasCenteredOnDroneRef.current
      ) {
        hasCenteredOnDroneRef.current = false;
      }
    }, [gps, gpsSignal]);

    // Determine if GPS is valid
    const hasValidGps =
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number" &&
      !(gps.latitude === 0 && gps.longitude === 0) &&
      !gpsSignal;

    // Update button states based on GPS validity
    useEffect(() => {
      const drawBtn = document.getElementById("start-drawing-btn");
      if (drawBtn) {
        drawBtn.disabled =
          !hasValidGps || isDrawingRef.current || !connected || !droneConnected;
      }
    }, [hasValidGps, isDrawingRef.current, connected, droneConnected]);

    return (
      <div
        className="map-wrapper"
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {/* Blur overlay if not connected */}
        {(!connected || !droneConnected) && (
          <div className="map-blur-overlay">
            <div className="map-spinner">
              <div className="spinner" />
              <div className="spinner-text">
                {!connected
                  ? "Waiting for server connection"
                  : "Waiting for drone connection"}
              </div>
            </div>
          </div>
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
        {/* Conditionally render instructions based on currentStep AND flightStep */}
        <div className="map-instructions">
          {/* Only show instructions if flight is NOT in progress or complete */}
          {flightStep === "idle" &&
            currentStep === "draw-area" &&
            !isDrawingRef.current && (
              <p>
                {!hasValidGps
                  ? "Waiting for drone GPS"
                  : 'Click the "Draw" button to start drawing the area.'}
              </p>
            )}
          {flightStep === "idle" &&
            currentStep === "draw-area" &&
            isDrawingRef.current && (
              <p>
                Click on the map to draw the area. Minimum 3 points required.
              </p>
            )}
          {/* Show this instruction only when idle and in the 'complete' (grid calculation) step */}
          {flightStep === "idle" && currentStep === "complete" && (
            <p>
              Adjust altitude and overlap settings, then calculate grid
              coverage.
            </p>
          )}
          {/* Optionally add messages for in_progress or complete steps if desired */}
          {/* {flightStep === 'in_progress' && <p>Flight mission is currently active.</p>} */}
        </div>
      </div>
    );
  }
);

export default MapComponent;
