<template>
  <h1>Hamming-Distanz</h1>

  <p>Gebe hier die Codewörter ein (getrennt durch einen Linienumbruch):</p>
  <textarea rows="4" cols="50" v-model="codewords"></textarea>
  <pre>Hamming-Distanz: {{ hammingDistance }}</pre>
  <pre>Ist ein Blockcode: {{ isBlockCode }}</pre>
  <pre>Ist ein linearer Code: {{ isBlockCode && isLinearCode }}</pre>
  <pre>
Ist ein zyklischer Code: {{ isBlockCode && isLinearCode && isCyclicCode }}</pre
  >

  <div id="hammingMatrix"></div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";

export default defineComponent({
  components: {},
  setup() {
    let codewords = ref("");
    let isBlockCode = ref(false);
    let isLinearCode = ref(false);
    let isCyclicCode = ref(false);
    let hammingDistance = ref("");
    let minHammingDistance = ref("");

    watch(codewords, (value) => {
      let codewordStrings = value.split("\n");

      if (codewordStrings.length < 2) {
        return 0;
      }

      if (blockCode(codewordStrings)) {
        let hammingDistanceData = getHammingDistance(codewordStrings);

        if (linearCode(codewordStrings)) {
          isLinearCode.value = true;
          isCyclicCode.value = cyclicCode(codewordStrings);
        } else {
          isLinearCode.value = false;
          isCyclicCode.value = false;
        }
        hammingDistance.value = hammingDistanceData.hammingDistance.toString();
        isBlockCode.value = true;
      } else {
        isLinearCode.value = false;
        isCyclicCode.value = false;
        isBlockCode.value = false;
        minHammingDistance.value = 0 + "";
      }
    });

    return {
      codewords,
      isBlockCode,
      isLinearCode,
      isCyclicCode,
      hammingDistance,
    };
  },
});

function bitCount(n: number): number {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}

function getHammingDistance(codewords: Array<string>) {
  let distances = new Array<number>();
  for (let i = 0; i < codewords.length; i++) {
    let codewordA = codewords[i];
    for (let j = 0; j < codewords.length; j++) {
      if (i == j) continue;
      let codewordB = codewords[j];
      distances.push(bitCount(parseInt(codewordA, 2) ^ parseInt(codewordB, 2)));
    }
  }
  let sortedDistances = distances.sort();

  return {
    hammingDistance: sortedDistances[0],
    distances: distances,
  };
}

function blockCode(codewords: Array<string>): boolean {
  let codewordLength = codewords[0].length;
  for (let i = 1; i < codewords.length; i++) {
    if (codewords[i].trim().length == 0) continue;
    if (codewords[i].length != codewordLength) {
      return false;
    }
  }
  return true;
}

function linearCode(codewords: Array<string>): boolean {
  for (let i = 0; i < codewords.length; i++) {
    let codewordA = codewords[i];
    for (let j = 0; j < codewords.length; j++) {
      if (i == j) continue;
      let codewordB = codewords[j];
      if (codewordA.length != codewordB.length) {
        return false;
      }
      let xorString = xorBinaryStrings(codewordA, codewordB);

      if (!codewords.includes(xorString)) {
        return false;
      }
    }
  }
  return true;
}

function cyclicCode(codewords: Array<string>): boolean {
  for (let i = 0; i < codewords.length; i++) {
    let codeword = codewords[i];
    for (let j = 0; j < codewords.length; j++) {
      let shiftedCode = cyclicShiftString(codeword, j);
      if (!codewords.includes(shiftedCode)) {
        return false;
      }
    }
  }
  return true;
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
</script>