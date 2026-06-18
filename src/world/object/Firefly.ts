import * as THREE from "three";
import { World } from "../World";

import fragment from "../shader/firefly/firefly_frag.glsl?raw";
import vertex from "../shader/firefly/firefly_vert.glsl?raw";
import type { DebugPanel } from "../utils/Types";

export class Firefly {
  world: World;
  debugPanel?: DebugPanel;

  private fireFlys!: THREE.Points;
  public fireflyGeometry!: THREE.BufferGeometry;

  private poolsPositions: THREE.Vector3[] = [];

  private params = {
    firefliesPerPool: 10,
    radius: 0.5,
    heightOffset: 0.15,
    randomHeight: 0.05,
    size: 1.0,
  };

  constructor() {
    this.world = World.getInstance();

    const GLTF = this.world.resources.lamp_frame.scene;

    if (GLTF) {
      const bodies = GLTF.children;
      this.poolsPositions = [];

      bodies.forEach((body: THREE.Object3D) => {
        if (body.name.includes("wood_cap")) {
          const worldPos = new THREE.Vector3();

          body.getWorldPosition(worldPos);

          this.poolsPositions.push(worldPos);
        }
      });

      this.generateFireflies();
      this.debug();
    } else {
      console.warn("❌ pool_light asset not found");
    }

    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  private generateFireflies() {

    if (this.poolsPositions.length === 0) {
      console.warn("No 'wood_cap' meshes found! Fireflies won't spawn.");
      return;
    }
    
    const total = this.poolsPositions.length * this.params.firefliesPerPool;

    this.fireflyGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(total * 3);
    const scales = new Float32Array(total);

    let index = 0;

    for (let i = 0; i < this.poolsPositions.length; i++) {
      const poolPos = this.poolsPositions[i];
      for (let j = 0; j < this.params.firefliesPerPool; j++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.params.radius;

        const x = poolPos.x + Math.cos(angle) * radius;
        const z = poolPos.z + Math.sin(angle) * radius;

        const y =
          poolPos.y +
          this.params.heightOffset +
          Math.random() * this.params.randomHeight;

        positions[index * 3 + 0] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;

        scales[index] = Math.random() * 1 + 0.5;

        index++;
      }
    }

    this.fireflyGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    this.fireflyGeometry.setAttribute(
      "aScale",
      new THREE.BufferAttribute(scales, 1),
    );

    this.fireFlys = new THREE.Points(
      this.fireflyGeometry,
      new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uResolution: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight),
          },
          uTexture: {
            value: this.world.resources.particle,
          },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uSize: { value: this.params.size }, // Bind to params
        },
        vertexShader: vertex,
        fragmentShader: fragment,
      })
    );

    this.world.scene.add(this.fireFlys);
  }

  private rebuildFireflies() {
    if (this.fireFlys) {
      this.fireFlys.geometry.dispose();
      (this.fireFlys.material as THREE.Material).dispose();
      this.world.scene.remove(this.fireFlys);
    }
    
    this.generateFireflies();
  }

  update() {
    const delta = this.world.ticker.delta;
    if (this.fireFlys && this.fireFlys.material) {
      (this.fireFlys.material as THREE.ShaderMaterial).uniforms.uTime.value += delta;
    }
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "✨ Fire flies",
      expanded: false,
    });

    const visualsFolder = this.debugPanel.addFolder({ title: "Visuals" });
    
    visualsFolder.addBinding(this.params, "size", {
      min: 1,
      max: 100,
      step: 0.1,
      label: "Particle Size"
    }).on("change", (ev: { value: number }) => {
      if (this.fireFlys) {
        (this.fireFlys.material as THREE.ShaderMaterial).uniforms.uSize.value = ev.value;
      }
    });

    const spawnFolder = this.debugPanel.addFolder({ title: "Spawn Settings" });

    spawnFolder.addBinding(this.params, "firefliesPerPool", {
      min: 1,
      max: 100,
      step: 1,
      label: "Count/Pool"
    }).on("change", () => this.rebuildFireflies());

    spawnFolder.addBinding(this.params, "radius", {
      min: 0.1,
      max: 10,
      step: 0.05,
    }).on("change", () => this.rebuildFireflies());

    spawnFolder.addBinding(this.params, "heightOffset", {
      min: -2,
      max: 10,
      step: 0.05,
    }).on("change", () => this.rebuildFireflies());

    spawnFolder.addBinding(this.params, "randomHeight", {
      min: 0,
      max: 5,
      step: 0.05,
    }).on("change", () => this.rebuildFireflies());

    this.world.debug.addButtons(
      this.debugPanel,
      {
        Rebuild: () => {
          this.rebuildFireflies();
        },
      },
      "Actions"
    );
  }
}