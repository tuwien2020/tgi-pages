<template>
  <h1>Overview Page</h1>
    <a-card v-for="category in groupedPages" :key="category.key" v-bind:title=category.key :bordered="true" style="width: 30vw">
      <div v-for="item in category.values" :key="item.name">
        <router-link v-if="item.internal" :to="item.link">{{item.name}}</router-link>
        <a target="_blank" v-if="!item.internal" :href="item.link">{{item.name}}</a>
      </div>
      
    </a-card>
  
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import pages from "./../assets/navigation";
import { Card } from "ant-design-vue";
import { groupBy } from "./../assets/utilities";
// import * as cat from "./../assets/grammar-ite";
// console.log(cat);

console.log();

export default defineComponent({
  components: {},
  setup() {
    const count = ref(0);
    const groupedPages = groupBy(pages, page => page.category);
    return {
      count,
      groupedPages
    };
  },
});
</script>
