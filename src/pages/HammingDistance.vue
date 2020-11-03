<template>
    <h1>Hamming-Distanz</h1>

    <p>Gebe hier die Codewörter ein (getrennt durch einen Linienumbruch):</p>
    <textarea rows="4" cols="50" v-model="codewords" ></textarea>
    <pre>Hamming-Distanz: {{hammingDistance}}</pre> 
    <pre>Ist ein Blockcode: {{isBlockCode}}</pre>
    <pre>Ist ein linearer Code: {{isLinearCode}}</pre>
    <pre>Ist ein zyklischer Code: {{isCyclicCode}}</pre>

    <div id="hammingMatrix"></div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue"; 

export default defineComponent({
  components: { 
  },
  setup() {
    let codewords = ref(""); 
    let isBlockCode = ref(false);
    let isLinearCode = ref(false);
    let isCyclicCode = ref(false);
    let hammingDistance = ref("");
    let minHammingDistance = ref("");

    watch(codewords, (value) => { 
      if(blockCode(value)) {
          let hammingDistanceData = getHammingDistance(value);

          hammingDistance.value = hammingDistanceData.hammingDistance.toString();

          isLinearCode.value = linearCode(value);
          isCyclicCode.value = cyclicCode(value);
          isBlockCode.value = true
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


function bitCount (n: number) : number {
  n = n - ((n >> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
  return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

function getHammingDistance(codewords: string) {
    let codewordStrings = codewords.split("\n");
    let distances = new Array<number>();
    for (let i = 0; i < codewordStrings.length; i++) {
      let codewordA = codewordStrings[i];
      for (let j = 0; j < codewordStrings.length; j++) {
        if (i == j) continue;
        let codewordB = codewordStrings[j];
        distances.push(bitCount(parseInt(codewordA, 2) ^ parseInt(codewordB ,2)));
      }
    }
    let sortedDistances = distances.sort();

    return {
      hammingDistance: sortedDistances[0], 
      distances: distances
    };
}

function blockCode(codewords: string) : boolean {
  let codewordStrings = codewords.split("\n");
  let codewordLength = codewordStrings[0].length;
  for (let i = 1; i < codewordStrings.length; i++) {
    if (codewordStrings[i].length != codewordLength) {
      return false;
    }
  }
  return true;
} 

function linearCode(codewords: string) : boolean {
  let codewordStrings = codewords.split("\n");

  for (let i = 0; i < codewordStrings.length; i++) {
    let codewordA = codewordStrings[i];
    for (let j = 0; j < codewordStrings.length; j++) {
      if (i == j) continue;
      let codewordB = codewordStrings[j];
        if (codewordA.length != codewordB.length) {
           return false;
        }
      let xorString = xorBinaryStrings(codewordA, codewordB);

      if (!codewordStrings.includes(xorString)) {
        return false;
      };
    }
  }
  return true;
}

function cyclicCode(codewords: string) : boolean {
  let codewordStrings = codewords.split("\n");

  for (let i = 0; i < codewordStrings.length; i++) {
    let codeword = codewordStrings[i];
    for (let j = 0; j < codewordStrings.length; j++) {  
      let shiftedCode = cyclicShiftString(codeword, j);
      if (!codewordStrings.includes(shiftedCode)) {
        return false;
      };
    }
  }
  return true;
}

function cyclicShiftString(s: String, n: number) {
  let rotatedString = "";
  for (let i = 0; i < s.length; i++) {
    rotatedString += s[(i+n)%s.length];
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

function createTable() {
  let hammingMatrix = document.getElementById("hammingMatrix");
  let table = document.createElement("table");

  for (let row = 0; row < 4; row++) {
    let tr = document.createElement("tr");

    for (let col = 0; col < 4; col++) {
      tr.appendChild( document.createElement("td") ); 
      tr.cells[0].appendChild( document.createTextNode('Text1') ) 
    }
  
    table.appendChild(tr);
  }

  hammingMatrix.appendChild(table);
}

</script>