class UIManager {
  constructor(toolsOverlay) {
    this.toolsOverlay = toolsOverlay;
  }

  initDraggableToolsOverlay() {
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
  
    this.toolsOverlay.addEventListener("mousedown", (e) => {
      offsetX = e.clientX - this.toolsOverlay.offsetLeft;
      offsetY = e.clientY - this.toolsOverlay.offsetTop;
      isDragging = true;
    });
  
    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        this.toolsOverlay.style.left = `${e.clientX - offsetX}px`;
        this.toolsOverlay.style.top = `${e.clientY - offsetY}px`;
      }
    });
  
    window.addEventListener("mouseup", () => {
      isDragging = false;
    
      const agentsButton = this.toolsOverlay.querySelector("#tool-agents");
      const agentsSubmenu = this.toolsOverlay.querySelector("#submenu");
      if (agentsButton && agentsSubmenu && agentsButton.classList.contains("tool-btn-selected")) {
        this.updateSubmenuPosition(agentsButton);
      }
    });    
  }
}

class ToolManager {
  constructor(toolCanvas, gridCanvas, grid, toolsOverlay, agents) {
    this.toolCanvas = toolCanvas;
    this.gridCanvas = gridCanvas;
    this.ctx = gridCanvas.getContext("2d");
    this.grid = grid;

    this.agents = agents;
  
    this.wallCells = {};
  
    this.toolsOverlay = toolsOverlay;
  
    this.toolsList = [
      { id: "tool-simulation", name: "Simulation" },
      { id: "tool-agents", name: "Agents" },
      { id: "tool-wall", name: "Wall" },
      { id: "tool-barrier", name: "Barrier" },
      { id: "tool-start", name: "Start Point" },
      { id: "tool-exit", name: "Exit Point" },
      { id: "tool-settings", name: "Settings" },
    ];

    this.simSubmenu = document.createElement("div");
    this.simSubmenu.id = "sim-submenu";
    this.simSubmenu.classList.add("submenu");
    this.toolsOverlay.appendChild(this.simSubmenu);
  
    this.agentsSubmenu = document.createElement("div");
    this.agentsSubmenu.id = "agent-submenu";
    this.agentsSubmenu.classList.add("submenu");
    this.toolsOverlay.appendChild(this.agentsSubmenu);

    this.settingsSubmenu = document.createElement("div");
    this.settingsSubmenu.id = "settings-submenu";
    this.settingsSubmenu.classList.add("submenu");
    this.toolsOverlay.appendChild(this.settingsSubmenu);

    this.wallSubmenu = document.createElement("div");
    this.wallSubmenu.id = "wall-submenu";
    this.wallSubmenu.classList.add("submenu");
    this.toolsOverlay.appendChild(this.wallSubmenu);
  
    this.handleWallMouseDown = this.handleWallMouseDown.bind(this);
    this.handleWallMouseMove = this.handleWallMouseMove.bind(this);
    this.handleWallMouseUp = this.handleWallMouseUp.bind(this);

    this.gridCanvas.addEventListener("mousedown", this.handleWallMouseDown);
    this.gridCanvas.addEventListener("mousemove", this.handleWallMouseMove);
    this.gridCanvas.addEventListener("mouseup", this.handleWallMouseUp);    

    this.agentAmountInput = null;

    this.mouseX = null;
    this.mouseY = null;
    
    this.gridCanvas.addEventListener("mousemove", (e) => {
      const rect = this.gridCanvas.getBoundingClientRect();
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    this.gridCanvas.addEventListener("mouseleave", () => {
      this.mouseX = null;
      this.mouseY = null;
    });

    this.createToolsMenu();
  }  
  
  createToolsMenu() {
    this.toolsList.forEach((tool) => {
      const container = document.createElement("div");
      container.classList.add("tool-container");
  
      const button = document.createElement("button");
      button.classList.add("tool-btn");
      button.id = tool.id;
      button.textContent = tool.name;
      button.addEventListener("click", (e) => {
        this.toolClicked(e, tool.id);
      });
      container.appendChild(button);
  
      const arrow = document.createElement("span");
      arrow.classList.add("arrow");
      container.appendChild(arrow);
  
      this.toolsOverlay.appendChild(container);
    });
  }

  createAgentSubmenu() {
    const agentAmountLabel = document.createElement("label");
    agentAmountLabel.textContent = "No. of agents";
    this.agentsSubmenu.appendChild(agentAmountLabel);

    this.agentAmountInput = document.createElement("input");
    this.agentAmountInput.type = "number";
    this.agentAmountInput.min = 1;
    this.agentAmountInput.classList.add("submenu-input");
    this.agentsSubmenu.appendChild(this.agentAmountInput);

    const spawnButton = document.createElement("button");
    spawnButton.textContent = "Spawn";
    spawnButton.classList.add("submenu-submit", "submenu-btn");
    spawnButton.addEventListener("click", this.handleSpawnButtonClick);
    this.agentsSubmenu.appendChild(spawnButton);

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.classList.add("submenu-submit", "submenu-btn");
    removeButton.addEventListener("click", this.handleRemoveAgentsButtonClick);
    this.agentsSubmenu.appendChild(removeButton);
  }

  createSettingsSubmenu() {
    const settingsLabel = document.createElement("label");
    settingsLabel.setAttribute("for", "cell-size");
    settingsLabel.textContent = "Cell Size";
    this.settingsSubmenu.appendChild(settingsLabel);

    const settingsInput = document.createElement("input");
    settingsInput.type = "number";
    settingsInput.min = 10;
    settingsInput.max = 100;
    settingsInput.value = this.grid.cellSize;
    settingsInput.id = "cell-size";
    settingsInput.classList.add("submenu-input");
    this.settingsSubmenu.appendChild(settingsInput);

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.classList.add("submenu-btn");
    submitButton.addEventListener("click", () => {
      this.updateCellSize(settingsInput.value);
    });
    this.settingsSubmenu.appendChild(submitButton);
  }

  createWallSubmenu() {
    const paintButton = document.createElement("button");
    paintButton.textContent = "Paint";
    paintButton.classList.add("submenu-btn");
    this.wallSubmenu.appendChild(paintButton);

    const eraseButton = document.createElement("button");
    eraseButton.textContent = "Erase";
    eraseButton.classList.add("submenu-btn");
    this.wallSubmenu.appendChild(eraseButton);

    const clearAllButton = document.createElement("button");
    clearAllButton.textContent = "Clear all";
    clearAllButton.classList.add("submenu-btn");
    this.wallSubmenu.appendChild(clearAllButton);

    paintButton.addEventListener("click", () => {
      paintButton.classList.add("submenu-btn-selected");
      eraseButton.classList.remove("submenu-btn-selected");
      this.setPaintMode(true);
      this.setEraseMode(false);
    });
    
    eraseButton.addEventListener("click", () => {
      eraseButton.classList.add("submenu-btn-selected");
      paintButton.classList.remove("submenu-btn-selected");
      this.setPaintMode(false);
      this.setEraseMode(true);
    });

    clearAllButton.addEventListener("click", () => {
      this.clearAllWalls();
    });
  }

  createSimSubmenu(){
    const simButton = document.createElement("button");
    simButton.textContent = "Simulate";
    simButton.classList.add("submenu-btn");
    this.simSubmenu.appendChild(simButton);

    simButton.addEventListener("click", () =>{
      console.log("Simulation started!");
    });
  }

  toggleSubmenu(clickedButton, submenu) {
    this.hideOtherSubmenus(submenu);
  
    const isVisible = submenu.style.display === "block";
    submenu.style.display = isVisible ? "none" : "block";
  
    if (clickedButton.classList.contains("tool-btn-selected")) {
      clickedButton.classList.remove("tool-btn-selected");
      this.selectedTool = null;
      return;
    }
  
    this.toolsOverlay
      .querySelectorAll(".tool-btn")
      .forEach((button) => button.classList.remove("tool-btn-selected"));
  
    clickedButton.classList.add("tool-btn-selected");
  
    if (!isVisible) {
      this.updateSubmenuPosition(clickedButton, submenu);
    }
  
    if (!isVisible && submenu.childElementCount === 0) {
      this.createSubmenuContent(submenu);
    }
  
    if (isVisible) {
      this.resetSelectedButtons(clickedButton, submenu);
    }
  
    window.addEventListener("resize", () => {
      this.updateSubmenuPosition(clickedButton, submenu);
    });
  
    if (isVisible) {
      clickedButton.classList.remove("tool-btn-selected");
    }
  }
  
  createSubmenuContent(submenu) {
    if (submenu === this.agentsSubmenu) {
      this.createAgentSubmenu();
    } else if (submenu === this.settingsSubmenu) {
      this.createSettingsSubmenu();
    } else if (submenu === this.wallSubmenu) {
      this.createWallSubmenu();
    } else if (submenu === this.simSubmenu) {
      this.createSimSubmenu();
    }
  }
  
  resetSelectedButtons(clickedButton, submenu) {
    clickedButton.classList.remove("tool-btn-selected");
    submenu
      .querySelectorAll(".submenu-btn-selected")
      .forEach((button) => button.classList.remove("submenu-btn-selected"));
  }  

  toolClicked(event, toolId) {
    console.log(`Tool clicked: ${toolId}`);
  
    const clickedButton = event.currentTarget;
  
    if (this.isSubmenuTool(toolId)) {
      this.toggleSubmenuForTool(clickedButton, toolId);
      return;
    }
  
    this.handleNonSubmenuTool(clickedButton, toolId);
  }
  
  isSubmenuTool(toolId) {
    return [
      "tool-simulation",
      "tool-agents",
      "tool-settings",
      "tool-wall",
    ].includes(toolId);
  }
  
  toggleSubmenuForTool(clickedButton, toolId) {
    const submenuMap = {
      "tool-simulation": this.simSubmenu,
      "tool-agents": this.agentsSubmenu,
      "tool-settings": this.settingsSubmenu,
      "tool-wall": this.wallSubmenu,
    };
  
    this.toggleSubmenu(clickedButton, submenuMap[toolId]);
  }
  
  handleNonSubmenuTool(clickedButton, toolId) {
    if (this.selectedTool === clickedButton) {
      clickedButton.classList.remove("tool-btn-selected");
      this.selectedTool = null;
    } else {
      if (this.selectedTool) {
        this.selectedTool.classList.remove("tool-btn-selected");
      }
  
      clickedButton.classList.add("tool-btn-selected");
      this.selectedTool = clickedButton;
    }
  }

  hideOtherSubmenus(excludeSubmenu) {
    const submenus = [this.agentsSubmenu, this.settingsSubmenu, this.wallSubmenu, this.simSubmenu];
  
    submenus.forEach((submenu) => {
      if (submenu !== excludeSubmenu) {
        submenu.style.display = "none";
      }
    });
  
    this.toolsOverlay.querySelectorAll(".tool-btn").forEach((button) => {
      if (button !== excludeSubmenu) {
        button.classList.remove("tool-btn-selected");
      }
    });
  }  

  setPaintMode(enabled) {
    this.paintMode = enabled;
  }

  setEraseMode(enabled) {
    this.eraseMode = enabled;
  }

  clearAllWalls() {
    this.wallCells = {};
    this.drawWalls('black');
  }

  updateSubmenuPosition(clickedButton, submenu) {
    const offset = 11;
    const buttonRect = clickedButton.getBoundingClientRect();
    const containerRect = clickedButton.parentElement.getBoundingClientRect();
    const toolsOverlayRect = this.toolsOverlay.getBoundingClientRect();
    submenu.style.top = `${containerRect.top - toolsOverlayRect.top}px`;
    submenu.style.left = `${containerRect.right - toolsOverlayRect.left + offset}px`;
  }

  updateCellSize(newCellSize) {
    this.grid.cellSize = parseInt(newCellSize, 10);
    this.grid.resize();
  }

  redrawGridAndAgents() {
    this.ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
  
    this.grid.draw(this.ctx);
    this.drawWalls('black');
  }

  getGridCoords(x, y) {
    const gridX = Math.floor(x / this.grid.cellSize);
    const gridY = Math.floor(y / this.grid.cellSize);
    return { x: gridX, y: gridY };
  }

  drawWalls(color) {
    this.ctx.fillStyle = color;
  
    for (const key in this.wallCells) {
      const [gridX, gridY] = key.split(",").map(Number);
      const x = gridX * this.grid.cellSize;
      const y = gridY * this.grid.cellSize;
  
      this.ctx.fillRect(x, y, this.grid.cellSize, this.grid.cellSize);
    }
  }

  handleWallMouseDown = (e) => {
    this.isDrawingWall = true;
    this.handleWallMouseMove(e);
  };

  handleWallMouseUp = () => {
    this.isDrawingWall = false;
  }; 
  
  handleWallMouseMove = (e) => {
    if (!this.isDrawingWall) return;
  
    const rect = this.gridCanvas.getBoundingClientRect();
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    const x = this.mouseX - rect.left;
    const y = this.mouseY - rect.top;
  
    const { x: gridX, y: gridY } = this.getGridCoords(x, y);
    const key = `${gridX},${gridY}`;
  
    if (this.eraseMode) {
      delete this.wallCells[key];
    } else if (this.paintMode) {
      this.wallCells[key] = true;
    }

    this.drawWalls('black');
  }; 

  handleSpawnButtonClick = () => {
    const agentAmount = parseInt(this.agentAmountInput.value, 10);

    if (!isNaN(agentAmount)) {
      this.agents.createAgents(agentAmount);
      console.log(`Spawning ${agentAmount} agents.`);
    } else {
      console.error("Invalid agent amount");
    }
  };

  handleRemoveAgentsButtonClick = () => {
    const agentAmount = parseInt(this.agentAmountInput.value, 10);

    if (!isNaN(agentAmount)) {
      this.agents.removeAgents(agentAmount);
      console.log(`Removing ${agentAmount} agents.`);
    } else {
      console.error("Invalid agent amount");
    }
  };
}

export default class Tools {
  constructor(toolCanvas, gridCanvas, grid, agents) {
    this.toolCanvas = toolCanvas;
    this.gridCanvas = gridCanvas;
    this.grid = grid;
    this.agents = agents;

    this.toolsOverlay = document.getElementById("tools-overlay");

    this.uiManager = new UIManager(this.toolsOverlay);
    this.toolManager = new ToolManager(toolCanvas, gridCanvas, grid, this.toolsOverlay, this.agents);

    this.uiManager.initDraggableToolsOverlay();
  }
}