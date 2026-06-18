import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export class Rendering {
  world: World;
  renderer!: THREE.WebGLRenderer;
  postProcessing!: EffectComposer;
  bloomPass!: UnrealBloomPass;
  stats?: {
    feed: {
      drawCalls: string;
      triangles: string;
      geometries: string;
      textures: string;
    };
    update: () => void;
  };
  debugPanel?: DebugPanel;

  depthTexture!: THREE.DepthTexture;
  renderTarget!: THREE.WebGLRenderTarget;

  constructor() {
    this.world = World.getInstance();
  }

  start() {
    this.world.ticker.events.on(
      "tick",
      () => {
        this.render();
      },
      998,
    );

    this.world.viewport.events.on("change", () => {
      this.resize();
    });
  }

  async setRenderer(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      powerPreference: "high-performance",
      antialias: this.world.viewport.pixelRatio < 2,
    });
    this.renderer.setSize(
      this.world.viewport.width,
      this.world.viewport.height,
    );
    this.renderer.setPixelRatio(this.world.viewport.pixelRatio);
    this.renderer.sortObjects = false;

    this.renderer.domElement.classList.add("experience");
    this.renderer.shadowMap.enabled = true;

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setOpaqueSort((a, b) => {
      return (a.renderOrder ?? 0) - (b.renderOrder ?? 0);
    });
    this.renderer.setTransparentSort((a, b) => {
      return (a.renderOrder ?? 0) - (b.renderOrder ?? 0);
    });

    this.depthTexture = new THREE.DepthTexture(
      window.innerWidth,
      window.innerHeight,
    );
    this.depthTexture.type = THREE.UnsignedShortType;

    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        depthTexture: this.depthTexture,
        depthBuffer: true,
      },
    );

    // Make the renderer control the ticker
    this.renderer.setAnimationLoop((elapsedTime) => {
      this.world.ticker.update(elapsedTime);
    });
  }

  setPostProcessing() {
    this.postProcessing = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.world.scene, this.world.view.camera);
    this.postProcessing.addPass(renderPass);

    const bloomSize = {
      width: Math.floor(this.world.viewport.width * 0.25),
      height: Math.floor(this.world.viewport.height * 0.25),
    };

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(bloomSize.width, bloomSize.height),
      0.15,
      0.3,
      0.8,
    );

    this.bloomPass.threshold = 1.2;
    this.bloomPass.strength = 0.5;
    this.bloomPass.radius = 1.0;
    this.postProcessing.addPass(this.bloomPass);

    this.debug();
  }

  resize() {
    this.renderer.setSize(
      this.world.viewport.width,
      this.world.viewport.height,
    );
    this.renderer.setPixelRatio(this.world.viewport.pixelRatio);

    if (this.postProcessing) {
      this.postProcessing.setSize(
        this.world.viewport.width,
        this.world.viewport.height,
      );
    }
  }

  async render() {
    this.world.view.camera.layers.disable(1);

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.world.scene, this.world.view.camera);

    this.world.view.camera.layers.enable(1);

    this.renderer.setRenderTarget(null);
    this.postProcessing?.render();

    if (this.stats) this.stats.update();
  }

  debug() {
    if (this.world.debug?.active && this.world.debug?.panel) {
      this.debugPanel = this.world.debug.panel.addFolder({
        title: "📸 Rendering",
        expanded: false,
      });

      //bloom control
      const bloomFolder = this.debugPanel.addFolder({ title: "Bloom" });

      // post-processing control
      bloomFolder.addBinding(this.bloomPass, "threshold", {
        label: "Bloom Threshold",
        min: 0,
        max: 5,
        step: 0.1,
      });
      bloomFolder.addBinding(this.bloomPass, "strength", {
        label: "Bloom Strength",
        min: 0,
        max: 5,
        step: 0.1,
      });
      bloomFolder.addBinding(this.bloomPass, "radius", {
        label: "Bloom Radius",
        min: 0,
        max: 5,
        step: 0.1,
      });
    }
  }
}
