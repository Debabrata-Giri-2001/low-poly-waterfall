import * as THREE from "three";
import { World } from "../World";
import type { DebugPanel } from "../utils/Types";

export class Light {
  world: World;
  debugPanel?: DebugPanel;

  ambientLight!: THREE.AmbientLight;

  directionalLight!: THREE.DirectionalLight;
  directionalLightHelper?: THREE.DirectionalLightHelper;

  pointLight!: THREE.PointLight;
  pointLightHelper!: THREE.PointLightHelper;

  constructor() {
    this.world = World.getInstance();
    this.setupLights();
    this.debug();
  }

  setupLights() {
    // Ambient Light - provides general illumination
    this.ambientLight = new THREE.AmbientLight("#FFF", 0.6);
    this.ambientLight.castShadow = false;

    this.world.scene.add(this.ambientLight);

    // Directional Light - simulates sunlight
    this.directionalLight = new THREE.DirectionalLight("#FFF", 0.75);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.radius = 0.85;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;

    this.world.scene.add(this.directionalLight);

    // Light helper for debugging
    this.directionalLightHelper = new THREE.DirectionalLightHelper(
      this.directionalLight,
      5,
    );
    this.directionalLightHelper.visible = false;
    this.world.scene.add(this.directionalLightHelper);

    //point light
    this.pointLight = new THREE.PointLight("#e90059", 5.0, 7, 0.1);
    this.pointLight.position.set(3,1.4, 4);
    this.world.scene.add(this.pointLight);

    this.pointLightHelper = new THREE.PointLightHelper(
      this.pointLight,
      1,
      "#e90059",
    );
    this.pointLightHelper.visible = false;
    this.world.scene.add(this.pointLightHelper);
  }

  debug() {
    if (this.world.debug?.active && this.world.debug?.panel) {
      this.debugPanel = this.world.debug.panel.addFolder({
        title: "💡 Light",
        expanded: false,
      });

      const ambientLight = this.debugPanel.addFolder({
        title: "Ambient Light",
      });

      // Ambient Light controls
      ambientLight.addBinding(this.ambientLight, "intensity", {
        label: "Ambient Intensity",
        min: 0,
        max: 2,
        step: 0.1,
      });

      // ambientlight color control
      ambientLight.addBinding(this.ambientLight, "color", {
        label: "Ambient Color",
        view: "color",
      });

      const directionalLight = this.debugPanel.addFolder({
        title: "Directional Light",
      });
      // Directional Light controls
      directionalLight.addBinding(this.directionalLight, "intensity", {
        label: "Directional Intensity",
        min: 0,
        max: 2,
        step: 0.1,
      });

      directionalLight.addBinding(this.directionalLight.position, "x", {
        label: "Light X",
        min: -20,
        max: 20,
      });

      directionalLight.addBinding(this.directionalLight.position, "y", {
        label: "Light Y",
        min: -20,
        max: 20,
      });

      directionalLight.addBinding(this.directionalLight.position, "z", {
        label: "Light Z",
        min: -20,
        max: 20,
      });

      directionalLight.addBinding(this.directionalLightHelper!, "visible", {
        label: "Light Helper",
      });

      // light shadow controls
      directionalLight.addBinding(this.directionalLight.shadow, "radius", {
        label: "Shadow Radius",
        min: 0,
        max: 20,
      });
      directionalLight.addBinding(
        this.directionalLight.shadow.mapSize,
        "width",
        {
          label: "Shadow Map Width",
          min: 256,
          max: 4096,
          step: 256,
        },
      );
      directionalLight.addBinding(
        this.directionalLight.shadow.mapSize,
        "height",
        {
          label: "Shadow Map Height",
          min: 256,
          max: 4096,
          step: 256,
        },
      );


      const pointLight = this.debugPanel.addFolder({ title: "Point Light" });

      pointLight.addBinding(this.pointLight, "intensity", {
        label: "Point Intensity",
        min: 0,
        max: 5,
        step: 0.1,
      });
      pointLight.addBinding(this.pointLight, "distance", {
        label: "Point Distance",
        min: 0,
        max: 20,
        step: 0.1,
      });
      pointLight.addBinding(this.pointLight, "decay", {
        label: "Point Decay",
        min: 0,
        max: 5,
        step: 0.1,
      });
      pointLight.addBinding(this.pointLight.position, "x", {
        label: "Point X",
        min: -20,
        max: 20,
      });
      pointLight.addBinding(this.pointLight.position, "y", {
        label: "Point Y",
        min: -20,
        max: 20,
      });
      pointLight.addBinding(this.pointLight.position, "z", {
        label: "Point Z",
        min: -20,
        max: 20,
      });
      pointLight.addBinding(this.pointLightHelper!, "visible", {
        label: "Point Helper",
      });
 
    }
  }
}
