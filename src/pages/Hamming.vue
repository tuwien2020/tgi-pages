<template>
    <h1>Hamming-Code</h1>

    <p>Gebe hier einen Hamming-Code ein:</p> 
    <input v-model="code" pattern="[01]+">
    
    <p>Gebe hier die Datenbits für einen Hamming-Code ein:</p>
    <input v-model="data" pattern="[01]+">

    <!-- parity bits !-->
    <pre>Hamming-Code: {{hammingCode.code}}</pre>
    <pre>Anzahl der Codebits: {{hammingCode.numCodeBits}}</pre>
    <pre>Anzahl der Paritybits: {{hammingCode.numParityBits}}</pre>
    <pre>Anzahl der Datenbits: {{hammingCode.numDataBits}}</pre>
    <pre>{{hammingCode.getFormattedHammingCodeParityFormulas()}}</pre>
    <pre>Fehler an der Stelle: {{hammingCode.errorBit}}</pre>

</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue"; 

export default defineComponent({
  components: { 
  },
  setup() {

    let hammingCode = ref(new HammingCode("")); 
    let code = ref(""); 
    let data = ref("");

    watch(data, (value) => {
        if (data.value.match(/^[01]+$/)) {
            hammingCode.value = new HammingCode(data.value, true);
        } else {
            hammingCode.value = new HammingCode("");
        }
        code.value = "";
    })

    watch (code, (value) => {
        if (code.value.match(/^[01]+$/)) {
            hammingCode.value = new HammingCode(code.value, false)
        } else {
            hammingCode.value = new HammingCode("");
        }
        data.value = "";
    })

    return {
      code,
      data,
      hammingCode, 
    };
  },
});


class HammingCode {

    readonly code: string;
    readonly numCodeBits: number;
    readonly numDataBits: number;
    readonly numParityBits: number;
    readonly parityBitFormulas: Array<String>;
    readonly parityBits: Array<number>;
    readonly errorBit: number;


    constructor(data: string, onlyDatabits?: boolean) {
        if (data == "") {
            this.code = "";
            this.numCodeBits = 0;
            this.numDataBits = 0;
            this.numParityBits = 0;
            this.parityBitFormulas = new Array<String>();
            this.parityBits = new Array<number>();
            this.errorBit = 0;
            return;
        }

        if (!onlyDatabits) {
            this.code = data; 
        } else {
            let code = "";
            let dataBitIndex = 0;
            let i = 1;
            while (dataBitIndex < data.length) {
                if ((i & (i - 1)) == 0) {
                    code += "0";
                } else {
                    code += data.charAt(dataBitIndex);
                    dataBitIndex++;
                }
                i++;
            }
            this.code = code; 
        }

        this.numCodeBits = this.code.length;
        this.numParityBits = Math.floor(Math.log2(this.numCodeBits)) + 1;
        this.numDataBits = this.numCodeBits - this.numParityBits;

        this.parityBits = new Array();
        this.parityBitFormulas = new Array();

        for ( let i = 0; i < this.numParityBits; i++) {
            let parityBitFormula = "[p" + (i+1) + "] = " ;
            let parity = 0;

            for ( let j = 1; j <= this.numCodeBits; j++) {
                if ((j & (j - 1)) == 0) continue; // i is a power of two
                if (((1 << i) & j) != 0) {
                    parity ^= this.code.codePointAt(j - 1) - '0'.codePointAt(0);
                    parityBitFormula += "c" + j + " ^ ";
                }
            }
            parityBitFormula = parityBitFormula.substring(0, parityBitFormula.length - 3);
            this.parityBitFormulas[i] = parityBitFormula;
            this.parityBits[i] = parity;
        }

        if (!onlyDatabits) {
            let error = "";
            for (let j = 0; j < this.numParityBits; j++) {
                let parity = 0;
                for (let i = 1; i <= this.numCodeBits; i++) {
                    if (((1 << j) & i) != 0) {
                        parity ^= this.code.codePointAt(i - 1) - '0'.codePointAt(0);
                    }
                }
                error = parity + error;
            }
            this.errorBit = parseInt(error, 2);
        } else { 
            let correctedCode = "";
            let parityBitIndex = 0;
            for (let i = 1; i <= this.numCodeBits; i++) {
                if ((i & (i - 1)) == 0) {
                    correctedCode += this.parityBits[parityBitIndex];
                    parityBitIndex++;
                } else {
                    correctedCode += this.code[i-1];
                }
            }
            this.code = correctedCode;
        }
    }

   getFormattedHammingCodeParityFormulas() : string {
        let output = ""; 
        for ( let i = 0; i < this.parityBitFormulas.length; i++) {
            const parityBitFormula = this.parityBitFormulas[i];
            const parityBit = this.parityBits[i];

            output += parityBitFormula + " = " + parityBit + "\n";
        }
        return output;
    }


}

function toSizedBinaryString(number: number, length: number) : string{
    return number.toString(2).padStart(length, "0"); 
}

</script>
