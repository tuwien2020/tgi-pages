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

    const result = computed(() => {
      if (props.operator == "add") {
        return props.valueA.add(props.valueB);
      } else if (props.operator == "subtract") {
        return props.valueA.subtract(props.valueB);
      } else if (props.operator == "multiply") {
        return props.valueA.multiply(props.valueB);
      } else if (props.operator == "divide") {
        // TODO: Make the number of decimal places configureable
        let division = props.valueA.divide(props.valueB, 5);
        return division.result;
      } else {
        return new BinaryNumber(false, [], 0);
      }
    });

    function printBitArray(value: readonly boolean[] | undefined) {
      return (value ?? []).map((v) => (v ? "1" : "0")).join("");
    }

    const output = computed(() => {
      if (props.operator == "add" || props.operator == "subtract") {
        let valueA = props.valueA;
        let valueB = props.valueB;
        let output = "";

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
      } else if (props.operator == "multiply") {
        let valueA = props.valueA;
        let valueB = props.valueB;
        let output = "";

        const lastLineLength = valueA.value.length + valueB.value.length - 1;
        const resultLength = result.value?.value?.length ?? 0;

        const requiredPadding =
          resultLength > lastLineLength ? resultLength - lastLineLength : 0;

        const printLatexNumber = (
          op: string,
          beforeDecimal: string,
          afterDecimal: string
        ) =>
          `\\mathtt{\\llap{${op}} ${beforeDecimal} ${
            afterDecimal.length > 0
              ? "\\clap{\\raisebox{-0.1em}{.}}" + afterDecimal
              : ""
          }}`;

        const phantomPadding = (value: number) =>
          `\\phantom{\\mathtt{${"0".repeat(value)}}}`;

        output += `& ${phantomPadding(requiredPadding)} ${printLatexNumber(
          valueA.isNegative ? "-" : "",
          printBitArray(valueA.getValueBeforeDecimal()),
          printBitArray(valueA.getValueAfterDecimal())
        )} \\times ${printLatexNumber(
          valueB.isNegative ? "-" : "",
          printBitArray(valueB.getValueBeforeDecimal()),
          printBitArray(valueB.getValueAfterDecimal())
        )} \\\\\n`;

        output += `\\hline \\\\\n`;

        // Additions
        const aBits = `\\mathtt{${printBitArray(valueA.value)}}`;

        let extraZeros = 0;
        for (let i = 0; i < valueB.value.length; i++) {
          const bitB = valueB.value[i];
          if (bitB) {
            output += `&${phantomPadding(
              i - extraZeros + requiredPadding
            )} \\mathtt{${"0".repeat(extraZeros)}} ${aBits} \\\\\n`;
            extraZeros = 0;
          } else {
            extraZeros++;
          }
        }

        // If the last line is "missing", add it
        if (extraZeros) {
          extraZeros--;
          output += `&${phantomPadding(
            valueB.value.length - 1 - extraZeros + requiredPadding
          )} \\mathtt{${"0".repeat(extraZeros + valueA.value.length)}} \\\\\n`;
        }

        output += `\\hline \\\\\n`;

        // Result

        output += `&${phantomPadding(
          lastLineLength - resultLength + requiredPadding
        )} ${printLatexNumber(
          result.value?.isNegative ? "-" : "",
          printBitArray(result.value?.getValueBeforeDecimal()),
          printBitArray(result.value?.getValueAfterDecimal())
        )}`;
        output = `\\def\\arraystretch{0.1}\n\\begin{alignedat}{1}\n${output}\n\\end{alignedat}`;
        return output;
      } else if (props.operator == "divide") {
        return (
          (result.value?.isNegative ? "-" : "") +
          printBitArray(result.value?.getValueBeforeDecimal()) +
          "." +
          printBitArray(result.value?.getValueAfterDecimal())
        );
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
.katex .vlist-s {
  pointer-events: none;
  user-select: none;
}
</style>