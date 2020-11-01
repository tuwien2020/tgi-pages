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
} from "vue";
import { MathJson } from "./../MathJson";
import Katex from "katex";
import { parse } from "./../assets/grammar";

function useMathParsing() {
  function parseMath(value: string): MathJson {
    console.log(parse(value));
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
.math-input {
  display: inline-block;
}
.math-input input {
  font-family: "Consolas", "Courier New", Courier, monospace;
}
</style>