<template>
  <h1>Overview Page</h1>
  <button @click="count++">count is: {{ count }}</button>
  <p>
    Edit <code>components/Overview.vue</code> to test hot module replacement.
  </p>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
export default defineComponent({
  setup() {
    const count = ref(0);

    return {
      count,
    };
  },
});
</script>
