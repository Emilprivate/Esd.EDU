//This is a file containing refactored modules from the original codebase but with no dependencies on the original codebase nor any DOM dependancy (e.g. document, window, etc.)
//This is to allow for unit testing of the modules without having to mock the DOM or the original codebase
//This file is not used in the actual application, it is only used for testing purposes
//This file is not meant to be run, it is only meant to be imported by the tests

module.exports = {
    populate,
    populateCells,
    spawnExceededAgents,
    checkAgentDistance,
    collisionCheck,
    getRandomArbitrary
  };

//Function for evenly distributing agents among total spawn area
function populate(spawnAreas, cellSize, numAgents) {
    if (spawnAreas.length == 0) {
      throw new Error("Please add spawn areas");
    }
  
    let totalCells = 0;
    let agentNum = numAgents;
  
    spawnAreas.forEach((area) => {
      totalCells += area.length;
    });
  
    //the minimum distance between agents
    const minAgentDistance = cellSize / 3;
    const maxAgents = totalCells * Math.floor((cellSize - minAgentDistance) / minAgentDistance);
    let exceededAgents = 0;
  
    if (agentNum > maxAgents) {
      exceededAgents = agentNum - maxAgents;
      agentNum = maxAgents;
    }
  
    let agentsSpawned = 0;
    spawnAreas.forEach((area, index) => {
      let ratio = area.length / totalCells;
      let agentsPerArea = Math.floor(ratio * agentNum);
  
      if (index === spawnAreas.length - 1) {
        agentsPerArea = agentNum - agentsSpawned;
      }
  
      agentsSpawned += agentsPerArea;
      populateCells(area, agentsPerArea, minAgentDistance, agents, cellSize);
    });
  
    return exceededAgents;
}
  
//Function for spawning agents randomly within correct area
function populateCells(area, agentsPerArea, minAgentDistance, agents, cellSize) {
  let firstCell = area[area.length - 1];
  let lastCell = area[0];
  let fattiness = ((cellSize / 6) + Math.floor(Math.random() * 3));

  //increase the padding to ensure agents are not placed too close to the border
  let padding = minAgentDistance;
  //add a limit to the number of tries
  let maxTries = 100;

  for (let i = 0; i < agentsPerArea; ++i) {
    let validPosition = false;
    let x, y;
    //initialize tries counter
    let tries = 0;
    //add tries limit to the condition
    while (!validPosition && tries < maxTries) {
      x = getRandomArbitrary(firstCell.x * cellSize + fattiness + padding, lastCell.x * cellSize + Math.floor(cellSize) - fattiness - padding);
      y = getRandomArbitrary(firstCell.y * cellSize + fattiness + padding, lastCell.y * cellSize + Math.floor(cellSize) - fattiness - padding);
      validPosition = checkAgentDistance(x, y, minAgentDistance, agents);
      //increment tries counter
      tries++;
    }
    //only create an agent if there's a valid position
    if (validPosition) {
      let agent = { x, y, fattiness };
      agents.push(agent);
    }
    //If no valid positions are found, spawn these agents later
    else {
      agentsPerArea++;
    }
  }
}

//Function for spawning agents in excess
function spawnExceededAgents(spawnAreas, agents, exceededAgents, cellSize) {
  const minAgentDistance = cellSize / 3;
  const padding = minAgentDistance / 2;
  for (let area of spawnAreas) {
    for (let cell of area) {
      let fattiness = ((cellSize / 6) + Math.floor(Math.random() * 3));
      let x = getRandomArbitrary(cell.x * cellSize + fattiness + padding, (cell.x + 1) * cellSize - fattiness - padding);
      let y = getRandomArbitrary(cell.y * cellSize + fattiness + padding, (cell.y + 1) * cellSize - fattiness - padding);
      if (checkAgentDistance(x, y, minAgentDistance, agents)) {
        let agent = {x, y, fattiness};
        agents.push(agent);
        exceededAgents--;
        if (exceededAgents <= 0) {
          return agents;
        }
      }
    }
    if (exceededAgents <= 0) {
      return agents;
    }
  }
  return agents;
}

//Function for checking if the distance between agents is greater than the minimum distance
function checkAgentDistance(x, y, minAgentDistance, agents) {
  for (let agent of agents) {
    let distance = Math.sqrt(Math.pow(agent.x - x, 2) + Math.pow(agent.y - y, 2));
    //increase the distance check to also include the agent's fattiness
    if (distance < minAgentDistance + agent.fattiness * 2) {
      return false;
    }
  }  
  return true;
}

//Function for checking if the agent is colliding with another agent or a wall
function collisionCheck(x, y, currAgent, newCell, agents) {
    let agentCollision = agents.some((agent) => Math.abs(agent.x - x) < agent.fattiness + currAgent.fattiness && Math.abs(agent.y - y) < agent.fattiness + currAgent.fattiness && agent.x != currAgent.x && agent.y != currAgent.y);
    let cellCollision = newCell.isWall;
    if (agentCollision || cellCollision) 
    {
        return true;
    } 
    else 
    {
        return false;
    }
}

//Function for getting the index of a cell
function calculateVectors(cells) {
  cells.forEach(column => {
      for (let cell of column) {
          if (cell.value === 0 || cell.isWall === true) {
              continue;
          }
          let neighbors = getNeighbors(cell, cells);

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

//Function for getting the index of a cell
function getNeighbors(currentCell, cellsArray) {
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

//Heatmap tests:
//TODO : Heatmap - Test if the density affects the color values

//Getting position within spawn area
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}