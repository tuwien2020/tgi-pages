<template>
  <h1>Wahrheitstabelle</h1>
  <p>Gebe hier einen Booleschen Ausdruck ein:</p>
  <math-input
    type="logical"
    v-model="logicalUserInput"
    @mathJson="(value) => (logicalMathJson = value)"
  ></math-input>

  <table>
    <thead>
      <tr>
        <th v-for="(item, index) in tableHeaders" :key="index">
          <math-output :value="item"></math-output>
        </th>
      </tr>
    </thead>
    <tbody class="monospace">
      <tr v-for="(row, index) in tableRows" :key="index">
        <td v-for="(item, itemIndex) in row" :key="itemIndex">
          {{ item === true ? 1 : item === false ? 0 : item }}
        </td>
      </tr>
    </tbody>
  </table>
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
import { MathJson } from "../MathJson";
import MathInput from "./../components/MathInput.vue";
import MathOutput from "./../components/MathOutput.vue";

function useLogicalMath() {
  function extractGetters(ast: MathJson) {
    const getters = new Set<string>();

    function extractGettersRecursive(ast: MathJson) {
      if (Array.isArray(ast)) {
        const [functionName, ...args] = ast;
        for (let i = 0; i < args.length; i++) {
          extractGettersRecursive(args[i]);
        }
      } else if (typeof ast === "string") {
        getters.add(ast);
      }
    }
    extractGettersRecursive(ast);

    return getters;
  }

  function extractOperations(ast: MathJson): MathJson[] {
    const operations = [];

    // TODO: Use this function
    function isPrimitive(ast: MathJson) {
      if (Array.isArray(ast)) {
        if (ast.length >= 3) {
          return false;
        } else if (ast.length == 2) {
          if (!isPrimitive(ast[1])) {
            return false;
          } else {
            return true;
          }
        } else {
          return true;
        }
      } else {
        return true;
      }
    }

    // TODO: Don't output `!c` when the input is `(not (a and b)) or (a xor not c) => 0`
    function extractOperationsRecursive(ast: MathJson) {
      if (Array.isArray(ast)) {
        const [functionName, ...args] = ast;

        for (let i = 0; i < args.length; i++) {
          extractOperationsRecursive(args[i]);
          if (ast.length === 3 && Array.isArray(args[i])) {
            operations.push(args[i]);
          }
        }
      }
    }

    extractOperationsRecursive(ast);
    operations.push(ast);

    return operations;
  }

  return {
    extractGetters,
    extractOperations,
  };
}

export default defineComponent({
  components: { MathInput, MathOutput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const logicalMath = useLogicalMath();

    const logicalUserInput = ref("" + route.query["input"]);
    const logicalMathJson = shallowRef<MathJson>();

    const tableHeaders = shallowRef<MathJson[]>([]);
    const tableRows = ref<boolean[][]>([[]]);

    watch(logicalMathJson, (value) => {
      console.log(value);
      const getters = logicalMath.extractGetters(value);
      let operations = logicalMath.extractOperations(value);

      tableHeaders.value = (Array.from(getters) as MathJson[]).concat(
        operations
      );

      let binaryNumber = BinaryNumber.fromSize(getters.size);
      const oneInBinary = BinaryNumber.fromSize(getters.size).add(
        new BinaryNumber([true])
      );

      const tableWidth = tableHeaders.value.length;
      const tableData = new Array(2 ** getters.size);
      for (let i = 0; i < tableData.length; i++) {
        tableData[i] = new Array(tableWidth);

        for (let j = 0; j < getters.size; j++) {
          tableData[i][j] = binaryNumber.value[j];
        }

        for (let j = getters.size; j < tableWidth; j++) {
          //tableData[i][j] =
        }

        binaryNumber = binaryNumber.add(oneInBinary);
      }

      tableRows.value = tableData;
    });

    watch(logicalUserInput, (value) => {
      router.replace({ query: { input: value } });
    });

    return {
      logicalUserInput,
      logicalMathJson,
      tableHeaders,
      tableRows,
    };
  },
});
</script>

<style scoped>
.monospace {
  font-family: "Consolas", "Courier New", Courier, monospace;
}
</style>