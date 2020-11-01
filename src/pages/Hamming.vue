<template>
    <h1>Hamming Code</h1>

    <p>Gebe hier einen Hamming Code ein:</p> 
    <input v-model="block" pattern="[01]+">
    
    <!-- parity bits !-->
    <pre>{{outputText}}</pre>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue"; 

export default defineComponent({
  components: { 
  },
  setup() {
    const count = ref(0);

    let block = ref("");
    let outputText = ref("");

    watch (block, (value) => {
        if (block.value.match(/^[01]+$/)) {
            outputText.value = getHammingCode(value);
        }
    })

    return {
      count,
      block,
      outputText,
    };
  },
});

function getHammingCode(block: string) : string {
    const blockLength = block.length;
    const numParityBits = Math.floor(Math.log2(blockLength)) + 1;
    
    let output = "";
    output += "Anzahl der Parity bits: " + numParityBits+ "\n\n"

    for ( let i = 0; i < numParityBits; i++) {
        let parityBitFormula = "[p" + (i+1) + "] = " ;
        let parity = 0;
        for ( let j = 1; j <= blockLength; j++) {
            if ((j & (j - 1)) == 0) continue; // i is a power of two
            if (((1 << i) & j) != 0) {
                parity ^= block.codePointAt(j - 1) - '0'.codePointAt(0);
                
                parityBitFormula += "c" + j + " ^ ";
            }
        }
        output += parityBitFormula.substring(0, parityBitFormula.length - 3) + " = " + parity  + "\n";
    }

    let error = "";
    for (let j = 0; j < numParityBits; j++) {
        let parity = 0;
        for (let i = 1; i <= blockLength; i++) {
            if (((1 << j) & i) != 0) {
                parity ^= block.codePointAt(i - 1) - '0'.codePointAt(0);
            }
        }
        error = parity + error;
    }

    output += "\nFehler an der Stelle: " + parseInt(error, 2) + "\n"
    return output;
    
} 

function toSizedBinaryString(number: number, length: number) : string{
    return number.toString(2).padStart(length, "0"); 
}

</script>
