<template>
  <br />
  <label>
    <h1>IEEE 754 Rechner</h1>
    <ieee-function-input
      v-bind:base="base"
      v-bind:mantissaSize="mantissaSize"
      v-bind:eMin="eMin"
      v-bind:eMax="eMax"
      @validFunction="(value) => (validFunction = value)"
      :denormValue="denormValue"
      autofocus
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
    autofocus
  >
  </ieee-number-input>

  <br />
  <span v-if="!isSingleOpExpression" class="error">Cannot compute more than one operation for now!</span>
  <math-single-op-ieee
    v-if="isSingleOpExpression"
    :operator="mathJsonExpression?.[0]"
    :valueA="mathJsonExpression?.[1]"
    :valueB="mathJsonExpression?.[2]"
    :mantissaSize="mantissaSize.value"
    :eValue="eMin.value"
  />
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useBinaryExpressions } from "./../math/binary-expression";
import { MathJson, MathJsonOperator } from "./../math/math-parsing";
import MathInput from "./../components/MathInput.vue";
import ieeeFunctionInput from "./../components/IEEEFunctionInput.vue";
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

    const base = shallowRef<Number>(2);
    const mantissaSize = shallowRef<Number>(11);
    const eMin = shallowRef<Number>(-14);
    const eMax = shallowRef<Number>(15);
    const denormValue = shallowRef<String>("false");
    const validFunction = shallowRef<Boolean>(true);

    const binaryOperator = shallowRef<Number>(16);

    const mathJsonExpression = shallowRef<MathJson>();
    const divisionDecimals = ref(7);
    const isSingleOpExpression = computed(() => {
      return (
        Array.isArray(mathJsonExpression.value) &&
        mathJsonExpression.value.length === 3 &&
        mathJsonExpression.value[1] instanceof IEEENumber &&
        mathJsonExpression.value[2] instanceof IEEENumber
      );
    });

    return {
      userInput,
      mantissaSize,
      base,
      eMin,
      eMax,
      denormValue,
      validFunction,
      binaryOperator,
      transform: useBinary.transformIEEE,
      customPrinter: useBinary.customPrinter,
      mathJsonExpression,
      isSingleOpExpression,
      divisionDecimals,
    };
  },
});
</script>
