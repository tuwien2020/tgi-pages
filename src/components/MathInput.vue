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
import { MathJson, MathJsonLogicalOperator } from "./../MathJson";
import Katex from "katex";
import { tryParse as tryParseAstLogical } from "./../assets/grammar-logical";
import { useMathPrinting } from "./../math/math-printing";

function useLogicalParsing() {
  function toMathJsonRecursive(ast: any) {
    if (ast.left) {
      return [
        ast.operator,
        toMathJsonRecursive(ast.left),
        toMathJsonRecursive(ast.right),
      ];
    } else if (ast.right && ast.operator) {
      return [ast.operator, toMathJsonRecursive(ast.right)];
    } else if (ast.right) {
      return toMathJsonRecursive(ast.right);
    } else {
      return ast.value;
    }
  }

  function parseLogical(
    value: string
  ): { mathJson?: MathJson; error?: string } {
    // Doesn't have a AND before OR order of operations (yet)
    try {
      const parsed = tryParseAstLogical(value);
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  return {
    parseLogical,
  };
}

function useMathParsing() {
  function parseMath(value: string): { mathJson?: MathJson; error?: string } {
    console.log(tryParseAstLogical(value));
    //@ts-ignore
    return [value];
  }

  return {
    parseMath,
  };
}

export default defineComponent({
  props: {
    type: {
      type: String, // "math" | "logical"
      default: "math",
    },
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: {
    "update:modelValue": (value: string) => true,
    mathJson: (value: MathJson) => true,
  },
  setup(props, context) {
    const logicalParsing = useLogicalParsing();
    const mathParsing = useMathParsing();
    const mathPrinting = useMathPrinting();

    const mathinput = ref("" + props.modelValue);
    const mathoutput = ref<HTMLElement>();

    watch(
      () => props.modelValue,
      (value) => {
        mathinput.value = value;
        let parsedAst =
          props.type === "logical"
            ? logicalParsing.parseLogical(value)
            : mathParsing.parseMath(value);

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