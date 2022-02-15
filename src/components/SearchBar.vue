<template>
  <!-- Or I could just have used a datalist -->
  <span class="search-bar" @keyup="onKeyUp">
    <input type="text" placeholder="SEARCH" v-model="searchText" class="search-input" />
    <div class="search-options">
      <div v-for="option in filteredOptions" :key="option.name" :value="option.name">
        <router-link v-if="option.internal" :to="option.link" class="search-link">{{ option.name }}</router-link>
        <a target="_blank" v-else :href="option.link" class="search-link">{{ option.name }}</a>
      </div>
    </div>
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
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
    const searchText = ref("");

    let filterOptions: (input: string, option: SearchOption) => boolean;
    if (props.filterOptions != undefined) {
      filterOptions = props.filterOptions;
    } else if (props.fuzzy) {
      filterOptions = (input, option) => {
        return (fuzzySort.single(input as string, option.name as string)?.score ?? 100000) < 4000;
      };
    } else {
      filterOptions = (input, option) => option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    }

    const links = props.links;
    const filteredOptions = computed(() => props.options.filter((opt) => (searchText.value ? filterOptions(searchText.value, opt) : true)));

    function onKeyUp(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        (ev.target as HTMLElement)?.blur?.();
      }
    }

    return {
      searchText,
      filteredOptions,
      links,
      onKeyUp,
    };
  },
});
</script>

<style scoped>
.search-bar {
  position: relative;
  height: max(1.4em,30px);
  margin-left: 4px;
  margin-right: 4px;
  width: max(3em, 200px);
}
.search-input {
  background: white;
  border: 1px solid rgba(144, 144, 144, 0.739);
  border-radius: 5px;
  height: max(1.4em,30px);
  width: max(3em, 200px);
  margin: 0px 0px 1px 0px;
  transition: box-shadow 0.5s ease-out;
  font-family: BlinkMacSystemFont, -apple-system, "Roboto", "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
}

.search-input:hover {
  box-shadow: 1px 1px 10px 3px #b8b8b883;
}

.search-options {
  display: none;
  position: absolute;
  left: 0px;
  right: 0px;
  width: max(3em, 200px);
  top: calc(100% + 4px);
  border-radius: 4px;
  background: white;
  overflow-x: hidden;
  overflow-y: scroll;
  white-space: nowrap;
  max-height: 50vh;  
  font-family: BlinkMacSystemFont, -apple-system, "Roboto", "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
}

.search-options > div {
  padding: 4px 8px;
  transition: box-shadow 0.5s ease-out;
}

.search-bar:focus-within > .search-options {
  display: initial;
}
</style>