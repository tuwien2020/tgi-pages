<template>
  <br />
  <label>
    <h1>Bin&auml;r Rechner</h1>
    <math-input
      v-model="userInput"
      :mathTransformer="transform"
      @mathJson="(value) => (mathJsonExpression = value)"
      :formatting="{ customPrinter }"
      autofocus
    ></math-input>
  </label>

  <br />
  <span v-if="isSingleOpExpression && mathJsonExpression?.[0] === 'Divide'">
    Decimal places:
    <input type="number" v-model="divisionDecimals" placeholder="Decimal places" />
  </span>
  <br />
  <math-single-op
    v-if="isSingleOpExpression"
    :operator="mathJsonExpression?.[0]"
    :valueA="mathJsonExpression?.[1]"
    :valueB="mathJsonExpression?.[2]"
    :divisionDecimals="divisionDecimals"
  ></math-single-op>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useBinaryExpressions } from "./../math/binary-expression";
import { MathJson } from "./../math/math-parsing";
import MathInput from "./../components/MathInput.vue";
import MathSingleOp from "./../components/MathSingleOp.vue";
import { BinaryNumber } from "../math/binary-number";

export default defineComponent({
  components: { MathInput, MathSingleOp },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const userInput = urlRef("input", "101+1110");
    const useBinary = useBinaryExpressions();
    const mathJsonExpression = shallowRef<MathJson>();
    const divisionDecimals = ref(7);
    const isSingleOpExpression = computed(() => {
      return (
        Array.isArray(mathJsonExpression.value) &&
        mathJsonExpression.value.length === 3 &&
        mathJsonExpression.value[1] instanceof BinaryNumber &&
        mathJsonExpression.value[2] instanceof BinaryNumber
      );
    });

    return {
      userInput,
      transform: useBinary.transform,
      customPrinter: useBinary.customPrinter,
      mathJsonExpression,
      isSingleOpExpression,
      divisionDecimals,
    };
  },
});
</script>
