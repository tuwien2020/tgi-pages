<template>
  <div class="math-input">
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
      type: Function as PropType<(value: MathJson, eMin: number, eMax: number, mantissaSize: number) => MathJson<any>>,
      required: true,
    },
    formatting: {
      type: Object,
      required: false,
    },
    mantissaSize: {
      type: Number,
      required: true,
    },
    eMin: {
      type: Number,
      required: true,
    },
    eMax: {
      type: Number,
      required: true,
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
    let mantissaSize = ref(props.mantissaSize);
    let eMin = ref(props.eMin);
    let eMax = ref(props.eMax);
    let lastParsedValue: MathJson<MathJsonNumber>;
    let numbers: BinaryNumber[] = [];

    const transformValue = () => {
      let transformed: MathJson<any> = props.mathTransformer(
        lastParsedValue,
        eMin.value as number,
        eMax.value as number,
        mantissaSize.value as number
      );
      if (transformed[0] && transformed[0] !== "Error") {
        for (let o of transformed) {
          if (o instanceof BinaryNumber) {
            // if (o.value.length != binaryOperator.value) {
            //   transformed = ["Error", "parse error when comparing the binary operator to the inputs"];
            //   break;
            // }
          }
        }
      }
      context.emit("mathJson", transformed);
      mathJson.value = transformed;
    };

    watch(
      () => props.mantissaSize,
      (value) => {
        mantissaSize.value = value;
        transformValue();
      },
      {
        immediate: true,
      }
    );

    watch(
      () => props.eMin,
      (value) => {
        eMin.value = value;
        transformValue();
      },
      {
        immediate: true,
      }
    );

    watch(
      () => props.eMax,
      (value) => {
        eMax.value = value;
        transformValue();
      },
      {
        immediate: true,
      }
    );

    watch(
      () => props.modelValue,
      (value) => {
        mathInput.value = value;
        lastParsedValue = parseMath(value);

        transformValue();
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
      mantissaSize,
      eMin,
      eMax,
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
