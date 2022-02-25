<template>
  <div class="format-input">
    <b>𝔽(</b>
    <small>
      <label>base: <input type="number" v-model="base" size="2" v-bind="$attrs" required disabled /></label>,
      <label>mantissaSize: <input type="number" v-model="mantissaSize" size="5" v-bind="$attrs" required /></label>,
      <label>eMin: <input type="number" v-model="eMin" size="5" v-bind="$attrs" v-on:blur="calcMax" required /></label>,
      <label>eMax: <input type="number" v-model="eMax" size="5" v-bind="$attrs" v-on:blur="calcMax" required /></label>,
      <label>denorm: <input type="checkbox" v-model="denorm" v-bind="$attrs" required /> {{ denorm }}</label>
    </small>
    <b>)</b>
  </div>
  <div>
    <table class="format-preview" :style="{ width: 2 * (1 + exponentBits + mantissaBits) + 'em' }">
      <tbody>
        <tr class="format-bits">
          <td class="sign-bit"></td>
          <td class="exponent-bit" v-for="(n, i) in exponentBits" :key="i"></td>
          <td class="mantissa-bit" v-for="(n, i) in mantissaBits" :key="i"></td>
        </tr>
        <tr>
          <td>sign</td>
          <td :colspan="exponentBits">exponent</td>
          <td :colspan="mantissaBits">mantissa</td>
        </tr>
        <tr>
          <td>1 bit</td>
          <td :colspan="exponentBits">{{ exponentBits }} bit</td>
          <td :colspan="mantissaBits">{{ mantissaBits }} bit</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, shallowRef, watch } from "vue";

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
   * Size of the mantissa in bits (including the implicit bit)
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
  methods: {
    updateValues: function (values: IEEEFloatFormat | null) {
      console.log(values);
    },
  },
  inheritAttrs: false,
  setup(props, context) {
    const base = ref(props.base);
    const mantissaSize = ref(props.mantissaSize);
    const eMin = ref(props.eMin);
    const eMax = ref(props.eMax);
    const denorm = ref(props.denormValue);

    const baseComp = computed(() => props.base);
    const mantissaComp = computed(() => props.mantissaSize);
    const eMinComp = computed(() => props.eMin);
    const eMaxComp = computed(() => props.eMax);
    const denormComp = computed(() => props.denormValue);

    let calcMax = function () {
      const n = Math.pow(2, Math.ceil(Math.log2(Math.abs(eMin.value) + eMax.value + (eMin.value > 0 || eMax.value < 0 ? 0 : 1) + 2)));
      if (n <= 0) {
        return;
      }
      eMax.value = eMin.value + n - 2 - (eMin.value > 0 || eMax.value < 0 ? 0 : 1);
    };

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

    // watch for changing the values via button click (don't ask me why this is needed - it is..)
    watch(
      [baseComp, mantissaComp, eMinComp, eMaxComp, denormComp],
      (value) => {
        base.value = value[0];
        mantissaSize.value = value[1];
        eMin.value = value[2];
        eMax.value = value[3];
        denorm.value = value[4];
      },
      {
        immediate: true,
      }
    );

    const exponentBits = computed(() => Math.ceil(Math.log2(Math.abs(eMin.value) + eMax.value + (eMin.value > 0 || eMax.value < 0 ? 0 : 1) + 2)));
    const mantissaBits = computed(() => mantissaSize.value - 1);

    return {
      base: base,
      mantissaSize: mantissaSize,
      eMin: eMin,
      eMax: eMax,
      denorm,
      exponentBits,
      mantissaBits,
      calcMax,
    };
  },
});
</script>

<style scoped>
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

.format-preview {
  margin-top: 8px;
  table-layout: fixed;
  border-spacing: 10px 0px;
  border-collapse: separate;
  white-space: nowrap;
  overflow: hidden;
  /*text-overflow: clip;*/
}
.format-preview .format-bits {
  height: 1em;
}

.sign-bit {
  background: var(--second-color);
}
.exponent-bit {
  background: var(--first-color);
}
.mantissa-bit {
  background: var(--third-color);
}

.format-preview td {
  padding: 0px;
  border: 0px;
  text-align: center;
}
</style>
