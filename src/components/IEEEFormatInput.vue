<template>
  <div class="format-input">
    <b>𝔽(</b>
    <small>
      <label>base: <input type="number" v-model="base" size="2" v-bind="$attrs" required /></label>,
      <label>mantissaSize: <input type="number" v-model="mantissaSize" size="5" v-bind="$attrs" required /></label>,
      <label>eMin: <input type="number" v-model="eMin" size="5" v-bind="$attrs" required /></label>,
      <label>eMax: <input type="number" v-model="eMax" size="5" v-bind="$attrs" required /></label>,
      <label>denorm: <input type="checkbox" v-model="denorm" v-bind="$attrs" required /> {{ denorm }}</label>
    </small>
    <b>)</b>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, shallowRef, watch } from "vue";

export type IEEEFloatFormat = {
  /**
   * Which base to use (binary, decimal, ...)
   */
  base: number;

  /**
   * Minimum exponent
   */
  eMin: number;

  /**
   * Maximum exponent
   */
  eMax: number;

  /**
   * Size of the mantissa in bits
   * (Does this include the implicit bit?)
   */
  mantissaSize: number;

  /**
   * If denormalized numbers should also be handled
   */
  allowDenormalized: boolean;
};

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
      type: Boolean,
      required: true,
    },
  },
  emits: {
    ieeeFormat: (value: IEEEFloatFormat | null) => true,
  },
  inheritAttrs: false,
  setup(props, context) {
    const base = ref(props.base);
    const mantissaSize = ref(props.mantissaSize);
    const eMin = ref(props.eMin);
    const eMax = ref(props.eMax);
    const denorm = ref(props.denormValue);

    watch(
      [base, mantissaSize, eMin, eMax, denorm],
      (value) => {
        // TODO: Use https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#the_constraint_validation_api
        const baseCorrect = +value[0] > 1;
        const mantissaCorrect = +value[1] > 0;
        const eCorrect = (value[2] as any) !== "" && (value[3] as any) !== "" && +value[3] > +value[2];
        if (baseCorrect && mantissaCorrect && eCorrect) {
          context.emit("ieeeFormat", {
            base: base.value,
            mantissaSize: mantissaSize.value,
            eMin: eMin.value,
            eMax: eMax.value,
            allowDenormalized: denorm.value,
          });
        } else {
          context.emit("ieeeFormat", null);
        }
      },
      {
        immediate: true,
      }
    );

    return {
      base: base,
      mantissaSize: mantissaSize,
      eMin: eMin,
      eMax: eMax,
      denorm,
    };
  },
});
</script>
-

<style>
.format-input {
  display: inline-block;
}
.format-input input {
  font-family: "Consolas", "Courier New", Courier, monospace;
}

.format-input input::-webkit-outer-spin-button,
.format-input input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.format-input input[type="number"] {
  -moz-appearance: textfield;
}

.format-input input:invalid {
  /* Yes it looks ugly, someone else should take care of this */
  border: 2px dashed red;
}
</style>
