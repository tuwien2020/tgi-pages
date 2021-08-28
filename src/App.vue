<template>
  <div class="header-block">.</div>
  <nav class="navbar header" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link to="/" class="home-link">
        TGI Pages - {{ version }}
        <search-bar />
      </router-link>
    </div>
    <div class="navbar-item"></div>
  </nav>

  <div class="content">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed } from 'vue'
import { version } from './../package.json'
import SearchBar from './components/SearchBar.vue'

export default defineComponent({
  components: { SearchBar },
  setup() {
    return {
      version,
    }
  },
})
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
