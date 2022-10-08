<script lang="ts">
import { defineComponent, ref } from "vue";
import { registerSW } from "virtual:pwa-register";

export default defineComponent({
  setup() {
    const needRefresh = ref(false);
    const offlineReady = ref(false);
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        needRefresh.value = true;
      },
      onOfflineReady() {
        offlineReady.value = true;
      },
    });

    const close = async () => {
      offlineReady.value = false;
      needRefresh.value = false;
    };

    return {
      offlineReady,
      needRefresh,
      updateServiceWorker,
      close,
    };
  },
});
</script>

<template>
  <div v-if="offlineReady || needRefresh" class="pwa-toast" role="alert">
    <div class="message">
      <span v-if="offlineReady"> App ready to work offline </span>
      <span v-else> New content available, click on reload button to update. </span>
    </div>
    <button v-if="needRefresh" @click="updateServiceWorker()">Reload</button>
    <button @click="close">Close</button>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0px #8885;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
</style>
