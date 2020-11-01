import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import "./index.css";
import Overview from "./pages/Overview.vue";
//import { render } from "katex/dist/katex.mjs";

/** @type {import("vue-router").RouteRecordRaw[]} */
const routes = [{ path: "/", component: Overview }];

createApp(App)
  .use(
    createRouter({
      history: createWebHashHistory(),
      routes: routes,
    })
  )
  .mount("#app");
