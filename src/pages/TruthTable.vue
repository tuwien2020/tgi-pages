<template>
  <h1>Wahrheitstabelle</h1>
  <p>Gebe hier einen Booleschen Ausdruck ein:</p>
  <math-input
    type="logical"
    v-model="logicalUserInput"
    @mathJson="(value) => (logicalMathJson = value)"
  ></math-input>

  <table>
    <thead>
      <tr>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td></td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed } from "vue";
import { MathJson } from "../MathJson";
import MathInput from "./../components/MathInput.vue";

function useLogicalMath() {
  function extractGetters(ast: MathJson) {
    const getters = new Set<string>();

    function extractGettersRecursive(ast: MathJson) {
      if (Array.isArray(ast)) {
        const [functionName, ...args] = ast;
        for (let i = 0; i < args.length; i++) {
          extractGettersRecursive(args[i]);
        }
      } else if (typeof ast === "string") {
        getters.add(ast);
      }
    }

    return getters;
  }
}

// TODO: Put the entered stuff into the URL
export default defineComponent({
  components: { MathInput },
  setup() {
    const logicalMath = useLogicalMath();

    const logicalUserInput = ref("");
    const logicalMathJson = ref([]);

    watch(logicalMathJson, (value) => {
      console.log(value);
    });

    return {
      logicalUserInput,
      logicalMathJson,
    };
  },
});
</script>
