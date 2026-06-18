import * as THREE from "three";
import { World } from "../World";

export type MeshDefaultMaterialOptions =
  THREE.MeshPhysicalMaterialParameters & {
    uniforms?: Record<string, THREE.IUniform>;

    vertex?: {
      header?: string;
      main?: string;
    };

    fragment?: {
      header?: string;
      main?: string;
    };

    hasCoreShadows?: boolean;
    hasDropShadows?: boolean;
    hasLightBounce?: boolean;
    hasFog?: boolean;
    hasReveal?: boolean;
  };

export class MeshDefaultMaterial extends THREE.MeshStandardMaterial {
  world: World;

  shader: any = null;

  customUniforms: Record<string, THREE.IUniform>;

  vertexHeader: string;
  vertexMain: string;

  fragmentHeader: string;
  fragmentMain: string;

  constructor(parameters: MeshDefaultMaterialOptions = {}) {
    const {
      uniforms = {},

      vertex = {},
      fragment = {},

      hasCoreShadows = true,
      hasDropShadows = true,
      hasLightBounce = true,
      hasFog = true,
      hasReveal = true,

      ...materialParams
    } = parameters;

    super(materialParams);

    this.world = World.getInstance();

    this.customUniforms = uniforms;

    this.vertexHeader = vertex.header ?? "";

    this.vertexMain = vertex.main ?? "";

    this.fragmentHeader = fragment.header ?? "";

    this.fragmentMain = fragment.main ?? "";

    //
    // Future systems
    //
    this.userData.hasCoreShadows = hasCoreShadows;

    this.userData.hasDropShadows = hasDropShadows;

    this.userData.hasLightBounce = hasLightBounce;

    this.userData.hasFog = hasFog;

    this.userData.hasReveal = hasReveal;

    this.onBeforeCompile = (shader) => {
      this.shader = shader;

      //
      // Add uniforms
      //
      Object.assign(shader.uniforms, this.customUniforms);

      //
      // Vertex header
      //
      if (this.vertexHeader.length > 0) {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `
            #include <common>

            ${this.vertexHeader}
            `,
        );
      }

      //
      // Vertex body
      //
      if (this.vertexMain.length > 0) {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
            #include <begin_vertex>

            ${this.vertexMain}
            `,
        );
      }

      //
      // Fragment header
      //
      if (this.fragmentHeader.length > 0) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `
            #include <common>

            ${this.fragmentHeader}
            `,
        );
      }

      //
      // Fragment body
      //
      if (this.fragmentMain.length > 0) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `
            #include <color_fragment>

            ${this.fragmentMain}
            `,
        );
      }
    };

    this.world.ticker.events.on("tick", this.update);
  }

  setUniform(name: string, value: any) {
    if (!this.shader) return;

    if (!this.shader.uniforms[name]) return;

    this.shader.uniforms[name].value = value;
  }

  update = () => {
    //
    // Optional auto-time support
    //
    if (this.shader && this.shader.uniforms.time) {
      this.shader.uniforms.time.value = this.world.ticker.elapsed;
    }
  };
}
