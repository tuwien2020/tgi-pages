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

/** @type {import("vue-router").RouteRecordRaw[]} */
const routes = [
  { path: "/", component: Overview },
  { path: "/hamming-code", component: HammingCode },
  { path: "/truth-table", component: TruthTable },
  { path: "/hamming-distance", component: HammingDistance },
  { path: "/binary-calculator", component: BinaryCalculator },
  { path: "/binary-coding", component: BinaryCoding },
  { path: "/pipeline", component: Pipeline },
  { path: "/interleaving-graph", component: InterleavingGraph },
  { path: "/cache-calc", component: CacheCalc },
  { path: "/stack", component: Stack },
  { path: "/micro16-decompiler", component: Micro16Decompiler },
  { path: "/test", component: Main},
];

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
