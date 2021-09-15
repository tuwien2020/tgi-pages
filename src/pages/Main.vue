<template>
  <div class="content">
    <h1>Overview Page</h1>
    <section class="columns is-multiline">
      <div v-for="category in pagesByCategory" :key="category.key.number" class="column is-one-third">
        <div class="card">
          <div class="card-content">
            <h4>{{ category.key.number.toString() + ". " + category.key.name }}</h4>
            <div v-for="item in category.values" :key="item.name">
              <router-link v-if="item.internal" :to="item.link">{{ item.name }}</router-link>
              <a target="_blank" v-if="!item.internal" :href="item.link">{{ item.name }}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-one-third">
        <div class="card">
          <div class="card-content">
            <a href="https://github.com/tuwien2020/tgi-pages" target="_blank">Github Repository </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { pagesByCategory } from "../router/navigation";

export default defineComponent({
  components: {},
  setup() {
    const count = ref(0);
    return {
      count,
      pagesByCategory,
    };
  },
});
</script>
