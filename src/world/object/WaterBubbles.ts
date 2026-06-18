import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

import { MeshDefaultMaterial } from "../Materials/MeshDefaultMaterial";
import { fragmentHeaderWaterBubbles, fragmentMainWaterBubbles, vertexHeaderWaterBubbles, vertexMainWaterBubbles } from "../shader/defultShader/Shader";

export class WaterBubbles {
  world: World;
  debugPanel?: DebugPanel;
  bubbles!: THREE.InstancedMesh;

  // Maximum memory to allocate on the GPU
  maxCount = 2000;

  // Store the relative positions so they don't teleport when scaling the box
  basePositions!: Float32Array;

  waterBubblesMaterial!: MeshDefaultMaterial;

  params = {
    count: 600,
    boxWidth: 1.8,
    boxHeight: 0.8,
    boxDepth: 0.8,
    minSize: 0.001,
    maxSize: 0.035,
    minSpeed: 0.3,
    maxSpeed: 1.0,
  };

  constructor() {
    this.world = World.getInstance();
    this.createBubbles();
    this.debug();

    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  createBubbles() {
    const water_bubbles = this.world.resources.water_bubbles.scene.children[0];
    const worldPos = new THREE.Vector3();
    water_bubbles.getWorldPosition(worldPos);

    // Initialize arrays using maxCount!
    this.basePositions = new Float32Array(this.maxCount * 3);
    const positions = new Float32Array(this.maxCount * 3);
    const sizes = new Float32Array(this.maxCount);
    const speeds = new Float32Array(this.maxCount);
    const offsets = new Float32Array(this.maxCount);
    const scales = new Float32Array(this.maxCount * 3);

    for (let i = 0; i < this.maxCount; i++) {
      // Store a normalized position (-0.5 to 0.5)
      this.basePositions[i * 3 + 0] = Math.random() - 0.5;
      this.basePositions[i * 3 + 1] = Math.random() - 0.5;
      this.basePositions[i * 3 + 2] = Math.random() - 0.5;

      offsets[i] = Math.random();

      scales[i * 3 + 0] = 0.8 + Math.random() * 0.8;
      scales[i * 3 + 1] = 0.8 + Math.random() * 0.8;
      scales[i * 3 + 2] = 0.8 + Math.random() * 0.8;
    }

    const geometry = new THREE.SphereGeometry(1, 16, 16);

    geometry.setAttribute(
      "aPosition",
      new THREE.InstancedBufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "aSize",
      new THREE.InstancedBufferAttribute(sizes, 1),
    );
    geometry.setAttribute(
      "aSpeed",
      new THREE.InstancedBufferAttribute(speeds, 1),
    );
    geometry.setAttribute(
      "aOffset",
      new THREE.InstancedBufferAttribute(offsets, 1),
    );
    geometry.setAttribute(
      "aScale",
      new THREE.InstancedBufferAttribute(scales, 3),
    );

    const waterBubblesUniforms = {
      uTime: { value: 0 },
      uBoxHeight: { value: this.params.boxHeight },
    };

    // 4. Instantiate the Material
    this.waterBubblesMaterial = new MeshDefaultMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.1,
      transmission: 0.5,
      uniforms: waterBubblesUniforms,
      vertex: {
        header: vertexHeaderWaterBubbles,
        main: vertexMainWaterBubbles,
      },
      fragment: {
        header: fragmentHeaderWaterBubbles,
        main: fragmentMainWaterBubbles,
      },
    });

    // Create mesh with max capacity
    this.bubbles = new THREE.InstancedMesh(
      geometry,
      this.waterBubblesMaterial,
      this.maxCount,
    );


    // Set active count to your initial param
    this.bubbles.count = this.params.count;
    // this.bubbles.position.copy(worldPos);

    this.bubbles.position.set(worldPos.x, worldPos.y + 0.2, worldPos.z);
    this.world.scene.add(this.bubbles);

