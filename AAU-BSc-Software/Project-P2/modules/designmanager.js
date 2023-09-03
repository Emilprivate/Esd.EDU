import { loadCells, setExits } from './cells.js';
import { setSpawnAreas } from './agents.js';
export { saveDesign, loadDesign, getAllDesignNames, removeDesign };

/**
 * 
 * @param {string} userCookie 
 * @returns savedDesigns  
 */
async function getAllDesignNames(userCookie) {
    let savedDesigns = [];
    let response = await fetch("/getdesignnames", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "cookie": userCookie
          }
    })
    let designs = await response.json();
    designs.forEach(design => {
        savedDesigns.push(design.name);
    });
    return savedDesigns;
}

/**
 * 
 * @param {string} userCookie 
 * @param {cells[]} cells 
 * @param {spawnAreas[]} spawnAreas 
 * @param {string} name 
 * @param {int} cellSize 
 */
async function saveDesign(userCookie, cells, spawnAreas, name, cellSize) {
    const design = {
        userCookie: userCookie,
        name: name,
        cells: cells,
        spawnAreas: spawnAreas,
        cellSize: cellSize
    }

    const deserializedDesign = JSON.stringify(design);
        const response = await fetch("/savedesign", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
              },
            body: deserializedDesign
        })
        if (!response.ok) {
            const body = await response.text();
            throw new Error(body)
        }
}

/**
 * 
 * @param {string} name 
 * @param {string} userCookie 
 */
async function removeDesign(name, userCookie) {
    await fetch("/removedesign", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "cookie": userCookie,
            "name": name
          }
    })
}

/**
 * 
 * @param {string} name 
 * @param {string} userCookie 
 */
async function loadDesign(name, userCookie){
    let response = await fetch("/getdesign", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "cookie": userCookie,
            "name": name
          }
    })
    let serializedDesign = await response.json();

    let Exits = [];
    serializedDesign.cells.forEach(columns => {
        columns.forEach(cell => {
            if (cell.isExit) {
                Exits.push(cell);
            }       
        });
    });
    setExits(Exits);
    loadCells(serializedDesign.cells, serializedDesign.cellSize);
    setSpawnAreas(serializedDesign.spawnAreas);
}