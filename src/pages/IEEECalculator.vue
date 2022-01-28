<template>
  <h1><u>IEEE Calculator</u></h1>
  <br />
  Format needs to be type of: <strong>F(base, mantissa, minimum exp, maximum exp, denormalized) : </strong>
  <input type="text" v-model="ieeeFormat" /> <br />
  Total bit number: <input type="text" v-model="bitNumber" /> <br /><br />

  <u>Base formats: </u><br />
  <strong>F(2,11,-14,15,true)</strong> -> Half Precision | Total length: 16<br />
  <strong>F(2,24,-126,127,true)</strong> -> Single Precision | Total length: 32<br />
  <strong>F(2,53,-1022,1023,true)</strong> -> Double Precision | Total length: 64<br />
  <br />
  <span style="white-space: pre-line"> {{ format_output }} </span><br />

  <br /><br />
  Number A: <input type="text" v-model="numberA" /><br /><br />
  <span style="white-space: pre-line"
    ><strong>{{ a_interpretation }}</strong></span
  >
  <br /><br />

  Number B: <input type="text" v-model="numberB" /><br /><br />
  <span style="white-space: pre-line"
    ><strong>{{ b_interpretation }}</strong></span
  >
  <br /><br />

  <section>
    <h4><u>Operation select</u></h4>
    <table style="width: 30%">
      <tr>
        <td><input type="radio" v-model="operation" value="0" /> Addition <br /></td>
        <td><input type="radio" v-model="operation" value="1" /> Substraction <br /></td>
        <td><input type="radio" v-model="operation" value="2" /> Multiplication <br /></td>
        <td><input type="radio" v-model="operation" value="3" /> Divison <br /></td>
      </tr>
    </table>
  </section>
  <br />

  <h4><u>Result:</u></h4>
  <br />
  <span style="white-space: pre-line">
    {{ output_calculation }}
  </span>
  <br /><br /><br />
  <!--
  
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
import { calc } from "src/assets/decompiler";
import { ref, defineComponent, watchEffect, watch, computed, shallowRef, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { BinaryNumber } from "../math/binary-number";

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

    const operation = urlRef("operation", "");

    const format = reactive({
      base: 0,
      mantissa: 0,
      min_exp: 0,
      max_exp: 0,
      denormalized: false,
      sign_bit_length: 0,
      exponent_length: 0,
      mantissa_length: 0,
    });

    let a_sign: number;
    let a_exponent: number;
    let a_mantissa: number;

    let b_sign: number;
    let b_exponent: number;
    let b_mantissa: number;

    function stringToBinaryNumber(value: string): BinaryNumber | null {
      const binaryNumberRegex = /^([+-])?([0-1]+)([.,]([0-1]+))?$/;

      const matchResults = (value ?? "").match(binaryNumberRegex);
      if (matchResults === null) return null;

      const [_, sign, numberValue, __, fractionalPart] = matchResults;

      return new BinaryNumber(
        sign === "-",
        ((numberValue ?? "") + (fractionalPart ?? "")).split("").map((v) => (v === "0" ? false : true)),
        fractionalPart?.length ?? 0
      );
    }

    function remove_space() {
      numberA.value = numberA.value.replace(" ", "");
      numberB.value = numberB.value.replace(" ", "");
    }

    //TODO: Make sure a_interpreation and b_interpretation are run everytime a radiobutton gets pressed
    function calculate_output() {
      let message = "";
      let result = 0;
      if (numberA.value.length == 16 && numberB.value.length == 16) {
        if (operation.value == "0") {
          message =
            "- Transform number A and B in scientific notation: \n\Number A: " +
            a_sign +
            " * " +
            a_mantissa +
            " * 2 ^" +
            a_exponent +
            "\n\
          Number B: " +
            b_sign +
            " * " +
            b_mantissa +
            " * 2 ^" +
            b_exponent;

          if (a_exponent > b_exponent) {
            let difference = a_exponent - b_exponent;
            message += "\n\n- Adjust exponents to higher one:\nExponent of A higher by " + difference;
            b_exponent += difference;
            b_mantissa /= Math.pow(10, difference);
            message += "\nDivide mantissa of B by 10^" + difference + ":\n" + b_mantissa;
          }
          if (b_exponent > a_exponent) {
            let difference = b_exponent - a_exponent;
            message += "\n\n- Adjust exponents to higher one:\nExponent of B higher by " + difference;
            a_exponent += difference;
            a_mantissa /= Math.pow(10, difference);
            message += "\nDivide mantissa of A by 10^" + difference + ":\n" + a_mantissa;
          }

          message += "\n\n- Add mantissa together: ";

          console.log(numberA.value.length + "  " + numberB.value.length);
        }
        return message + " \n ";
        result;
      } else {
        return "Number A and B need to be " + bitNumber.value + " bits long.";
      }
    }

    const format_output = computed(() => {
      format.base = parseInt(ieeeFormat.value.split(",")[0]);
      format.mantissa = parseInt(ieeeFormat.value.split(",")[1]);
      format.min_exp = parseInt(ieeeFormat.value.split(",")[2]);
      format.max_exp = parseInt(ieeeFormat.value.split(",")[3]);
      format.denormalized = ieeeFormat.value.split(",")[4] === "true";

      format.sign_bit_length = 1;
      format.exponent_length = parseInt(bitNumber.value) - format.mantissa;
      format.mantissa_length = format.mantissa - 1;

      return (
        "Base: " +
        format.base +
        " | Mantissa: " +
        format.mantissa +
        " | Minimum exponent: " +
        format.min_exp +
        " | Maximum exponent: " +
        format.max_exp +
        " | Denormalized: " +
        format.denormalized +
        " \n\n \
      Sign Bit: 1 | Exponent length: " +
        format.exponent_length +
        " | Mantissa Length: " +
        format.mantissa_length
      );
    });

    const a_interpretation = computed(() => {
      remove_space();
      let a_exp = numberA.value.substring(1, 1 + format.exponent_length);
      let a_mant = parseInt(numberA.value.substring(1 + format.exponent_length, 1 + format.exponent_length + format.mantissa_length));

      if (a_exp == "1".repeat(format.exponent_length) && a_mant == 0) {
        if (parseInt(numberA.value.charAt(0)) == 1) {
          return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 1: Minus Infinity ";
        } else {
          return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 0: Plus Infinity ";
        }
      } else if (a_exp == "1".repeat(format.exponent_length) && a_mant > 0) {
        return "NaN (0/0, Negative sqrt)";
      } else if (a_exp == "0".repeat(format.exponent_length) && a_mant == 0 && !format.denormalized) {
        return "Number = 0";
      } else if (a_exp == "0".repeat(format.exponent_length) && format.denormalized) {
        a_sign = Math.pow(-1, parseInt(numberA.value.charAt(0)));
        a_exponent = format.min_exp;
        a_mantissa = parseFloat("0." + numberA.value.substring(1 + format.exponent_length, 1 + format.exponent_length + format.mantissa_length));

        return "Denormalized number \nSign Bit: " + a_sign + " | Exponent: " + a_exponent + " | Mantissa: " + a_mantissa;
      } else {
        a_sign = Math.pow(-1, parseInt(numberA.value.charAt(0)));
        a_exponent = parseInt(numberA.value.substring(1, 1 + format.exponent_length), 2) - format.max_exp;
        a_mantissa = parseFloat("1." + numberA.value.substring(1 + format.exponent_length, 1 + format.exponent_length + format.mantissa_length));
        return "Sign Bit: " + a_sign + " | Exponent: " + a_exponent + " | Mantissa: " + a_mantissa;
      }
    });

    const b_interpretation = computed(() => {
      remove_space();
      let b_exp = numberB.value.substring(1, 1 + format.exponent_length);
      let b_mant = parseInt(numberB.value.substring(1 + format.exponent_length, 1 + format.exponent_length + format.mantissa_length));

      if (b_exp == "1".repeat(format.exponent_length) && b_mant == 0) {
        if (parseInt(numberB.value.charAt(0)) == 1) {
          return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 1: Minus Infinity ";
        } else {
          return "Only 1 in exponent, Only 0 in mantissa and Bit Sign = 0: Plus Infinity ";
        }
      } else if (b_exp == "1".repeat(format.exponent_length) && b_mant > 0) {
        return "NaN (0/0, Negative sqrt)";
      } else if (b_exp == "0".repeat(format.exponent_length) && b_mant == 0 && !format.denormalized) {
        return "Number = 0";
      } else if (b_exp == "0".repeat(format.exponent_length) && format.denormalized) {
        b_sign = Math.pow(-1, parseInt(numberB.value.charAt(0)));
        b_exponent = format.min_exp;
        b_mantissa = parseFloat("0." + numberB.value.substring(1 + format.exponent_length, 1 + format.exponent_length + format.mantissa_length));

        return "Denormalized number \nSign Bit: " + b_sign + " | Exponent: " + b_exponent + " | Mantissa: " + b_mantissa;
      } else {
        b_sign = Math.pow(-1, parseInt(numberB.value.charAt(0)));
        b_exponent = parseInt(numberB.value.substring(1, 1 + format.exponent_length), 2) - format.max_exp;
        b_mantissa = parseFloat("1." + numberB.value.substring(1 + format.exponent_length, 1 + format.exponent_length + format.mantissa_length));
        return "Sign Bit: " + b_sign + " | Exponent: " + b_exponent + " | Mantissa: " + b_mantissa;
      }
    });

    const output_calculation = computed(() => {
      let result = calculate_output();
      return result;
    });

    return {
      ieeeFormat,
      bitNumber,
      format_output,
      operation,
      a_interpretation,
      b_interpretation,
      numberA,
      numberB,
      output_calculation,
    };
  },
});
</script>
