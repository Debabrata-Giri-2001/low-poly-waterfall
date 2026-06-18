import { Events } from "../utils/Events";

export class Viewport {
  width!: number;
  height!: number;
  ratio!: number;
  pixelRatioPure!: number;
  pixelRatioMax!: number;
  pixelRatio!: number;
  events: Events;

  domElement: HTMLElement;
  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.events = new Events();

    this.measure();
    this.setResize();
  }

  measure() {
    const bounding = this.domElement.getBoundingClientRect();

    this.width = bounding.width;
    this.height = bounding.height;
    this.ratio = this.width / this.height;

    this.pixelRatioPure = window.devicePixelRatio;
    this.pixelRatioMax = 2;
    this.pixelRatio = Math.min(this.pixelRatioPure, this.pixelRatioMax);
  }

  setResize() {
    const throttleDuration = 400;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    addEventListener("resize", () => {
      this.measure();
      this.events.trigger("change");

      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        this.events.trigger("throttleChange");
      }, throttleDuration);
    });
  }
}
