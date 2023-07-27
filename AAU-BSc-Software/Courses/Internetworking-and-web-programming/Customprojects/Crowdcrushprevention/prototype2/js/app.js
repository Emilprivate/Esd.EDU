import { Grid } from './grid.js';
import { Tools } from './tools.js';

const gridcanvas = document.getElementById('grid-canvas');
const toolcanvas = document.getElementById('tool-canvas');

const cellSize = 50;
const borderWidth = 1;
const marginLeft = '0px';
const marginTop = '0px';

const numCols = Math.floor(window.innerWidth / cellSize);
const numRows = Math.floor(window.innerHeight / cellSize);

const grid = new Grid(gridcanvas, numRows, numCols, cellSize, borderWidth, marginLeft, marginTop);
    
const tools = new Tools(toolcanvas, grid);

// Add the color tool externally
const changeColor = (cell) => {
    cell.color = 'red';
    console.log("changed color")
    this.draw();
};

tools.addTool('color', changeColor);


grid.draw();
tools.draw();
