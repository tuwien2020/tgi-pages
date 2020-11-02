<template>
  <h1>Truth Table</h1>
  <p>Gebe hier einen Bool'schen Ausdruck ein:</p>
  <math-input></math-input>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed } from "vue";
import MathInput from "./../components/MathInput.vue";

// TODO: Put the entered stuff into the URL
export default defineComponent({
  components: { MathInput },
  setup() {},
});
</script>
