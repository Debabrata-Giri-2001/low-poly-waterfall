import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class Camera {
  world: World;
  camera!: THREE.PerspectiveCamera;
  debugPanel?: DebugPanel;

  // Define separate positions for different screen sizes
  public desktopPosition = { x: -4.79, y: 2.46, z: 5.39 };
  public mobilePosition = { x: -6.14, y: 5.49, z: 6.11 };

  // The active position that View.ts will read
  public originalPosition = { x: 0, y: 0, z: 0 };

  constructor() {
    this.world = World.getInstance();
    this.updateCurrentPosition();
    this.setupCamera();
    this.debug();
  }

  // Determines if the screen is mobile and sets the correct original position
  updateCurrentPosition() {
    const isMobile = this.world.viewport.width < 768;
    this.originalPosition = isMobile
      ? { ...this.mobilePosition }
      : { ...this.desktopPosition };
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      35,
      this.world.viewport.width / this.world.viewport.height,
      0.1,
      1000,
    );

    this.camera.position.set(
      this.originalPosition.x,
      this.originalPosition.y,
      this.originalPosition.z,
    );
  }

  resize() {
    this.camera.aspect = this.world.viewport.width / this.world.viewport.height;
    this.camera.updateProjectionMatrix();

    // Update the base position in case the user resizes across the mobile breakpoint
    this.updateCurrentPosition();
  }

  debug() {
    if (this.world.debug?.active && this.world.debug?.panel) {
      this.debugPanel = this.world.debug.panel.addFolder({
        title: "🎥 Camera Data",
        expanded: false,
      });
    }
  }
}
