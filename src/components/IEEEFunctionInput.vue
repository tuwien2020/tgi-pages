<template>
  <div class="function-input">
    <b>𝔽(</b>
    <small>
      base:<input type="number" v-model="base" size="2" v-bind="$attrs" disabled />, mantissaSize:<input
        type="number"
        v-model="mantissaSize"
        size="5"
        v-bind="$attrs"
        disabled
      />, eMin:<input type="number" v-model="eMin" size="5" v-bind="$attrs" disabled />, eMax:<input
        type="number"
        v-model="eMax"
        size="5"
        v-bind="$attrs"
        disabled
      />, denorm:<input type="text" v-model="denorm" size="5" v-bind="$attrs" disabled />
    </small>
    <b>)</b>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, shallowRef, watch } from "vue";

export default defineComponent({
  props: {
    mantissaSize: {
      type: Number,
      required: true,
    },
    base: {
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
    denormValue: {
      type: String,
      required: true,
    },
  },
  emits: {
    validFunction: (value: Boolean) => true,
  },
  inheritAttrs: false,
  setup(props, context) {
    const base = ref(props.base);
    const mantissaSize = ref(props.mantissaSize);
    const eMin = ref(props.eMin);
    const eMax = ref(props.eMax);
    const denorm = ref(props.denormValue);
    let validFunction = true;

    watch(
      [base, mantissaSize, eMin, eMax, denorm],
      (value: Array<Object>) => {
        const baseCorrect = value[0] !== "";
        const mantissaCorrect = value[1] !== "" && +value[1] > 0;
        const eCorrect = value[2] !== "" && value[3] !== "" && +value[3] > +value[2];
        const denormCorrect = ("" + value[4]).toLowerCase() === "false" || ("" + value[4]).toLowerCase() === "true";
        validFunction = baseCorrect && mantissaCorrect && eCorrect && denormCorrect;
        context.emit("validFunction", validFunction);
      },
      {
        immediate: true,
      }
    );
    /*watch(denorm, (value) => {
        validFunction = ;
        context.emit("validFunction", validFunction);
    },
    {
        immediate: true
    }
    );*/

    return {
      base: base,
      mantissaSize: mantissaSize,
      eMin: eMin,
      eMax: eMax,
      denorm,
      validFunction,
    };
  },
});
</script>
-

<style>
.function-input {
  display: inline-block;
}
.function-input input {
  font-family: "Consolas", "Courier New", Courier, monospace;
}

.function-input input::-webkit-outer-spin-button,
.function-input input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.function-input input[type="number"] {
  -moz-appearance: textfield;
}

.error {
  color: red;
}
</style>
