import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy-assets'
import ViteComponents, { AntDesignVueResolver } from 'vite-plugin-components'
const { resolve } = require('path')

export default {
  optimizeDeps: {
    exclude: ['monaco-editor'],
  },
  plugins: [
    vue(),
    copy({
      assets: ['node_modules/monaco-editor/min/vs'],
    }),
    ViteComponents({
      customComponentResolvers: [AntDesignVueResolver()],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  /*build: {
    target: "esnext",
  },*/
}
