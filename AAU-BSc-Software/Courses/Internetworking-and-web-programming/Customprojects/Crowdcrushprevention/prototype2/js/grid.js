export class Grid {
    constructor(canvas, rows, columns, cellSize, gap, posx, posy) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.rows = rows;
      this.columns = columns;
      this.cellSize = cellSize;
      this.gap = gap;
      this.width = columns * cellSize + (columns + 1) * gap;
      this.height = rows * cellSize + (rows + 1) * gap;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = posx;
      this.canvas.style.left = posy;
  
      this.cells = [];
      for (let i = 0; i < this.rows; i++) {
        this.cells[i] = [];
        for (let j = 0; j < this.columns; j++) {
          this.cells[i][j] = { x: j, y: i, color: 'white' };
        }
      }
  
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    }
  
    getCellFromEvent(event) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cellX = Math.floor(x / (this.cellSize + this.gap));
      const cellY = Math.floor(y / (this.cellSize + this.gap));
      if (cellX >= 0 && cellY >= 0 && cellX < this.columns && cellY < this.rows) {
        return this.cells[cellY][cellX];
      } else {
        return null;
      }
    }
  
    handleMouseDown(event) {
      const cell = this.getCellFromEvent(event);
      if (cell) {
        this.changeColor(cell);
      }
    }
  
    changeColor(cell) {
      cell.color = 'red';
      this.draw();
    }
  
    draw() {
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = this.gap;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.columns; j++) {
          const x = j * (this.cellSize + this.gap) + this.gap;
          const y = i * (this.cellSize + this.gap) + this.gap;
          this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
        }
      }
  
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.columns; j++) {
          const cell = this.cells[i][j];
          this.ctx.fillStyle = cell.color;
          this.ctx.fillRect(
            j * (this.cellSize + this.gap) + this.gap,
            i * (this.cellSize + this.gap) + this.gap,
            this.cellSize,
            this.cellSize
          );
          this.ctx.strokeRect(
            j * (this.cellSize + this.gap) + this.gap,
            i * (this.cellSize + this.gap) + this.gap,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
  }
    