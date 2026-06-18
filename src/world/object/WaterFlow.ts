import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";
import { MeshDefaultMaterial } from "../Materials/MeshDefaultMaterial";
import { fragmentHeaderWaterFlowMap, fragmentMainWaterFlowMap, vertexHeaderWaterFlowMap, vertexMainWaterFlowMap } from "../shader/defultShader/Shader";


// ─────────────────────────────────────────────────────────────────────────────
export class WaterFlow {
  world: World;
  debugPanel?: DebugPanel;
  flowMaterial!: MeshDefaultMaterial;

  rockPositions!: THREE.Vector3[];
  rockRadii!: Float32Array;
  maxRocks = 50;

  // Lily pad position buffer — updated every frame from LilyPad
  lilyPadPositions!: THREE.Vector3[];
  maxLilyPads = 20;

  params = {
    // Colors
    colorDeep:    "#0d7fb5",
    colorShallow: "#6de8f5",
    colorFoam:    "#e8f8ff",

    // Flow
    flowSpeed:    0.88,
    flowScale:    0.8,
    flowStrength: 0.25,
    flowContrast: 6.5,

    // Dual-scroll
    noiseScale:    3.4,
    noiseStrength: 0.10,

    // Shore foam
    shoreFoamWidth: 0.4,
    shoreFoamSharp: 0.75,

    // Rock foam
    rockFoamStrength:     1.0,
    rockFoamRadius:       0.2,
    rockFoamScale:        20.0,
    rockFoamSpeed:        1.5,
    rockFoamThreshold:    0.18,
    rockRadiusMultiplier: 0.6,
    enableRockFoam:       true,

    // Lily pad foam
    lilyPadFoamStrength:  0.8,
    lilyPadFoamRadius:    0.1,  // foam zone width around each pad
    lilyPadRadius:        0.1,  // approximate pad mesh radius in world units
    lilyPadFoamScale:     14.0,
    lilyPadFoamSpeed:     1.2,
    lilyPadFoamThreshold: 0.08,
    enableLilyPadFoam:    true,
  };

  constructor() {
    this.world = World.getInstance();
    this.createFlowMaterial();
    this.debug();
    this.world.ticker.events.on("tick", () => this.update());
  }

