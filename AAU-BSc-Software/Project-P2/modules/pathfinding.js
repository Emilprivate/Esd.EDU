export { calculateVectors }
import { getSpawnAreas } from './agents.js';
import { cellSize, getCellIndex, getCellSize } from './cells.js'

/**
 * Used to call the initial BFS and vector calculation to measure performance
 * @param {cells[]} cells array of cells
 * @param {cells[]} goal array of goal cells
 * @returns {void}
 */
async function perfMeasure(cells, goal) {
    const start = performance.now();

    markCells(cells, goal);

    let spawnCount = 0;
    let spawnGroups = getSpawnAreas();
    for (let i = 0; i < getSpawnAreas().length; i++) {
        spawnCount = spawnCount + spawnGroups[i].length;
    }
    if (hitSpawnCells != spawnCount) {
        alert("Not all spawn areas can reach the end point(s)!");
        return;
    }

    calculateVectors(cells);

    const end = performance.now();
    console.log(`Execution time: ${end - start} ms`);
}

let hitSpawnCells = 0;

let distVal = 0;


/**
 * Recursive function for marking array of cells and counting distance
 * @param {cells[]} cells array of cells
 * @param {cell[]} currentCell array of next cells
 */
function markCells(cells, currentCell) {
    let nextNeighbors = [];
    let NeighborArr = [];

    for (let i = 0; i < currentCell.length; i++) {
        //Update cell if not already marked as updated or wall
        //(cell.isWall === true) implies (cell.mark === true)
        if (currentCell[i] != undefined && currentCell[i].mark === false) {
            //Set distance on current array of cells
            markCellsController(cells, currentCell[i]);

            //Get next araray of cells to set distance for
            //Only get direct neighbors
            NeighborArr = getNeighbors4D(cells, currentCell[i]);

            //A maximum of 4 neighbors can be found for each cell
            nextNeighbors.push(NeighborArr[0]);
            nextNeighbors.push(NeighborArr[1]);
            nextNeighbors.push(NeighborArr[2]);
            nextNeighbors.push(NeighborArr[3]);
        }
    }
    distVal += 1;

    //If neighbors are present around current cells, do fsame procedure on cells
    if (nextNeighbors.length !== 0) {
        markCells(cells, nextNeighbors);
    }
}

/**
 * Sets distance value and mark on cell
 * @param {cells[]} cells array of cells
 * @param {cell[]} currentCell array of cells to set value for
 */
function markCellsController(cells, currentCell) {
    let pCellSize = getCellSize();
    cells[currentCell.x / pCellSize][currentCell.y / pCellSize].value = distVal;
    //drawTxt(cells[currentCell.x / pCellSize][currentCell.y / pCellSize], distVal);

    let cell = cells[currentCell.x / pCellSize][currentCell.y / pCellSize];

    //Counts amount of reachable spawn cells
    if (cell.color == "blue") {
        hitSpawnCells++;
    }
    cells[currentCell.x / pCellSize][currentCell.y / pCellSize].mark = true;
    //currentCell.mark = true;
}

/**
 * Get all of the 8 closest cells, to the selected cell 
 * @param {cell} currentCell the cell to get the neighbors for 
 * @param {cells[]} cellsArray an array of all cells in the grid
 * @returns a struct of the closest cells
 */
function getNeighbors8D(currentCell, cellsArray) {
    let neighbors = { N: null, S: null, E: null, W: null, NE: null, NW: null, SE: null, SW: null };
    let index = getCellIndex(currentCell.x, currentCell.y);
    // Find north
    neighbors.N = cellsArray[index.x][index.y - 1];
    // Find south
    neighbors.S = cellsArray[index.x][index.y + 1];
    // Find east
    if (index.x < cellsArray.length - 1) {
        neighbors.E = cellsArray[index.x + 1][index.y];
    }
    // Find west
    if (index.x != 0) {
        neighbors.W = cellsArray[index.x - 1][index.y];
    }
    // Find north-east 
    if (index.x < cellsArray.length - 1) {
        neighbors.NE = cellsArray[index.x + 1][index.y - 1];
    }
    // Find north-west
    if (index.x != 0) {
        neighbors.NW = cellsArray[index.x - 1][index.y - 1];
    }
    // Find south-east
    if (index.x < cellsArray.length - 1) {
        neighbors.SE = cellsArray[index.x + 1][index.y + 1];
    }
    // Find south-west
    if (index.x != 0) {
        neighbors.SW = cellsArray[index.x - 1][index.y + 1];
    }
    return neighbors;
}

