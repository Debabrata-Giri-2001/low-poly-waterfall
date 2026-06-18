import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { World } from "../World";

import type { DebugPanel } from "../utils/Types";

// Create an interface to store each pad's data
interface PadData {
  mesh: THREE.Object3D;
  initialPosition: THREE.Vector3;
  initialRotation: THREE.Euler;
  randomSeed: number;
}

export class LilyPad {
  world: World;
  debugPanel?: DebugPanel;
  
  // New properties for animation
  noise: SimplexNoise;
  pads: PadData[] = [];
  elapsedTime: number = 0;

  noiseSpeed: number = 0.25; // How fast they drift
  noiseAmplitude: number = 0.10; // How far they drift from the center

  constructor() {
    this.world = World.getInstance();
    this.noise = new SimplexNoise();

    const GLTF = this.world.resources.lily_pad.scene;
    this.world.scene.add(GLTF);

    // 1. Extract and store the 7 children
    // We iterate through the children and save their initial states
    GLTF.children.forEach((child: THREE.Object3D) => {
      // Make sure we only target the groups you mentioned
      if (child.name.includes("lily_base")) {
        this.pads.push({
          mesh: child,
          initialPosition: child.position.clone(),
          initialRotation: child.rotation.clone(),
          // Give each pad a random seed so they don't move in perfect sync
          randomSeed: Math.random() * 100, 
        });
      }
    });

    this.debug();

    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  update() {
    // Convert delta to a manageable time step (assuming delta is in milliseconds)
    const delta = this.world.ticker.delta; 
    this.elapsedTime += delta * this.noiseSpeed;

    // 2. Animate each pad using Simplex Noise
    this.pads.forEach((pad) => {
      // We sample the noise function using the elapsed time and the pad's unique seed.
      // We add an arbitrary offset (e.g., 50) to the Z noise so X and Z don't move identically.
      const xOffset = this.noise.noise(pad.randomSeed, this.elapsedTime) * this.noiseAmplitude;
      const zOffset = this.noise.noise(pad.randomSeed + 50, this.elapsedTime) * this.noiseAmplitude;
      
      // Optional: Add a very subtle rotation wobble
      const rotationOffset = this.noise.noise(pad.randomSeed + 100, this.elapsedTime) * 0.1;

      // Apply the calculated offsets to the initial state
      pad.mesh.position.x = pad.initialPosition.x + xOffset;
      pad.mesh.position.z = pad.initialPosition.z + zOffset;
      
      pad.mesh.rotation.y = pad.initialRotation.y + rotationOffset;
    });
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "☘️ Lily Pad",
      expanded: false,
    });

    // 1. Uniforms (Update Instantly)
    const visualsFolder = this.debugPanel.addFolder({ title: "Visuals" });
    
    // Add animation controls to your debug panel
    visualsFolder.addBinding(this, 'noiseSpeed', { min: 0.1, max: 2, step: 0.01, label: "Drift Speed" });
    visualsFolder.addBinding(this, 'noiseAmplitude', { min: 0, max: 2, step: 0.01, label: "Drift Distance" });
  }
}