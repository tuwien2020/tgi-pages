<template>
  <h1>Micro 16-Dekompilierer</h1>

  <p>Bytecode (getrennt durch einen Linienumbruch):</p>
  <textarea 
    rows="4" 
    cols="50" 
    
    @input="change"
    ></textarea>

    <pre>{{instruction}}</pre>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";
import { ParsedInstruction, parse, getRegistry, interpret} from './../assets/decompiler';

export default defineComponent({
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);

    const bytecode = urlRef("bytecode", "");
    const instruction = ref("instruction");

    const change = (event) => {
      bytecode.value = event.target.value;
      let s = "";
      console.log(bytecode.value.split('\n'));
      
      console.log();
      for (const line of bytecode.value.split('\n')) {
      
        
        s += interpret(line) + "\n";
      } 
      instruction.value = s;
      event.stopPropagation();
    };

    return {
      bytecode,
      instruction,
      change
    };
  },
});
</script>
