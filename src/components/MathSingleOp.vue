<template></template>


<script lang="ts">
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  shallowRef,
} from "vue";
import { BinaryNumber } from "../math/binary-number";
import { MathJson, MathJsonLogicalOperator } from "../math/MathJson";
import { tryParse as tryParseAst } from "./../assets/grammar-single-op";
import MathOutput from "./../components/MathOutput.vue";

export default defineComponent({
  components: { MathOutput },
  setup() {
    return {};
  },
});
</script>
