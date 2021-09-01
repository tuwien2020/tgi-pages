<template>
  <div>
    <h1>Bin&auml;re Codierungen</h1>
    <!-- TODO: Is this UI fine or is it confusing? -->
    <h2>Encoding</h2>
    <p>Gebe hier eine Bin&auml;re Zahl ein:</p>
    <math-input
      v-model="userInputEncoding"
      :mathTransformer="transform"
      @mathJson="(value) => (mathJsonEncoding = value)"
      :formatting="{ customPrinter }"
    ></math-input>
    <br />
    <span v-if="!isBinaryNumber" class="error-message">Expected a binary number</span>
    <table>
      <thead>
        <tr>
          <th>Binärzahl</th>
          <th>Bin&auml;r-Encoded</th>
          <th>mit Einstellungen</th>
        </tr>
      </thead>
      <tbody class="monospace">
        <tr v-for="(item, index) in formats" :key="index">
          <td>{{ item.name }}</td>
          <td class="align-right">
            <!-- TODO: Warn if it has a decimal point -->
            {{ bitsToString(item.getBits(binaryNumber)) }}
          </td>
          <td>
            <label v-for="(option, optionIndex) in item.options" :key="optionIndex">
              {{ option.name }} =
              <!-- TODO: Minor warning: Those are the same options as below, depending on how the UI should look, this may or may not be fine -->
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

    <br />
    <h2>Decoding</h2>
    <p>Gebe hier ein Bitmuster ein:</p>
    <math-input
      v-model="userInputDecoding"
      :mathTransformer="transform"
      @mathJson="(value) => (mathJsonDecoding = value)"
      :formatting="{ customPrinter }"
    ></math-input>
    <!-- TODO: Improve the error message (maybe with a custom tranform?) -->
    <br />
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
            {{ binaryToString(item.getBinaryNumber(bitPattern)) }}
          </td>
          <td class="align-right">{{ binaryToDecimal(item.getBinaryNumber(bitPattern)) }}</td>
          <td>
            -
            <!-- TODO: Hexadecimal decoding -->
          </td>
          <td>
            <label v-for="(option, optionIndex) in item.options" :key="optionIndex">
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

interface BinaryFormat {
  name: string;
  hasDecimalPoint: boolean;
  getBits(value: BinaryNumber): boolean[];
  getBinaryNumber(value: ReadonlyArray<boolean>): BinaryNumber;
  options: { value: Ref<string>; name: string; pattern?: string }[];
}

