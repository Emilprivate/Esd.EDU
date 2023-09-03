const {
  populate,
  populateCells,
  spawnExceededAgents,
  checkAgentDistance,
  collisionCheck,
  getRandomArbitrary 
} = require('./refactored_modules.js');

describe('populate', () => {
    test('throws an error when spawnAreas is an empty array', () => {
      const spawnAreas = [];
      const cellSize = 10;
      const numAgents = 5;
      expect(() => {
        populate(spawnAreas, cellSize, numAgents);
      }).toThrowError('Please add spawn areas');
    });

    test('throws an error when numAgents is greater than the maximum number of agents that can be spawned', () => {
      const spawnAreas = [[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]];
      const cellSize = 10;

      //We are assuming the maximum number of agents that can be spawned is less than 10
      const numAgents = 10; 

      expect(() => {
        populate(spawnAreas, cellSize, numAgents);
      }).toThrowError();
    });
});

describe('populateCells', () => {
  test('handles the case where agentsPerArea is zero', () => {
    const area = [{ x: 0, y: 0 }];
    const agentsPerArea = 0;
    const minAgentDistance = 5;
    const agents = [];
    const cellSize = 10;
    populateCells(area, agentsPerArea, minAgentDistance, agents, cellSize);
    expect(agents.length).toBe(0);
  });
});

describe('spawnExceededAgents', () => {
  test('successfully spawns agents when there are excess agents', () => {
    const spawnAreas = [[{ x: 0, y: 0 }, { x: 100, y: 100 }]];
    const cellSize = 15;
    let agents = [{ x: 5, y: 5, fattiness: 1 }];
    let exceededAgents = 2;
    
    agents = spawnExceededAgents(spawnAreas, agents, exceededAgents, cellSize);
    
    expect(agents.length).toBe(2);
  });
});

describe('checkAgentDistance', () => {
  test('returns false when distance is less than minAgentDistance + agent.fattiness * 2', () => {
    const x = 10;
    const y = 20;
    const minAgentDistance = 5;
    const agents = [
      { x: 15, y: 25, fattiness: 2 },
      { x: 30, y: 35, fattiness: 3 },
    ];
    const result = checkAgentDistance(x, y, minAgentDistance, agents);
    expect(result).toBe(false);
  });

  test('returns true when there are no agents in the array', () => {
    const x = 10;
    const y = 20;
    const minAgentDistance = 5;
    const agents = [];
    const result = checkAgentDistance(x, y, minAgentDistance, agents);
    expect(result).toBe(true);
  });

  test('returns true when the distance between the given position and the agents is greater than minAgentDistance + agent.fattiness * 2', () => {
    const x = 10;
    const y = 20;
    const minAgentDistance = 5;
    const agents = [
      { x: 15, y: 25, fattiness: 1 },
      { x: 30, y: 35, fattiness: 1 },
    ];
    const result = checkAgentDistance(x, y, minAgentDistance, agents);
    expect(result).toBe(true);
  });

  test('returns false when the distance is equal to minAgentDistance + agent.fattiness * 2 for some agents', () => {
    const x = 10;
    const y = 20;
    const minAgentDistance = 5;
    const agents = [
      { x: 15, y: 20, fattiness: 2 },
      { x: 30, y: 35, fattiness: 3 },
    ];
    const result = checkAgentDistance(x, y, minAgentDistance, agents);
    expect(result).toBe(false);
  });
});

describe('collisionCheck', () => {
  test('returns true when there is an agent collision', () => {
    const x = 10;
    const y = 20;
    const currAgent = { x: 15, y: 25, fattiness: 5 };
    const newCell = { isWall: false };
    const agents = [
      { x: 13, y: 27, fattiness: 4 },
      { x: 30, y: 35, fattiness: 3 },
    ];
    const result = collisionCheck(x, y, currAgent, newCell, agents);
    expect(result).toBe(true);
  });  

  test('returns true when there is a cell collision', () => {
    const x = 10;
    const y = 20;
    const currAgent = { x: 5, y: 5, fattiness: 1 };
    const newCell = { isWall: true };
    const agents = [{ x: 5, y: 5, fattiness: 1 }];
    const result = collisionCheck(x, y, currAgent, newCell, agents);
    expect(result).toBe(true);
  });

  test('returns false when there are no collisions', () => {
    const x = 10;
    const y = 20;
    const currAgent = { x: 5, y: 5, fattiness: 1 };
    const newCell = { isWall: false };
    const agents = [{ x: 15, y: 25, fattiness: 2 }];
    const result = collisionCheck(x, y, currAgent, newCell, agents);
    expect(result).toBe(false);
  });
});

describe('getRandomArbitrary', () => {
  test('returns a value within the specified range', () => {
    const min = 0;
    const max = 10;
    const result = getRandomArbitrary(min, max);
    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
  });
});

//follow the same structure as above for tests on other functions
  