/**
 * Gets only direct neighbors of cell
 * @param {[cells]} cells an array of all cells in the grid
 * @param {cell} currentCell the cell to find the neighbors for 
 * @returns an array of the 4 closest cells
 */
function getNeighbors4D(cells, currentCell) {
    let newCurrentCell = [];
    let pCellSize = getCellSize();
    if (currentCell.x != 0) {
        newCurrentCell[0] = cells[(currentCell.x / pCellSize) - 1][currentCell.y / pCellSize];
        if (newCurrentCell[0] === undefined) {
            newCurrentCell.splice(0, 1);
        }
    }
    else {

    }

    if (currentCell.x != cells[cells.length - 1][cells[0].length - 1].x) {
        newCurrentCell[1] = cells[(currentCell.x / pCellSize) + 1][currentCell.y / pCellSize];
        if (newCurrentCell[1] === undefined) {
            newCurrentCell.splice(1, 1);
        }
    }

    if (currentCell.y != 0) {
        newCurrentCell[2] = cells[currentCell.x / pCellSize][(currentCell.y / pCellSize) - 1];
        if (newCurrentCell[2] === undefined) {
            newCurrentCell.splice(2, 1);
        }
    }

    if (currentCell.y != cells[0][cells[0].length - 1].y) {
        newCurrentCell[3] = cells[currentCell.x / pCellSize][(currentCell.y / pCellSize) + 1];
        if (newCurrentCell[3] === undefined) {
            newCurrentCell.splice(3, 1);
        }
    }
    return newCurrentCell;
}

/**
 * Calculate vectors of cells depending on lowest value neighbor
 * @param {cells[]} cells array of cells
 */
function calculateVectors(cells) {
    cells.forEach(column => {
        for (let cell of column) {
            if (cell.value === 0 || cell.isWall === true) {
                continue;
            }
            let neighbors = getNeighbors8D(cell, cells);

            if (neighbors.N && neighbors.N.isWall) {
                neighbors.NE = null
                neighbors.NW = null
            }
            if (neighbors.E && neighbors.E.isWall) {
                neighbors.NE = null
                neighbors.SE = null
            }
            if (neighbors.S && neighbors.S.isWall) {
                neighbors.SE = null
                neighbors.SW = null
            }
            if (neighbors.W && neighbors.W.isWall) {
                neighbors.NW = null
                neighbors.SW = null
            }
            let lowestValue = Infinity;
            let direction = '';

            for (let key in neighbors) {
                let neighbor = neighbors[key];
                if (neighbor && neighbor.isWall == false && neighbor.value < lowestValue) {
                    lowestValue = neighbor.value;
                    direction = key;
                }
            }

            //Set vectors for cells
            if (direction === 'N') {
                cell.dVector = { x: 0, y: -1 }
            } else if (direction === 'S') {
                cell.dVector = { x: 0, y: 1 }
            } else if (direction === 'E') {
                cell.dVector = { x: 1, y: 0 }
            } else if (direction === 'W') {
                cell.dVector = { x: -1, y: 0 }
            } else if (direction === 'NE') {
                cell.dVector = { x: 1, y: -1 }
            } else if (direction === 'NW') {
                cell.dVector = { x: -1, y: -1 }
            } else if (direction === 'SE') {
                cell.dVector = { x: 1, y: 1 }
            } else if (direction === 'SW') {
                cell.dVector = { x: -1, y: 1 }
            }
        }
    });
}



export { perfMeasure };