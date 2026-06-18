import { World } from "./world/World";

declare global {
  interface Window {
    world: World;
  }
}

// Initialize the World
window.world = new World();

