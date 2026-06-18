import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class EnvirmentWorld {
  world: World;
  debugPanel?: DebugPanel;

  // Base parameters linked to Tweakpane
  private params = {
    backgroundColor: "#323232",
    fogColor: "#323232",
    fogNear: 10,
    fogFar: 15,
  };

  // Define responsive fog limits
  // Since mobile camera is further back, fog needs to start later
  public desktopFog = { near: 10, far: 15 };
  public mobileFog = { near: 13, far: 19 };

  constructor() {
    this.world = World.getInstance();

    this.updateCurrentFog(); // Set initial values before creating fog

    this.world.scene.background = new THREE.Color(this.params.backgroundColor);
    this.world.scene.fog = new THREE.Fog(
      this.params.fogColor,
      this.params.fogNear,
      this.params.fogFar,
    );

    this.debug();
    
    this.world.ticker.events.on("tick", () => {
      this.update();
    });

    // Listen for screen resizes to adjust fog dynamically
    this.world.viewport.events.on("change", () => {
      this.resize();
    });
  }

  // Determines if the screen is mobile and sets the correct fog parameters
  updateCurrentFog() {
    const isMobile = this.world.viewport.width < 768;
    this.params.fogNear = isMobile ? this.mobileFog.near : this.desktopFog.near;
    this.params.fogFar = isMobile ? this.mobileFog.far : this.desktopFog.far;
  }

  resize() {
    this.updateCurrentFog();

    // Apply the new values to the actual Three.js fog object
    if (this.world.scene.fog instanceof THREE.Fog) {
      this.world.scene.fog.near = this.params.fogNear;
      this.world.scene.fog.far = this.params.fogFar;
    }

    // Refresh the Tweakpane UI so the sliders show the new responsive values
    if (this.world.debug?.active && this.world.debug?.panel) {
      this.world.debug.panel.refresh();
    }
  }

  update() {}

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "🌫️ Environment World",
      expanded: false,
    });

    const visualsFolder = this.debugPanel.addFolder({ title: "Visuals" });

    // Background Color Control
    visualsFolder.addBinding(this.params, "backgroundColor", { view: "color" })
      .on("change", (ev) => {
        if (this.world.scene.background instanceof THREE.Color) {
          this.world.scene.background.set(ev.value);
        }
      });

    // Fog Color Control
    visualsFolder.addBinding(this.params, "fogColor", { view: "color" })
      .on("change", (ev) => {
        if (this.world.scene.fog instanceof THREE.Fog) {
          this.world.scene.fog.color.set(ev.value);
        }
      });

    // Fog Near Control
    visualsFolder.addBinding(this.params, "fogNear", { min: 0, max: 50, step: 0.5, label: "Fog Near" })
      .on("change", (ev) => {
        if (this.world.scene.fog instanceof THREE.Fog) {
          this.world.scene.fog.near = ev.value;
        }
      });

    // Fog Far Control
    visualsFolder.addBinding(this.params, "fogFar", { min: 0, max: 100, step: 0.5, label: "Fog Far" })
      .on("change", (ev) => {
        if (this.world.scene.fog instanceof THREE.Fog) {
          this.world.scene.fog.far = ev.value;
        }
      });
  }
}