<template>
  <div class="math-output" ref="mathoutput"></div>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, onMounted, nextTick } from "vue";
import { MathJson, MathJsonLogicalOperator } from "./../math/MathJson";
import Katex from "katex";
import { useMathPrinting } from "./../math/math-printing";

export default defineComponent({
  props: {
    value: {
      type: [Object, String, Array, Boolean],
      required: true,
    },
  },
  setup(props, context) {
    const mathPrinting = useMathPrinting();
    const mathoutput = ref<HTMLElement>();

    onMounted(() => {
      watch(
        () => props.value,
        (value) => {
          nextTick(() => {
            const latex = mathPrinting.mathToLatex({
              mathJson: value as MathJson,
            });

            if (mathoutput.value) {
              Katex.render(latex, mathoutput.value, {
                displayMode: true,
                throwOnError: false,
                output: "html",
              });
            }
          });
        },
        {
          immediate: true,
        }
      );
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