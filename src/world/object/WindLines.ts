import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class WindLines {
  world: World;
  debugPanel?: DebugPanel;

  private lines: {
    mesh: THREE.Mesh;
    progress: number;
    speed: number;
    delay: number;
    timer: number;
    dir: THREE.Vector3;
  }[] = [];

  private params = {
    count: 14,
    speed: 0.25,
    speedMultiplier: 3,
    thickness: 0.10,
    length: 1.5,
    amplitude: 0.3,
    handles: 3,
    divisions: 25,
    area: 10,
    height: 0.5,
    angle: 285,
    spread: 45,
    opacity: 1,
    color: "#ffffff",
    delayMin: 0,
    delayMax: 2,
    waveAngle: 94,
  };

  private windDir = new THREE.Vector3(1, 0, 0);
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private tempAxisY: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  constructor() {
    this.world = World.getInstance();
    this.updateWindDir();

    this.createLines();
    this.debug();
    this.world.ticker.events.on("tick", () => {
      this.update();
    });
  }

  // ---------------- WIND DIRECTION ----------------

  private updateWindDir() {
    const rad = THREE.MathUtils.degToRad(this.params.angle);
    this.windDir.set(Math.cos(rad), 0, Math.sin(rad));
  }

  // ---------------- CREATE LINES ----------------

  private createLines() {
    // OPTIMIZATION: Create the geometry ONLY ONCE and share it among all meshes.
    const sharedGeometry = this.createGeometry(
      this.params.length,
      this.params.handles,
      this.params.amplitude,
      this.params.divisions
    );

    for (let i = 0; i < this.params.count; i++) {
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,

        uniforms: {
          uThickness: { value: this.params.thickness },
          uProgress: { value: Math.random() },
          uColor: { value: new THREE.Color(this.params.color) },
          uOpacity: { value: this.params.opacity },
        },

        vertexShader: `
        attribute float ratio;

        uniform float uThickness;
        uniform float uProgress;

        varying float vAlpha;

        void main(){
          float baseThickness = smoothstep(0.0, 1.0, 1.0 - abs(ratio - 0.5) * 2.0);
          float remapedProgress = uProgress * 3.0 - 1.0;
          float progressThickness = smoothstep(0.0, 1.0, 1.0 - abs(ratio - remapedProgress));
          float finalThickness = uThickness * baseThickness * progressThickness;

          float side = mod(float(gl_VertexID), 2.0) - 0.5;

          // BUG FIX: Calculate billboarding entirely in View Space.
          // This prevents mesh rotation/position from distorting the line thickness.
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Camera right vector in view space is just (1, 0, 0)
          vec3 viewOffset = vec3(1.0, 0.0, 0.0) * side * finalThickness;
          viewPosition.xyz += viewOffset;

          vAlpha = baseThickness * progressThickness;
          gl_Position = projectionMatrix * viewPosition;
        }
        `,

        fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        uniform float uOpacity;

        void main(){
          gl_FragColor = vec4(uColor, vAlpha * uOpacity);
        }
        `,
      });

      const mesh = new THREE.Mesh(sharedGeometry, material);
      mesh.rotation.y = THREE.MathUtils.degToRad(this.params.waveAngle);
      mesh.position.set(
        (Math.random() - 0.5) * this.params.area,
        this.params.height,
        (Math.random() - 0.5) * this.params.area
      );

      const randomAngle = THREE.MathUtils.degToRad((Math.random() - 0.5) * this.params.spread);
      const dir = this.tempVec
        .copy(this.windDir)
        .applyAxisAngle(this.tempAxisY, randomAngle)
        .clone();
        
      this.world.scene.add(mesh);

      this.lines.push({
        mesh,
        progress: Math.random(),
        speed: 0.6 + Math.random() * 0.8,
        delay: Math.random() * 2,
        timer: 0,
        dir,
      });
    }
  }

  // ---------------- GEOMETRY ----------------

  private createGeometry(
    length = 10,
    handles = 4,
    amplitude = 1,
    divisions = 30
  ) {
    const geometry = new THREE.BufferGeometry();
    const half = length / 2;
    const span = length / (handles - 1);
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < handles; i++) {
      points.push(
        new THREE.Vector3(0, ((i % 2) - 0.5) * amplitude, -half + i * span)
      );
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const p = curve.getPoints(divisions);

    const vertices: number[] = [];
    const indices: number[] = [];
    const ratios: number[] = [];

    for (let i = 0; i < p.length; i++) {
      const point = p[i];
      const r = i / (p.length - 1);

      vertices.push(point.x, point.y, point.z);
      vertices.push(point.x, point.y, point.z);

      ratios.push(r, r);

      if (i < p.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("ratio", new THREE.Float32BufferAttribute(ratios, 1));
    geometry.setIndex(indices);

    return geometry;
  }

  private rebuildLines() {
    // Keep a reference to the shared geometry from the first mesh to dispose of it once.
    if (this.lines.length > 0) {
      this.lines[0].mesh.geometry.dispose();
    }

    for (const line of this.lines) {
      (line.mesh.material as THREE.Material).dispose();
      this.world.scene.remove(line.mesh);
    }

    this.lines.length = 0;
    this.createLines();
  }

  update() {
    const delta = this.world.ticker.delta;
    for (const l of this.lines) {
      const mat = l.mesh.material as THREE.ShaderMaterial;

      if (l.timer > 0) {
        l.timer -= delta;
        continue;
      }

      l.progress += delta * this.params.speed * l.speed;
      mat.uniforms.uProgress.value = l.progress;

      l.mesh.position.addScaledVector(l.dir, delta * 3 * l.speed);

      if (l.progress >= 1) {
        l.progress = 0;

        l.mesh.position.set(
          (Math.random() - 0.5) * this.params.area,
          this.params.height + 0.5,
          (Math.random() - 0.5) * this.params.area
        );

        const randomAngle = (Math.random() - 0.5) * 0.8;
        this.tempVec.copy(this.windDir).applyAxisAngle(this.tempAxisY, randomAngle);
        l.dir.copy(this.tempVec);

        l.timer = l.delay;
      }
    }
  }

  debug() {
    if (!this.world.debug?.active || !this.world.debug?.panel) return;

    this.debugPanel = this.world.debug.panel.addFolder({
      title: "💨 Wind Lines",
      expanded: false,
    });

    const movement = this.debugPanel.addFolder({ title: "Movement" });
    movement.addBinding(this.params, "angle", { min: 0, max: 360, step: 1, label: "Direction" }).on("change", () => this.updateWindDir());
    movement.addBinding(this.params, "spread", { min: 0, max: 180, step: 1 });
    movement.addBinding(this.params, "speed", { min: 0, max: 5, step: 0.01 });
    movement.addBinding(this.params, "speedMultiplier", { min: 0, max: 10, step: 0.1 });

    const shape = this.debugPanel.addFolder({ title: "Shape" });
    shape.addBinding(this.params, "thickness", { min: 0.01, max: 2, step: 0.01 }).on("change", (ev) => {
      this.lines.forEach((line) => {
        (line.mesh.material as THREE.ShaderMaterial).uniforms.uThickness.value = ev.value;
      });
    });

    // BUG FIX: Change `onChange: ...` to `.on("change", ...)` for all geometry controls
    shape.addBinding(this.params, "length", { min: 1, max: 30, step: 0.1 }).on("change", () => this.rebuildLines());
    shape.addBinding(this.params, "amplitude", { min: 0, max: 10, step: 0.1 }).on("change", () => this.rebuildLines());
    shape.addBinding(this.params, "handles", { min: 2, max: 10, step: 1 }).on("change", () => this.rebuildLines());
    shape.addBinding(this.params, "divisions", { min: 5, max: 100, step: 1 }).on("change", () => this.rebuildLines());

    const spawn = this.debugPanel.addFolder({ title: "Spawn" });
    spawn.addBinding(this.params, "count", { min: 1, max: 200, step: 1 }).on("change", () => this.rebuildLines());
    spawn.addBinding(this.params, "area", { min: 1, max: 100, step: 1 });
    spawn.addBinding(this.params, "height", { min: -5, max: 10, step: 0.1 });
    spawn.addBinding(this.params, "delayMin", { min: 0, max: 10, step: 0.1 });
    spawn.addBinding(this.params, "delayMax", { min: 0, max: 10, step: 0.1 });

    const material = this.debugPanel.addFolder({ title: "Material" });
    material.addBinding(this.params, "color", { view: "color" }).on("change", (ev) => {
      this.lines.forEach((line) => {
        (line.mesh.material as THREE.ShaderMaterial).uniforms.uColor.value.set(ev.value);
      });
    });
    material.addBinding(this.params, "opacity", { min: 0, max: 1, step: 0.01 }).on("change", (ev) => {
      this.lines.forEach((line) => {
        (line.mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = ev.value;
      });
    });
    shape.addBinding(this.params, "waveAngle", { min: 0, max: 360, step: 1 }).on("change", (ev) => {
      const rad = THREE.MathUtils.degToRad(ev.value);
      this.lines.forEach((line) => {
        line.mesh.rotation.y = rad;
      });
    });

    this.world.debug.addButtons(
      this.debugPanel,
      {
        Rebuild: () => this.rebuildLines(),
        Reset: () => location.reload(),
      },
      "Actions"
    );
  }
}