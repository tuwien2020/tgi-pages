<template>
    <h1>Polynom-Code</h1>
<!-- <pre>                               
 (x^9+x^8+x^7+x^6+x^5                    ):(x^4+x^3+x^2+x^1)=(x^5+x^1+x^0)
  x^9+x^8+x^7+x^6
  ---------------------------------------
                  x^5
                  x^5+x^4+x^3+x^2
  ---------------------------------------
                      x^4+x^3+x^2
                      x^4+x^3+x^2+x^1
  ---------------------------------------
                                  x^1   

</pre> -->
    <p>Bitfolge zu Polynom</p>
    <input v-model="code">
    <pre>{{polynom}}</pre>
    <p>Dividend</p>
    <input v-model="M">
    <p>Divisor</p>
    <input v-model="G">
    <br>
    <br>
    <pre>{{output}}</pre>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue"; 

export default defineComponent({
  components: { 
  },
  setup() {
    let M = ref("x^5+x^4+x^0");
    let G = ref("x^2+x^0");
    let code = ref("");
    let polynom = ref("");

    let output = ref(getOutputString(M.value, G.value));

    watch(code, (value) => {
      let exponent = 0;
      let polynomString = ""; 
      for (let i = value.length-1; i >= 0; i--) {
        if (value[exponent] == "1") {
          polynomString += "x^" + i + "+";
        }
        exponent++;
      }
      polynom.value = polynomString.substring(0, polynomString.length-1);
    })

    watch(M, (value)=> {
      output.value = getOutputString(value, G.value);
    })

    watch(G, (value) => {
      output.value = getOutputString(M.value, value);
    })

    return {
        M,G,
        output,
        code,
        polynom,
    };
},
});

function getOutputString(m: string, g: string) : string {
  let messageMonoms = m.replace(/[x\^]/g, "").split("+").map((i) => parseInt(i));
  let degreeOfPolynom = messageMonoms[0];

  let generatorMonoms = g.replace(/[x\^]/g, "").split("+").map((i) => parseInt(i));;
  let degreeOfGeneratorPolynom = generatorMonoms[0];

  let head = "(" + getPolynomWithSpaces(messageMonoms, degreeOfPolynom) + "):(" + g + ")=";
  let result = ""
  let body = "";
  
  let broughtDownIndex = degreeOfPolynom - degreeOfGeneratorPolynom-1;
  let currentDegree = degreeOfPolynom;
  let currentMonoms = [...messageMonoms]; 
 
  while(currentDegree >= degreeOfGeneratorPolynom) { 
    let currentResultDegree = currentDegree - degreeOfGeneratorPolynom;
    result += "x^" + currentResultDegree + "+";

    let newMonoms = new Array<number>();
    for (let i = 0; i < generatorMonoms.length; i++) { 
      newMonoms.push(generatorMonoms[i] + currentResultDegree);
    }

    body += " " + getPolynomWithSpaces(newMonoms, degreeOfPolynom) + "\n"
    body += " " + getFormatedLine(degreeOfPolynom) + "\n";

    let resultMonoms = new Array<number>();
    for (let i = currentDegree; i >= currentDegree - degreeOfGeneratorPolynom; i--) { 
      if (newMonoms.includes(i) !== currentMonoms.includes(i)) {
        resultMonoms.push(i);
      }
    }
 
    if (broughtDownIndex <= degreeOfPolynom) {
      if (messageMonoms.includes(broughtDownIndex)) {
        resultMonoms.push(broughtDownIndex);
      } 
      broughtDownIndex--;
    }
 
    body += " " + getPolynomWithSpaces(resultMonoms, degreeOfPolynom) + "\n"
    currentDegree = resultMonoms[0];
    currentMonoms = [...resultMonoms]; 
  }

  let remainder = getPolynomWithSpaces(currentMonoms, degreeOfPolynom).trim().substring(1);
  if (remainder.length == 0) {
    remainder = "0";
  }
  body += "\n\nRest: " + remainder;

  result = "(" + result.substring(0, head.length-1) + ")"
  head += result;

  return head + "\n" + body;  
}

function getPolynomWithSpaces(monoms: Array<number>, degreeOfPolynom: number) : string {
  let formattedString = "";
  for (let i = degreeOfPolynom; i >= 0; i--) {
    if (monoms.includes(i)) {
      formattedString += "+x^" + i;
    } else {
      formattedString += "    " 
    }
  }
  formattedString = formattedString.slice(1);
  return formattedString;
}

function getFormatedLine(degreeOfPolynom: number) : string {
  let formattedString = "";
  for (let i = degreeOfPolynom; i >= 0; i--) {
    formattedString += "----" 
  }
  formattedString = formattedString.slice(1);
  return formattedString;
}

</script>