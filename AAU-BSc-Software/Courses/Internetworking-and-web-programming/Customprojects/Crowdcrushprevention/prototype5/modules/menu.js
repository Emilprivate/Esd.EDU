import ESDUI from '../libs/ESDUI.js/esdui.js/esdui.js';
import Functions from '../js/menufuncs/functions.js';

class UIManager {
  constructor(menuContainer) {
    this.menuContainer = menuContainer;
    this.esdui = new ESDUI();
    this.menu = this.esdui.createUIElement("Menu", this.menuContainer);
    this.drawMenuContent();
  }

  drawMenuContent() {
    // Get the menu container
    const menuContainer = this.menuContainer;

    // Create the ESDUI instance
    const esdui = new ESDUI();
    const menu = esdui.createUIElement("Menu", menuContainer);

    // Create simulation submenu
    const simSubmenu = esdui.createUIElement("Submenu", menu.element, { text: "Simulation" });
    const simStart = esdui.createUIElement("Button", simSubmenu.submenuList.element, { text: "Start Simulation" });
    const startPoint = esdui.createUIElement("MenuItem", simSubmenu.submenuList.element, { text: "Add Startpoint" });
    const exitPoint = esdui.createUIElement("MenuItem", simSubmenu.submenuList.element, { text: "Add Exitpoint" });

    // Create a separator for the menu
    const separator = esdui.createUIElement("Separator", menu.element);

    // Create the agents submenu
    const agentsSubmenu = esdui.createUIElement("Submenu", menu.element, { text: "Agents" });

    // Add agents inputbox
    const agentsInput = esdui.createUIElement("Input", agentsSubmenu.submenuList.element, { text: "Add Agents" });
    const agentsAdd = esdui.createUIElement("Button", agentsSubmenu.submenuList.element, { text: "Add Agents" });
    const agentsRemove = esdui.createUIElement("Button", agentsSubmenu.submenuList.element, { text: "Remove Agents" });
    const agentsClear = esdui.createUIElement("Button", agentsSubmenu.submenuList.element, { text: "Clear Agents" });

    // Create a separator for the menu
    const separator2 = esdui.createUIElement("Separator", menu.element);

    // Create the grid submenu
    const gridSubmenu = esdui.createUIElement("Submenu", menu.element, { text: "Grid" });

    // Create a paint menu item
    const gridPaint = esdui.createUIElement("MenuItem", gridSubmenu.submenuList.element, { text: "Paint" });
    const gridErase = esdui.createUIElement("MenuItem", gridSubmenu.submenuList.element, { text: "Erase" });
    const gridClear = esdui.createUIElement("MenuItem", gridSubmenu.submenuList.element, { text: "Clear" });

    // Create a separator for the menu
    const separator3 = esdui.createUIElement("Separator", menu.element);

    // Create a settings submenu
    const settingsSubmenu = esdui.createUIElement("Submenu", menu.element, { text: "Settings" });

    // Create a cell size label
    const cellSizeLabel = esdui.createUIElement("Label", settingsSubmenu.submenuList.element, { text: "Cell Size" });

    // Create a cell size inputbox 
    const cellSizeInput = esdui.createUIElement("Input", settingsSubmenu.submenuList.element, { text: "Cell Size" });
    const cellSizeApply = esdui.createUIElement("Button", settingsSubmenu.submenuList.element, { text: "Apply" });
  }
}

export default class Menu {
  constructor(menuContainer, gridCanvas, grid, agents) {
    this.menuContainer = menuContainer;
    this.gridCanvas = gridCanvas;
    this.grid = grid;
    this.agents = agents;
    
    this.uiManager = new UIManager(menuContainer);
  }
}
