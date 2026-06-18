import * as THREE from "three";
import CameraControls from "camera-controls";
import { World } from "../World";
import { Camera } from "./Camera";
import { Light } from "./Light";
import type { DebugPanel } from "../utils/Types";

CameraControls.install({ THREE: THREE });

export class View {
  world: World;

  camera!: THREE.PerspectiveCamera;
  cameraObject!: Camera;
  light!: Light;
  cameraHelper!: THREE.CameraHelper;
  cameraControls!: CameraControls;

  debugPanel?: DebugPanel;

  // Create a proxy object for Tweakpane to read/write safely
  cameraParams = { x: 0, y: 0, z: 0 };

  constructor() {
    this.world = World.getInstance();

    this.cameraObject = new Camera();
    this.camera = this.cameraObject.camera;
    this.light = new Light();

    // Initialize proxy object values
    this.cameraParams.x = this.cameraObject.originalPosition.x;
    this.cameraParams.y = this.cameraObject.originalPosition.y;
    this.cameraParams.z = this.cameraObject.originalPosition.z;

    this.setupCameraControls();
    this.setupHelper();
    this.setupTickListener();
    this.debug();
  }

  setupCameraControls() {
    this.cameraControls = new CameraControls(
      this.camera,
      this.world.rendering.renderer?.domElement,
    );

    this.cameraControls.smoothTime = 0.25;
    this.cameraControls.dollySpeed = 1;
    this.cameraControls.truckSpeed = 2;
    this.cameraControls.dollyToCursor = true;

    // Responsive Distance Limits
    const isMobile = this.world.viewport.width < 768;
    this.cameraControls.minDistance = isMobile ? 4 : 3;
    this.cameraControls.maxDistance = isMobile ? 12 : 8;

    this.cameraControls.minPolarAngle = Math.PI / 4;
    this.cameraControls.maxPolarAngle = Math.PI / 2;

    this.cameraControls.minAzimuthAngle = -Math.PI / 4;
    this.cameraControls.maxAzimuthAngle = Math.PI / 4;

    this.cameraControls.setLookAt(
      this.cameraObject.originalPosition.x,
      this.cameraObject.originalPosition.y,
      this.cameraObject.originalPosition.z,
      0,
      1,
      0,
      false,
    );
  }

  setupHelper() {
    this.cameraHelper = new THREE.CameraHelper(this.camera);
    this.cameraHelper.visible = false;
    this.world.scene.add(this.cameraHelper);
  }

  setupTickListener() {
    this.world.ticker.events.on("tick", () => {
      this.update();
    });

    this.world.viewport.events.on("change", () => {
      this.resize();
    });
  }

  resize() {
    this.cameraObject.resize();
    if (this.cameraControls) {
      this.cameraControls.updateCameraUp();
    }
  }

  update() {
    if (this.cameraControls) {
      const deltaTime = this.world.ticker.delta;
      const hasUpdated = this.cameraControls.update(deltaTime);

      // If camera-controls moved the camera (via mouse drag), sync the proxy and refresh UI
      if (hasUpdated && this.world.debug?.active && this.world.debug?.panel) {
        this.cameraParams.x = this.camera.position.x;
        this.cameraParams.y = this.camera.position.y;
        this.cameraParams.z = this.camera.position.z;
        this.world.debug.panel.refresh();
      }
    }
  }

  debug() {
    if (this.world.debug?.active && this.world.debug?.panel) {
      this.debugPanel = this.world.debug.panel.addFolder({
        title: "🎥 View Control",
        expanded: false,
      });

      // Real-time Camera Position Debug via CameraControls
      const posFolder = this.debugPanel.addFolder({ title: "Position" });

      const updatePosition = () => {
        this.cameraControls.setPosition(
          this.cameraParams.x,
          this.cameraParams.y,
          this.cameraParams.z,
        );
      };

      posFolder.addBinding(this.cameraParams, "x").on("change", updatePosition);
      posFolder.addBinding(this.cameraParams, "y").on("change", updatePosition);
      posFolder.addBinding(this.cameraParams, "z").on("change", updatePosition);

      this.debugPanel.addBinding(this.cameraHelper, "visible", {
        label: "Camera Helper",
      });

      this.debugPanel.addBinding(this.cameraControls, "smoothTime", {
        label: "Smooth Time",
        min: 0,
        max: 2,
        step: 0.1,
      });

      this.debugPanel.addBinding(this.cameraControls, "dollySpeed", {
        label: "Dolly Speed",
        min: 0,
        max: 5,
        step: 0.1,
      });

      this.debugPanel.addBinding(this.cameraControls, "truckSpeed", {
        label: "Truck Speed",
        min: 0,
        max: 5,
        step: 0.1,
      });

      this.debugPanel
        .addButton({ title: "Reset View Position" })
        .on("click", () => {
          this.cameraControls.setLookAt(
            this.cameraObject.originalPosition.x,
            this.cameraObject.originalPosition.y,
            this.cameraObject.originalPosition.z,
            0,
            1,
            0,
            true, // True enables a smooth transition back to the start!
          );
        });
    }
  }
}
