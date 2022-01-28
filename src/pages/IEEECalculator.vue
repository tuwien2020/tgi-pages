<template>
  <h1>IEEE Calculator</h1>
  <br />
  Format needs to be type of: <strong>F(base, mantissa, minimum exp, maximum exp, denormalized)  : </strong> <input type="text" v-model="ieeeFormat" /> <br>
  Total bit number: <input type="text" v-model="bitNumber" /> <br><br>

  <u>Base formats: </u><br>
  <strong>F(2,11,-14,15,true)</strong> -> Half Precision | Total length: 16<br>
  <strong>F(2,24,-126,127,true)</strong> -> Single Precision | Total length: 32<br>
  <strong>F(2,53,-1022,1023,true)</strong> -> Double Precision | Total length: 64<br>
  <br>
  <span style="white-space: pre-line">
  {{ format_output }}
  </span><br>

  <br /><br />
  Number A: <input type="text" v-model="numberA" /><br><br>
  <span style="white-space: pre-line"><strong>{{a_interpretation}}</strong></span>
  <br /><br />

  Number B: <input type="text" v-model="numberB" /><br><br>
  <span style="white-space: pre-line"><strong>{{b_interpretation}}</strong></span>
  <br /><br /><br /><br />
  
  <!--
  Addition:
  <span>
    {{ output_addition }}
  </span>
  <br><br><br>
  Substraction:
  <span>
    {{ output_substaction }}
  </span>
  <br><br><br>
  Multiplication:
  <span>
    {{ output_multiplication }}
  </span>
  <br><br><br>
  Divison:
  <span>
    {{ output_division }}
  </span>
  -->

</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const ieeeFormat = urlRef("format", "");
    const bitNumber = urlRef("length", "");
    const numberA = urlRef("numberA", "");
    const numberB = urlRef("numberB", "");
    
    let base: number;
    let mantissa: number;
    let min_exp: number;
    let max_exp: number;
    let denormalized: boolean;

    let sign_bit_length: number;
    let exponent_length: number;
    let mantissa_length: number;

    let a_sign: number;
    let a_exponent: number;
    let a_mantissa: number;

    let b_sign: number;
    let b_exponent: number;
    let b_mantissa: number;

    function remove_space(){
      numberA.value = numberA.value.replace(" ","");
      numberB.value = numberB.value.replace(" ","");
    }
    const format_output = computed(()=>{
      base = parseInt(ieeeFormat.value.split(",")[0]);
      mantissa = parseInt(ieeeFormat.value.split(",")[1]);
      min_exp = parseInt(ieeeFormat.value.split(",")[2]);
      max_exp = parseInt(ieeeFormat.value.split(",")[3]);
      denormalized = (ieeeFormat.value.split(",")[4] === 'true');

      sign_bit_length = 1;
      exponent_length = parseInt(bitNumber.value) - mantissa;
      mantissa_length = mantissa - 1;

      return "Base: "+base+" | Mantissa: "+mantissa+" | Minimum exponent: "+min_exp+" | Maximum exponent: "+max_exp+" | Denormalized: "+denormalized + " \n\n \
      Sign Bit: 1 | Exponent length: "+ exponent_length + " | Mantissa Length: "+mantissa_length;

    });


    const a_interpretation = computed (() => {

        remove_space();
        let a_exp = numberA.value.substring(1,1+exponent_length);
        let a_mant = parseInt(numberA.value.substring(1+exponent_length, 1+exponent_length+mantissa_length));

        if (a_exp == "1".repeat(exponent_length) && a_mant == 0){
          if (parseInt(numberA.value.charAt(0)) == 1){
            return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 1: Minus Infinity ";
          }
          else{
            return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 0: Plus Infinity ";
          }
          
        }
        else if (a_exp == "1".repeat(exponent_length) && a_mant > 0){
          return "NaN (0/0, Negative sqrt)";
        }
        else if (a_exp == "0".repeat(exponent_length) && a_mant == 0 && !denormalized){
          return "Number = 0";
        }
        else if (a_exp == "0".repeat(exponent_length) && denormalized){
          a_sign = Math.pow(-1,parseInt(numberA.value.charAt(0)));
          a_exponent = min_exp;
          a_mantissa = parseFloat("0."+numberA.value.substring(1+exponent_length, 1+exponent_length+mantissa_length));

          return "Denormalized number \nSign Bit: " + a_sign + " | Exponent: " + a_exponent + " | Mantissa: " + a_mantissa;
        }
        else{
          a_sign = Math.pow(-1,parseInt(numberA.value.charAt(0)));
          a_exponent = parseInt(numberA.value.substring(1,1+exponent_length),2) - max_exp;
          a_mantissa = parseFloat("1."+numberA.value.substring(1+exponent_length, 1+exponent_length+mantissa_length));
          return "Sign Bit: " + a_sign + " | Exponent: " + a_exponent + " | Mantissa: " + a_mantissa;
        }

    });

    const b_interpretation = computed (() => {

      remove_space();
      let b_exp = numberB.value.substring(1,1+exponent_length);
      let b_mant = parseInt(numberB.value.substring(1+exponent_length, 1+exponent_length+mantissa_length));

      if (b_exp == "1".repeat(exponent_length) && b_mant == 0){
        if (parseInt(numberB.value.charAt(0)) == 1){
          return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 1: Minus Infinity ";
        }
        else{
          return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 0: Plus Infinity ";
        }
        
      }
      else if (b_exp == "1".repeat(exponent_length) && b_mant > 0){
        return "NaN (0/0, Negative sqrt)";
      }
      else if (b_exp == "0".repeat(exponent_length) && b_mant == 0 && !denormalized){
        return "Number = 0";
      }
      else if (b_exp == "0".repeat(exponent_length) && denormalized){
        b_sign = Math.pow(-1,parseInt(numberB.value.charAt(0)));
        b_exponent = min_exp;
        b_mantissa = parseFloat("0."+numberB.value.substring(1+exponent_length, 1+exponent_length+mantissa_length));

        return "Denormalized number \nSign Bit: " + b_sign + " | Exponent: " + b_exponent + " | Mantissa: " + b_mantissa;
      }
      else{
        b_sign = Math.pow(-1,parseInt(numberB.value.charAt(0)));
        b_exponent = parseInt(numberB.value.substring(1,1+exponent_length),2) - max_exp;
        b_mantissa = parseFloat("1."+numberB.value.substring(1+exponent_length, 1+exponent_length+mantissa_length));
        return "Sign Bit: " + b_sign + " | Exponent: " + b_exponent + " | Mantissa: " + b_mantissa;
      }
    });


    const output_addition = computed(()=>{
      let nbA = +numberA.value;
      let nbB = +numberB.value;

      let result = nbA + nbB;

      base = 1;
      return result;
    });

    const output_substaction = computed(()=>{
      let nbA = +numberA.value;
      let nbB = +numberB.value;

      let result = nbA + nbB;
      return result;
      
    });
    const output_multiplication = computed(()=>{
      let nbA = +numberA.value;
      let nbB = +numberB.value;

      let result = nbA + nbB;
      return result;
      
    });
    const output_division = computed(()=>{
      let nbA = +numberA.value;
      let nbB = +numberB.value;

      let result = nbA + nbB;
      return result;
      
    });

    return {
      ieeeFormat,
      bitNumber,
      format_output,
      a_interpretation,
      b_interpretation,
      numberA,
      numberB,
      output_addition,
      output_substaction,
      output_multiplication,
      output_division,
    };
  },
});
</script>
