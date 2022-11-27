import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import copy from "rollup-plugin-copy";
import { viteStaticCopy } from "vite-plugin-static-copy";
//import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  plugins: [
    viteStaticCopy({
      // Yeah, this directly copies to the dist folder
      targets: [{ src: "node_modules/monaco-editor/min/vs/**/*", dest: "assets" }],
      flatten: false,
    }),
    VitePWA({
      includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "apple-touch-icon.png"],
      srcDir: "src",
      manifest: {
        name: "TGI Pages",
        short_name: "tgi-pages",
        description: "Helpful tools for the TGI Course at the TU Vienna",
        theme_color: "#80CBC4",
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
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ttf,woff2}"],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ttf,woff2}"],
      },
    }),
    vue(),
    //vuetify({ autoImport: true }),
  ],

  /*build: {
    target: "esnext",
  },*/
});
