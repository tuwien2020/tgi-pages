<template>
  <h1>Hamming-Distanz</h1>

  <p>Gebe hier die Codewörter ein (getrennt durch einen Linienumbruch):</p>
  <textarea
    rows="4"
    cols="50"
    :value="codewords"
    @input="
      (event) =>
        (codewords = event.target.value
          .replace(/ /g, '')
          .replace(/[^01\n]/g, ''))
    "
  ></textarea>
  <pre>Hamming-Distanz: {{ codewordsData.hammingDistance }}</pre>
  <pre>Ist ein Blockcode: {{ codewordsData.isBlockCode }}</pre>
  <pre>Ist ein linearer Code: {{ codewordsData.isLinearCode }}</pre>
  <pre>Ist ein zyklischer Code: {{ codewordsData.isCyclicCode }}</pre>

  <br />
  <table class="hammingMatrix" v-if="codewordsData.isBlockCode">
    <tr
      v-for="(row, index) in codewordsData.distanceMatrixData"
      :key="index"
      tabindex="0"
    >
      <td v-for="(item, itemIndex) in row" :key="itemIndex">
        {{ item }}
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    let codewords = urlRef("input", "");
    let codewordsData = ref(new CodewordsData(new Array<string>()));

    let hammingMatrix = ref<string[][]>([[]]);

    watch(codewords, (value) => {
      let codewordStrings = value.split("\n");

      codewordStrings = codewordStrings.filter(
        (v) => v != null && v.trim() !== ""
      );

      codewordsData.value = new CodewordsData(codewordStrings);
    });

    return {
      codewords,
      codewordsData,
    };
  },
});

class CodewordsData {
  private readonly codewords: Array<string>;

  readonly isBlockCode: boolean;
  readonly isLinearCode: boolean;
  readonly isCyclicCode: boolean;

  readonly hammingDistance: number;
  readonly distanceMatrixData: string[][];

  constructor(codewords: Array<string>) {
    this.codewords = codewords;

    if (codewords.length < 2) {
      this.hammingDistance = 0;
      this.isBlockCode = false;
      this.isLinearCode = false;
      this.isCyclicCode = false;
      this.distanceMatrixData = [[]];
      return;
    }

    this.isBlockCode = this.blockCode();
    this.isLinearCode = this.isBlockCode && this.linearCode();
    this.isCyclicCode = this.isLinearCode && this.cyclicCode();

    if (this.isBlockCode) {
      let hammingDistanceData = this.getHammingDistances();
      this.hammingDistance = hammingDistanceData.hammingDistance;
      this.distanceMatrixData = hammingDistanceData.distanceMatrix;
    } else {
      this.hammingDistance = 0;
      this.distanceMatrixData = [[]];
    }
  }

  private getHammingDistances() {
    let distances = new Array<number>();
    for (let i = 0; i < this.codewords.length; i++) {
      let codewordA = this.codewords[i];
      for (let j = 0; j < this.codewords.length; j++) {
        if (i == j) continue;
        let codewordB = this.codewords[j];
        distances.push(
          bitCount(parseInt(codewordA, 2) ^ parseInt(codewordB, 2))
        );
      }
    }

    let smallestDistance = distances[0];
    for (let i = 1; i < distances.length; i++) {
      if (smallestDistance > distances[i]) {
        smallestDistance = distances[i];
      }
    }

    return {
      hammingDistance: smallestDistance,
      distanceMatrix: this.hammingDistanceMatrix(distances),
    };
  }

  private blockCode(): boolean {
    let codewordLength = this.codewords[0].length;
    for (let i = 1; i < this.codewords.length; i++) {
      if (this.codewords[i].length != codewordLength) {
        return false;
      }
    }
    return true;
  }

  private linearCode(): boolean {
    for (let i = 0; i < this.codewords.length; i++) {
      let codewordA = this.codewords[i];
      for (let j = 0; j < this.codewords.length; j++) {
        if (i == j) continue;
        let codewordB = this.codewords[j];
        if (codewordA.length != codewordB.length) {
          return false;
        }
        let xorString = xorBinaryStrings(codewordA, codewordB);

        if (!this.codewords.includes(xorString)) {
          return false;
        }
      }
    }
    return true;
  }

  private cyclicCode(): boolean {
    for (let i = 0; i < this.codewords.length; i++) {
      let codeword = this.codewords[i];
      for (let j = 0; j < this.codewords.length; j++) {
        let shiftedCode = cyclicShiftString(codeword, j);
        if (!this.codewords.includes(shiftedCode)) {
          return false;
        }
      }
    }
    return true;
  }

  private hammingDistanceMatrix(distances: Array<number>): string[][] {
    let matrix = Array.from(
      new Array(this.codewords.length + 1),
      () => new Array(this.codewords.length + 1)
    );
    let indexDistanceData = 0;

    matrix[0][0] = "";
    for (let i = 0; i < this.codewords.length; i++) {
      matrix[i + 1][0] = this.codewords[i];
      matrix[0][i + 1] = this.codewords[i];
    }

    for (let row = 1; row <= this.codewords.length; row++) {
      let rowArray = new Array<string>(this.codewords.length);
      for (let col = 1; col <= this.codewords.length; col++) {
        if (row == col) {
          matrix[row][col] = "-";
        } else {
          matrix[row][col] = distances[indexDistanceData].toString();
          indexDistanceData++;
        }
      }
    }
    return matrix;
  }
}

function cyclicShiftString(s: String, n: number) {
  let rotatedString = "";
  for (let i = 0; i < s.length; i++) {
    rotatedString += s[(i + n) % s.length];
  }
  return rotatedString;
}

function xorBinaryStrings(a: string, b: string) {
  let xorString = "";
  for (let i = 0; i < a.length; i++) {
    xorString += parseInt(a[i]) ^ parseInt(b[i]);
  }
  return xorString;
}

function bitCount(n: number): number {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
</script>

<style scoped>
.hammingMatrix td:hover,
.hammingMatrix td:focus {
  background-color: #f1f1f1;
}

.hammingMatrix {
  font-family: "Consolas", "Courier New", Courier, monospace;
  text-align: center;
  overflow: hidden;
}
</style>