    this.refreshAttributes();
  }

  refreshAttributes() {
    if (!this.bubbles) return;

    // Update how many bubbles we actually draw
    this.bubbles.count = Math.floor(this.params.count);

    const geometry = this.bubbles.geometry;
    const positions = geometry.attributes.aPosition.array as Float32Array;
    const sizes = geometry.attributes.aSize.array as Float32Array;
    const speeds = geometry.attributes.aSpeed.array as Float32Array;

    // We must iterate over all active instances to update their properties
    for (let i = 0; i < this.bubbles.count; i++) {
      // Multiply the saved relative position by the current box dimensions
      positions[i * 3 + 0] =
        this.basePositions[i * 3 + 0] * this.params.boxWidth;
      positions[i * 3 + 1] =
        this.basePositions[i * 3 + 1] * this.params.boxHeight + 1.6;
      positions[i * 3 + 2] =
        this.basePositions[i * 3 + 2] * this.params.boxDepth;

      sizes[i] =
        this.params.minSize +
        Math.random() * (this.params.maxSize - this.params.minSize);
      speeds[i] =
        this.params.minSpeed +
        Math.random() * (this.params.maxSpeed - this.params.minSpeed);
    }

    // Flag buffers for WebGL upload
    geometry.attributes.aPosition.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aSpeed.needsUpdate = true;

    if (this.waterBubblesMaterial) {
      this.waterBubblesMaterial.setUniform("uBoxHeight", this.params.boxHeight);
    }
  }

  update() {
    const delta = this.world.ticker.delta;
    if (this.waterBubblesMaterial && this.waterBubblesMaterial.shader) {
      const currentTime = this.waterBubblesMaterial.shader.uniforms.uTime.value;
      this.waterBubblesMaterial.setUniform("uTime", currentTime + delta);
    }
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "💦 Water Bubbles",
      expanded: false,
    });

    // --- INSTANCE COUNT ---
    const countFolder = this.debugPanel.addFolder({ title: "Density" });
    countFolder
      .addBinding(this.params, "count", { min: 0, max: this.maxCount, step: 1 })
      .on("change", () => this.refreshAttributes());

    // --- TRANSFORM CONTROLS ---
    const transformFolder = this.debugPanel.addFolder({
      title: "Transform (Position)",
    });
    transformFolder.addBinding(this.bubbles.position, "x", {
      label: "X Position",
    });
    transformFolder.addBinding(this.bubbles.position, "y", {
      label: "Y Position",
    });
    transformFolder.addBinding(this.bubbles.position, "z", {
      label: "Z Position",
    });

    // --- AREA / BOX CONTROLS ---
    const areaFolder = this.debugPanel.addFolder({
      title: "Spawn Area Bounds",
    });
    areaFolder
      .addBinding(this.params, "boxWidth", { min: 0.1, max: 20, step: 0.1 })
      .on("change", () => this.refreshAttributes());
    areaFolder
      .addBinding(this.params, "boxHeight", { min: 0.1, max: 20, step: 0.1 })
      .on("change", () => this.refreshAttributes());
    areaFolder
      .addBinding(this.params, "boxDepth", { min: 0.1, max: 20, step: 0.1 })
      .on("change", () => this.refreshAttributes());

    // --- PHYSICS & SIZE CONTROLS ---
    const physicsFolder = this.debugPanel.addFolder({
      title: "Behavior & Size",
    });
    physicsFolder
      .addBinding(this.params, "minSize", { min: 0.001, max: 0.5, step: 0.001 })
      .on("change", () => this.refreshAttributes());
    physicsFolder
      .addBinding(this.params, "maxSize", { min: 0.01, max: 1.0, step: 0.001 })
      .on("change", () => this.refreshAttributes());
    physicsFolder
      .addBinding(this.params, "minSpeed", { min: 0.1, max: 5.0, step: 0.1 })
      .on("change", () => this.refreshAttributes());
    physicsFolder
      .addBinding(this.params, "maxSpeed", { min: 0.1, max: 10.0, step: 0.1 })
      .on("change", () => this.refreshAttributes());
  }
}
