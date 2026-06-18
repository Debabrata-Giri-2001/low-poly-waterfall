import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class Flowers {
  world: World;
  debugPanel?: DebugPanel;

  private params = {
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

  constructor() {
    this.world = World.getInstance();
    this.createFlower();
    this.debug();

    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  createFlower() {
    const flowersAsset = this.world.resources.flowers.scene;

    // A shared compile function so we don't duplicate code if there are multiple materials
    const injectWindShader = (shader: any) => {
      shader.uniforms.uTime = this.windUniforms.uTime;
      shader.uniforms.uWindSpeed = this.windUniforms.uWindSpeed;
      shader.uniforms.uWindStrength = this.windUniforms.uWindStrength;
      shader.uniforms.uWindDensity = this.windUniforms.uWindDensity;

      shader.vertexShader =
        `
        uniform float uTime;
        uniform float uWindSpeed;
        uniform float uWindStrength;
        uniform float uWindDensity;
        ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        
        // 1. Extract this individual blade's position from the instance matrix
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
        `,
      );
    };

    // Traverse the asset and inject the logic into the EXISTING materials
    flowersAsset.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          // If the mesh has an array of materials (multi-material setups)
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              mat.onBeforeCompile = injectWindShader;
            });
          } else {
            // If it has just one single material from Blender
            child.material.onBeforeCompile = injectWindShader;
          }
        }
      }
    });

    this.world.scene.add(flowersAsset);
  }
  update() {
    const delta = this.world.ticker.delta;
    this.windUniforms.uTime.value += delta;
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "🌼 Flowers",
      expanded: false,
    });

    const windFolder = this.debugPanel.addFolder({
      title: "💨 Wind Controls",
      expanded: true,
    });

    windFolder
      .addBinding(this.params, "windSpeed", { min: 0.1, max: 10, step: 0.1 })
      .on("change", () => {
        this.windUniforms.uWindSpeed.value = this.params.windSpeed;
      });

    windFolder
      .addBinding(this.params, "windStrength", {
        min: 0.0,
        max: 2.0,
        step: 0.01,
      })
      .on("change", () => {
        this.windUniforms.uWindStrength.value = this.params.windStrength;
      });

    windFolder
      .addBinding(this.params, "windDensity", { min: 0.1, max: 5.0, step: 0.1 })
      .on("change", () => {
        this.windUniforms.uWindDensity.value = this.params.windDensity;
      });
  }
}