export default defineComponent({
  components: { MathInput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const useBinary = useBinaryExpressions();

    const userInputEncoding = urlRef("input-encoding", "0");
    const mathJsonEncoding = shallowRef<MathJson<BinaryNumber>>();
    const isBinaryNumber = computed(() => mathJsonEncoding.value instanceof BinaryNumber);
    const binaryNumber = computed(() => (mathJsonEncoding.value instanceof BinaryNumber ? mathJsonEncoding.value : new BinaryNumber(false, [], 0)));

    const userInputDecoding = urlRef("input-decoding", "0");
    const mathJsonDecoding = shallowRef<MathJson<BinaryNumber>>();
    const isBitPattern = computed(
      () => mathJsonDecoding.value instanceof BinaryNumber && mathJsonDecoding.value.decimalPoint === 0 && !mathJsonDecoding.value.isNegative
    );

    const bitPattern: ComputedRef<readonly boolean[]> = computed(() => (isBitPattern ? (mathJsonDecoding.value as any)?.value ?? [] : []));

    const formats: BinaryFormat[] = [
      // Abusing closures for private variables
      (() => {
        return {
          name: "VZ und Betrag",
          hasDecimalPoint: false,
          options: [],
          getBits(value) {
            return [value.isNegative ? 1 : 0, ...value.getValueBeforeDecimal()];
          },
          getBinaryNumber(value) {
            return BinaryNumber.fromSignMagnitude(value);
          },
        } as BinaryFormat;
      })(),
      (() => {
        return {
          name: "Einerkomplement",
          hasDecimalPoint: false,
          options: [],
          getBits(value) {
            const bitArray = value.getValueBeforeDecimal();
            if (value.isNegative) {
              for (let i = 0; i < bitArray.length; i++) {
                bitArray[i] = !bitArray[i];
              }
            }
            return [value.isNegative ? 1 : 0, ...bitArray];
          },
          getBinaryNumber(value) {
            return BinaryNumber.fromOnesComplement(value);
          },
        } as BinaryFormat;
      })(),
      (() => {
        return {
          name: "Zweierkomplement",
          hasDecimalPoint: false,
          options: [],
          getBits(value) {
            // TODO: -0 cannot be represented in twos complement!
            /*
            Positive values can simply be passed through.
            Negative values need to be converted. We could subtract one and then flip the bits.
            However, the alternative of flipping the bits and adding one also works.
            And that alternative happens to match up with converting to the twos complement format.
            */
            const bitArray = value.getValueBeforeDecimal();
            if (value.isNegative) {
              for (let i = 0; i < bitArray.length; i++) {
                bitArray[i] = !bitArray[i];
              }

              const oneInBinary = new BinaryNumber(false, [true], 0);
              const bitArrayPlusOne = new BinaryNumber(false, bitArray, 0).add(oneInBinary);
              return [value.isNegative ? 1 : 0, ...bitArrayPlusOne.value];
            } else {
              return [value.isNegative ? 1 : 0, ...bitArray];
            }
          },
          getBinaryNumber(value) {
            return BinaryNumber.fromTwosComplement(value);
          },
        } as BinaryFormat;
      })(),
      (() => {
        const offset = urlRef("input-offset", "0");
        return {
          name: "Exzessdarstellung",
          hasDecimalPoint: false,
          options: [
            {
              name: "Exzess (binär)",
              value: offset,
              pattern: "[01]+", // HTML pattern
            },
          ],
          getBits(value) {
            const offsetValue = new BinaryNumber(false, parseBitArray(offset.value), 0);
            return value.add(offsetValue).getValueBeforeDecimal();
          },
          getBinaryNumber(value) {
            return BinaryNumber.fromOffsetBinary(value, parseBitArray(offset.value));
          },
        } as BinaryFormat;
      })(),
      /*(() => {
        // TODO: How should I deal with the festpunkt format?
        const afterDecimalPlaces = urlRef("input-point", "0");
        return {
          name: "Festpunkt",
          hasDecimalPoint: true,
          options: [
            {
              name: "Nachkommastellen",
              value: afterDecimalPlaces,
              pattern: "[0-9]+", // HTML pattern
            },
          ],
          getBits(value) {
            return [value.isNegative ? 1 : 0, ...value.value];
          },
          getBinaryNumber(value) {
            return BinaryNumber.fromSignMagnitude(value).multiplyByPowerOfTwo(
              Number.isSafeInteger(-afterDecimalPlaces.value) ? -afterDecimalPlaces.value : 0
            );
          },
        } as BinaryFormat;
      })(),*/
    ];

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

      const beforeDecimal = value.getValueBeforeDecimal();
      for (let i = 0; i < beforeDecimal.length; i++) {
        const bit = beforeDecimal[i];
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

    function bitsToString(value: boolean[]) {
      return unref(value)
        .map((v) => (v ? "1" : "0"))
        .join("");
    }

    return {
      userInputEncoding,
      userInputDecoding,
      mathJsonEncoding,
      mathJsonDecoding,
      formats,
      binaryNumber,
      bitPattern,
      binaryToDecimal,
      binaryToString,
      bitsToString,
      transform: useBinary.transform,
      customPrinter: useBinary.customPrinter,
      isBinaryNumber,
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
input:valid {
  outline: 0px;
}
input:invalid {
  outline: 1px solid red;
}
</style>