<template>
  <div class="content">
    <h1>Overview Page</h1>
    <section class="columns is-multiline">
      <a-card v-for="category in pagesByCategory" :key="category.key.number" v-bind:title="category.key.number.toString() + '. ' + category.key.name" :hoverable="true" :bordered="true" class="column is-one-third">
        <div v-for="item in category.values" :key="item.name">
          <router-link v-if="item.internal" :to="item.link">{{item.name}}</router-link>
          <a target="_blank" v-if="!item.internal" :href="item.link">{{item.name}}</a>
        </div>
        
      </a-card>
      <a-card :hoverable="true" :bordered="true" class="column">
        <a href="https://github.com/tuwien2020/tgi-pages" target="_blank">Github Repository <icon type="github" theme="filled" /></a>
      </a-card>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { pagesByCategory, getCategory } from "./../assets/navigation";
import Card from "ant-design-vue/lib/card";
import Icon from "ant-design-vue/lib/icon";

export default defineComponent({
  components: {Icon, Card},
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
