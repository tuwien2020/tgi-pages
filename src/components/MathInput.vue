<template>
  <input type="text" v-model="mathinput" />
  <div ref="mathoutput"></div>
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
} from "vue";
import { MathJson } from "./../MathJson";
import Katex from "katex";

function useMathParsing() {
  function parseMath(value: string): MathJson {
    //@ts-ignore
    return [value];
  }

  function mathToLatex(value: MathJson) {
    //@ts-ignore
    return value[0];
  }

  return {
    parseMath,
    mathToLatex,
  };
}

export default defineComponent({
  setup() {
    const mathParsing = useMathParsing();

    const mathinput = ref("");
    const parsed = ref<any>();
    const mathoutput = ref<HTMLElement>();

    onMounted(() => {
      watch(mathinput, (value) => {
        nextTick(() => {
          parsed.value = mathParsing.parseMath(value);

          //@ts-ignore
          const latex = mathParsing.mathToLatex(parsed.value);

          Katex.render(latex, mathoutput.value, {
            displayMode: true,
            throwOnError: false,
            output: "html",
          });
        });
      });
    });

    return {
      mathinput,
      mathoutput,
    };
  },
});
</script>

<style>
</style>