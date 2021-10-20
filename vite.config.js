import vue from "@vitejs/plugin-vue";
import copy from "rollup-plugin-copy-assets";
import vuetify from "@vuetify/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
const { resolve } = require("path");

export default {
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  plugins: [
    vue(),
    copy({
      assets: ["node_modules/monaco-editor/min/vs"],
    }),
    vuetify({ autoImport: true }),
    VitePWA({
      includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "TGI Pages",
        short_name: "tgi-pages",
        description: "Helpful tools for the TGI Course at the TU Vienna",
        theme_color: "#80CBC4",
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        workbox: {
          cleanupOutdatedCaches: false,
          sourcemap: true,
        },
      },
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: false,
        sourcemap: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    sourcemap: process.env.SOURCE_MAP === "true",
  },

  /*build: {
    target: "esnext",
  },*/
};
