<template>
  <h1>Wahrheitstabelle</h1>
  <p>Gebe hier einen Booleschen Ausdruck ein:</p>
  <math-input
    type="logical"
    v-model="logicalUserInput"
    :mathParser="parseLogical"
    @mathJson="(value) => (logicalMathJson = value)"
  ></math-input>

  <div>
    <label><input type="checkbox" v-model="flipBits" /> Flip the bits </label>
  </div>

  <table class="truth-table">
    <thead>
      <tr>
        <th
          v-for="(item, index) in tableHeaders"
          :key="index"
          :class="{
            'right-thick-border': index === tableThickBorderIndex,
          }"
        >
          <math-output :value="item"></math-output>
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
        <td><math-output :value="['not', 'a']"></math-output></td>
        <td>not</td>
        <td>!</td>
      </tr>
      <tr>
        <td><math-output :value="['and', 'a', 'b']"></math-output></td>
        <td>and</td>
        <td>&&</td>
      </tr>
      <tr>
        <td><math-output :value="['or', 'a', 'b']"></math-output></td>
        <td>or</td>
        <td>||</td>
      </tr>
      <tr>
        <td><math-output :value="['xor', 'a', 'b']"></math-output></td>
        <td>xor</td>
        <td>^</td>
      </tr>
      <tr>
        <td><math-output :value="['nand', 'a', 'b']"></math-output></td>
        <td>nand</td>
        <td>!&&</td>
      </tr>
      <tr>
        <td><math-output :value="['nor', 'a', 'b']"></math-output></td>
        <td>nor</td>
        <td>!||</td>
      </tr>
      <tr>
        <td><math-output :value="['implies', 'a', 'b']"></math-output></td>
        <td>implies</td>
        <td>=></td>
      </tr>
      <tr>
        <td><math-output :value="['equals', 'a', 'b']"></math-output></td>
        <td>equals</td>
        <td>=</td>
      </tr>
    </tbody>
  </table>

  <p>Protip: Wenn man eine Variable haben will die nichts macht, kann man <pre style="display: inline">or (variableName and 0)</pre> eingeben.</p>
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
import { tryParse as tryParseAstLogical } from "./../assets/grammar-logical";
import MathInput from "./../components/MathInput.vue";
import MathOutput from "./../components/MathOutput.vue";

function useLogicalParsing() {
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

  function parseLogical(
    value: string
  ): { mathJson?: MathJson; error?: string } {
    // Doesn't have a AND before OR order of operations (yet)
    try {
      const parsed = tryParseAstLogical(value);
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  return {
    parseLogical,
  };
}

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
    const operations: MathJson[] = [];

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
    (a: boolean, b: boolean) => boolean
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
        return op(evaluateRecursive(ast[1], getters), false);
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
    const { urlRef } = useUrlRef(router, route);

    const { parseLogical } = useLogicalParsing();
    const logicalMath = useLogicalMath();

    const logicalUserInput = urlRef("input", "a and (b xor 1)");
    const logicalMathJson = shallowRef<MathJson>();

    const tableHeaders = shallowRef<MathJson[]>([]);
    const tableRows = ref<boolean[][]>([[]]);
    const flipBits = ref<boolean>(false);
    const tableThickBorderIndex = ref(0);

    function createTable(value: MathJson | undefined) {
      if (value === undefined) return;

      const getterNames = logicalMath.extractGetters(value);
      let operations = logicalMath.extractOperations(value);

      const getters = Array.from(logicalMath.extractGetters(value));
      getters.sort();

      tableHeaders.value = (getters as MathJson[]).concat(operations);

      let binaryNumber = BinaryNumber.fromSize(getters.length);
      const oneInBinary = BinaryNumber.fromSize(getters.length).add(
        new BinaryNumber(true, [true])
      );

      const tableWidth = tableHeaders.value.length;
      const tableData = new Array(2 ** getters.length);
      for (let i = 0; i < tableData.length; i++) {
        tableData[i] = new Array(tableWidth);

        for (let j = 0; j < getters.length; j++) {
          tableData[i][j] =
            binaryNumber.value[flipBits.value ? getters.length - j - 1 : j];
        }
        const getterData = new Map<string, boolean>(
          getters.map((v, j) => [
            v,
            binaryNumber.value[flipBits.value ? getters.length - j - 1 : j],
          ])
        );

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
      console.log(value);
      createTable(value);
    });

    watch(flipBits, (value) => {
      createTable(logicalMathJson.value);
    });

    return {
      parseLogical,
      logicalUserInput,
      logicalMathJson,
      tableHeaders,
      tableRows,
      flipBits,
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