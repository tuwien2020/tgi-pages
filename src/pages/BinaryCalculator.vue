<template>
  <h1>Bin&auml;r Rechner</h1>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  shallowRef,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { BinaryNumber } from "../math/binary-number";
import { MathJson, MathJsonLogicalOperator } from "../math/MathJson";
import { useUrlRef } from "../url-ref";
import { tryParse as tryParseAstLogical } from "./../assets/grammar-logical";
import MathInput from "./../components/MathInput.vue";
import MathOutput from "./../components/MathOutput.vue";

export default defineComponent({
  components: { MathInput, MathOutput },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    return {};
  },
});
</script>
