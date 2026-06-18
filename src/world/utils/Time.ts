import { World } from "../World";
import gsap from "gsap";
import { clamp, remap } from "../utils/maths";
import type { Pane } from "tweakpane";

export class Time {
  world: World;
  defaultScale: number;
  _scale: number;
  bulletTime!: {
    active: boolean;
    endTime: number | null;
    scale: number;
    progress: number;
    inSpeed: number;
    outSpeed: number;
    activate: (duration?: number) => void;
  };

  debugPanel?: ReturnType<Pane["addFolder"]>;

  constructor() {
    this.world = World.getInstance();

    this.defaultScale = 2;
    this._scale = this.defaultScale;
    this.world.ticker.scale = this.scale;
    gsap.globalTimeline.timeScale(this.scale);

    this.setBulletTime();

    this.world.ticker.events.on(
      "tick",
      () => {
        this.update();
      },
      0,
    );

    // Debug
    if (this.world.debug?.active && this.world.debug?.panel) {
      this.debugPanel = this.world.debug.panel.addFolder({
        title: "⏱️ Time",
        expanded: false,
      });
      this.debugPanel.addBinding(this, "defaultScale", {
        min: 0,
        max: 5,
        step: 0.01,
      });
      this.debugPanel.addButton({ title: "bullet time" }).on("click", () => {
        this.bulletTime.activate();
      });
    }
  }

  setBulletTime() {
    this.bulletTime = {
      active: false,
      endTime: null,
      scale: 0.5,
      progress: 0,
      inSpeed: 3,
      outSpeed: 0.3,
      activate: (duration = 1.5) => {
        if (this.bulletTime.active) {
          const newEndTime = Date.now() + duration * 1000;
          this.bulletTime.endTime = Math.max(
            this.bulletTime.endTime || 0,
            newEndTime,
          );
        } else {
          this.bulletTime.endTime = Date.now() + duration * 1000;
        }
        this.bulletTime.active = true;
      },
    };
  }

  update() {
    if (this.bulletTime.endTime && Date.now() > this.bulletTime.endTime) {
      this.bulletTime.active = false;
    }

    const speed = this.bulletTime.active
      ? this.bulletTime.inSpeed
      : this.bulletTime.outSpeed;
    this.bulletTime.progress +=
      (this.bulletTime.active ? 1 : -1) * this.world.ticker.delta * speed;
    this.bulletTime.progress = clamp(this.bulletTime.progress, 0, 1);

    this.scale = remap(
      this.bulletTime.progress,
      0,
      1,
      this.defaultScale,
      this.bulletTime.scale,
    );
    // console.log(this.bulletTime.progress)
  }

  set scale(value: number) {
    this._scale = value;
    this.world.ticker.scale = this.scale;
    gsap.globalTimeline.timeScale(value);
  }

  get scale(): number {
    return this._scale;
  }
}
