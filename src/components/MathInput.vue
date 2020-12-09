<template>
  <div class="math-input">
    <input type="text" v-model="mathinput" size="100" />
    <div
      ref="mathoutput"
      @mouseover="hoverOverMath($event)"
      @mouseout="hoverOverMath($event)"
    ></div>
  </div>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  onMounted,
  nextTick,
  PropType,
} from "vue";
import { MathJson, MathJsonLogicalOperator } from "./../math/MathJson";
import Katex from "katex";
import { useMathPrinting } from "./../math/math-printing";

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    mathParser: {
      type: Function as PropType<
        (value: string) => { mathJson?: MathJson; error?: string }
      >,
      required: true,
    },
  },
  emits: {
    "update:modelValue": (value: string) => true,
    mathJson: (value: MathJson) => true,
  },
  setup(props, context) {
    const mathPrinting = useMathPrinting();

    const mathinput = ref("" + props.modelValue);
    const mathoutput = ref<HTMLElement>();

    const lastTargets: HTMLElement[] = [];
    function hoverOverMath(event: MouseEvent) {
      lastTargets.forEach((t) => (t.style.color = ""));
      lastTargets.length = 0;

      if (event.target instanceof HTMLElement && event.type == "mouseover") {
        if (event.target.innerText == "(" || event.target.innerText == ")") {
          const bracketId = event.target.parentElement?.getAttribute(
            "data-bracketid"
          );
          mathoutput.value
            ?.querySelectorAll(`[data-bracketid='${bracketId}']`)
            ?.forEach((v) => {
              if (v instanceof HTMLElement) {
                v.style.color = "red";
                lastTargets.push(v);
              }
            });
        }
      }
    }

    watch(
      () => props.modelValue,
      (value) => {
        mathinput.value = value;
        let parsedAst = props.mathParser(value);

        if (parsedAst.mathJson && !parsedAst.error) {
          context.emit("mathJson", parsedAst.mathJson);
        }

        nextTick(() => {
          const latex = mathPrinting.mathToLatex(parsedAst, {
            bracketIds: true,
          });

          if (mathoutput.value) {
            Katex.render(latex, mathoutput.value, {
              displayMode: true,
              throwOnError: false,
              output: "html",
              trust: function (context) {
                return context.command == "\\htmlData";
              },
            });
          }
        });
      },
      {
        immediate: true,
      }
    );

    watch(mathinput, (value) => {
      context.emit("update:modelValue", value);
    });

    return {
      mathinput,
      mathoutput,
      hoverOverMath,
    };
  },
});
</script>

<style>
.math-input {
  display: inline-block;
}
.math-input input {
  font-family: "Consolas", "Courier New", Courier, monospace;
}
.error {
  color: red;
}
</style>