<template>
  <div>
    <h1>Bin&auml;re Codierungen</h1>
    <!--<h2>Encoding</h2>
    <p>Gebe hier eine Bin&auml;re Zahl ein:</p>-->

    <h2>Decoding</h2>
    <p>Gebe hier ein Bitmuster ein:</p>
    <math-input
      v-model="userInput"
      :mathParser="parseBitArray"
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
      <tbody class="monospace">
        <tr v-for="(item, index) in formats" :key="index">
          <td>{{ item.name }}</td>
          <td class="align-right">
            {{ binaryToString(item.binaryNumber) }}
          </td>
          <td class="align-right">{{ binaryToDecimal(item.binaryNumber) }}</td>
          <td>-</td>
          <td>
            <label
              v-for="(option, optionName) in item.options"
              :key="optionName"
              >{{ optionName }} =
              <input
                type="text"
                :value="option.value"
                @input="
                  (event) =>
                    (option.value = event.target.value.replace(/[^01]/, ''))
                "
            /></label>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, shallowRef, ComputedRef, unref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MathJson, MathJsonNumber } from "../math/MathJson";
import MathInput from "./../components/MathInput.vue";
import { tryParseBinaryNumber, tryParseNumber } from "./../assets/grammar-math";
import { BinaryNumber } from "../math/binary-number";
import { useUrlRef } from "../url-ref";
import { useMathPrinting } from "../math/math-printing";

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

  function parseBitArray(
    value: string
  ): { mathJson?: MathJson; error?: string } {
    try {
      const parsed = tryParseBinaryNumber(value);
      if (parsed.value.decimalPoint > 0) {
        return { error: "Bit array cannot have a decimal point" };
      }
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  function parseBinary(value: string): { mathJson?: MathJson; error?: string } {
    try {
      const parsed = tryParseBinaryNumber(value);
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  // TODO: Handle fractional binary numbers
  function binaryToString(value: BinaryNumber) {
    const sign = unref(value).isNegative ? "-" : "+";
    const beforeDecimal = unref(value)
      .getValueBeforeDecimal()
      .map((v) => (v ? "1" : "0"))
      .join("");
    const afterDecimal = unref(value)
      .getValueAfterDecimal()
      .map((v) => (v ? "1" : "0"))
      .join("");

    return (
      sign +
      beforeDecimal +
      (afterDecimal !== undefined && afterDecimal.length > 0
        ? `.${afterDecimal}`
        : "")
    );
  }

  return {
    parseBitArray,
    parseBinary,
    binaryToString,
  };
}

export default defineComponent({
  components: { MathInput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const mathPrinting = useMathPrinting();

    const { parseBitArray, parseBinary, binaryToString } = useBinaryParsing();
    const userInput = urlRef("input", "0");
    const mathJsonNumber = shallowRef<MathJson>();

    // TODO: This is actually not a valid mathjsonnumber
    const bitPattern: ComputedRef<readonly boolean[]> = computed(
      () => (mathJsonNumber.value as any)?.value ?? []
    );

    function defineFormat<T extends object>(
      name: string,
      getBinaryNumber: (
        value: ReadonlyArray<boolean>,
        options: T
      ) => BinaryNumber,
      options: T
    ) {
      return {
        name,
        binaryNumber: computed(() =>
          getBinaryNumber(bitPattern.value, options)
        ),
        options,
      };
    }

    function binaryToDecimal(value: BinaryNumber): BigInt {
      value = unref(value);
      let result = BigInt(0);
      const oneAsBigint = BigInt(1);
      const twoAsBigint = BigInt(2);

      for (let i = 0; i < value.value.length; i++) {
        const bit = value.value[i];
        result = result * twoAsBigint;
        if (bit) {
          result += oneAsBigint;
        }
      }

      if (value.isNegative) {
        result *= BigInt(-1);
      }

      if (value.decimalPoint > 0) {
        // TODO: Support decimal points > 0
        console.warn("not supported");
      }

      return result;
    }

    const formats = [
      defineFormat(
        "VZ und Betrag",
        (value, options) => BinaryNumber.fromSignMagnitude(value),
        {}
      ),
      defineFormat(
        "Einerkomplement",
        (value, options) => BinaryNumber.fromOnesComplement(bitPattern.value),
        {}
      ),
      defineFormat(
        "Zweierkomplement",
        (value, options) => BinaryNumber.fromTwosComplement(bitPattern.value),
        {}
      ),
      defineFormat(
        "Exzessdarstellung",
        (value, options) =>
          BinaryNumber.fromOffsetBinary(
            bitPattern.value,
            tryParseBinaryNumber(options.e.value).value.value
          ),
        {
          e: urlRef("input-offset", "0"),
        }
      ),
      /*TODO:
      {
        name: "Festpunkt",
      },*/
    ];

    return {
      parseBitArray,
      parseBinary,
      userInput,
      mathJsonNumber,
      formats,
      binaryToString,
      binaryToDecimal,
    };
  },
});
</script>

<style scoped>
.monospace {
  font-family: "Consolas", "Courier New", Courier, monospace;
}
.monospace input {
  font-family: "Consolas", "Courier New", Courier, monospace;
}
.align-right {
  text-align: right;
}
</style>