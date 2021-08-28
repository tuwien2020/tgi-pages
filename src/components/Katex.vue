<template>
  <div class="math-output" ref="mathoutput"></div>
</template>

<script lang="ts">
import { ref, defineComponent, watch, onMounted, nextTick, watchEffect } from "vue";
import Katex from "katex";

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  setup(props, context) {
    const mathoutput = ref<HTMLElement>();
    watchEffect(() => {
      if (mathoutput.value) {
        Katex.render(props.value + "", mathoutput.value, {
          displayMode: true,
          throwOnError: false,
          output: "html",
        });
      }
    });

    return {
      mathoutput,
    };
  },
});
</script>

<style>
.math-output {
  display: inline-block;
}
</style>