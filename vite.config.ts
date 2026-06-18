import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import glsl from "vite-plugin-glsl";
import wasm from "vite-plugin-wasm";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), glsl(), wasm()],

  // Optimize dependencies
  optimizeDeps: {
    include: ["three", "react", "react-dom", "camera-controls", "gsap"],
  },

  // Include additional asset types
  assetsInclude: ["**/*.exr"],

  // Build optimizations
  build: {
    // Reduce chunk size
    minify: "terser",

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Better sourcemap strategy for production
    sourcemap: false, // Disable for production builds (smaller bundle)

    // Optimize CSS
    cssCodeSplit: true,

    // Roll up options
    rollupOptions: {
      output: {
        manualChunks: {
          // Split dependencies into separate chunks for better caching
          three: ["three"],
        },
      },
    },
  },

  // Development server optimizations
  server: {
    middlewareMode: false,
    host: true,
    open: true,
  },
});
