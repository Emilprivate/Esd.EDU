import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import L from "leaflet";
import "leaflet-draw";

// Fix for marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Custom vertex icon for editing
const vertexIcon = new L.DivIcon({
  html: '<div style="width: 10px; height: 10px; background-color: white; border: 2px solid #444; border-radius: 50%;"></div>',
  className: "leaflet-div-icon-vertex",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Custom waypoint icon
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

// Custom drone icon
const droneIcon = L.divIcon({
  html: `<div style="width: 24px; height: 24px; transform: rotate(0deg);">
    <svg viewBox="0 0 24 24" fill="#FF5722">
      <path d="M12,0L7,5h5V0L12,0z M12,0l5,5h-5V0L12,0z M12,24l-5-5h5V24L12,24z M12,24l5-5h-5V24L12,24z M0,12l5-5v5H0L0,12z M0,12l5,5v-5H0L0,12z M24,12l-5-5v5H24L24,12z M24,12l-5,5v-5H24L24,12z"/>
      <circle cx="12" cy="12" r="4" fill="#FF5722" stroke="#FFF" stroke-width="1"/>
    </svg>
  </div>`,
  className: "drone-icon",
  iconSize: [24, 24],
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
      currentStep,
      dronePosition,
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
    const droneMarkerRef = useRef(null);

    // Use refs for state that the event handlers need to access
    const isDrawingRef = useRef(false);
    const isEditingRef = useRef(false);

    // Keep React state for component rendering
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const mapClickHandlerRef = useRef(null);

    useImperativeHandle(ref, () => ({
      fitBounds: (bounds) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds);
        }
      },
    }));

    useEffect(() => {
      if (!mapContainerRef.current) return;

      console.log("Initializing map...");
      const map = L.map(mapContainerRef.current).setView(
        [57.013722, 9.974037],
        15
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Save map reference immediately
      mapInstanceRef.current = map;

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

        // Enable confirm button if we have at least a3 points
        const confirmBtn = document.querySelector(".confirm-drawing");
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

      // Add custom styles
      const style = document.createElement("style");
      style.textContent = `
        .custom-control-container {
          background: white;
          padding: 5px;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.2);
        }
        .custom-control-panel {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .control-btn {
          min-width: 80px;
          height: 30px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .control-btn:hover:not(:disabled) {
          background: #f4f4f4;
        }
        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .control-active {
          background-color: #ffeb3b;
        }
        .crosshair-cursor {
          cursor: crosshair !important;
        }
      `;
      document.head.appendChild(style);

      // Clean up function
      return () => {
        console.log("Cleaning up map...");
        document.head.removeChild(style);

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

        // Don't call onStepComplete here - we've modified the logic to automatically
        // transition in the parent component based on polygon creation
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

      if (gridData.grids && gridData.grids.length > 0) {
        // Create grid rectangles
        const gridBounds = [];

        gridData.grids.forEach((grid, index) => {
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

          // Add tooltip with grid number
          gridPolygon.bindTooltip(`Grid #${index + 1}`);

          // Store bounds for later
          gridBounds.push(gridPolygon.getBounds());
        });

        // Draw the path if available
        if (gridData.path && gridData.path.length > 0) {
          // Create an array of waypoint coordinates
          const pathPoints = gridData.path.map((wp) => [wp.lat, wp.lon]);

          // Add waypoint markers
          gridData.path.forEach((waypoint, idx) => {
            // Add waypoint marker with number
            const marker = L.marker([waypoint.lat, waypoint.lon], {
              icon: waypointIcon,
            }).addTo(waypointsLayerRef.current);

            // Add tooltip with waypoint number and information
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

          // Add start and end markers for the path
          if (pathPoints.length > 0) {
            // Add start marker
            const startIcon = L.divIcon({
              html: '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%;"></div>',
              className: "start-icon",
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });

            L.marker(pathPoints[0], { icon: startIcon })
              .bindTooltip("Start")
              .addTo(pathLayerRef.current);

            // Add end marker
            const endIcon = L.divIcon({
              html: '<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%;"></div>',
              className: "end-icon",
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });

            L.marker(pathPoints[pathPoints.length - 1], { icon: endIcon })
              .bindTooltip("End")
              .addTo(pathLayerRef.current);
          }
        }

        // Create a bounds object that includes all grids
        if (gridBounds.length > 0) {
          const allBounds = L.latLngBounds(
            gridBounds[0].getSouthWest(),
            gridBounds[0].getNorthEast()
          );
          gridBounds.forEach((bounds) => {
            allBounds.extend(bounds);
          });

          // Fit map to show all grids
          mapInstanceRef.current.fitBounds(allBounds);
        }
      }
    }, [gridData]);

    // Handle drone position updates
    useEffect(() => {
      if (!mapInstanceRef.current || !dronePosition) return;

      const { lat, lon } = dronePosition;

      // Skip updating if we received error coordinates (500,500,500)
      // Also skip if lat or lon is above 90/180 (invalid coordinates)
      if (
        (lat === 500 && lon === 500) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      ) {
        console.log("Ignoring invalid drone position:", lat, lon);
        return;
      }

      // If drone marker doesn't exist, create it
      if (!droneMarkerRef.current) {
        console.log("Creating new drone marker at", lat, lon);
        droneMarkerRef.current = L.marker([lat, lon], {
          icon: droneIcon,
        }).addTo(mapInstanceRef.current);

        // Pan to the drone the first time we get its position
        mapInstanceRef.current.panTo([lat, lon]);
      } else {
        // Update marker position
        droneMarkerRef.current.setLatLng([lat, lon]);
      }
    }, [dronePosition]);

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

    return (
      <div className="map-wrapper">
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
        <div className="map-instructions">
          {currentStep === "draw-area" && !isDrawingRef.current && (
            <p>Click the "Draw" button to start drawing the area.</p>
          )}
          {currentStep === "draw-area" && isDrawingRef.current && (
            <p>Click on the map to draw the area. Minimum 3 points required.</p>
          )}
          {currentStep === "set-start" && (
            <p>
              <strong>
                Click on the map to set the drone's start/end point.
              </strong>
            </p>
          )}
          {currentStep === "calculate" && (
            <p>
              <strong>
                Set altitude and overlap settings, then calculate grid coverage.
              </strong>
            </p>
          )}
          {currentStep === "execute" && (
            <p>
              <strong>Review the flight plan, then execute when ready.</strong>
            </p>
          )}
        </div>
      </div>
    );
  }
);

export default MapComponent;
