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
import { parse as parseAstLogical } from "./../assets/grammar-logical";

function useLogicalParsing() {
  function parseLogical(value: string): MathJson {
    console.log(parseAstLogical(value));
    //@ts-ignore
    return [value];
  }

  return {
    parseLogical,
  };
}

function useMathParsing() {
  function parseMath(value: string): MathJson {
    console.log(parseAstLogical(value));
    //@ts-ignore
    return [value];
  }

  return {
    parseMath,
  };
}

function useMathPrinting() {
  function mathToLatex(value: MathJson) {
    //@ts-ignore
    return value[0];
  }

  return {
    mathToLatex,
  };
}

export default defineComponent({
  props: {
    type: {
      type: String, // "math" | "logical"
      default: "math",
    },
  },

  setup(props, context) {
    const logicalParsing = useLogicalParsing();
    const mathParsing = useMathParsing();
    const mathPrinting = useMathPrinting();

    const mathinput = ref("");
    const parsed = ref<any>();
    const mathoutput = ref<HTMLElement>();

    onMounted(() => {
      watch(mathinput, (value) => {
        nextTick(() => {
          if (props.type === "logical") {
            parsed.value = logicalParsing.parseLogical(value);
          } else {
            parsed.value = mathParsing.parseMath(value);
          }

          const latex = mathPrinting.mathToLatex(parsed.value);

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