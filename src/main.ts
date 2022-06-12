import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import { name, version } from "../package.json";
import "bulma/css/bulma.css";
import "intro.js/minified/introjs.min.css";
// import "vuetify/styles"; // TODO: Add the vuetify styles again
import { createVuetify } from "vuetify";
import router from "./router";
import { i18n } from "./i18n/i18n";

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}

const vuetify = createVuetify();

if (typeof window !== "undefined") {
  import("./pwa/PWA.vue");
}

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(vuetify);
app.mount("#app");
