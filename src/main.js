import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import Overview from "./pages/Overview.vue";
import HammingCode from "./pages/HammingCode.vue";
import TruthTable from "./pages/TruthTable.vue";
import HammingDistance from "./pages/HammingDistance.vue";
import BinaryCalculator from "./pages/BinaryCalculator.vue";
import BinaryCoding from "./pages/BinaryCoding.vue";
import Pipeline from "./pages/Pipeline.vue";
import InterleavingGraph from "./pages/InterleavingGraph.vue";
import CacheCalc from "./pages/CacheCalc.vue";
import Stack from "./pages/Stack.vue";
import Micro16Decompiler from "./pages/Micro16Decompiler.vue";
import Main from "./pages/Main.vue";
import { name, version } from "./../package.json";
import "bulma/css/bulma.css";
import 'ant-design-vue/dist/antd.css';
import Antd from "ant-design-vue";
import { pages } from "./assets/navigation";

/** @type {import("vue-router").RouteRecordRaw[]} */
const routes = pages.map(p => {return {path: '/' + p.link, component: p.page}});
routes.push({path: '/', component: Main});

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}

createApp(App)
  .use(
    createRouter({
      history: createWebHashHistory(),
      routes: routes,
    })
  )
  .use(Antd)
  .mount("#app");
