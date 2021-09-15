import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import { name, version } from "./../package.json";
import "bulma/css/bulma.css";
import "ant-design-vue/dist/antd.css";
import Antd from "ant-design-vue";
import { createI18n } from "vue-i18n";
import router from "./router";
import { translations } from "./translations";

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}
const i18n = createI18n({
  legacy: false,
  locale: (navigator.language || "en").slice(0, 2),
  fallbackLocale: "en",
  messages: translations,
});

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(Antd);
app.mount("#app");
