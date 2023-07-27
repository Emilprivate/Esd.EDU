export default class Tools {
  constructor(toolCanvas, gridCanvas, grid) {
    this.toolCanvas = toolCanvas;
    this.gridCanvas = gridCanvas;
    this.ctx = toolCanvas.getContext("2d");
    this.grid = grid;

    this.toolsOverlay = document.getElementById("tools-overlay");

    this.spawnPositionMode = false;
    this.handleSpawnPositionMouseMove = this.handleSpawnPositionMouseMove.bind(this);
    this.handleSpawnPositionMouseClick = this.handleSpawnPositionMouseClick.bind(this);
    this.spawnAreaCircle = null;

    this.toolsList = [
      { id: "tool-agents", name: "Agents" },
      { id: "tool-wall", name: "Wall" },
      { id: "tool-stairs", name: "Stairs" },
      { id: "tool-object", name: "Object" },
      { id: "tool-entrance", name: "Entrance" },
      { id: "tool-exit", name: "Exit Point" },
    ];

    this.agentsSubmenu = document.createElement("div");
    this.agentsSubmenu.id = "agents-submenu";
    this.agentsSubmenu.classList.add("agents-submenu");
    this.toolsOverlay.appendChild(this.agentsSubmenu);

    this.createToolsMenu();
    this.initDraggableToolsOverlay();

  }

  redrawGridAndAgents() {
    const ctx = this.gridCanvas.getContext("2d");
    ctx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    this.grid.draw();
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
    });
  }

  createToolsMenu() {
    this.toolsList.forEach((tool) => {
      const button = document.createElement("button");
      button.classList.add("tool-btn");
      button.id = tool.id;
      button.textContent = tool.name;
      button.addEventListener("click", (e) => {
        this.toolClicked(e, tool.id);
      });

      this.toolsOverlay.appendChild(button);
    });
  }

  createAgentModifiers() {
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.placeholder = "Amount of agents";
    amountInput.min = 1;
    amountInput.classList.add("agent-modifier-input");
    this.agentsSubmenu.appendChild(amountInput);
  
    const velocityInput = document.createElement("input");
    velocityInput.type = "number";
    velocityInput.placeholder = "Velocity of agents";
    velocityInput.min = 0.1;
    velocityInput.step = 0.1;
    velocityInput.classList.add("agent-modifier-input");
    this.agentsSubmenu.appendChild(velocityInput);
  
    const spawnPositionButton = document.createElement("button");
    spawnPositionButton.classList.add("agent-modifier-btn");
    spawnPositionButton.textContent = "Spawn position of agents";
    spawnPositionButton.addEventListener("click", (e) => {
      this.setSpawnPositionMode(true);
  });

  this.agentsSubmenu.appendChild(spawnPositionButton);
    const spawnAgentsButton = document.createElement("button");
    spawnAgentsButton.classList.add("agent-modifier-btn");
    spawnAgentsButton.textContent = "Spawn agents";
    spawnAgentsButton.addEventListener("click", (e) => {
      this.spawnAgents();
    });
    this.agentsSubmenu.appendChild(spawnAgentsButton);
  }

  toggleAgentsSubmenu(clickedButton) {
    const isVisible = this.agentsSubmenu.style.display === "block";

    this.agentsSubmenu.style.display = isVisible ? "none" : "block";

    if (clickedButton.classList.contains("tool-btn-selected")) {
      clickedButton.classList.remove("tool-btn-selected");
      this.selectedTool = null;
      return;
    }

    this.toolsOverlay.querySelectorAll(".tool-btn").forEach((button) => {
      button.classList.remove("tool-btn-selected");
    });
    clickedButton.classList.add("tool-btn-selected");

      if (!isVisible) {
        const buttonRect = clickedButton.getBoundingClientRect();
        this.agentsSubmenu.style.top = `${buttonRect.top}px`;
        this.agentsSubmenu.style.left = `${buttonRect.right}px`;
      }

      if (!isVisible && this.agentsSubmenu.childElementCount === 0) {
        this.createAgentModifiers();
      }
    }

  toolClicked(event, toolId) {
    console.log(`Tool clicked: ${toolId}`);

    const clickedButton = event.currentTarget;

    if (toolId === "tool-agents") {
      this.toggleAgentsSubmenu(clickedButton);
      if (this.selectedTool !== clickedButton) {
        if (this.selectedTool) {
          this.selectedTool.classList.remove("tool-btn-selected");
        }
        clickedButton.classList.add("tool-btn-selected");
        this.selectedTool = clickedButton;
      } else {
        this.selectedTool = null;
      }
      return;
    }

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

    if (this.agentsSubmenu.style.display === "block") {
      this.agentsSubmenu.style.display = "none";
      this.toolsOverlay.querySelector("#tool-agents").classList.remove("tool-btn-selected");
    }
  }

  setSpawnPositionMode(enabled) {
    this.spawnPositionMode = enabled;
  
    if (enabled) {
      this.toolCanvas.addEventListener("mousemove", this.handleSpawnPositionMouseMove);
      this.toolCanvas.addEventListener("click", this.handleSpawnPositionMouseClick);
    } else {
      this.toolCanvas.removeEventListener("mousemove", this.handleSpawnPositionMouseMove);
      this.toolCanvas.removeEventListener("click", this.handleSpawnPositionMouseClick);
      this.ctx.clearRect(0, 0, this.toolCanvas.width, this.toolCanvas.height);
    }
  }
  
  handleSpawnPositionMouseMove = (e) => {
    if (!this.spawnPositionMode) return;
  
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const radius = 50;
  
    this.spawnAreaCircle = { x, y, radius };
  
    this.drawSpawnAreaCircle();
  }
  

  drawSpawnAreaCircle() {
    if (!this.spawnAreaCircle) return;
  
    this.redrawGridAndAgents();
    this.ctx.beginPath();
    this.ctx.arc(this.spawnAreaCircle.x, this.spawnAreaCircle.y, this.spawnAreaCircle.radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
    this.ctx.fill();
    this.ctx.closePath();
  }
  
  handleSpawnPositionMouseClick = (e) => {
    if (!this.spawnPositionMode) return;
  
    this.spawnPosition = this.spawnAreaCircle;
    this.spawnAreaCircle = null;
  
    this.setSpawnPositionMode(false);
  }
  
  spawnAgents() {
    console.log("Spawn agents");
  }
}
