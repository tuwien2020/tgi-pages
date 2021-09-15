<template>
  <elix-filter-combo-box placeholder="Search" aria-label="Search" class="search-box" @close="searchClosed">
    <!--show-search  option-filter-prop="value" style="width: 200px" :allowClear="true" :filter-option="filterOptions"> -->
    <div v-for="option in options" :key="option.name" :value="option.name">
      {{ option.name }}
      <!--<router-link v-if="option.internal" :to="option.link">{{ option.name }}</router-link>
      <a target="_blank" v-else :href="option.link">{{ option.name }}</a>-->
    </div>
  </elix-filter-combo-box>
</template>

<script lang="ts">
import { searchTools, searchablePages } from "../router/navigation";
import { defineComponent, PropType } from "vue";
import fuzzySort from "fuzzysort";
import FilterComboBox from "elix/define/FilterComboBox.js";

export type SearchOption = {
  name: string;
  internal: boolean;
  link: string;
};

export default defineComponent({
  components: {
    FilterComboBox,
  },
  props: {
    options: {
      type: Object as PropType<SearchOption[]>,
      required: true,
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
    // TODO: Hook up fuzzy sort again?
    // (Maybe by hooking into the internal https://component.kitchen/elix/FilterListBox and changing the itemMatchesFilter method?)
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

    const options = props.options;

    async function searchClosed(e: any) {
      console.log(e.detail);
      /*const closeResult = await e.target.whenClosed();
      console.log(closeResult);
      const selectedValue = closeResult?.value;
      console.log(selectedValue);*/
    }

    return {
      options,
      filterOptions,
      searchClosed,
    };
  },
});
</script>
<style scoped>
.search-box::part(popup) {
  max-height: 30vh;
}
</style>
