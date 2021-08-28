import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import { name, version } from "./../package.json";
import "bulma/css/bulma.css";
import "ant-design-vue/dist/antd.css";
import Antd from "ant-design-vue";
import router from "./router";

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}
const app = createApp(App);
app.use(router);
app.use(Antd);
app.mount("#app");
