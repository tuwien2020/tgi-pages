import vue from "@vitejs/plugin-vue";

export default {
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  plugins: [vue()],
  /*build: {
    target: "esnext",
  },*/
};
