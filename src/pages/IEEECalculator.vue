<template>
  <br />
  <label>
    <h1>IEEE 754 Rechner</h1>
    <ieee-function-input
      :base="base"
      :mantissaSize="mantissaSize"
      :eMin="eMin"
      :eMax="eMax"
      @ieeeFormat="setIeeeFormat"
      ref="formatInput"
      :denormValue="denormValue"
    ></ieee-function-input>
    Rounding: <i>round to nearest - round to even</i>
    <div class="binary-operator">
      <input type="button" value="16 Bit" @click="setIeeeFormat({ base: 2, eMin: -14, eMax: 15, mantissaSize: 11, allowDenormalized: true })" />
      <input type="button" value="32 Bit" @click="setIeeeFormat({ base: 2, eMin: -126, eMax: 127, mantissaSize: 24, allowDenormalized: true })" />
      <input type="button" value="64 Bit" @click="setIeeeFormat({ base: 2, eMin: -1022, eMax: 1023, mantissaSize: 53, allowDenormalized: true })" />
      <input
        type="button"
        value="128 Bit"
        @click="setIeeeFormat({ base: 2, eMin: -16382, eMax: 16383, mantissaSize: 64, allowDenormalized: true })"
      />
    </div>
  </label>

  <br />
  <ieee-number-input
    v-model="userInput"
    :mathTransformer="transform"
    @mathJson="(value) => (mathJsonExpression = value)"
    :formatting="{ customPrinter }"
    :mantissaSize="mantissaSize"
    :eMin="eMin"
    :eMax="eMax"
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
import { IEEENumber } from "../math/binary-number";
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

    setIeeeFormat({ base: 3, eMin: -15, eMax: 14, mantissaSize: 12, allowDenormalized: false });

    return {
      userInput,
      mantissaSize,
      base,
      eMin,
      eMax,
      denormValue,
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
