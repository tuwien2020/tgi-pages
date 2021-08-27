<template>
  <h1>Overview Page</h1>
  <section class="columns is-multiline">
    <a-card v-for="category in pagesByCategory" :key="category.key.number" v-bind:title="category.key.number.toString() + '. ' + category.key.name" :hoverable="true" :bordered="true" class="column is-one-third">
      <div v-for="item in category.values" :key="item.name">
        <router-link v-if="item.internal" :to="item.link">{{item.name}}</router-link>
        <a target="_blank" v-if="!item.internal" :href="item.link">{{item.name}}</a>
      </div>
      
    </a-card>
  </section>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { pagesByCategory, getCategory } from "./../assets/navigation";
import { Card } from "ant-design-vue";
// import * as cat from "./../assets/grammar-ite";
// console.log(cat);

console.log();

export default defineComponent({
  components: {},
  setup() {
    const count = ref(0);
    return {
      count,
      pagesByCategory,
      getCategory
    };
  },
});
</script>
