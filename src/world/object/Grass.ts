import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class Grass {
  world: World;
  debugPanel?: DebugPanel;

  private params = {
    count: 2000,
    
    // Customization parameters
    globalScale: 0.35,          // Scale all
    randomScaleMin: 0.1,        // Random size (minimum)
    randomScaleMax: 1.1,        // Random size (maximum)
    randomRotation: false,      // Random rotation toggle
    rotationAngle: 0,           // Fixed fallback rotation angle
    color: "#c1ff6b",

    // Wind Parameters
    windSpeed: 2.0,
    windStrength: 0.15,
    windDensity: 1.0,
  };

  // Uniforms to share between CPU and GPU
  private windUniforms = {
    uTime: { value: 0 },
    uWindSpeed: { value: 2.0 },
    uWindStrength: { value: 0.15 },
    uWindDensity: { value: 1.0 },
  };

  grassMesh!: THREE.InstancedMesh;

  constructor() {
    this.world = World.getInstance();
    this.createGrass();
    this.debug();

    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  private rebuildGrass() {
    if (this.grassMesh) {
      this.grassMesh.geometry.dispose();

      if (Array.isArray(this.grassMesh.material)) {
        this.grassMesh.material.forEach((m) => m.dispose());
      } else {
        this.grassMesh.material.dispose();
      }

      this.world.scene.remove(this.grassMesh);
    }

    this.createGrass();
  }

  createGrass() {
    const grassGround = this.world.resources.grasses.scene;
    const grassBlade = this.world.resources.grass_blade_1.scene;
    
    // 1. Find the Ground Mesh
    let groundMesh: THREE.Mesh | any = null;
    grassGround.traverse((child: any) => {
      if (child.isMesh && !groundMesh) { 
        groundMesh = child;
      }
    });

    if (!groundMesh) return;

    // 2. Find and clone the Grass Blade Mesh/Material
    let bladeGeometry: THREE.BufferGeometry | null = null;
    let bladeMaterial: any = null;

    grassBlade.traverse((child: any) => {
      if (child.isMesh && !bladeGeometry) {
        bladeGeometry = child.geometry;
        bladeMaterial = child.material.clone();
        
        if (bladeMaterial && bladeMaterial.color) {
           bladeMaterial.color.set(this.params.color);
        }
      }
    });

    if (!bladeGeometry || !bladeMaterial) {
      console.warn("Could not find a mesh in the grassBlade model.");
      return;
    }

    // --- INJECT ADVANCED WIND SHADER LOGIC ---
    bladeMaterial.onBeforeCompile = (shader: any) => {
      shader.uniforms.uTime = this.windUniforms.uTime;
      shader.uniforms.uWindSpeed = this.windUniforms.uWindSpeed;
      shader.uniforms.uWindStrength = this.windUniforms.uWindStrength;
      shader.uniforms.uWindDensity = this.windUniforms.uWindDensity;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uWindSpeed;
        uniform float uWindStrength;
        uniform float uWindDensity;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        
        // 1. Extract this individual blade's position on the ground from the instance matrix
        // Column [3] of the matrix contains the unique X, Y, Z translation coordinates.
        #ifdef USE_INSTANCING
          vec3 instancePos = instanceMatrix[3].xyz;
        #else
          vec3 instancePos = vec3(0.0);
        #endif

        // 2. Generate an "invisible" unique noise offset per blade based on its coordinates
        float uniqueNoise = sin(instancePos.x * 45.0 + instancePos.z * 25.0) * 20.0;
        
        // 3. Create a sweeping directional wave field
        float mainWave = sin(uTime * uWindSpeed + (instancePos.x * uWindDensity) + (instancePos.z * uWindDensity) + uniqueNoise);
        
        // 4. Create a high-frequency micro-shiver/flutter wave to simulate air turbulence
        float flutterWave = cos(uTime * uWindSpeed * 3.5 + uniqueNoise * 1.5) * 0.25;
        
        // 5. Combine waves and scale by master parameter configurations
        float finalWave = (mainWave + flutterWave) * uWindStrength;
        
        // Displace coordinates; position.y ensures roots stay pinned while tips bend
        transformed.x += finalWave * position.y;
        transformed.z += finalWave * 0.4 * position.y;
        `
      );
    };

    groundMesh.updateMatrixWorld(true);
    const sampler = new MeshSurfaceSampler(groundMesh).build();

    this.grassMesh = new THREE.InstancedMesh(
      bladeGeometry,
      bladeMaterial,
      this.params.count,
    );

    const dummy = new THREE.Object3D();
    const _position = new THREE.Vector3();
    const _normal = new THREE.Vector3();

    for (let i = 0; i < this.params.count; i++) {
      sampler.sample(_position, _normal);
      _position.applyMatrix4(groundMesh.matrixWorld);
      dummy.position.copy(_position);

      if (this.params.randomRotation) {
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      } else {
        dummy.rotation.set(0, 0, 0);
        // dummy.rotation.set(-1.5, 0, 0);
      }
      
      const randomFactor = THREE.MathUtils.lerp(this.params.randomScaleMin, this.params.randomScaleMax, Math.random());
      const finalScale = randomFactor * this.params.globalScale;
      dummy.scale.setScalar(finalScale);

      dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, dummy.matrix);
    }

    this.grassMesh.castShadow = true;
    this.world.scene.add(this.grassMesh);
  }

  update() {
    const delta = this.world.ticker.delta ?? 0.016;
    this.windUniforms.uTime.value += delta;
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "🦗 Grass",
      expanded: false,
    });

    this.debugPanel
      .addBinding(this.params, "count", { min: 100, max: 50000, step: 100 })
      .on("change", () => this.rebuildGrass());

    this.debugPanel
      .addBinding(this.params, "globalScale", { label: "Scale All", min: 0.001, max: 5, step: 0.01 })
      .on("change", () => this.rebuildGrass());

    this.debugPanel
      .addBinding(this.params, "randomScaleMin", { label: "Min Size", min: 0.1, max: 2, step: 0.1 })
      .on("change", () => this.rebuildGrass());

    this.debugPanel
      .addBinding(this.params, "randomScaleMax", { label: "Max Size", min: 0.1, max: 3, step: 0.1 })
      .on("change", () => this.rebuildGrass());

    this.debugPanel
      .addBinding(this.params, "randomRotation", { label: "Random Rotation" })
      .on("change", () => this.rebuildGrass());

    this.debugPanel
      .addBinding(this.params, "rotationAngle", { label: "Rotation Angle", min: 0, max: 360, step: 0.1 })
      .on("change", () => this.rebuildGrass());

    const windFolder = this.debugPanel.addFolder({ title: "💨 Wind Controls", expanded: true });
    
    windFolder
      .addBinding(this.params, "windSpeed", { min: 0.1, max: 10, step: 0.1 })
      .on("change", () => { this.windUniforms.uWindSpeed.value = this.params.windSpeed; });

    windFolder
      .addBinding(this.params, "windStrength", { min: 0.0, max: 2.0, step: 0.01 })
      .on("change", () => { this.windUniforms.uWindStrength.value = this.params.windStrength; });

    windFolder
      .addBinding(this.params, "windDensity", { min: 0.1, max: 5.0, step: 0.1 })
      .on("change", () => { this.windUniforms.uWindDensity.value = this.params.windDensity; });

    this.debugPanel
      .addBinding(this.params, "color", { view: "color" })
      .on("change", () => {
        const material = this.grassMesh.material;
        if (material && (material as any).color) {
          (material as any).color.set(this.params.color);
        }
      });
  }
}