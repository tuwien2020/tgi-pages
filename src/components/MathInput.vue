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

function useMathPrinting() {
  const mathJsonOperatorMap = new Map<MathJsonLogicalOperator, string>([
    ["not", "\\neg"],
    ["implies", "\\implies"],
    ["and", "\\land"],
    ["or", "\\lor"],
    ["xor", "\\mathbin{\\mathtt{xor}}"],
    ["nand", "\\mathbin{\\mathtt{nand}}"],
    ["nor", "\\mathbin{\\mathtt{nor}}"],
    ["equals", "\\Leftrightarrow"],
  ]);

  function needsBrackets(ast: MathJson) {
    // For a correct implementation, you'd need to implement operator precedence...
    if (Array.isArray(ast) && ast.length == 3) {
      return true;
    } else {
      return false;
    }
  }

  function toLatexRecursive(ast: MathJson) {
    if (Array.isArray(ast)) {
      const op = mathJsonOperatorMap.get(ast[0]);
      if (!op) {
        throw new Error("Unknown operator " + ast);
      }

      if (ast.length == 0) {
        throw new Error("Not well formed AST tree " + ast);
      } else if (ast.length == 2) {
        let right = toLatexRecursive(ast[1]);
        if (needsBrackets(ast[1])) {
          right = `(${right})`;
        }
        return `${op} ${right}`;
      } else if (ast.length == 3) {
        let left = toLatexRecursive(ast[1]);
        if (needsBrackets(ast[1])) {
          left = `(${left})`;
        }
        let right = toLatexRecursive(ast[2]);
        if (needsBrackets(ast[2])) {
          right = `(${right})`;
        }
        return `${left} ${op} ${right}`; // TODO:
      } else {
        throw new Error("Not well formed AST tree " + ast);
      }
    } else if (ast === true) {
      return "\\mathtt{1}";
    } else if (ast === false) {
      return "\\mathtt{0}";
    } else if (typeof ast === "string") {
      return ast;
    }
  }

  function mathToLatex(value: { mathJson?: MathJson; error?: string }): string {
    if (value.mathJson) {
      try {
        const output = toLatexRecursive(value.mathJson);
        return output;
      } catch (e) {
        value.error = e;
      }
    }

    if (value.error) {
      // https://tex.stackexchange.com/a/34586
      let escaped = value.error
        .replace(/\\/g, "\\textbackslash")
        .replace(/[&%$#_{}]/g, "\\$&")
        .replace(/\[/g, "{[}")
        .replace(/\]/g, "{]}")
        .replace(/~/g, "{\\textasciitilde}")
        .replace(/\^/g, "{\\textasciicircum}")
        .replace(/[^\x00-\x7F]/g, function (c) {
          return `\\char"${c.codePointAt(0).toString(16)}`;
        });
      // TODO: Prevent KaTeX warnings when encountering Unicode symbols
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