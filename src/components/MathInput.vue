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
      console.log(parsed);
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
  // TODO: handle (0∨ not 1 ∨ not 0)
  const mathJsonOperatorMap = new Map<MathJsonLogicalOperator, string>([
    ["not", "\\neg"],
    ["implies", "\\implies"],
    ["and", "\\land"],
    ["or", "\\lor"],
    ["xor", "\\mathtt{XOR}"],
    ["nand", "\\mathtt{NAND}"],
    ["nor", "\\mathtt{NOR}"],
    ["equals", "\\Leftrightarrow"],
  ]);

  function mathToLatex(value: { mathJson?: MathJson; error?: string }): string {
    if (value.mathJson) {
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
        }
      }

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