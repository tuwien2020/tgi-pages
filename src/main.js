import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import { name, version } from "./../package.json";
import "bulma/css/bulma.css";
// import "vuetify/styles"; // TODO: Add the vuetify styles again
import { createVuetify } from "vuetify";
import router from "./router";

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}

const vuetify = createVuetify();

const app = createApp(App);
app.use(router);
app.use(vuetify);
app.mount("#app");
