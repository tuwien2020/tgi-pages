<template>
  <h1>Karnaugh-Veitch-Diagramm</h1>
  <p>Gebe hier eine Normalform ein:</p>
  <math-input
    type="logical"
    v-model="logicalUserInput"
    :mathParser="parse"
    @mathJson="(value) => (logicalMathJson = value)"
  ></math-input>

  <div>
    <label><input type="checkbox" v-model="flipBits" /> Flip the bits </label>
  </div>

  <div id="kv-diagram"></div>

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
  onMounted,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { BinaryNumber } from "../math/binary-number";
import { MathJson } from "../math/MathJson";
import { useUrlRef } from "../url-ref";
import {
  useBooleanExpressions,
  useBooleanExpressionParsing,
} from "../math/boolean-expression";
import {
  SVG,
  extend as SVGextend,
  Element as SVGElement,
  Text as SVGText,
} from "@svgdotjs/svg.js";
import MathInput from "./../components/MathInput.vue";
import MathOutput from "./../components/MathOutput.vue";
import {
  KVDiagram,
  KVBlock,
  findBlocksInKVDiagram,
} from "./../assets/kv-diagram";

function rainbow(numOfSteps: number, step: number) {
  // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
  // Adam Cole, 2011-Sept-14
  // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  var r = 0,
    g = 0,
    b = 0;
  var h = step / numOfSteps;
  var i = ~~(h * 6);
  var f = h * 6 - i;
  var q = 1 - f;
  switch (i % 6) {
    case 0:
      r = 1;
      g = f;
      b = 0;
      break;
    case 1:
      r = q;
      g = 1;
      b = 0;
      break;
    case 2:
      r = 0;
      g = 1;
      b = f;
      break;
    case 3:
      r = 0;
      g = q;
      b = 1;
      break;
    case 4:
      r = f;
      g = 0;
      b = 1;
      break;
    case 5:
      r = 1;
      g = 0;
      b = q;
      break;
  }
  var c =
    "#" +
    ("00" + (~~(r * 255)).toString(16)).slice(-2) +
    ("00" + (~~(g * 255)).toString(16)).slice(-2) +
    ("00" + (~~(b * 255)).toString(16)).slice(-2);
  return c;
}

export default defineComponent({
  components: { MathInput, MathOutput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const { parse } = useBooleanExpressionParsing();
    const logicalMath = useBooleanExpressions();

    const logicalUserInput = urlRef("input", "a and (b xor 1)");
    const logicalMathJson = shallowRef<MathJson>();

    const tableHeaders = shallowRef<MathJson[]>([]);
    const tableRows = ref<boolean[][]>([[]]);
    const flipBits = ref<boolean>(false);
    const tableThickBorderIndex = ref(0);

    // TODO: Stefan, do your thing
    onMounted(() => {
      const width = 240,
        height = 240;
      const cellSize = width / 4;

      const kvDiagram = SVG().addTo("#kv-diagram").size(width, height);
      kvDiagram.viewbox(0, 0, width, height);

      watch(logicalMathJson, (value) => {
        console.log(value);
        kvDiagram.clear();
        //logicalMath.evaluate();

        const testDiagram = new KVDiagram([
          "0",
          "1",
          "1",
          "0",
          "1",
          "1",
          "1",
          "1",
          "0",
          "1",
          "1",
          "1",
          "0",
          "0",
          "1",
          "0",
        ]);

        let blocks = findBlocksInKVDiagram(testDiagram);

        let colors: string[] = [];
        for (let i = 0; i < blocks.length; i++) {
          colors.push(rainbow(blocks.length, i));
        }
        console.log(blocks);

        const textsInGrid = new Array<SVGText>(16);

        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            let updateText = () =>
              textsInGrid[row * 4 + col].text(
                testDiagram.values[col * 4 + row]
              );

            let cell = kvDiagram
              .rect(cellSize, cellSize)
              .move(cellSize * row, cellSize * col)
              .fill("#ffffff")
              .stroke("#000000");
            cell.click(updateText);

            for (let i = 0; i < blocks.length; i++) {
              if (blocks[i].positions.includes(col * 4 + row)) {
                let block = kvDiagram
                  .rect(cellSize, cellSize)
                  .move(cellSize * row, cellSize * col)
                  .fill(colors[i] + "99");
              }
            }

            textsInGrid[row * 4 + col] = kvDiagram
              .text(testDiagram.values[col * 4 + row])
              .font({ size: 30, family: "Consolas" })
              .center(
                cellSize * row + cellSize / 2,
                cellSize * col + cellSize / 2
              )
              .size(100)
              .click(updateText);
          }
        }
      });
    });

    watch(flipBits, (value) => {});

    return {
      parse,
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