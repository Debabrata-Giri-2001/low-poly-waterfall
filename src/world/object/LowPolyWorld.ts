import { World } from "../World";
import * as THREE from "three";

import type { DebugPanel } from "../utils/Types";
import { MeshDefaultMaterial } from "../Materials/MeshDefaultMaterial";

type ResourceConfig = {
  name: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  material?: THREE.Material;
  meshMaterials?: { [meshName: string]: THREE.Material };
};

export class LowPolyWorld {
  world: World;
  debugPanel?: DebugPanel;

  flowMaterial!: MeshDefaultMaterial;

  rocks: Array<{ position: THREE.Vector3; radius: number }> = [];

  constructor() {
    this.world = World.getInstance();

    this.init();
    this.debug();
    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  init() {
    const resourcesToLoad: ResourceConfig[] = [
      // { name: "ground", receiveShadow: true, },
      { name: "rocks", castShadow: true, receiveShadow: true },
      { name: "grasses", receiveShadow: true },
      { name: "wooden_fence", castShadow: true },
      { name: "pole", castShadow: true },
      { name: "lamp_frame", castShadow: true },
      { name: "lamp_light", castShadow: true },
      { name: "flowers", castShadow: true },
      { name: "grass", castShadow: true },
    ];

    // resourcesToLoad.forEach((config) => this.loadAndAddResource(config));

    resourcesToLoad.forEach((config) => {
      // Special handling for rocks
      if (config.name === "rocks") {
        this.loadRocksAndExtractData(config);
      } else {
        this.loadAndAddResource(config);
      }
    });
  }

private loadRocksAndExtractData(_config: ResourceConfig) {
    const resource = this.world.resources["rocks"];
    if (!resource || !resource.scene) return;

    const rocksScene = resource.scene;
    const WATER_SURFACE_Y = 0.3;
    const WATER_SURFACE_THRESHOLD = 0.5;
    const MAX_ROCK_RADIUS = 0.5;  // ← FILTER OUT HUGE ROCKS
    const MIN_ROCK_RADIUS = 0.05;  // ← FILTER OUT TINY ROCKS

    rocksScene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        
        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = bbox.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) / 2;
        
        // Filter by Y position AND radius
        if (
          worldPos.y < WATER_SURFACE_Y + WATER_SURFACE_THRESHOLD &&
          radius >= MIN_ROCK_RADIUS &&
          radius <= MAX_ROCK_RADIUS
        ) {
          this.rocks.push({
            position: worldPos,
            radius: radius,
          });
          
        } else if (radius > MAX_ROCK_RADIUS) {}
      }
    });

    this.world.scene.add(rocksScene);
}

  private loadAndAddResource({
    name,
    castShadow = false,
    receiveShadow = false,
    material,
    meshMaterials,
  }: ResourceConfig) {
    const resource = this.world.resources[name];

    if (!resource || !resource.scene) {
      console.warn(`Resource "${name}" not found in world resources.`);
      return;
    }

    const sceneObj = resource.scene;

    // 2. The traversal now checks for custom materials
    sceneObj.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;

        // Check if we have a specific material for this exact mesh name (Level 2)
        if (meshMaterials && meshMaterials[mesh.name]) {
          mesh.material = meshMaterials[mesh.name];
        }
        // Otherwise, check if we have a general material for the whole model (Level 1)
        else if (material) {
          mesh.material = material;
        }
      }
    });

    this.world.scene.add(sceneObj);
  }

  update() {}

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;
  }
}
