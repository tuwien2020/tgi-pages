<template>
  <div class="math-output" ref="mathoutput"></div>
</template>
<script lang="ts">
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  shallowRef,
  PropType,
  onMounted,
  nextTick,
} from "vue";
import { BinaryNumber } from "../math/binary-number";
import { MathJson, MathJsonMathOperator } from "../math/MathJson";
import Katex from "katex";

export default defineComponent({
  components: {},
  props: {
    valueA: {
      type: Object as PropType<BinaryNumber>,
      default: () => new BinaryNumber(false, [], 0),
    },

    valueB: {
      type: Object as PropType<BinaryNumber>,
      default: () => new BinaryNumber(false, [], 0),
    },
    operator: {
      type: String as PropType<MathJsonMathOperator>,
      default: () => "plus" as MathJsonMathOperator,
    },
  },
  setup(props, context) {
    const mathoutput = ref<HTMLElement>();
    // TODO: Allow numbers with a sign as input

    const result = computed(() => {
      if (props.operator == "add") {
        return props.valueA.add(props.valueB);
      } else if (props.operator == "subtract") {
        return props.valueA.subtract(props.valueB);
      } else if (props.operator == "multiply") {
        //return props.valueA.multiply(props.valueB);
      } else if (props.operator == "divide") {
        //return props.valueA.divide(props.valueB);
      } else {
        return new BinaryNumber(false, [], 0);
      }
    });

    const output = computed(() => {
      if (props.operator == "add" || props.operator == "subtract") {
        let valueA = props.valueA;
        let valueB = props.valueB;
        let output = "";

        const printBitArray = (value: readonly boolean[] | undefined) =>
          (value ?? []).map((v) => (v ? "1" : "0")).join("");

        const printLatexNumber = (
          op: string,
          beforeDecimal: string,
          afterDecimal: string
        ) =>
          `& \\mathtt{${op}} & \\mathtt{${beforeDecimal}} & \\mathtt{${
            afterDecimal.length > 0 ? "." + afterDecimal : ""
          }} &`;

        // see binary-number.ts
        if (props.operator == "subtract") {
          valueB = valueB.setSign(!valueB.isNegative);
        }

        if (valueA.isNegative == valueB.isNegative) {
          // Addition
          let firstNumber = printLatexNumber(
            "",
            printBitArray(valueA.getValueBeforeDecimal()),
            printBitArray(valueA.getValueAfterDecimal())
          );
          if (result.value?.isNegative) {
            // Slap a minus sign around the operation
            firstNumber =
              `\\smash{\\raisebox{-0.75em}{$-\\Bigg($}}` +
              firstNumber +
              `\\smash{\\raisebox{-0.75em}{$\\Bigg)$}}`;
          }
          output += firstNumber;
          output += "\\\\\n";
          let secondNumber = printLatexNumber(
            "+",
            printBitArray(valueB.getValueBeforeDecimal()),
            printBitArray(valueB.getValueAfterDecimal())
          );
          output += secondNumber;
        } else {
          // Subtraction
          const comparison = valueA
            .setSign(false)
            .compareTo(valueB.setSign(false));
          if (comparison < 0) {
            const temp = valueA;
            valueA = valueB;
            valueB = temp;
          }
          let firstNumber = printLatexNumber(
            "",
            printBitArray(valueA.getValueBeforeDecimal()),
            printBitArray(valueA.getValueAfterDecimal())
          );
          if (result.value?.isNegative) {
            // Slap a minus sign around the operation
            firstNumber =
              `\\smash{\\raisebox{-0.75em}{$-\\Bigg($}}` +
              firstNumber +
              `\\smash{\\raisebox{-0.75em}{$\\Bigg)$}}`;
          }
          output += firstNumber;
          output += "\\\\\n";
          let secondNumber = printLatexNumber(
            "-",
            printBitArray(valueB.getValueBeforeDecimal()),
            printBitArray(valueB.getValueAfterDecimal())
          );
          output += secondNumber;
        }

        output += `\\\\\n\\hline ${printLatexNumber(
          result.value?.isNegative ? "-" : "",
          printBitArray(result.value?.getValueBeforeDecimal()),
          printBitArray(result.value?.getValueAfterDecimal())
        )}`;

        output = `\\begin{alignedat}{3}\n${output}\n\\end{alignedat}`;
        return output;
      }

      return "";
    });
    onMounted(() => {
      watch(
        output,
        (value) => {
          nextTick(() => {
            if (mathoutput.value) {
              Katex.render(value, mathoutput.value, {
                displayMode: true,
                throwOnError: false,
                output: "html",
              });
            }
          });
        },
        {
          immediate: true,
        }
      );
    });

    return {
      mathoutput,
    };
  },
});
</script>

<style>
.katex .vlist-t2 .vlist-r:last-child {
  pointer-events: none;
}
</style>