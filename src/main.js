import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import { name, version } from "./../package.json";
import "bulma/css/bulma.css";
import router from "./router";

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}
const app = createApp(App);
app.use(router);
app.mount("#app");
