import * as THREE from "three/webgpu";
import { Debug } from "../engine/Debug";
import { ResourcesLoader } from "../engine/ResourcesLoader";
import { Events } from "./Events";
import { Time } from "./Time";
import { Ticker } from "./Ticker";
import { Viewport } from "../engine/Viewport";
import { Rendering } from "../engine/Rendering";
import { View } from "../engine/View";
import type { Pane } from "tweakpane";
import Reveal from "../../reveal";
import { LowPolyWorld } from "../object/LowPolyWorld";
import { WindLines } from "../object/WindLines";
import { Firefly } from "../object/Firefly";
import { WaterBubbles } from "../object/WaterBubbles";
import { LilyPad } from "../object/LilyPad";
import { Grass } from "../object/Grass";
import { Flowers } from "../object/Flowers";
import { CherryBlossom } from "../object/CherryBlossom";
import { WaterFlow } from "../object/WaterFlow";
import { PineTree } from "../object/PineTree";
import { EnvirmentWorld } from "../object/EnvirmentWorld";
import { HtmlContent } from "../object/HtmlContent";

// Type alias for debug panel
export type DebugPanel = ReturnType<Pane["addFolder"]>;

export class TypesWorld {
  domElement!: HTMLElement;
  canvasElement!: HTMLCanvasElement;

  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGPURenderer;

  debug!: Debug;
  resourcesLoader!: ResourcesLoader;
  events!: Events;
  time!: Time;
  ticker!: Ticker;
  viewport!: Viewport; 
  rendering!: Rendering;
  view!: View;



  revealCanvas!: HTMLCanvasElement;
  reveal!: Reveal;

  lowPolyWorld!: LowPolyWorld;
  windLines!: WindLines;
  firefly!: Firefly;
  waterBubbles!: WaterBubbles;
  lilyPad!: LilyPad;
  grass!: Grass;
  flowers!: Flowers;
  cherryBlossom!: CherryBlossom;
  waterFlow!: WaterFlow;
  pineTree!: PineTree;
  envirmentWorld!: EnvirmentWorld;
  htmlContent!: HtmlContent;
}





