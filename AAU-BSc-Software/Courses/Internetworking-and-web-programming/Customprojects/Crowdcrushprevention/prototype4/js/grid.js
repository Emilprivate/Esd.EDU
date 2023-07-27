export default class Grid {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
  
      this.cellSize = 30;
  
      this.updateCanvasSize();
      this.init();
    }
  
    init() {
      this.draw();
    }

    updateCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gridWidth = this.canvas.width / this.cellSize;
        this.gridHeight = this.canvas.height / this.cellSize;
      }

    resize() {
        this.updateCanvasSize();
        this.draw();
    }
  
    draw() {
      this.ctx.strokeStyle = "gray";
      this.ctx.lineWidth = 1;
  
      for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
  
      for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    }
  }
  