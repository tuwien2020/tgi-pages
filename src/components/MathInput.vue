<template>
  <div class="math-input">
    <input type="text" v-model="mathinput" size="100" />
    <div ref="mathoutput"></div>
    <div class="error"></div>
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
  function parseLogical(
    value: string
  ): { mathJson?: MathJson; error?: string } {
    // Doesn't have a AND before OR order of operations (yet)
    const parsed = parseAstLogical(value.replace(/[ \n\t]*/g, ""));
    if (parsed.err) {
      return { error: "" + parsed.err };
    }

    function toMathJson(ast: any) {
      if (ast.left) {
        return [
          ast.operator.value,
          toMathJson(ast.left),
          toMathJson(ast.right),
        ];
      } else if (ast.right && ast.operator) {
        return [ast.operator.value, toMathJson(ast.right)];
      } else if (ast.right) {
        return toMathJson(ast.right);
      } else {
        return ast.value;
      }
    }

    return { mathJson: toMathJson(parsed.ast) };
  }

  return {
    parseLogical,
  };
}

function useMathParsing() {
  function parseMath(value: string): { mathJson?: MathJson; error?: string } {
    console.log(parseAstLogical(value));
    //@ts-ignore
    return [value];
  }

  return {
    parseMath,
  };
}

function useMathPrinting() {
  function mathToLatex(value: { mathJson?: MathJson; error?: string }): string {
    if (value.error) {
      // https://tex.stackexchange.com/a/34586
      let escaped = value.error
        .replace(/\\/g, "\\textbackslash")
        .replace(/[&%$#_{}]/g, "\\$&")
        .replace(/\[/g, "{[}")
        .replace(/\]/g, "{]}")
        .replace(/~/g, "{\\textasciitilde}")
        .replace(/\^/g, "{\\textasciicircum}");
      return `\\textcolor{red}{\\texttt{${escaped}}}`;
    }

    return "";
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
    const mathoutput = ref<HTMLElement>();

    onMounted(() => {
      watch(mathinput, (value) => {
        nextTick(() => {
          let parsedAst =
            props.type === "logical"
              ? logicalParsing.parseLogical(value)
              : mathParsing.parseMath(value);

          console.log(parsedAst);
          const latex = mathPrinting.mathToLatex(parsedAst);

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
.error {
  color: red;
}
</style>