<template>
  <div class="math-output" ref="mathoutput"></div>
</template>
<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed, shallowRef, PropType, onMounted, nextTick } from "vue";
import { BinaryNumber } from "../math/binary-number";
import { MathJson, MathJsonMathOperator } from "../math/MathJson";
import { useMathPrinting } from "../math/math-printing";
import Katex from "katex";

function useMathWithStepsPrinting() {
  const mathPrinting = useMathPrinting();

  function bitArray(value: readonly boolean[] | undefined) {
    return (value ?? []).map((v) => (v ? "1" : "0")).join("");
  }

  function pad(value: number) {
    return `\\phantom{\\mathtt{${"0".repeat(value)}}}`;
  }

  function calculationToLatex(
    valueA: BinaryNumber,
    valueB: BinaryNumber,
    operator: MathJsonMathOperator,
    options?: {
      placesAfterDecimal?: number;
    }
  ) {
    const placesAfterDecimal = options?.placesAfterDecimal ?? 0;

    if (operator == "add" || operator == "subtract") {
      const result = operator == "add" ? valueA.add(valueB) : valueA.subtract(valueB);

      let output = "";

      const formatLatexNumber = (op: string, value: BinaryNumber) =>
        `& \\texttt{${op}} & \\mathtt{${bitArray(value.getValueBeforeDecimal())}} & \\mathtt{${
          value.decimalPoint > 0 ? "." + bitArray(value.getValueAfterDecimal()) : ""
        }} &`;

      // see binary-number.ts
      if (operator == "subtract") {
        valueB = valueB.setSign(!valueB.isNegative);
      }

      if (valueA.isNegative == valueB.isNegative) {
        // Addition
        let firstNumber = formatLatexNumber("", valueA);
        if (result.isNegative) {
          // Slap a minus sign around the operation
          firstNumber = `\\smash{\\raisebox{-0.75em}{$-\\Bigg($}}` + firstNumber + `\\smash{\\raisebox{-0.75em}{$\\Bigg)$}}`;
        }
        output += firstNumber;
        output += "\\\\\n";
        let secondNumber = formatLatexNumber("+", valueB);
        output += secondNumber;
      } else {
        // Subtraction
        const comparison = valueA.setSign(false).compareTo(valueB.setSign(false));
        if (comparison < 0) {
          const temp = valueA;
          valueA = valueB;
          valueB = temp;
        }
        let firstNumber = formatLatexNumber("", valueA);
        if (result.isNegative) {
          // Slap a minus sign around the operation
          firstNumber = `\\smash{\\raisebox{-0.75em}{$-\\Bigg($}}` + firstNumber + `\\smash{\\raisebox{-0.75em}{$\\Bigg)$}}`;
        }
        output += firstNumber;
        output += "\\\\\n";
        let secondNumber = formatLatexNumber("-", valueB);
        output += secondNumber;
      }

      output += `\\\\\n\\hline ${formatLatexNumber(result.isNegative ? "-" : "", result)}`;

      output = `\\begin{alignedat}{3}\n${output}\n\\end{alignedat}`;
      return output;
    } else if (operator == "multiply") {
      const result = valueA.multiply(valueB);
      let output = "";

      const lastLineLength = valueA.value.length + valueB.value.length - 1;
      const resultLength = result.value.length ?? 0;

      const requiredPadding = resultLength > lastLineLength ? resultLength - lastLineLength : 0;

      output += `& ${pad(requiredPadding)} ${mathPrinting.binaryNumberToLatex(valueA, {
        zeroWidthDecimal: true,
        groupZeros: false,
      })} \\times ${mathPrinting.binaryNumberToLatex(valueB, {
        zeroWidthDecimal: true,
        groupZeros: false,
      })} \\\\\n`;

      output += `\\hline \\\\\n`;

      // Additions
      let extraZeros = 0;
      for (let i = 0; i < valueB.value.length; i++) {
        const bitB = valueB.value[i];
        if (bitB) {
          output += `&${pad(i - extraZeros + requiredPadding)} \\mathtt{${"0".repeat(extraZeros)} ${bitArray(valueA.value)}} \\\\\n`;
          extraZeros = 0;
        } else {
          extraZeros++;
        }
      }

      // If the last line is "missing", add it
      if (extraZeros) {
        extraZeros--;
        output += `&${pad(valueB.value.length - 1 - extraZeros + requiredPadding)} \\mathtt{${"0".repeat(extraZeros + valueA.value.length)}} \\\\\n`;
      }

      output += `\\hline \\\\\n`;

      // Result
      output += `&${pad(lastLineLength - resultLength + requiredPadding)} ${mathPrinting.binaryNumberToLatex(result, {
        zeroWidthDecimal: true,
        groupZeros: false,
      })}`;
      output = `\\def\\arraystretch{0.1}\n\\begin{alignedat}{1}\n${output}\n\\end{alignedat}`;
      return output;
    } else if (operator == "divide") {
      // TODO: Stop after finding a value = 0
      const result = valueA.divide(valueB, placesAfterDecimal);
      let output = "";

      output += `&${pad(1)} ${mathPrinting.binaryNumberToLatex(valueA, {
        zeroWidthDecimal: true,
        groupZeros: false,
      })} ${pad(2)} \\mathllap{\\div} ${pad(1)} ${mathPrinting.binaryNumberToLatex(valueB, {
        zeroWidthDecimal: true,
        groupZeros: false,
      })} ${pad(2)} \\mathllap{=} ${pad(1)}`;

      // Binary division
      // Shift the decimal points away
      const maxDecimal = Math.max(valueA.decimalPoint, valueB.decimalPoint);
      const a = valueA.setSign(false).multiplyByPowerOfTwo(maxDecimal);
      const b = valueB.setSign(false).multiplyByPowerOfTwo(maxDecimal).trimZerosBeforeDecimal();

      if (b.value.length <= 0) {
        output += `\\text{Division by zero}`;
      } else {
        // Pretty print the result
        const remainderIsZero = new BinaryNumber(false, result.remainder, 0).isZero();
        output += ` ${mathPrinting.binaryNumberToLatex(result.result)} ${remainderIsZero ? "" : "..."}\\\\\n`;

        // Copy of binary-number.ts
        let index = 0;
        const maxLength = a.value.length + placesAfterDecimal; // TODO: Configureable
        const resultBits = new Array<boolean>(maxLength).fill(false);
        let remainder = new BinaryNumber(false, [], 0);

        const printPadded = (value: string, valueLength: number, length: number) =>
          `&${pad(Math.max(length - valueLength, 0))} \\mathtt{${value}} \\\\\n`;

        while (!a.isZero() && index < maxLength) {
          // Pull down the next bit
          const newBit = index < a.value.length ? a.value[index] : false;
          remainder = new BinaryNumber(false, remainder.value.concat(newBit), 0);

          const remainderToPrint = remainder.trimZerosBeforeDecimal().extend(1);

          output += printPadded(bitArray(remainderToPrint.value), remainderToPrint.value.length, 1 + remainder.value.length);

          // If we can subtract, do so
          if (remainder.compareTo(b) >= 0) {
            remainder = remainder.subtract(b);
            resultBits[index] = true;

            const paddingDelta = remainderToPrint.value.length - b.value.length;

            output += printPadded(
              `\\mathllap{-}\\underline{${pad(paddingDelta)}${bitArray(b.value)}}`,
              remainderToPrint.value.length,
              1 + remainder.value.length
            );
          } else {
            resultBits[index] = false;
            output += printPadded(
              `\\mathllap{-}\\underline{${pad(remainderToPrint.value.length - 1)}0}`,
              remainderToPrint.value.length,
              1 + remainder.value.length
            );
          }
          index += 1;
        }

        let remainderToPrint = new BinaryNumber(false, result.remainder ?? [], 0).trimZerosBeforeDecimal().extend(1);

        output += printPadded(bitArray(remainderToPrint.value) + `\\mathrlap{R}`, remainderToPrint.value.length, 1 + remainder.value.length);
      }

      output = `\\def\\arraystretch{0.1}\n\\begin{alignedat}{2}\n${output}\n\\end{alignedat}`;
      return output;
    }

    return "";
  }

  return {
    calculationToLatex,
  };
}

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
    const placesAfterDecimal = ref(7);
    const mathPrinting = useMathWithStepsPrinting();

    function printBitArray(value: readonly boolean[] | undefined) {
      return (value ?? []).map((v) => (v ? "1" : "0")).join("");
    }

    const output = computed(() =>
      mathPrinting.calculationToLatex(props.valueA, props.valueB, props.operator, {
        placesAfterDecimal: placesAfterDecimal.value,
      })
    );

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
                  "\\phantom": "\\htmlStyle{color: transparent; user-select: none;}{#1}",
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