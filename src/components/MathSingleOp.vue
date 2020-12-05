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
    const placesAfterDecimal = 7;

    const result = computed(() => {
      if (props.operator == "add") {
        return props.valueA.add(props.valueB);
      } else if (props.operator == "subtract") {
        return props.valueA.subtract(props.valueB);
      } else if (props.operator == "multiply") {
        return props.valueA.multiply(props.valueB);
      } else if (props.operator == "divide") {
        // TODO: Make the number of decimal places configureable
        let division = props.valueA.divide(props.valueB, placesAfterDecimal);
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

        const formatLatexNumber = (
          op: string,
          beforeDecimal: boolean[],
          afterDecimal: boolean[]
        ) =>
          `& \\texttt{${op}} & \\mathtt{${printBitArray(
            beforeDecimal
          )}} & \\mathtt{${
            afterDecimal.length > 0 ? "." + printBitArray(afterDecimal) : ""
          }} &`;

        // see binary-number.ts
        if (props.operator == "subtract") {
          valueB = valueB.setSign(!valueB.isNegative);
        }

        if (valueA.isNegative == valueB.isNegative) {
          // Addition
          let firstNumber = formatLatexNumber(
            "",
            valueA.getValueBeforeDecimal(),
            valueA.getValueAfterDecimal()
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
          let secondNumber = formatLatexNumber(
            "+",
            valueB.getValueBeforeDecimal(),
            valueB.getValueAfterDecimal()
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
          let firstNumber = formatLatexNumber(
            "",
            valueA.getValueBeforeDecimal(),
            valueA.getValueAfterDecimal()
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
          let secondNumber = formatLatexNumber(
            "-",
            valueB.getValueBeforeDecimal(),
            valueB.getValueAfterDecimal()
          );
          output += secondNumber;
        }

        output += `\\\\\n\\hline ${formatLatexNumber(
          result.value?.isNegative ? "-" : "",
          result.value?.getValueBeforeDecimal(),
          result.value?.getValueAfterDecimal()
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

        const formatLatexNumber = (
          op: string,
          beforeDecimal: boolean[],
          afterDecimal: boolean[]
        ) =>
          `\\texttt{\\mathllap{${op}}} \\mathtt{${printBitArray(
            beforeDecimal
          )} ${
            afterDecimal.length > 0
              ? "\\mathclap{\\raisebox{-0.1em}{.}}" +
                printBitArray(afterDecimal)
              : ""
          }}`;

        const phantomPadding = (value: number) =>
          `\\phantom{\\mathtt{${"0".repeat(value)}}}`;

        output += `& ${phantomPadding(requiredPadding)} ${formatLatexNumber(
          valueA.isNegative ? "-" : "",
          valueA.getValueBeforeDecimal(),
          valueA.getValueAfterDecimal()
        )} \\times ${formatLatexNumber(
          valueB.isNegative ? "-" : "",
          valueB.getValueBeforeDecimal(),
          valueB.getValueAfterDecimal()
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
        )} ${formatLatexNumber(
          result.value?.isNegative ? "-" : "",
          result.value?.getValueBeforeDecimal(),
          result.value?.getValueAfterDecimal()
        )}`;
        output = `\\def\\arraystretch{0.1}\n\\begin{alignedat}{1}\n${output}\n\\end{alignedat}`;
        return output;
      } else if (props.operator == "divide") {
        const formatLatexNumber = (
          op: string,
          beforeDecimal: boolean[],
          afterDecimal: boolean[]
        ) =>
          `\\texttt{\\mathllap{${op}}} \\mathtt{${printBitArray(
            beforeDecimal
          )} ${
            afterDecimal.length > 0
              ? "\\mathclap{\\raisebox{-0.1em}{.}}" +
                printBitArray(afterDecimal)
              : ""
          }}`;

        const phantomPadding = (value: number) =>
          `\\phantom{\\mathtt{${"0".repeat(value)}}}`;

        // TODO: Catch division by zero
        const result = props.valueA.divide(props.valueB, placesAfterDecimal);
        let valueA = props.valueA;
        let valueB = props.valueB;
        let output = "";

        output += `&${phantomPadding(1)} ${formatLatexNumber(
          valueA.isNegative ? "-" : "",
          valueA.getValueBeforeDecimal(),
          valueA.getValueAfterDecimal()
        )}  ${phantomPadding(2)} \\mathllap{\\div} ${phantomPadding(
          1
        )} ${formatLatexNumber(
          valueB.isNegative ? "-" : "",
          valueB.getValueBeforeDecimal(),
          valueB.getValueAfterDecimal()
        )} ${phantomPadding(2)} \\mathllap{=} ${phantomPadding(1)}`;

        // Binary division
        // Shift the decimal points away
        const maxDecimal = Math.max(valueA.decimalPoint, valueB.decimalPoint);
        const a = valueA.setSign(false).multiplyByPowerOfTwo(maxDecimal);
        const b = valueB
          .setSign(false)
          .multiplyByPowerOfTwo(maxDecimal)
          .trimZerosBeforeDecimal();

        if (b.value.length <= 0) {
          output += `\\text{Division by zero}`;
        } else {
          output += ` ${formatLatexNumber(
            result.result.isNegative ? "-" : "",
            result.result.getValueBeforeDecimal(),
            result.result.getValueAfterDecimal()
          )}\\\\\n`;

          // Copy of binary-number.ts
          let index = 0;
          const maxLength = a.value.length + placesAfterDecimal; // TODO: Configureable
          const resultBits = new Array<boolean>(maxLength).fill(false);
          let remainder = new BinaryNumber(false, [], 0);

          const printPadded = (
            value: string,
            valueLength: number,
            length: number
          ) =>
            `&${phantomPadding(
              Math.max(length - valueLength, 0)
            )} \\mathtt{${value}} \\\\\n`;

          while (!a.isZero() && index < maxLength) {
            // Pull down the next bit
            const newBit = index < a.value.length ? a.value[index] : false;
            remainder = new BinaryNumber(
              false,
              remainder.value.concat(newBit),
              0
            );

            const remainderToPrint = remainder
              .trimZerosBeforeDecimal()
              .extend(1);

            output += printPadded(
              printBitArray(remainderToPrint.value),
              remainderToPrint.value.length,
              1 + remainder.value.length
            );

            // If we can subtract, do so
            if (remainder.compareTo(b) >= 0) {
              remainder = remainder.subtract(b);
              resultBits[index] = true;

              const paddingDelta =
                remainderToPrint.value.length - b.value.length;

              output += printPadded(
                `\\mathllap{-}\\underline{${phantomPadding(
                  paddingDelta
                )}${printBitArray(b.value)}}`,
                remainderToPrint.value.length,
                1 + remainder.value.length
              );
            } else {
              resultBits[index] = false;
              output += printPadded(
                `\\mathllap{-}\\underline{${phantomPadding(
                  remainderToPrint.value.length - 1
                )}0}`,
                remainderToPrint.value.length,
                1 + remainder.value.length
              );
            }
            index += 1;
          }

          let remainderToPrint = result.remainder ?? [];

          output += printPadded(
            printBitArray(remainderToPrint) + `\\mathrlap{R}`,
            remainderToPrint.length,
            1 + remainder.value.length
          );
        }

        output = `\\def\\arraystretch{0.1}\n\\begin{alignedat}{2}\n${output}\n\\end{alignedat}`;
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
                trust: function (context) {
                  return context.command == "\\htmlStyle";
                },
                macros: {
                  "\\phantom":
                    "\\htmlStyle{color: transparent; user-select: none;}{#1}",
                },
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