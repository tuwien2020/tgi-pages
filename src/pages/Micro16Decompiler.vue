<template>
  <h1>Micro 16-Dekompilierer</h1>

  <p>Bytecode (getrennt durch einen Linienumbruch):</p>
  <textarea
    rows="4"
    cols="50"
    v-model="bytecode"
    class="is-family-monospace"
  ></textarea>

  <pre>{{ instruction }}</pre>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import {
  ParsedInstruction,
  parse,
  getRegistry,
  interpret,
} from "./../assets/decompiler";

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const bytecode = urlRef("bytecode", "");
    const instruction = computed(() => {
      const lines = bytecode.value.trimEnd().split("\n");
      let s = "";
      for (const line of lines) {
        s += interpret(line) + "\n";
      }

      return s;
    });

    return {
      bytecode,
      instruction,
    };
  },
});
</script>
