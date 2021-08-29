<template>
  <div class="math-output" ref="mathoutput" @mouseover="hoverOverMath($event)" @mouseout="hoverOverMath($event)"></div>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, onMounted, nextTick } from "vue";
import { MathJson } from "./../math/math-parsing";
import Katex from "katex";
import { useMathPrinting } from "./../math/math-printing";

export default defineComponent({
  props: {
    value: {
      type: [Object, String, Array, Boolean],
      required: false,
    },
    latex: {
      type: String,
      required: false,
    },
    formatting: {
      type: Object,
      required: false,
    },
  },
  setup(props, context) {
    const mathPrinting = useMathPrinting();
    const mathoutput = ref<HTMLElement>();

    // For coloring bracket pairs
    const lastTargets: HTMLElement[] = [];
    function hoverOverMath(event: MouseEvent) {
      lastTargets.forEach((t) => (t.style.color = ""));
      lastTargets.length = 0;

      if (event.target instanceof HTMLElement && event.type == "mouseover") {
        if (event.target.innerText == "(" || event.target.innerText == ")") {
          const bracketId = event.target.parentElement?.getAttribute("data-bracketid");
          mathoutput.value?.querySelectorAll(`[data-bracketid='${bracketId}']`)?.forEach((v) => {
            if (v instanceof HTMLElement) {
              v.style.color = "red";
              lastTargets.push(v);
            }
          });
        }
      }
    }

    // Output the latex
    watchEffect(() => {
      const latex = props.latex || mathPrinting.mathToLatex(props.value as MathJson, props.formatting);

      nextTick(() => {
        if (mathoutput.value) {
          Katex.render(latex, mathoutput.value, {
            displayMode: true,
            throwOnError: false,
            //output: "html",
            trust: function (context) {
              return context.command === "\\htmlData" || context.command === "\\htmlStyle";
            },
            strict: false,
            macros: {
              "\\phantom": "\\htmlStyle{color: transparent; user-select: none;}{#1}",
            },
          });
        }
      });
    });

    return {
      mathoutput,
      hoverOverMath,
    };
  },
});
</script>

<style>
.math-output {
  display: inline-block;
}
</style>