<template>
  <!-- Or I could just have used a datalist -->
  <details>
    <summary><slot name="title"></slot></summary>
    <table v-bind:class="{'table-toggled': toggle, 'table': true}">
      <thead> 
        <slot name="header"></slot> 
      </thead>
      <tbody v-bind:class="{'table-toggled': toggle}">
        <slot name="body"></slot>
      </tbody>
    </table>
  </details>
</template>

<script lang="ts">
import { defineComponent, ref} from "vue";


export default defineComponent({
  props: {
    toggleText: {
      type: String,
      requried: false,
      default: "Toggle",
    },
  },
  setup(props, context) {
    const toggle = ref(false);
    return {
      ...props,
      toggle
    };
  },
});
</script>

<style scoped>
.table tbody, .table * {
  transition: 0.2s ease-out;
}

.table-toggled {
  display: none;
}

details {
    border: 1px solid #aaa;
    border-radius: 4px;
    padding: .5em .5em 0;
}

summary {
    font-weight: bold;
    margin: -.5em -.5em 0;
    padding: .5em;
}

details[open] {
    padding: .5em;
}

details[open] summary {
    border-bottom: 1px solid #aaa;
    margin-bottom: .5em;
}
</style>