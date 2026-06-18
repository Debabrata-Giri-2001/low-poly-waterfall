import { World } from "../World";
import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/**
 * Supported resource types
 */
type ResourceType = "texture" | "model" | "audio" | "environment"; // Extend as needed

/**
 * File descriptor instead of array indexing
 */
interface ResourceFile<T = any> {
  name: string; // key in returned object
  path: string; // file path
  type: ResourceType;
  modifier?: (resource: T) => void;
}

/**
 * Loaded resources map
 */
type LoadedResources = Record<string, unknown>;

export class ResourcesLoader {
  world: World;
  loaders: Map<ResourceType, THREE.Loader>;
  cache: Map<string, unknown>;

  constructor() {
    this.world = World.getInstance();
    this.loaders = new Map();
    this.cache = new Map();
  }

  private getLoader(type: ResourceType): THREE.Loader {
    if (this.loaders.has(type)) {
      return this.loaders.get(type)!;
    }

    let loader: THREE.Loader;

    if (type === "texture") {
      loader = new THREE.TextureLoader();
    } else if (type === "audio") {
      loader = new THREE.AudioLoader();
    }else if(type === "environment"){
      loader = new HDRLoader();
    }else {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/static/draco/')
      // dracoLoader.setDecoderPath("node_modules/three/examples/jsm/libs/draco/");
      // dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      dracoLoader.preload();

      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      loader = gltfLoader;
    }

    this.loaders.set(type, loader);
    return loader;
  }

  load<T extends LoadedResources>(
    files: ResourceFile[],
    progressCallback?: (remaining: number, total: number) => void,
  ): Promise<T> {
    return (async () => {
      const total = files.length;
      const loadedResources: LoadedResources = {};

      if (total === 0) return loadedResources as T;

      let remaining = total;
      const report = () => {
        remaining--;
        if (progressCallback) progressCallback(remaining, total);
      };

      const tasks = files.map((file) => {
        if (this.cache.has(file.path)) {
          loadedResources[file.name] = this.cache.get(file.path)!;
          report();
          return Promise.resolve();
        }

        const loader = this.getLoader(file.type) as any;

        const loadPromise: Promise<unknown> =
          typeof loader.loadAsync === "function"
            ? loader.loadAsync(file.path)
            : new Promise((resolve, reject) => {
                loader.load(file.path, resolve, undefined, reject);
              });

        return loadPromise.then((resource) => {
          if (file.modifier) file.modifier(resource);
          loadedResources[file.name] = resource;
          this.cache.set(file.path, resource);
          report();
        }).catch((err) => {
          console.error(`Resources > Couldn't load file ${file.path}`, err);
          throw file.path;
        });
      });

      await Promise.all(tasks);
      return loadedResources as T;
    })();
  }
}
