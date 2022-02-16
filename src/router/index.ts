import { pages } from "./navigation";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Main from "./../pages/Main.vue";

const routes = pages.map((p) => {
  return { path: "/" + p.link, component: p.page, name: p.name } as RouteRecordRaw;
});
routes.push({ path: "/", component: Main, name: "TGI Pages" });

export default createRouter({
  history: createWebHashHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return {
        el: to.hash,
      };
    }
    return { top: 0 };
  },
  routes: routes,
});
