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
      <tbody class="monospace">
        <tr v-for="(item, index) in formats" :key="index">
          <td>{{ item.name }}</td>
          <td style="text-align: right">
            {{ binaryToString(item.binaryNumber) }}
          </td>
          <td>-</td>
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
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  shallowRef,
  readonly,
  ComputedRef,
  reactive,
  unref,
  Ref,
} from "vue";
import {
  RouteLocationNormalized,
  Router,
  useRoute,
  useRouter,
} from "vue-router";
import { MathJson, MathJsonNumber } from "../MathJson";
import MathInput from "./../components/MathInput.vue";
import { tryParseNumber } from "./../assets/grammar-math";
import { BinaryNumber } from "../math/binary-number";
import { useUrlRef } from "../url-ref";

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

  // TODO: Consider reworking the function above ^
  function parseBinarySimple(value: string): boolean[] {
    return (value ?? "").split("").map((v) => (v === "0" ? false : true));
  }

  function binaryToString(value: BinaryNumber) {
    return `${unref(value).isNegative ? "-" : "+"}${unref(value)
      .value.map((v) => (v ? "1" : "0"))
      .join("")}`;
  }

  return {
    parseBinary,
    parseBinarySimple,
    binaryToString,
  };
}

export default defineComponent({
  components: { MathInput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const {
      parseBinary,
      parseBinarySimple,
      binaryToString,
    } = useBinaryParsing();
    const userInput = urlRef("input", "0");
    const mathJsonNumber = shallowRef<MathJson>();

    const bitPattern: ComputedRef<boolean[]> = computed(() =>
      parseBinarySimple((mathJsonNumber.value as MathJsonNumber)?.value)
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
            parseBinarySimple(options.e.value)
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
      parseBinary,
      userInput,
      mathJsonNumber,
      formats,
      binaryToString,
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
</style>