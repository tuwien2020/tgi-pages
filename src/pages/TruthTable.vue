<template>
  <h1>Wahrheitstabelle</h1>
  <p>Gebe hier einen Booleschen Ausdruck ein:</p>
  <math-input
    type="logical"
    v-model="logicalUserInput"
    @mathJson="(value) => (logicalMathJson = value)"
  ></math-input>

  <table class="truth-table">
    <thead>
      <tr>
        <th v-for="(item, index) in tableHeaders" :key="index">
          <math-output :value="item"></math-output>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in tableRows" :key="index">
        <td
          v-for="(item, itemIndex) in row"
          :key="itemIndex"
          :class="{ 'faded-text': item === false }"
        >
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
import { MathJson, MathJsonLogicalOperator } from "../MathJson";
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

  const mathJsonOperatorMap = new Map<
    MathJsonLogicalOperator,
    (a: boolean, b?: boolean) => boolean
  >([
    ["not", (a) => !a],
    ["implies", (a, b) => !a || b],
    ["and", (a, b) => a && b],
    ["or", (a, b) => a || b],
    ["xor", (a, b) => (a ? !b : b)],
    ["nand", (a, b) => !(a && b)],
    ["nor", (a, b) => !(a || b)],
    ["equals", (a, b) => a == b],
  ]);

  function evaluateRecursive(
    ast: MathJson,
    getters: Map<string, boolean>
  ): boolean {
    if (Array.isArray(ast)) {
      const op = mathJsonOperatorMap.get(ast[0]);
      if (!op) throw new Error("Unknown operation " + ast);

      if (ast.length === 3) {
        return op(
          evaluateRecursive(ast[1], getters),
          evaluateRecursive(ast[2], getters)
        );
      } else if (ast.length === 2) {
        return op(evaluateRecursive(ast[1], getters));
      } else {
        throw new Error("Unable to evaluate " + ast);
      }
    } else if (ast === true) {
      return true;
    } else if (ast === false) {
      return false;
    } else if (typeof ast === "string") {
      const result = getters.get(ast);
      if (result === undefined) throw new Error("Unable to evaluate " + ast);
      return result;
    } else {
      throw new Error("Unable to evaluate " + ast);
    }
  }

  function evaluate(ast: MathJson, getters?: Map<string, boolean>): boolean {
    return evaluateRecursive(ast, getters ?? new Map());
  }

  return {
    extractGetters,
    extractOperations,
    evaluate,
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
      const getterNames = logicalMath.extractGetters(value);
      let operations = logicalMath.extractOperations(value);

      const getters = Array.from(logicalMath.extractGetters(value));

      tableHeaders.value = (getters as MathJson[]).concat(operations);

      let binaryNumber = BinaryNumber.fromSize(getters.length);
      const oneInBinary = BinaryNumber.fromSize(getters.length).add(
        new BinaryNumber([true])
      );

      const tableWidth = tableHeaders.value.length;
      const tableData = new Array(2 ** getters.length);
      for (let i = 0; i < tableData.length; i++) {
        tableData[i] = new Array(tableWidth);

        for (let j = 0; j < getters.length; j++) {
          tableData[i][j] = binaryNumber.value[j];
        }
        const getterData = new Map<string, boolean>(
          getters.map((v, j) => [v, binaryNumber.value[j]])
        );

        for (let j = getters.length; j < tableWidth; j++) {
          const op = operations[j - getters.length];

          tableData[i][j] = logicalMath.evaluate(op, getterData);
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
.truth-table {
  font-family: "Consolas", "Courier New", Courier, monospace;
  text-align: center;
  overflow: hidden;
}
.truth-table td {
  padding: 2px;
}
.truth-table th {
  position: relative;
}
.faded-text {
  color: #7c7c7c;
}
.truth-table tbody tr:hover {
  background-color: #f1f1f1;
}

.truth-table th:hover::after {
  background-color: #f1f1f1;
  content: "";
  position: absolute;
  left: 0;
  top: -5000px;
  height: 10000px;
  width: 100%;
  z-index: -1;
}
</style>