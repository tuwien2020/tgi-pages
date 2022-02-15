<template>
  <div class="content">
    <h1>Overview Page</h1>
    <section class="columns is-multiline">
      <div v-for="category in pagesByCategory" :key="category.key.number" class="column is-one-third">
        <div class="card">
          <div class="card-content">
            <h4>{{ category.key.number + ". " + t(category.key.name) }}</h4>
            <div v-for="item in category.values" :key="item.name">
              <router-link v-if="item.internal" :to="item.link">{{ t(item.name) }}</router-link>
              <a target="_blank" v-if="!item.internal" :href="item.link">{{ t(item.name) }}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-one-third">
        <div class="card">
          <div class="card-content">
            <div><a href="https://github.com/tuwien2020/tgi-pages" target="_blank">Github Repository </a></div>
            <div><a href="https://discord.gg/bmChQgsagS" target="_blank">(Inofficial) Developer Discord </a></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { pagesByCategory } from "../router/navigation";
import { useI18n } from "vue-i18n";

export default defineComponent({
  components: {},
  setup() {
    const { t } = useI18n();
    const count = ref(0);
    return {
      t,
      count,
      pagesByCategory,
    };
  },
});
</script>

<style scoped>
.card {
  height: 100%;
}
</style>
