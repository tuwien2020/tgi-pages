<template>
  <a-select
    show-search
    placeholder="Search"
    option-filter-prop="value"
    style="width: 200px"
    :allowClear="true"
    :filter-option="filterOptions"
  >
    <a-select-option v-for="page in searchablePages" :key=page.name :value=page.name>
      <router-link v-if="page.internal" :to="page.link">{{page.name}}</router-link>
      <a target="_blank" v-if="!page.internal" :href="page.link">{{page.name}}</a>
    </a-select-option>
  </a-select>
</template>

<script lang="ts">
import { filterOption } from "ant-design-vue/lib/vc-mentions/src/util";
import { searchTools, searchablePages } from "../router/navigation";
import {
  defineComponent,
} from "vue";

export default defineComponent({
  props: {
    value: {
      type: [Object, String, Array, Boolean],
      required: true,
    },
  },
  setup(props, context) {
    const filterOptions = (input, option) => {
      
      return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    }
     
    return {
      searchablePages,
      filterOptions
    };
  },
});
</script>

<style>

</style>