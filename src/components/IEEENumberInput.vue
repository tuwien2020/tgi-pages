<template>
  <div class="math-input">
    <div class="binary-operator">
      <input type="button" value="16 Bit" v-bind="$attrs" v-on:click="binaryOperator = 16" />
      <input type="button" value="32 Bit" v-bind="$attrs" v-on:click="binaryOperator = 32" />
      <input type="button" value="64 Bit" v-bind="$attrs" v-on:click="binaryOperator = 64" />
      <input type="button" value="128 Bit" v-bind="$attrs" v-on:click="binaryOperator = 128" />
    </div>
    <input type="text" v-model="mathInput" size="100" v-bind="$attrs" />
    <br />
    <math-output :value="mathJson" :formatting="formatting"></math-output>
  </div>
</template>

<script lang="ts">
import { BinaryNumber, IEEENumber } from "./../math/binary-number";
import { ref, defineComponent, watch, PropType, shallowRef } from "vue";
import { MathJson, MathJsonNumber, parseMath } from "./../math/math-parsing";
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
      type: Function as PropType<(value: MathJson, binaryOperator: number) => MathJson<any>>,
      required: true,
    },
    formatting: {
      type: Object,
      required: false,
    },
    binaryOperator: {
      type: Number,
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
    const binaryOperator = ref(props.binaryOperator);
    let lastParsedValue: MathJson<MathJsonNumber>;
    let numbers: BinaryNumber[] = [];

    watch(
      () => props.modelValue,
      (value) => {
        mathInput.value = value;
        lastParsedValue = parseMath(value);
        let transformed: MathJson<any> = props.mathTransformer(lastParsedValue, binaryOperator.value as number);
        if (transformed[0] && transformed[0] !== "Error") {
          for (let o of transformed) {
            if (o instanceof BinaryNumber) {
              if (o.value.length != binaryOperator.value) {
                transformed = ["Error", "parse error when comparing the binary operator to the inputs"];
                break;
              }
            }
          }
        }
        context.emit("mathJson", transformed);
        mathJson.value = transformed;
      },
      {
        immediate: true,
      }
    );

    watch(
      binaryOperator,
      (value) => {
        let transformed: MathJson<any> = props.mathTransformer(lastParsedValue, binaryOperator.value as number);
        if (transformed[0] && transformed[0] !== "Error") {
          for (let o of transformed) {
            if (o instanceof BinaryNumber) {
              if (o.value.length != binaryOperator.value) {
                transformed = ["Error", "parse error when comparing the binary operator to the inputs"];
                break;
              }
            }
          }
        }
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
      numbers,
      binaryOperator,
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
.math-input .binary-operator {
  display: flex;
  justify-content: center;
}
.math-input .binary-operator input {
  margin: auto 10px;
}
.error {
  color: red;
}
</style>
