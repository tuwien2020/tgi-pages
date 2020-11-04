<template>
  <div>
    <h1>Bin&auml;r Rechner</h1>

    <h2>Codierungen</h2>
    <p>Gebe hier ein Bitmuster ein:</p>
    <math-input
      v-model="userInput"
      :mathParser="parseBinary"
      @mathJson="(value) => (mathJsonNumber = value)"
    ></math-input>

    <table>
      <thead>
        <tr>
          <th>Bitmuster interpretiert als</th>
          <th>Bin&auml;r-Decoded</th>
          <th>Dezimal-Decoded</th>
          <th>Hexadezimal-Decoded</th>
          <th>mit Einstellungen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in formats" :key="index">
          <td>{{ item.name }}</td>
          <td>{{ item.name }}</td>
        </tr>
      </tbody>
    </table>
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
  readonly,
} from "vue";
import { MathJson, MathJsonNumber } from "../MathJson";
import MathInput from "./../components/MathInput.vue";
import { tryParseNumber } from "./../assets/grammar-math";
import { BinaryNumber } from "../math/binary-number";

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
    const userInput = ref("");
    const mathJsonNumber = shallowRef<MathJson>();
    const bitPattern = computed(() =>
      (bitPattern.value as MathJsonNumber).value
        .split("")
        .map((v) => (v === "0" ? false : true))
    );

    const formats = readonly([
      {
        name: "VZ und Betrag",
        binaryNumber: computed(() =>
          BinaryNumber.fromSignMagnitude(bitPattern)
        ),
      },
      {
        name: "Einerkomplement",
        binaryNumber: computed(() =>
          BinaryNumber.fromOnesComplement(bitPattern)
        ),
      },
      {
        name: "Zweierkomplement",
        binaryNumber: computed(() =>
          BinaryNumber.fromTwosComplement(bitPattern)
        ),
      },
      {
        name: "Exzessdarstellung",
      },
      {
        name: "Festpunkt",
      },
    ]);

    function binaryNumberToString(value: BinaryNumber) {
      return `${value.isNegative ? "-" : "+"}${value.value
        .map((v) => (v ? "1" : "0"))
        .join("")}`;
    }

    return {
      parseBinary,
      userInput,
      mathJsonNumber,
      formats,
    };
  },
});
</script>
