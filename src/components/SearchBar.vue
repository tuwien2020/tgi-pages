<template>
  <blaze-autocomplete placeholder="Search"></blaze-autocomplete>
  <!--<a-select show-search placeholder="Search" option-filter-prop="value" style="width: 200px" :allowClear="true" :filter-option="filterOptions">
    <a-select-option v-for="option in options" :key="option.name" :value="option.name">
      <router-link v-if="option.internal" :to="option.link" class="search-link">{{ option.name }}</router-link>
      <a target="_blank" v-else :href="option.link" class="search-link">{{ option.name }}</a>
    </a-select-option>
  </a-select>-->
</template>

<script lang="ts">
import { searchTools, searchablePages } from "../router/navigation";
import { defineComponent, PropType } from "vue";
import fuzzySort from "fuzzysort";

export type SearchOption = {
  name: string;
  internal: boolean;
  link: string;
};

export default defineComponent({
  props: {
    options: {
      type: Object as PropType<SearchOption[]>,
      required: true,
    },
    links: {
      // unused for now
      type: Boolean,
      requried: false,
      default: true,
    },
    filterOptions: {
      type: Function as PropType<(input: any, output: any) => boolean>,
      required: false,
    },
    fuzzy: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, context) {
    let filterOptions: (input: any, option: any) => boolean;
    if (props.filterOptions != undefined) {
      filterOptions = props.filterOptions;
    } else if (props.fuzzy) {
      filterOptions = (input, option) => {
        console.log(input);
        return (fuzzySort.single(input as string, option.value as string)?.score ?? 100000) < 4000;
      };
    } else {
      filterOptions = (input, option) => option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    }

    const links = props.links;
    const options = props.options;

    return {
      options,
      filterOptions,
      links,
    };
  },
});
</script>

<style scoped>
/* Silly hack */
.search-link {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 8px;
}
</style>