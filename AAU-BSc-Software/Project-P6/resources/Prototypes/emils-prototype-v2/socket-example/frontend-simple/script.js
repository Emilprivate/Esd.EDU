let socket;
let backendConnected = false;
let droneConnected = false;
let autoScroll = true;

function connectToBackend() {
  socket = io("http://localhost:5000");
  setupSocketListeners();
}

function setupSocketListeners() {
  socket.on("connect", handleBackendConnect);
  socket.on("disconnect", handleBackendDisconnect);
  
  socket.on("telemetry", updateTelemetry);
  socket.on("state_update", updateDroneState);
  socket.on("battery_update", updateBatteryStatus);
  socket.on("attitude_update", updateAttitude);
  socket.on("speed_update", updateSpeed);
  socket.on("gps_fix_state", updateGpsFix);
  socket.on("drone_connection_status", updateDroneConnection);
  
  socket.on("backend_log", handleBackendLog);
  socket.on("command_result", handleCommandResult);
}

function handleBackendConnect() {
  console.log("Connected to backend");
  backendConnected = true;
  document.getElementById("backend-status").innerText = "Connected";
  document.getElementById("backend-status").className = "connected";
  document.getElementById("connect-backend").disabled = true;
  document.getElementById("connect-drone").disabled = false;
  addLogEntry("INFO", "FRONTEND", "Connected to backend");
}

function handleBackendDisconnect() {
  console.log("Disconnected from backend");
  backendConnected = false;
  droneConnected = false;
  document.getElementById("backend-status").innerText = "Disconnected";
  document.getElementById("backend-status").className = "disconnected";
  document.getElementById("drone-status").innerText = "Disconnected";
  document.getElementById("drone-status").className = "disconnected";
  document.getElementById("connect-backend").disabled = false;
  document.getElementById("connect-drone").disabled = true;
  resetAllDataValues();
  addLogEntry("WARN", "FRONTEND", "Disconnected from backend");
}

function updateTelemetry(data) {
  document.getElementById("lat").innerText = data.latitude;
  document.getElementById("lon").innerText = data.longitude;
  document.getElementById("alt").innerText = data.altitude;
}

function updateDroneState(data) {
  document.getElementById("event").innerText = data.event;
  document.getElementById("state").innerText = data.state;
}

function updateBatteryStatus(data) {
  const batteryLevel = data.level;
  document.getElementById("battery-level").innerText = `${batteryLevel}%`;
  
  const batteryVisual = document.getElementById("battery-level-visual");
  batteryVisual.style.width = `${batteryLevel}%`;
  
  if (batteryLevel > 50) {
    batteryVisual.style.backgroundColor = "#4caf50"; // Green
  } else if (batteryLevel > 20) {
    batteryVisual.style.backgroundColor = "#ff9800"; // Orange
  } else {
    batteryVisual.style.backgroundColor = "#f44336"; // Red
  }
}

function updateAttitude(data) {
  document.getElementById("roll").innerText = `${data.roll.toFixed(2)}°`;
  document.getElementById("pitch").innerText = `${data.pitch.toFixed(2)}°`;
  document.getElementById("yaw").innerText = `${data.yaw.toFixed(2)}°`;
}

function updateSpeed(data) {
  document.getElementById("speed-x").innerText = `${data.speedX.toFixed(2)} m/s`;
  document.getElementById("speed-y").innerText = `${data.speedY.toFixed(2)} m/s`;
  document.getElementById("speed-z").innerText = `${data.speedZ.toFixed(2)} m/s`;
}

function updateGpsFix(data) {
  const fixStatus = data.fixed ? "Fixed" : "Not fixed";
  document.getElementById("gps-fix").innerText = fixStatus;
  document.getElementById("gps-fix").className = data.fixed ? "connected" : "disconnected";
}

function updateDroneConnection(data) {
  droneConnected = data.connected;
  document.getElementById("drone-status").innerText = droneConnected ? "Connected" : "Disconnected";
  document.getElementById("drone-status").className = droneConnected ? "connected" : "disconnected";
  document.getElementById("connect-drone").disabled = droneConnected;
  document.getElementById("disconnect-drone").disabled = !droneConnected;
  
  const flightButtons = document.querySelectorAll(".flight-control");
  flightButtons.forEach(btn => {
    btn.disabled = !droneConnected;
  });
  
  if (data.error) {
    addLogEntry("ERROR", "FRONTEND", `Drone connection error: ${data.error}`);
  }
  
  if (data.connecting) {
    addLogEntry("INFO", "FRONTEND", "Connecting to drone...");
  } else if (data.connected) {
    addLogEntry("INFO", "FRONTEND", "Drone connected successfully");
  } else if (!data.connecting && !data.connected && !data.error) {
    addLogEntry("INFO", "FRONTEND", "Drone disconnected");
    resetDroneData();
  }
}

