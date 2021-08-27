import { pages } from "./navigation";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Main from "./../pages/Main.vue";

const routes = pages.map(p => {return {path: '/' + p.link, component: p.page} as RouteRecordRaw});
routes.push({path: '/', component: Main});

export default createRouter({
  history: createWebHashHistory(),
  routes: routes,
});