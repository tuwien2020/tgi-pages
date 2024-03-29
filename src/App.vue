<template>
  <div class="header-block">.</div>
  <nav class="navbar header" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link to="/" class="home-link"> TGI Pages - {{ version }} </router-link>
      <search-bar :options="options" :links="true" />
    </div>
    <div class="navbar-item"></div>
  </nav>

  <div class="content">
    <router-view></router-view>
  </div>
  <Notifications />
  <PWA />
</template>

<script setup lang="ts">
import { ref, defineComponent, watchEffect, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { version } from "./../package.json";
import SearchBar, { SearchOption } from "./components/SearchBar.vue";
import Notifications from "./components/Notifications.vue";
import * as Notify from "./notify";
import { searchablePages } from "./router/navigation";
import PWA from "./pwa/PWA.vue";

const route = useRoute();
const { t } = useI18n();
const notificationMessage = ref("");

window.addEventListener("error", (ev) => {
  Notify.error("Unhandled error", ev.error);
});
window.addEventListener("unhandledrejection", (ev) => {
  Notify.error("Unhandled error (promise)", ev.reason);
});

watch(route, ({ name }) => {
  window.document.title = t((name as string) + "");
});

const options = computed(() =>
  searchablePages.map((p) => {
    return { name: t(p.name), link: p.link, internal: p.internal } as SearchOption;
  })
);
</script>

<style scoped>
.header {
  height: 1em;
  width: 100vw;
  padding: 12px 24px;
  background: #f5f5f5;
  box-shadow: 0 1px 5px -1px rgba(0, 0, 0, 0.2);
  min-height: none;
  position: fixed;
}

.header-block {
  height: 1em;
  padding: 15px 24px;
  background: #ffffff00;
  min-height: none;
}

.home-link {
  text-decoration: none;
  text-transform: uppercase;
  color: var(--sexy-text-color);
}
.content {
  margin: 24px;
  flex: 1 1 auto;
}
</style>