function resetAllDataValues() {
  const valueElements = document.querySelectorAll(".value");
  valueElements.forEach(el => {
    el.innerText = "N/A";
    if (el.classList.contains("connected") || el.classList.contains("disconnected")) {
      el.className = "value";
    }
  });
  
  document.getElementById("battery-level-visual").style.width = "0%";
}

function resetDroneData() {
  document.getElementById("lat").innerText = "N/A";
  document.getElementById("lon").innerText = "N/A";
  document.getElementById("alt").innerText = "N/A";
  document.getElementById("roll").innerText = "N/A";
  document.getElementById("pitch").innerText = "N/A";
  document.getElementById("yaw").innerText = "N/A";
  document.getElementById("speed-x").innerText = "N/A";
  document.getElementById("speed-y").innerText = "N/A";
  document.getElementById("speed-z").innerText = "N/A";
  document.getElementById("gps-fix").innerText = "N/A";
  document.getElementById("gps-fix").className = "value";
  document.getElementById("event").innerText = "N/A";
  document.getElementById("state").innerText = "N/A";
}

function handleBackendLog(logData) {
  addLogEntry(logData.level, logData.component, logData.message, logData.timestamp);
}

function handleCommandResult(result) {
  const commandName = result.command.charAt(0).toUpperCase() + result.command.slice(1);
  if (result.success) {
    addLogEntry("INFO", "COMMAND", `${commandName} command succeeded`);
  } else {
    const errorMsg = result.error ? `: ${result.error}` : "";
    addLogEntry("ERROR", "COMMAND", `${commandName} command failed${errorMsg}`);
  }
}

function addLogEntry(level, component, message, timestamp = null) {
  const terminal = document.getElementById("terminal-content");
  
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  
  if (!timestamp) {
    const now = new Date();
    timestamp = now.toTimeString().substring(0, 8);
  }
  
  const timeSpan = document.createElement("span");
  timeSpan.className = "log-timestamp";
  timeSpan.textContent = `[${timestamp}]`;
  
  const levelSpan = document.createElement("span");
  levelSpan.className = `log-level-${level}`;
  levelSpan.textContent = `[${level}]`;
  
  const componentSpan = document.createElement("span");
  componentSpan.className = "log-component";
  componentSpan.textContent = `[${component}]`;
  
  const messageSpan = document.createElement("span");
  messageSpan.className = "log-message";
  messageSpan.textContent = ` ${message}`;
  
  logEntry.appendChild(timeSpan);
  logEntry.appendChild(levelSpan);
  logEntry.appendChild(componentSpan);
  logEntry.appendChild(messageSpan);
  
  terminal.appendChild(logEntry);
  
  if (autoScroll) {
    const terminalContainer = document.getElementById("backend-terminal");
    terminalContainer.scrollTop = terminalContainer.scrollHeight;
  }
}

document.addEventListener("DOMContentLoaded", function() {

  document.getElementById("connect-backend").addEventListener("click", () => {
    connectToBackend();
  });

  document.getElementById("connect-drone").addEventListener("click", () => {
    if (socket && backendConnected) {
      socket.emit("connect_drone");
    }
  });

  document.getElementById("disconnect-drone").addEventListener("click", () => {
    if (socket && backendConnected && droneConnected) {
      socket.emit("disconnect_drone");
    }
  });

  document.getElementById("takeoff").addEventListener("click", () => {
    if (socket && droneConnected) {
      socket.emit("takeoff");
      addLogEntry("INFO", "FRONTEND", "Sending takeoff command");
    }
  });

  document.getElementById("land").addEventListener("click", () => {
    if (socket && droneConnected) {
      socket.emit("land");
      addLogEntry("INFO", "FRONTEND", "Sending land command");
    }
  });

  document.getElementById("move").addEventListener("click", () => {
    if (socket && droneConnected) {
      socket.emit("move", { dx: 1, dy: 0, dz: 0, dpsi: 0 });
      addLogEntry("INFO", "FRONTEND", "Sending move forward command");
    }
  });
  
  document.getElementById("clear-logs").addEventListener("click", () => {
    document.getElementById("terminal-content").innerHTML = "";
    addLogEntry("INFO", "TERMINAL", "Logs cleared");
  });
  
  document.getElementById("auto-scroll").addEventListener("change", (e) => {
    autoScroll = e.target.checked;
    addLogEntry("INFO", "TERMINAL", `Auto-scroll ${autoScroll ? 'enabled' : 'disabled'}`);
  });
  
  addLogEntry("INFO", "FRONTEND", "Frontend initialized. Connect to backend to begin.");
});
