<template>
  <div class="math-input">
    <input type="text" v-model="mathInput" size="100" v-bind="$attrs" /> <br />
    <math-output :value="mathJson" :formatting="formatting"></math-output>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, watch, PropType, shallowRef } from "vue";
import { MathJson, parseMath } from "./../math/math-parsing";
import MathOutput from "./MathOutput.vue";

export default defineComponent({
  components: {
    MathOutput,
  },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    mathTransformer: {
      type: Function as PropType<(value: MathJson) => MathJson<any>>,
      required: true,
    },
    formatting: {
      type: Object,
      required: false,
    },
  },
  emits: {
    "update:modelValue": (value: string) => true,
    mathJson: (value: MathJson) => true,
  },
  inheritAttrs: false,
  setup(props, context) {
    const mathInput = ref("" + props.modelValue);
    const mathJson = shallowRef<MathJson>("");

    watch(
      () => props.modelValue,
      (value) => {
        mathInput.value = value;
        const parsed = parseMath(value);
        let transformed: MathJson<any> = props.mathTransformer(parsed);
        context.emit("mathJson", transformed);
        mathJson.value = transformed;
      },
      {
        immediate: true,
      }
    );

    watch(mathInput, (value) => {
      context.emit("update:modelValue", value);
    });

    return {
      mathInput,
      mathJson,
      formatting: props.formatting,
    };
  },
});
</script>

<style>
.math-input {
  display: inline-block;
}
.math-input input {
  font-family: "Consolas", "Courier New", Courier, monospace;
}
.error {
  color: red;
}
</style>