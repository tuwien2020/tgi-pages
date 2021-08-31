<template>
  <h1>Wahrheitstabelle</h1>
  <p>Gebe hier einen Booleschen Ausdruck ein:</p>
  <math-input
    v-model="logicalUserInput"
    :mathTransformer="transform"
    @mathJson="(value) => (logicalMathJson = value)"
    :formatting="{customPrinter}"
  ></math-input>

  <div>
    <label><input type="checkbox" v-model="flipBits" /> Flip the bits </label>
    <label><input type="checkbox" v-model="hideColumns" /> Hide intermediate columns </label>
  </div>

  <table class="truth-table">
    <thead>
      <tr>
        <!-- TODO: Allow hiding intermediate columns? -->
        <!-- TODO: Allow reordering? -->
        <th
          v-for="(item, index) in tableHeaders"
          :key="index"
          :class="{
            'right-thick-border': index === tableThickBorderIndex,
          }"
        >
          <math-output :value="item" :formatting="{customPrinter}"></math-output>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in tableRows" :key="index" tabindex="0">
        <td
          v-for="(item, itemIndex) in row"
          :key="itemIndex"
          :class="{
            'faded-text': item === false,
            'right-thick-border': itemIndex === tableThickBorderIndex,
          }"
        >
          {{ item === true ? 1 : item === false ? 0 : item }}
        </td>
      </tr>
    </tbody>
  </table>

  <br />
  <br />
  <br />
  <h4>Documentation</h4>
  <table class="documentation-table">
    <thead>
      <tr>
        <th>Operator</th>
        <th>Type this text</th>
        <th>Or this symbol</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><math-output :value="['Not', 'a']"></math-output></td>
        <td>not</td>
        <td>!</td>
      </tr>
      <tr>
        <td><math-output :value="['And', 'a', 'b']"></math-output></td>
        <td>and</td>
        <td>&&</td>
      </tr>
      <tr>
        <td><math-output :value="['Or', 'a', 'b']"></math-output></td>
        <td>or</td>
        <td>||</td>
      </tr>
      <tr>
        <td><math-output :value="['Xor', 'a', 'b']"></math-output></td>
        <td>xor</td>
        <td>^</td>
      </tr>
      <tr>
        <td><math-output :value="['Nand', 'a', 'b']"></math-output></td>
        <td>nand</td>
        <td>!&&</td>
      </tr>
      <tr>
        <td><math-output :value="['Nor', 'a', 'b']"></math-output></td>
        <td>nor</td>
        <td>!||</td>
      </tr>
      <tr>
        <td><math-output :value="['Implies', 'a', 'b']"></math-output></td>
        <td>implies</td>
        <td>=></td>
      </tr>
      <tr>
        <td><math-output :value="['Equal', 'a', 'b']"></math-output></td>
        <td>equals</td>
        <td>=</td>
      </tr>
      <tr>
        <td><math-output :value="['Subset', 'a', 'b']"></math-output></td>
        <td>if</td>
        <td>&lt;=</td>
      </tr>
    </tbody>
  </table>

  <p>Protip: Wenn man eine Variable haben will die nichts macht, kann man <pre style="display: inline">or (variableName and 0)</pre> eingeben.</p>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BinaryNumber } from "../math/binary-number";
import { MathJson, hasError } from "../math/math-parsing";
import { useBooleanExpressions } from "../math/boolean-expression";
import { useUrlRef } from "../url-ref";
import MathInput from "./../components/MathInput.vue";
import MathOutput from "./../components/MathOutput.vue";

function useBooleanMath() {
  const useBoolean = useBooleanExpressions();
  function isPrimitive<T>(ast: MathJson<T>) {
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

  function extractOperations<T>(ast: MathJson<T>): MathJson<T>[] {
    const operations: MathJson<T>[] = [];

    function extractOperationsRecursive(ast: MathJson<T>) {
      if (Array.isArray(ast)) {
        const [functionName, ...args] = ast;

        for (let i = 0; i < args.length; i++) {
          extractOperationsRecursive(args[i]);
          if (!isPrimitive(args[i])) {
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
    extractGetters: useBoolean.extractGetters,
    extractOperations,
    evaluate: useBoolean.evaluate,
    transform: useBoolean.transform,
    customPrinter: useBoolean.customPrinter,
  };
}

export default defineComponent({
  components: { MathInput, MathOutput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const logicalMath = useBooleanMath();

    const logicalUserInput = urlRef("input", "a and (b xor 1)");
    const logicalMathJson = shallowRef<MathJson<boolean>>();

    const tableHeaders = shallowRef<MathJson<boolean>[]>([]);
    const tableRows = ref<boolean[][]>([[]]);
    const flipBits = urlRef("flipped",false);
    const hideColumns = urlRef("hide-extra",false);
    const tableThickBorderIndex = ref(0);

    function createTable(value: MathJson<boolean> | undefined) {
      if (value === undefined) return;
      if (hasError(value)) return;

      let operations = logicalMath.extractOperations(value);
      if (hideColumns.value) {
        operations = operations.slice(operations.length - 1);
      }

      const getters = Array.from(logicalMath.extractGetters(value));
      getters.sort();

      tableHeaders.value = (getters as MathJson<boolean>[]).concat(operations);

      let binaryNumber = BinaryNumber.fromSize(getters.length);
      const oneInBinary = BinaryNumber.fromSize(getters.length).add(new BinaryNumber(true, [true], 0));

      const tableWidth = tableHeaders.value.length;
      const tableData = new Array(2 ** getters.length);
      for (let i = 0; i < tableData.length; i++) {
        tableData[i] = new Array(tableWidth);

        for (let j = 0; j < getters.length; j++) {
          tableData[i][j] = binaryNumber.value[flipBits.value ? getters.length - j - 1 : j];
        }
        const getterData = new Map<string, boolean>(getters.map((v, j) => [v, binaryNumber.value[flipBits.value ? getters.length - j - 1 : j]]));

        for (let j = getters.length; j < tableWidth; j++) {
          const op = operations[j - getters.length];

          tableData[i][j] = logicalMath.evaluate(op, getterData);
        }

        binaryNumber = binaryNumber.add(oneInBinary);
      }

      tableRows.value = tableData;
      tableThickBorderIndex.value = getters.length - 1;
    }
    watch(logicalMathJson, (value) => {
      createTable(value);
    });

    watch(flipBits, (value) => {
      createTable(logicalMathJson.value);
    });

    watch(hideColumns, (value) => {
      createTable(logicalMathJson.value);
    });

    return {
      transform: logicalMath.transform,
      customPrinter: logicalMath.customPrinter,
      logicalUserInput,
      logicalMathJson,
      tableHeaders,
      tableRows,
      flipBits,
      hideColumns,
      tableThickBorderIndex,
    };
  },
});
</script>

<style scoped>
.truth-table {
  font-family: "Consolas", "Courier New", Courier, monospace;
  text-align: center;
  overflow: hidden;
  width: auto;
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
.truth-table tbody tr:hover,
.truth-table tbody tr:focus {
  background-color: #f1f1f1;
}

.truth-table th:hover::after,
.truth-table th:focus::after {
  background-color: #f1f1f1;
  content: "";
  position: absolute;
  left: 0;
  top: -5000px;
  height: 10000px;
  width: 100%;
  z-index: -1;
}
.right-thick-border {
  border-right-width: 2px;
  border-right-color: black;
}
</style>

<style>
.documentation-table .katex-display {
  margin: 0px;
}
</style>