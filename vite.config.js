import vue from "@vitejs/plugin-vue";
import copy from "rollup-plugin-copy-assets";
import createImportPlugin from 'vite-plugin-import';
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
    createImportPlugin({
      onlyBuild: false, // if onlyBuild === true, this plugin takes effect only in vite build mode; onlyBuild's default value is true.
      babelImportPluginOptions: [{
        libraryName: 'antd',
        'style': true,   // or 'css'
      }]
    }),

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
