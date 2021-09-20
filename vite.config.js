import vue from "@vitejs/plugin-vue";
import copy from "rollup-plugin-copy-assets";
import vuetify from "@vuetify/vite-plugin";
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
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  /*build: {
    target: "esnext",
  },*/
};
