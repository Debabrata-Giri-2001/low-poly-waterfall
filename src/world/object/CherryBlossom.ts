import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class CherryBlossom {
  world: World;
  debugPanel?: DebugPanel;

  private params = {
    // Wind Parameters
    windSpeed: 1.0,
    windStrength: 0.2,
    windDensity: 0.5,
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
    const cherryblossom = this.world.resources.cherry_blossom.scene;

    const getWindShader = (randomOffset: number) => {
      return (shader: any) => {
        shader.uniforms.uTime = this.windUniforms.uTime;
        shader.uniforms.uWindSpeed = this.windUniforms.uWindSpeed;
        shader.uniforms.uWindStrength = this.windUniforms.uWindStrength;
        shader.uniforms.uWindDensity = this.windUniforms.uWindDensity;
        
        shader.uniforms.uRandomOffset = { value: randomOffset };

        shader.vertexShader =
          `
          uniform float uTime;
          uniform float uWindSpeed;
          uniform float uWindStrength;
          uniform float uWindDensity;
          uniform float uRandomOffset;
          ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
          #include <begin_vertex>
          
          // Calculate the actual world position of this specific mesh
          vec3 meshWorldPos = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

          // Generate a guaranteed unique noise seed using the JS Math.random() value
          float uniqueNoise = uRandomOffset * 100.0;
          
          // 3. Create a sweeping directional wave field (using real world coordinates)
          float mainWave = sin(uTime * uWindSpeed + (meshWorldPos.x * uWindDensity) + (meshWorldPos.z * uWindDensity) + uniqueNoise);
          
          // 4. Create a high-frequency micro-shiver/flutter wave
          float flutterWave = cos(uTime * uWindSpeed * 3.5 + uniqueNoise * 1.5) * 0.25;
          
          // 5. Combine waves
          float finalWave = (mainWave + flutterWave) * uWindStrength;
          
          // Displace coordinates
          transformed.x += finalWave * position.y;
          transformed.z += finalWave * 0.4 * position.y;
          `
        );
      };
    };

    // Traverse the asset and inject the logic
    cherryblossom.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.name.startsWith("Icosphere") && child.material) {
          
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat: any) => {
              const newMat = mat.clone();
              // Pass a unique random number to this specific material instance
              newMat.onBeforeCompile = getWindShader(Math.random());
              return newMat;
            });
          } else {
            child.material = child.material.clone();
            // Pass a unique random number to this specific material instance
            child.material.onBeforeCompile = getWindShader(Math.random());
          }
        }
      }
    });

    this.world.scene.add(cherryblossom);
  }
  update() {
    const delta = this.world.ticker.delta;
    this.windUniforms.uTime.value += delta;
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "🌼 Cherry Blossom",
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
