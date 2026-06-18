import * as THREE from "three";
import { Pane, TpChangeEvent } from "tweakpane";
import { BindingApi } from "@tweakpane/core";
import { ButtonGridApi } from "@tweakpane/plugin-essentials";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import * as CamerakitPlugin from "@tweakpane/plugin-camerakit";
/**
 * Generic binding object
 */
interface ManualBinding<T> {
  manual: boolean;
  manualValue: T;
  update: () => void;
  instance?: BindingApi<unknown, T>;
}

export class Debug {
  active: boolean;
  panel?: Pane;

  constructor() {
    this.active = !!location.hash.match(/debug/i);

    if (this.active) {
      this.panel = new Pane();
      this.panel.registerPlugin(EssentialsPlugin);
      this.panel.registerPlugin(CamerakitPlugin);

      addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "KeyH" && this.panel) {
          this.panel.hidden = !this.panel.hidden;
        }
      });
    }
  }

  /**
   * Manual/auto binding (generic safe version)
   */
  addManualBinding<T extends Record<string, any>, K extends keyof T>(
    panel: Pane,
    object: T,
    property: K,
    settings: Record<string, unknown>,
    update: () => T[K],
    manual = false,
  ): ManualBinding<T[K]> {
    const binding: ManualBinding<T[K]> = {
      manual,
      manualValue: object[property],
      update: () => {
        object[property] = binding.manual ? binding.manualValue : update();
      },
    };

    if (this.active) {
      binding.instance = panel.addBinding(binding, "manualValue", settings);

      binding.instance.on("change", () => {
        binding.manual = true;
      });

      this.addButtons(
        panel,
        {
          manual: () => {
            binding.manual = true;
            binding.manualValue = object[property];
            binding.instance?.refresh();
          },
          auto: () => {
            binding.manual = false;
            binding.update();
            binding.manualValue = object[property];
          },
        },
        "",
      );
      
    }

    return binding;
  }

  /**
   * THREE.Color binding
   */
  addThreeColorBinding(panel: Pane, object: THREE.Color, label: string) {
    return panel
      .addBinding({ color: object.getHex(THREE.SRGBColorSpace) }, "color", {
        label,
        view: "color",
      })
      .on(
        "change",
        (ev: TpChangeEvent<number, BindingApi<unknown, number>>) => {
          object.set(ev.value);
        },
      );
  }

  

  /**
   * Button grid
   */
  addButtons(panel: any, buttons: Record<string, () => void>, title = "") {
    const keys = Object.keys(buttons);

    (
      panel.addBlade({
        view: "buttongrid",
        size: [keys.length, 1],
        cells: (x: number, y: number) => ({
          title: keys[y * keys.length + x] ?? keys[x],
        }),
        label: title,
      }) as ButtonGridApi
    ).on("click", (event) => {
      const buttonName = event.cell.title;
      if (buttonName && buttonName in buttons) {
        buttons[buttonName]?.();
      }
    });
  }

  
}
