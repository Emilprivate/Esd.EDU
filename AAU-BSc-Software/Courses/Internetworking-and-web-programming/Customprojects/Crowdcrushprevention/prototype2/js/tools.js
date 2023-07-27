export class Tools {
    constructor(canvas, grid) {
      this.canvas = canvas;
      this.grid = grid;
      this.tools = new Map();
      this.activeTool = null;
  
      this.canvas.addEventListener('click', this.handleClick.bind(this));
      this.menuToggle = document.createElement('button');
      this.menuToggle.innerText = 'Tools';
      this.menuToggle.style.position = 'absolute';
      this.menuToggle.style.top = '10px';
      this.menuToggle.style.left = '10px';
      this.menuToggle.addEventListener('click', this.toggleMenu.bind(this));
      this.canvas.parentElement.appendChild(this.menuToggle);
  
      this.menu = document.createElement('select');
      this.menu.style.position = 'absolute';
      this.menu.style.top = '30px';
      this.menu.style.left = '10px';
      this.menu.style.display = 'none';
      this.canvas.parentElement.appendChild(this.menu);
    }
  
    addTool(name, callback) {
      this.tools.set(name, callback);
      const option = document.createElement('option');
      option.innerText = name;
      this.menu.appendChild(option);
    }
  
    setActiveTool(name) {
      this.activeTool = this.tools.get(name);
    }
  
    handleClick(event) {
      const toolName = event.target.getAttribute('data-tool');
      if (toolName) {
        this.setActiveTool(toolName);
        this.toggleMenu(false);
      } else if (this.activeTool) {
        if (this.activeTool === this.tools.get('color')) {
          const cell = this.grid.getCellFromEvent(event);
          if (cell) {
            this.activeTool.changeColor(cell);
          }
        } else {
          const cell = this.grid.getCellFromEvent(event);
          if (cell) {
            this.activeTool(cell);
          }
        }
      }
    }
  
    draw() {
      const ctx = this.canvas.getContext('2d');
  
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
      this.menuToggle.style.display = 'block';
  
      this.toggleMenu(false);
  
      this.menu.style.top = `${this.menuToggle.offsetTop + this.menuToggle.offsetHeight}px`;
      this.menu.style.left
      `${this.menuToggle.offsetLeft}px`;
    }
  
    toggleMenu(show) {
      if (typeof show !== 'boolean') {
        show = this.menu.style.display === 'none';
      }
      this.menu.style.display = show ? 'block' : 'none';
    }
  }
    