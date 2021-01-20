<template>
  <h1>Micro 16-Dekompilierer</h1>

  <p>Bytecode (getrennt durch einen Linienumbruch):</p>
  <textarea 
    rows="4" 
    cols="50" 
    :value="bytecode"
    @input="
      (event) => 
        (bytecode = event.target.value
          .replace(/ /g, '')
          .replace(/[^01\n]/g, ''))
    "
    ></textarea>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const bytecode = urlRef("bytecode", "");

    return {
      bytecode,
    };
  },
});
</script>
