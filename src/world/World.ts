import * as THREE from "three";
import "../world/style/index.css";
import "../world/style/font.css";

import { Debug } from "./engine/Debug";
import { TypesWorld } from "./utils/Types";
import { ResourcesLoader } from "./engine/ResourcesLoader";
import { Ticker } from "./utils/Ticker";
import { Time } from "./utils/Time";
import { Viewport } from "./engine/Viewport";
import { Rendering } from "./engine/Rendering";
import { View } from "./engine/View";
import { ResourceFile } from "./utils/Resource";
import Reveal from "../reveal";
import { LowPolyWorld } from "./object/LowPolyWorld";
import { WindLines } from "./object/WindLines";
import { Firefly } from "./object/Firefly";
import { WaterBubbles } from "./object/WaterBubbles";
import { LilyPad } from "./object/LilyPad";
import { Grass } from "./object/Grass";
import { Flowers } from "./object/Flowers";
import { CherryBlossom } from "./object/CherryBlossom";
import { WaterFlow } from "./object/WaterFlow";
import { PineTree } from "./object/PineTree";
import { EnvirmentWorld } from "./object/EnvirmentWorld";
import { HtmlContent } from "./object/HtmlContent";

export class World extends TypesWorld {
  static instance: World;

  resources: Record<string, any> = {};

  static getInstance() {
    return World.instance;
  }

  constructor() {
    if (World.instance) {
      return World.instance;
    }
    super();
    World.instance = this;
    this.init();
  }

  async init() {
    // Setup
    this.domElement = document.querySelector(".world_view")!;
    this.canvasElement = this.domElement.querySelector(".ts-canvas")!;
    document.documentElement.classList.add("is-started");
    this.revealCanvas = this.domElement.querySelector(".ts-loader-canvas")!;

    // First batch for intro
    this.scene = new THREE.Scene();

    this.debug = new Debug();
    this.resourcesLoader = new ResourcesLoader();
    this.ticker = new Ticker();
    this.time = new Time();
    this.viewport = new Viewport(this.domElement);
    this.rendering = new Rendering();

    this.reveal = new Reveal(this.revealCanvas);

    // Load resources
    this.resources = await ResourceFile.load(this, (remaining, total) => {
      this.reveal.setProgress((total - remaining) / total);
    });

    console.log("Loading resources end");

    await this.rendering.setRenderer(this.canvasElement);

    this.view = new View();
    this.rendering.setPostProcessing();
    this.rendering.start();



    this.envirmentWorld = new EnvirmentWorld();
    this.lowPolyWorld = new LowPolyWorld();
    this.windLines = new WindLines();
    this.firefly = new Firefly();
    this.waterBubbles = new WaterBubbles();
    this.lilyPad = new LilyPad();
    this.grass = new Grass();
    this.flowers = new Flowers();
    this.cherryBlossom = new CherryBlossom();
    this.waterFlow = new WaterFlow();
    this.pineTree = new PineTree();

    this.htmlContent = new HtmlContent();

    // Reveal loader
    await this.reveal.complete();
  }
}
