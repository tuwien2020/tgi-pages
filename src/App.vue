<template>
  <div class="header">
    <div>
      <router-link to="/" class="home-link"
        >TGI Pages - {{ version }}
      </router-link>
    </div>
  </div>
  <div class="content">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed } from "vue";
import { version } from "./../package.json";

export default defineComponent({
  components: {},
  setup() {
    return {
      version,
    };
  },
});
</script>

<style scoped>
.header {
  height: 1em;
  padding: 12px 24px;
  background: #f5f5f5;
  box-shadow: 0 1px 5px -1px rgba(0, 0, 0, 0.2);
}
.home-link {
  text-decoration: none;
  text-transform: uppercase;
  color: var(--sexy-text-color);
}
.content {
  margin: 24px;
}
</style>
