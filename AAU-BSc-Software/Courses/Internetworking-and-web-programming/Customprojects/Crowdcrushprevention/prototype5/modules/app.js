import Grid from "./grid.js";
import Menu from "./menu.js";
import Agents from "./agents.js";

class App {
  constructor() {
    this.gridCanvas = document.getElementById("grid-canvas");
    this.menuCanvas = document.getElementById("menu-container");

    this.init();
  }

  init() {
    this.grid = new Grid(this.gridCanvas);
    this.agents = new Agents(this.gridCanvas, this.grid);
    this.menu = new Menu(this.menuCanvas, this.gridCanvas, this.grid, this.agents);
  
    this.registerResizeEventListener();
  
    this.loop();
  }

  registerResizeEventListener() {
      window.addEventListener("resize", () => {
        this.grid.resize();
      });
  }

  loop() {
      this.agents.update();
      this.agents.draw();
      this.grid.draw();
      
      requestAnimationFrame(() => this.loop());
  }
}

const app = new App();
