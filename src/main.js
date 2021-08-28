import { createApp, nextTick, onBeforeMount, onMounted, reactive, ref, watch } from "vue";
import { createRouter, createWebHashHistory, useRoute, useRouter } from "vue-router";
import App from "./App.vue";
import "./index.css";
import "katex/dist/katex.css";
import { name, version } from "./../package.json";
import "bulma/css/bulma.css";
import 'ant-design-vue/dist/antd.css';
import router from "./router";
import Antd from 'ant-design-vue';

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}
const app = createApp(App);
app.use(router);
app.use(Antd);

app.config.globalProperties.$ref = ref;
app.config.globalProperties.$reactive = reactive;
app.config.globalProperties.$onBeforeMount = onBeforeMount;
app.config.globalProperties.$onMounted = onMounted;
app.config.globalProperties.$watch = watch;
app.config.globalProperties.$nextTick = nextTick;
app.config.globalProperties.$useRouter = useRouter;
app.config.globalProperties.$useRoute = useRoute;

app.mount("#app");
