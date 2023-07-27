class Agent {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.canvas = canvas;
      }
  
    update() {
        const x = Math.floor(Math.random() * 3) - 1;
        const y = Math.floor(Math.random() * 3) - 1;
    
        const newX = this.x + x;
        const newY = this.y + y;
    
        if (newX >= this.radius && newX <= this.canvas.width - this.radius) {
          this.x = newX;
        }
        if (newY >= this.radius && newY <= this.canvas.height - this.radius) {
          this.y = newY;
        }
    }
  
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.closePath();
    }
  }
  
 export default class Agents {
    constructor(canvas, grid) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.grid = grid;
      this.agents = [];
    }
  
    createAgents(numAgents) {
        for (let i = 0; i < numAgents; i++) {
          const x = Math.floor(Math.random() * this.grid.gridWidth) * this.grid.cellSize + this.grid.cellSize / 2;
          const y = Math.floor(Math.random() * this.grid.gridHeight) * this.grid.cellSize + this.grid.cellSize / 2;
    
          const agent = new Agent(x, y, this.canvas);
    
          this.agents.push(agent);
        }
    }  

    removeAgents(numAgentsToRemove) {
      if (numAgentsToRemove >= this.agents.length) {
        this.agents = [];
      } else {
        this.agents.splice(-numAgentsToRemove);
      }
    }
  
    update() {
      this.agents.forEach(agent => agent.update());
    }
  
    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
      this.agents.forEach(agent => agent.draw(this.ctx));
    }
  }
  