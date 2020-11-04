<template>
  <div>
    <h1>Bin&auml;r Rechner</h1>

    <h2>Codierungen</h2>
    <p>Gebe hier ein Bitmuster ein:</p>
    <math-input
      v-model="bitUserInput"
      :mathParser="parseBinary"
      @mathJson="(value) => (bitPattern = value)"
    ></math-input>

    <p>Bitmuster interpretiert als</p>

    <!-- TODO: Interpret bitpattern as ... -->
    <!--
    <select>
      <option value="sign-bit">VZ und Betrag</option>
      <option value="ones-complement">Einerkomplement</option>
      <option value="twos-complement">Zweierkomplement</option>
      <option value="excess-e">Exzessdarstellung</option>
      <option value="fixed-point">Festpunkt</option>
    </select>
-->
    <!--TODO: Length -->

    <!--TODO: Print out the results -->
  </div>
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
import { MathJson } from "../MathJson";
import MathInput from "./../components/MathInput.vue";
import { tryParseNumber } from "./../assets/grammar-math";

function useBinaryParsing() {
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

  function parseBinary(value: string): { mathJson?: MathJson; error?: string } {
    try {
      const parsed = tryParseNumber(value, { type: "binary" });
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  return {
    parseBinary,
  };
}

export default defineComponent({
  components: { MathInput },
  setup() {
    const { parseBinary } = useBinaryParsing();
    const bitUserInput = ref("");
    const bitPattern = shallowRef<MathJson>();

    return {
      bitUserInput,
      bitPattern,
      parseBinary,
    };
  },
});
</script>
