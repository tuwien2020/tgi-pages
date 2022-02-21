<template>
  <br />
  <label>
    <h1>IEEE 754 Rechner</h1>
    <ieee-function-input
      v-bind:base="base"
      v-bind:mantissaSize="mantissaSize"
      v-bind:eMin="eMin"
      v-bind:eMax="eMax"
      @ieeeFormat="setIeeeFormat"
      :denormValue="denormValue"
    ></ieee-function-input>
    Rounding: <i>round to nearest - round to even</i>
  </label>

  <br />
  <ieee-number-input
    v-model="userInput"
    :mathTransformer="transform"
    @mathJson="(value) => (mathJsonExpression = value)"
    :formatting="{ customPrinter }"
    :binaryOperator="binaryOperator"
  >
  </ieee-number-input>

  <br />
  <span v-if="!singleOpExpression" class="error">Cannot compute more than one operation for now!</span>
  <math-single-op-ieee
    v-if="singleOpExpression"
    :operator="(singleOpExpression[0] as any)"
    :valueA="(singleOpExpression[1] as any)"
    :valueB="(singleOpExpression[2] as any)"
    :mantissaSize="mantissaSize"
    :eValue="eMin"
  />
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useBinaryExpressions } from "./../math/binary-expression";
import { MathJson, MathJsonOperator } from "./../math/math-parsing";
import MathInput from "./../components/MathInput.vue";
import ieeeFunctionInput, { IEEEFloatFormat } from "../components/IEEEFormatInput.vue";
import MathSingleOp from "./../components/MathSingleOp.vue";
import { BinaryNumber, IEEENumber } from "../math/binary-number";
import ieeeNumberInput from "./../components/IEEENumberInput.vue";
import MathSingleOpIeee from "./../components/MathSingleOpIeee.vue";

export default defineComponent({
  components: { MathInput, ieeeFunctionInput, MathSingleOp, ieeeNumberInput, MathSingleOpIeee },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const userInput = urlRef("input", "1010100010001000+10111100100010011");
    const useBinary = useBinaryExpressions();

    const base = ref(2);
    const mantissaSize = ref(11);
    const eMin = ref(-14);
    const eMax = ref(15);
    const denormValue = ref(true);

    const binaryOperator = ref(16);

    const mathJsonExpression = shallowRef<MathJson>();
    const divisionDecimals = ref(7);

    const singleOpExpression = computed(() => {
      return Array.isArray(mathJsonExpression.value) &&
        mathJsonExpression.value.length === 3 &&
        mathJsonExpression.value[1] instanceof IEEENumber &&
        mathJsonExpression.value[2] instanceof IEEENumber
        ? mathJsonExpression.value
        : null;
    });

    function setIeeeFormat(value: IEEEFloatFormat | null) {
      if (value) {
        base.value = value.base;
        mantissaSize.value = value.mantissaSize;
        eMin.value = value.eMin;
        eMax.value = value.eMax;
        denormValue.value = value.allowDenormalized;
      } else {
        // TODO: handle null elegantly
      }
    }

    return {
      userInput,
      mantissaSize,
      base,
      eMin,
      eMax,
      denormValue,
      binaryOperator,
      transform: useBinary.transformIEEE,
      customPrinter: useBinary.customPrinter,
      mathJsonExpression,
      singleOpExpression,
      divisionDecimals,
      setIeeeFormat,
    };
  },
});
</script>
