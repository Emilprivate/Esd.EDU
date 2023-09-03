const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const button = document.getElementById("button");

let people = [];
let target = { x: xCoordinate, y: yCoordinate };
let xCoordinateNumber = 0;
let yCoordinateNumber = 0;

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const xCursor = event.clientX - rect.left;
    const yCursor = event.clientY - rect.top;
    document.getElementById("xCoordinate").value = xCursor.toFixed(0);
    document.getElementById("yCoordinate").value = yCursor.toFixed(0);
}

canvas.addEventListener("click", function(canvasClick) {
    getCursorPosition(canvas, canvasClick)
});

button.addEventListener("click", function() {
    xCoordinateNumber = Number(document.getElementById("xCoordinate").value);
    yCoordinateNumber = Number(document.getElementById("yCoordinate").value);
    target.x = xCoordinateNumber;
    target.y = yCoordinateNumber;
    animate();
});

class Person {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.path = [];
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill(); 
    }

    update() {
        if (!this.path.length) {
            this.path = findPath(this, target, people);
          }
      
          if (this.path.length) {
            const next = this.path.shift();
            let collision = false;
            for (const person of people) {
              if (person === this) continue;
              if (intersect(this, next, person)) {
                collision = true;
                break;
              }
            }
            if (!collision) {
              this.x = next.x + Math.random() * 2 - 1;
              this.y = next.y + Math.random() * 2 - 1;
            }
        }
    }
}


for (let i = 0; i < 3; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * (10 - 6) + 6;
    people.push(new Person(x, y, r));
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const person of people) {
        person.update();
        person.draw();
    }

    requestAnimationFrame(animate);
}


function findPath(start, end) {
    const grid = [];
    for (let i = 0; i < canvas.width; i++) {
        grid[i] = [];
        for (let j = 0; j < canvas.height; j++) {
            grid[i][j] = { x: i, y: j, f: 0, g: 0, h: 0, parent: null };
        }
    }

    const openList = [];
    const closedList = [];

    openList.push(grid[Math.round(start.x)][Math.round(start.y)]);

    while (openList.length > 0) {   
        const currentNode = openList.shift();
        closedList.push(currentNode);

        if (currentNode.x === end.x && currentNode.y === end.y) {
            const path = [];
            let current = currentNode;
            while (current.parent) {
                path.push({ x: current.x, y: current.y });
                current = current.parent;
            }
            return path.reverse();
        }

        const neighbors = getNeighbors(grid, currentNode);
        for (const neighbor of neighbors) {
            if (closedList.includes(neighbor)) continue;

            const gScore = currentNode.g + 1;
            let gScoreIsBest = false;

            if (!openList.includes(neighbor)) {
                gScoreIsBest = true;
                neighbor.h = heuristic(neighbor, end);
                openList.push(neighbor);
            } else if (gScore < neighbor.g) {
                gScoreIsBest = true;
            }

            if (gScoreIsBest) {
                neighbor.parent = currentNode;
                neighbor.g = gScore;
                neighbor.f = neighbor.g + neighbor.h;
            }
        }

        openList.sort((a, b) => a.f - b.f);
    }

    return [];
}

function intersect(person1, next1, person2) {
    const x1 = person1.x;
    const y1 = person1.y;
    const r1 = person1.r;
    
    const x2 = next1.x;
    const y2 = next1.y;
    
    const x3 = person2.x;
    const y3 = person2.y;
    const r3 = person2.r;
    
    const dist = Math.sqrt((x1 - x3) ** 2 + (y1 - y3) ** 2);
    if (dist < r1 + r3) return true;
    
    const distNext = Math.sqrt((x2 - x3) ** 2 + (y2 - y3) ** 2);
    if (distNext < r1 + r3) return true;
    
    return false;
  }

function getNeighbors(grid, node) {
    const neighbors = [];
    const x = node.x;
    const y = node.y;

    if (grid[x - 1] && grid[x - 1][y]) neighbors.push(grid[x - 1][y]);
    if (grid[x + 1] && grid[x + 1][y]) neighbors.push(grid[x + 1][y]);
    if (grid[x] && grid[x][y - 1]) neighbors.push(grid[x][y - 1]);
    if (grid[x] && grid[x][y + 1]) neighbors.push(grid[x][y + 1]);

    return neighbors;
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
