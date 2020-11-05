<template>
  <div class="math-input">
    <input type="text" v-model="mathinput" size="100" />
    <div ref="mathoutput"></div>
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

    watch(
      () => props.modelValue,
      (value) => {
        mathinput.value = value;
        let parsedAst = props.mathParser(value);

        if (parsedAst.mathJson && !parsedAst.error) {
          context.emit("mathJson", parsedAst.mathJson);
        }

        nextTick(() => {
          const latex = mathPrinting.mathToLatex(parsedAst);

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

    watch(mathinput, (value) => {
      context.emit("update:modelValue", value);
    });

    return {
      mathinput,
      mathoutput,
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