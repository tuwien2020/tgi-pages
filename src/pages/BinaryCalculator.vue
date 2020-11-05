<template>
  <h1>Bin&auml;r Rechner</h1>
  <math-input
    v-model="userInput"
    :mathParser="parseBinaryOperation"
    @mathJson="(value) => (mathJsonExpression = value)"
  ></math-input>

  <br />
  <math-single-op
    :operator="mathJsonExpression?.[0]"
    :valueA="mathJsonExpression?.[1]"
    :valueB="mathJsonExpression?.[2]"
  ></math-single-op>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  shallowRef,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { BinaryNumber } from "../math/binary-number";
import { MathJson, MathJsonLogicalOperator } from "../math/MathJson";
import { useUrlRef } from "../url-ref";
import { tryParse as tryParseAst } from "./../assets/grammar-single-op";
import MathInput from "./../components/MathInput.vue";
import MathOutput from "./../components/MathOutput.vue";
import MathSingleOp from "./../components/MathSingleOp.vue";

function useBinaryParsing() {
  function toMathJsonRecursive(ast: any): MathJson {
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

  function parseBinaryOperation(
    value: string
  ): { mathJson?: MathJson; error?: string } {
    try {
      const parsed = tryParseAst(value);
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  return {
    parseBinaryOperation,
  };
}

export default defineComponent({
  components: { MathInput, MathOutput, MathSingleOp },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const userInput = urlRef("input", "101+1110");
    const { parseBinaryOperation } = useBinaryParsing();
    const mathJsonExpression = shallowRef<MathJson>();

    return {
      userInput,
      parseBinaryOperation,
      mathJsonExpression,
    };
  },
});
</script>
