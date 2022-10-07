<template>
  <br />
  <label>
    <h1>{{ t("page.binaryCalculator.title") }}</h1>
    <math-input
      v-model="userInput"
      :mathTransformer="transform"
      @mathJson="(value) => (mathJsonExpression = value)"
      :formatting="{ customPrinter }"
      autofocus
    ></math-input>
  </label>

  <br />
  <span v-if="singleOpExpression && singleOpExpression[0] === 'Divide'">
    {{ t("page.binaryCalculator.decimalPlaces") }}:
    <input type="number" v-model="divisionDecimals" :placeholder="t('page.binaryCalculator.decimalPlaces')" />
  </span>
  <br />
  <math-single-op
    v-if="singleOpExpression"
    :operator="singleOpExpression[0]"
    :valueA="(singleOpExpression as any)[1]"
    :valueB="(singleOpExpression as any)[2]"
    :divisionDecimals="divisionDecimals"
  ></math-single-op>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { useBinaryExpressions } from "./../math/binary-expression";
import { MathJson, MathJsonMathOperator } from "./../math/math-parsing";
import MathInput from "./../components/MathInput.vue";
import MathSingleOp from "./../components/MathSingleOp.vue";
import { BinaryNumber } from "../math/binary-number";
import { useI18n } from "vue-i18n";

export default defineComponent({
  components: { MathInput, MathSingleOp },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const { t } = useI18n();

    const userInput = urlRef("input", "101+1110");
    const useBinary = useBinaryExpressions();
    const mathJsonExpression = shallowRef<MathJson>();
    const divisionDecimals = ref(7);
    const singleOpExpression = computed(() => {
      return Array.isArray(mathJsonExpression.value) &&
        mathJsonExpression.value.length === 3 &&
        mathJsonExpression.value[1] instanceof BinaryNumber &&
        mathJsonExpression.value[2] instanceof BinaryNumber
        ? (mathJsonExpression.value as [operator: MathJsonMathOperator, ...args: MathJson[]])
        : undefined;
    });

    return {
      t,
      userInput,
      transform: useBinary.transform,
      customPrinter: useBinary.customPrinter,
      mathJsonExpression,
      singleOpExpression,
      divisionDecimals,
    };
  },
});
</script>
