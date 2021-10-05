<template>
  <!-- Or I could just have used a datalist -->
  <details open>
    <summary>
      <slot name="title"></slot>
    </summary>
    <table>
      <thead> 
        <slot name="header"></slot> 
      </thead>
      <tbody>
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
    return {
      ...props,
    };
  },
});
</script>

<style scoped>
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