  createFlowMaterial() {
    const dudvMapTexture = this.world.resources.dudvMap;
    dudvMapTexture.wrapS = dudvMapTexture.wrapT = THREE.RepeatWrapping;

    // Rock buffers
    this.rockPositions = new Array(this.maxRocks)
      .fill(null)
      .map(() => new THREE.Vector3());
    this.rockRadii = new Float32Array(this.maxRocks);

    const lowPolyWorld = this.world.lowPolyWorld;
    if (lowPolyWorld?.rocks.length) {
      lowPolyWorld.rocks.forEach((rock, i) => {
        if (i < this.maxRocks) {
          this.rockPositions[i].copy(rock.position);
          this.rockRadii[i] = rock.radius;
        }
      });
    }

    // Lily pad position buffer — pre-fill with zeros, updated each frame
    this.lilyPadPositions = new Array(this.maxLilyPads)
      .fill(null)
      .map(() => new THREE.Vector3());

    const uniforms = {
      uTime:      { value: 0 },
      tDudv:      { value: dudvMapTexture },
      cameraNear: { value: this.world.view.camera.near },
      cameraFar:  { value: this.world.view.camera.far },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

      uColorDeep:    { value: new THREE.Color(this.params.colorDeep) },
      uColorShallow: { value: new THREE.Color(this.params.colorShallow) },
      uColorFoam:    { value: new THREE.Color(this.params.colorFoam) },

      flowSpeed:    { value: this.params.flowSpeed },
      flowScale:    { value: this.params.flowScale },
      flowStrength: { value: this.params.flowStrength },
      flowContrast: { value: this.params.flowContrast },
      noiseScale:    { value: this.params.noiseScale },
      noiseStrength: { value: this.params.noiseStrength },
      shoreFoamWidth: { value: this.params.shoreFoamWidth },
      shoreFoamSharp: { value: this.params.shoreFoamSharp },

      // Rock foam
      rockPositions:        { value: this.rockPositions },
      rockRadii:            { value: this.rockRadii },
      numRocks:             { value: lowPolyWorld?.rocks.length || 0 },
      rockFoamStrength:     { value: this.params.rockFoamStrength },
      rockFoamRadius:       { value: this.params.rockFoamRadius },
      rockFoamScale:        { value: this.params.rockFoamScale },
      rockFoamSpeed:        { value: this.params.rockFoamSpeed },
      rockFoamThreshold:    { value: this.params.rockFoamThreshold },
      rockRadiusMultiplier: { value: this.params.rockRadiusMultiplier },
      enableRockFoam:       { value: this.params.enableRockFoam ? 1.0 : 0.0 },

      // Lily pad foam
      lilyPadPositions:     { value: this.lilyPadPositions },
      numLilyPads:          { value: 0 }, // filled in update() once LilyPad is ready
      lilyPadFoamStrength:  { value: this.params.lilyPadFoamStrength },
      lilyPadFoamRadius:    { value: this.params.lilyPadFoamRadius },
      lilyPadRadius:        { value: this.params.lilyPadRadius },
      lilyPadFoamScale:     { value: this.params.lilyPadFoamScale },
      lilyPadFoamSpeed:     { value: this.params.lilyPadFoamSpeed },
      lilyPadFoamThreshold: { value: this.params.lilyPadFoamThreshold },
      enableLilyPadFoam:    { value: this.params.enableLilyPadFoam ? 1.0 : 0.0 },
    };

    this.flowMaterial = new MeshDefaultMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      roughness:    0.4,
      metalness:    0.05,
      transmission: 0.4,
      uniforms,
      vertex:   { header: vertexHeaderWaterFlowMap, main: vertexMainWaterFlowMap },
      fragment:  { header: fragmentHeaderWaterFlowMap, main: fragmentMainWaterFlowMap },
    });

    const waterFlow = this.world.resources.water_flow.scene;
    waterFlow.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.material = this.flowMaterial;
        child.receiveShadow = true;
      }
    });

    this.world.scene.add(waterFlow);
  }

  update() {
    const delta = this.world.ticker.delta;
    if (!this.flowMaterial?.shader) return;

    const u = this.flowMaterial.shader.uniforms;
    this.flowMaterial.setUniform("uTime", u.uTime.value + delta);

    // ── Sync rock positions ──────────────────────────────────
    const lowPolyWorld = this.world.lowPolyWorld;
    if (lowPolyWorld?.rocks.length) {
      lowPolyWorld.rocks.forEach((rock, i) => {
        if (i < this.maxRocks) this.rockPositions[i].copy(rock.position);
      });
      this.flowMaterial.setUniform("rockPositions", this.rockPositions);
    }

    // ── Sync lily pad positions from LilyPad instance ────────
    // world.lilyPad.pads holds the live mesh data after LilyPad runs its update
    const lilyPad = this.world.lilyPad;
    if (lilyPad?.pads.length) {
      const count = Math.min(lilyPad.pads.length, this.maxLilyPads);
      for (let i = 0; i < count; i++) {
        const mesh = lilyPad.pads[i].mesh;
        this.lilyPadPositions[i].set(
          mesh.position.x,
          mesh.position.y,
          mesh.position.z
        );
      }
      this.flowMaterial.setUniform("lilyPadPositions", this.lilyPadPositions);
      this.flowMaterial.setUniform("numLilyPads", count);
    }

    // ── Sync colors ──────────────────────────────────────────
    u.uColorDeep.value.set(this.params.colorDeep);
    u.uColorShallow.value.set(this.params.colorShallow);
    u.uColorFoam.value.set(this.params.colorFoam);

    // ── Sync flow uniforms ───────────────────────────────────
    this.flowMaterial.setUniform("flowSpeed",    this.params.flowSpeed);
    this.flowMaterial.setUniform("flowScale",    this.params.flowScale);
    this.flowMaterial.setUniform("flowStrength", this.params.flowStrength);
    this.flowMaterial.setUniform("flowContrast", this.params.flowContrast);
    this.flowMaterial.setUniform("noiseScale",    this.params.noiseScale);
    this.flowMaterial.setUniform("noiseStrength", this.params.noiseStrength);
    this.flowMaterial.setUniform("shoreFoamWidth", this.params.shoreFoamWidth);
    this.flowMaterial.setUniform("shoreFoamSharp", this.params.shoreFoamSharp);

    // ── Sync rock foam uniforms ──────────────────────────────
    this.flowMaterial.setUniform("rockFoamStrength",     this.params.rockFoamStrength);
    this.flowMaterial.setUniform("rockFoamRadius",       this.params.rockFoamRadius);
    this.flowMaterial.setUniform("rockFoamScale",        this.params.rockFoamScale);
    this.flowMaterial.setUniform("rockFoamSpeed",        this.params.rockFoamSpeed);
    this.flowMaterial.setUniform("rockFoamThreshold",    this.params.rockFoamThreshold);
    this.flowMaterial.setUniform("rockRadiusMultiplier", this.params.rockRadiusMultiplier);
    this.flowMaterial.setUniform("enableRockFoam",       this.params.enableRockFoam ? 1.0 : 0.0);

    // ── Sync lily pad foam uniforms ──────────────────────────
    this.flowMaterial.setUniform("lilyPadFoamStrength",  this.params.lilyPadFoamStrength);
    this.flowMaterial.setUniform("lilyPadFoamRadius",    this.params.lilyPadFoamRadius);
    this.flowMaterial.setUniform("lilyPadRadius",        this.params.lilyPadRadius);
    this.flowMaterial.setUniform("lilyPadFoamScale",     this.params.lilyPadFoamScale);
    this.flowMaterial.setUniform("lilyPadFoamSpeed",     this.params.lilyPadFoamSpeed);
    this.flowMaterial.setUniform("lilyPadFoamThreshold", this.params.lilyPadFoamThreshold);
    this.flowMaterial.setUniform("enableLilyPadFoam",    this.params.enableLilyPadFoam ? 1.0 : 0.0);
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "🌊 Flow Water",
      expanded: false,
    });

    const colorFolder = this.debugPanel.addFolder({ title: "Colors", expanded: false });
    colorFolder.addBinding(this.params, "colorDeep",    { label: "Deep" });
    colorFolder.addBinding(this.params, "colorShallow", { label: "Shallow / Streak" });
    colorFolder.addBinding(this.params, "colorFoam",    { label: "Foam" });

    const flowFolder = this.debugPanel.addFolder({ title: "Flow", expanded: true });
    flowFolder.addBinding(this.params, "flowSpeed",    { label: "Speed",        min: 0.0, max: 1.0, step: 0.01 });
    flowFolder.addBinding(this.params, "flowScale",    { label: "UV Scale",     min: 0.2, max: 5.0, step: 0.1  });
    flowFolder.addBinding(this.params, "flowStrength", { label: "Flowmap Str",  min: 0.0, max: 1.0, step: 0.05 });
    flowFolder.addBinding(this.params, "flowContrast", { label: "Streak sharp", min: 1.0, max: 8.0, step: 0.1  });
    flowFolder.addBinding(this.params, "noiseScale",   { label: "Noise scale",  min: 0.5, max: 8.0, step: 0.1  });
    flowFolder.addBinding(this.params, "noiseStrength",{ label: "Broad blend",  min: 0.0, max: 1.0, step: 0.05 });

    const shoreFolder = this.debugPanel.addFolder({ title: "Shore Foam", expanded: false });
    shoreFolder.addBinding(this.params, "shoreFoamWidth", { label: "Width", min: 0.0, max: 2.0, step: 0.05 });
    shoreFolder.addBinding(this.params, "shoreFoamSharp", { label: "Sharp", min: 0.0, max: 1.0, step: 0.01 });

    const rockFoamFolder = this.debugPanel.addFolder({ title: "Rock Foam", expanded: false });
    rockFoamFolder.addBinding(this.params, "enableRockFoam",       { label: "Enable" });
    rockFoamFolder.addBinding(this.params, "rockFoamStrength",     { label: "Opacity",     min: 0,   max: 2.0, step: 0.1  });
    rockFoamFolder.addBinding(this.params, "rockFoamRadius",       { label: "Radius",      min: 0.1, max: 5.0, step: 0.1  });
    rockFoamFolder.addBinding(this.params, "rockFoamThreshold",    { label: "Amount",      min: 0.0, max: 1.0, step: 0.01 });
    rockFoamFolder.addBinding(this.params, "rockFoamScale",        { label: "Noise scale", min: 0.1, max: 20,  step: 0.1  });
    rockFoamFolder.addBinding(this.params, "rockFoamSpeed",        { label: "Speed",       min: 0.0, max: 5.0, step: 0.1  });
    rockFoamFolder.addBinding(this.params, "rockRadiusMultiplier", { label: "Rock radius", min: 0.1, max: 5.0, step: 0.1  });

    const lilyFoamFolder = this.debugPanel.addFolder({ title: "Lily Pad Foam", expanded: false });
    lilyFoamFolder.addBinding(this.params, "enableLilyPadFoam",    { label: "Enable" });
    lilyFoamFolder.addBinding(this.params, "lilyPadFoamStrength",  { label: "Opacity",     min: 0,    max: 2.0,  step: 0.05 });
    lilyFoamFolder.addBinding(this.params, "lilyPadRadius",        { label: "Pad radius",  min: 0.01, max: 1.0,  step: 0.01 });
    lilyFoamFolder.addBinding(this.params, "lilyPadFoamRadius",    { label: "Foam width",  min: 0.01, max: 1.0,  step: 0.01 });
    lilyFoamFolder.addBinding(this.params, "lilyPadFoamThreshold", { label: "Amount",      min: 0.0,  max: 1.0,  step: 0.01 });
    lilyFoamFolder.addBinding(this.params, "lilyPadFoamScale",     { label: "Noise scale", min: 0.1,  max: 20.0, step: 0.1  });
    lilyFoamFolder.addBinding(this.params, "lilyPadFoamSpeed",     { label: "Speed",       min: 0.0,  max: 5.0,  step: 0.1  });
  }
}