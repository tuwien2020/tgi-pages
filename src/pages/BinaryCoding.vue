<template>
  <div>
    <h1>Bin&auml;re Codierungen</h1>
    <!--<h2>Encoding</h2>
    <p>Gebe hier eine Bin&auml;re Zahl ein:</p>-->

    <h2>Decoding</h2>
    <p>Gebe hier ein Bitmuster ein:</p>
    <math-input
      v-model="userInput"
      :mathTransformer="transform"
      @mathJson="(value) => (mathJsonNumber = value)"
      :formatting="{ customPrinter }"
    ></math-input>
    <span v-if="!isBitPattern" class="error-message">Expected a bit pattern</span>
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
            <label v-for="(option, optionName) in item.options" :key="optionName">
              {{ option.name }} =
              <input
                type="text"
                :value="option.value.value"
                @input="(event) => (option.value.value = event.target.value)"
                :pattern="option.pattern"
              />
            </label>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, shallowRef, ComputedRef, unref, Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MathJson } from "../math/math-parsing";
import MathInput from "./../components/MathInput.vue";
import { BinaryNumber } from "../math/binary-number";
import { useUrlRef } from "../url-ref";
import { useBinaryExpressions } from "../math/binary-expression";

export default defineComponent({
  components: { MathInput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const useBinary = useBinaryExpressions();

    const userInput = urlRef("input", "0");
    const mathJsonNumber = shallowRef<MathJson<BinaryNumber>>();
    const isBitPattern = computed(
      () => mathJsonNumber.value instanceof BinaryNumber && mathJsonNumber.value.decimalPoint === 0 && !mathJsonNumber.value.isNegative
    );

    const bitPattern: ComputedRef<readonly boolean[]> = computed(() => (isBitPattern ? (mathJsonNumber.value as any)?.value ?? [] : []));

    function defineFormat<T extends { [key: string]: { value: Ref<string>; name: string; pattern?: RegExp } }>(
      name: string,
      getBinaryNumber: (value: ReadonlyArray<boolean>, options: T) => BinaryNumber,
      options: T
    ) {
      return {
        name,
        binaryNumber: computed(() => getBinaryNumber(bitPattern.value, options)),
        options,
      };
    }

    function parseBitArray(value: string): boolean[] {
      const bitPatternRegex = /^([0-1]+)$/;

      const matchResults = (value ?? "").match(bitPatternRegex);
      if (matchResults === null) return [];

      const [_, bits] = matchResults;
      return bits.split("").map((v) => (v === "0" ? false : true));
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

      return sign + beforeDecimal + (afterDecimal !== undefined && afterDecimal.length > 0 ? `.${afterDecimal}` : "");
    }

    const formats = [
      defineFormat("VZ und Betrag", (value, options) => BinaryNumber.fromSignMagnitude(value), {}),
      defineFormat("Einerkomplement", (value, options) => BinaryNumber.fromOnesComplement(value), {}),
      defineFormat("Zweierkomplement", (value, options) => BinaryNumber.fromTwosComplement(value), {}),
      defineFormat("Exzessdarstellung", (value, options) => BinaryNumber.fromOffsetBinary(value, parseBitArray(options.e.value.value)), {
        e: {
          name: "Exzess (binär)",
          value: urlRef("input-offset", "0"),
          pattern: /^[01]+$/,
        },
      }),
      defineFormat(
        "Festpunkt",
        (value, options) =>
          BinaryNumber.fromSignMagnitude(value).multiplyByPowerOfTwo(Number.isSafeInteger(-options.n.value.value) ? -options.n.value.value : 0),
        {
          n: {
            name: "Nachkommastellen",
            value: urlRef("input-point", "0"),
            pattern: /^[0-9]+$/,
          },
        }
      ),
    ];

    return {
      userInput,
      mathJsonNumber,
      formats,
      binaryToDecimal,
      binaryToString,
      transform: useBinary.transform,
      customPrinter: useBinary.customPrinter,
      isBitPattern,
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
.error-message {
  color: red;
}
</style>