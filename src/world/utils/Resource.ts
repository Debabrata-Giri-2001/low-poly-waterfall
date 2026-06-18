import { World } from "../World";

export class ResourceFile {
  static async load(
    world: World,
    progressCallback?: (remaining: number, total: number) => void,
  ) {
    console.log("Starting resource loading...");
    const resources = await world.resourcesLoader.load(
      [
        {
          name: "venice_sunset",
          path: "/static/assets/environment/venice_sunset_1k.hdr",
          type: "environment",
        },

        {
          name: "cherry_blossom",
          path: "/static/assets/model/cherry_blossom-v1.glb",
          type: "model",
        },
        {
          name: "grasses",
          path: "/static/assets/model/grasses-v1.glb",
          type: "model",
        },
        {
          name: "lamp_frame",
          path: "/static/assets/model/lamp_frame-v1.glb",
          type: "model",
        },
        {
          name: "lily_pad",
          path: "/static/assets/model/lily_pad-v1.glb",
          type: "model",
        },
        {
          name: "pole",
          path: "/static/assets/model/pole-v1.glb",
          type: "model",
        },
        {
          name: "water_flow",
          path: "/static/assets/model/water_flow-v1.glb",
          type: "model",
        },
        {
          name: "flowers",
          path: "/static/assets/model/flowers-v1.glb",
          type: "model",
        },
        {
          name: "grass",
          path: "/static/assets/model/grass-v1.glb",
          type: "model",
        },
        {
          name: "grass_blade",
          path: "/static/assets/model/grass_blade-v1.glb",
          type: "model",
        },
        {
          name: "grass_blade_1",
          path: "/static/assets/model/grass_blade.glb",
          type: "model",
        },
        {
          name: "lamp_light",
          path: "/static/assets/model/lamp_light-v1.glb",
          type: "model",
        },
        {
          name: "pine_tree",
          path: "/static/assets/model/pine_tree-v1.glb",
          type: "model",
        },
        {
          name: "rocks",
          path: "/static/assets/model/rocks-v1.glb",
          type: "model",
        },
        {
          name: "wooden_fence",
          path: "/static/assets/model/wooden_fence-v1.glb",
          type: "model",
        },
        {
          name: "ground",
          path: "/static/assets/model/ground-v1.glb",
          type: "model",
        },
        {
          name: "water_bubbles",
          path: "/static/assets/model/water_bubbles.glb",
          type: "model",
        },
        {
          name: "particle",
          path: "/static/assets/textures/particle_256x256.jpg",
          type: "texture",
        },
        {
          name: "dudvMap",
          path: "/static/assets/textures/dudvMap.webp",
          type: "texture",
        },
        {
          name: "noiseMap",
          path: "/static/assets/textures/noiseMap.webp",
          type: "texture",
        }
      ],
      progressCallback,
    );
    console.log("Loaded resources:", resources);
    return resources;
  }
}
