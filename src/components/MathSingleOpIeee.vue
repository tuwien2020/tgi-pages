<template>
  <math-output :latex="value"></math-output>
</template>
<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { BinaryNumber, IEEENumber, arraysEqual } from "../math/binary-number";
import { MathJsonMathOperator } from "../math/math-parsing";
import { useMathPrinting } from "../math/math-printing";
import { useBinaryExpressions } from "../math/binary-expression";
import MathOutput from "./MathOutput.vue";

function useMathWithStepsPrinting() {
  const binaryExpression = useBinaryExpressions();

  function bitArray(value: readonly boolean[] | undefined): string {
    return (value ?? []).map((v) => (v ? "1" : "0")).join("");
  }

  function pad(value: number) {
    return `\\phantom{\\mathtt{${"0".repeat(value)}}}`;
  }

  function formatMultiplyNumbers(valueA: BinaryNumber, valueB: BinaryNumber, mantissaSize: number): string {
    const result = valueA.multiply(valueB);
    let output = "";

    const lastLineLength = valueA.value.length + valueB.value.length - 1;
    const resultLength = result.value.length ?? 0;

    const requiredPadding = resultLength > lastLineLength ? resultLength - lastLineLength : 0;

    output += `& ${pad(requiredPadding)} ${binaryExpression.binaryNumberToLatex(valueA, {
      zeroWidthDecimal: true,
      groupZeros: false,
    })} \\times ${binaryExpression.binaryNumberToLatex(valueB, {
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
    output += `&${pad(lastLineLength - resultLength + requiredPadding)} ${binaryExpression.binaryNumberToLatex(
      new BinaryNumber(false, result.value.slice(0, resultLength - (mantissaSize + 3) + 1), 0),
      {
        zeroWidthDecimal: true,
        groupZeros: false,
      }
    )}\\color{lightgrey}${binaryExpression.binaryNumberToLatex(
      new BinaryNumber(false, result.value.slice(resultLength - (mantissaSize + 3) + 1), 0),
      {
        zeroWidthDecimal: true,
        groupZeros: false,
      }
    )}`;
    output = `\\def\\arraystretch{0.1}\n\\begin{alignedat}{1}\n${output}\n\\end{alignedat}`;
    return output;
  }

  function calculationToLatex(valueA: IEEENumber, valueB: IEEENumber, operator: MathJsonMathOperator, mantissaSize: number, eValue: number) {
    // format IEEENumber to latex-viewable number
    // empaphizeExponent greys out everything except the exponent
    // empaphizeRounding greys out everything except the mantissa and the rounding bits
    const formatMantissaOnlyLatexNumber = (op: string, value: BinaryNumber) => `& \\texttt{${op}} & \\mathtt{${bitArray(value.value)}}`;
    const formatLatexNumber = (op: string, value: IEEENumber, empaphizeExponent: boolean = false, empaphizeRounding: boolean = false) =>
      `& \\texttt{${op}} & ${empaphizeExponent || empaphizeRounding ? "\\color{lightgrey}" : ""}\\mathtt{${value.isNegative ? "1" : "0"}\\,}` +
      `${empaphizeExponent ? "\\color{defaultcolor}" : ""}\\mathtt{${bitArray(value.exponent)}\\,}\\color{lightgrey}` +
      `\\mathtt{${bitArray(value.implicit)}}` +
      `& ${empaphizeExponent || empaphizeRounding ? "" : "\\color{defaultcolor}"} & \\mathtt{\\,} & \\mathtt{${bitArray(value.value)}\\, ${
        (value.guardBit ? "1" : "0") + (value.roundBit ? "1" : "0") + (value.stickyBit ? "1" : "0")
      }}`;

    if (operator === "Add" || operator === "Subtract") {
      let result = operator == "Add" ? valueA.add(valueB, mantissaSize) : valueA.subtract(valueB, mantissaSize);

      let outputs = [];

      // see binary-number.ts
      if (operator === "Subtract") {
        valueB = valueB.negate();
      }

      outputs[0] = "\\color{green}\\texttt{1. Exponenten gleichsetzen, Mantissen verschieben:}\\color{defaultcolor}";
      const numbers = valueA.normalizeExpression(valueB);

      if (arraysEqual(numbers[0].exponent, valueA.exponent) && !arraysEqual(numbers[0].exponent, valueB.exponent)) {
        outputs[1] = formatLatexNumber("", valueB, true);
        outputs[1] += "\\color{defaultcolor}\\texttt{ => }";
        outputs[1] += formatLatexNumber("", valueA.compareTo(numbers[0]) === 0 ? numbers[1] : numbers[0], true);
      } else if (arraysEqual(numbers[0].exponent, valueB.exponent) && !arraysEqual(numbers[0].exponent, valueA.exponent)) {
        outputs[1] = formatLatexNumber("", valueA, true);
        outputs[1] += "\\color{defaultcolor}\\texttt{ => }";
        outputs[1] += formatLatexNumber("", valueB.compareTo(numbers[0]) === 0 ? numbers[1] : numbers[0], true);
      } else {
        outputs[1] = formatLatexNumber("", valueB, true);
        outputs[1] += "\\color{defaultcolor}\\texttt{ => }";
        outputs[1] += formatLatexNumber("", valueA.compareTo(numbers[0]) === 0 ? numbers[1] : numbers[0], true);
      }

      outputs[2] = `\\color{green}\\texttt{2. Mantissen ${operator === "Add" ? "addieren" : "subtrahieren"} und verschieben:}\\color{defaultcolor}`;
      outputs[3] = "";
      if (valueA.isNegative == valueB.isNegative) {
        // Addition
        let firstNumber = formatMantissaOnlyLatexNumber("", BinaryNumber.fromIEEENumber(numbers[0], false));
        outputs[3] += firstNumber;
        outputs[3] += "\\\\\n";
        let secondNumber = formatMantissaOnlyLatexNumber("+", BinaryNumber.fromIEEENumber(numbers[1], false));
        outputs[3] += secondNumber;
      } else {
        // Subtraction
        let firstNumber = formatMantissaOnlyLatexNumber("", BinaryNumber.fromIEEENumber(numbers[1], false));
        outputs[3] += firstNumber;
        outputs[3] += "\\\\\n";
        let secondNumber = formatMantissaOnlyLatexNumber("-", BinaryNumber.fromIEEENumber(numbers[0], false));
        outputs[3] += secondNumber;
      }
      outputs[3] += `\\\\\n\\hline ${formatMantissaOnlyLatexNumber("", BinaryNumber.fromIEEENumber(result, false))}`;
      outputs[4] = "";
      outputs[4] += formatLatexNumber("", result);
      outputs[4] += "\\color{defaultcolor}\\texttt{ => }";
      outputs[4] += formatLatexNumber("", result.normalizeMantissa(mantissaSize));
      result = result.normalizeMantissa(mantissaSize);

      outputs[5] = `\\color{green}\\texttt{3. Runden und eventuell erneut normalisieren:}\\color{defaultcolor}`;
      outputs[6] = "";
      outputs[6] += formatLatexNumber("", result, false, true);
      outputs[6] += "\\color{defaultcolor}\\texttt{ => }";
      outputs[6] += formatLatexNumber("", result.round(mantissaSize), false, true);
      result = result.round(mantissaSize);

      outputs[1] = `\\begin{aligned}{}\n${outputs[1].replaceAll("&", "")}\n\\end{aligned}`;
      outputs[3] = `\\begin{alignedat}{4}\n${outputs[3]}\n\\end{alignedat}`;
      outputs[4] = `\\begin{alignedat}{6}\n${outputs[4]}\n\\end{alignedat}`;
      outputs[6] = `\\begin{alignedat}{6}\n${outputs[6]}\n\\end{alignedat}`;
      let output = outputs.join("\\\\");

      output += `\\\\ => \\begin{alignedat}{6}\n${formatLatexNumber("", result.normalizeMantissa(mantissaSize))}\n\\end{alignedat}`;

      console.log(output);

      return output;
    } else if (operator === "Multiply") {
      let result = valueA.multiply(valueB, eValue, mantissaSize);

      let outputs = [];

      outputs[0] = "\\color{green}\\texttt{1. Exponenten addieren, Mantissen multiplizieren:}\\color{defaultcolor}";
      outputs[1] = "";
      let fomratBinaryNumber = (op: string, value: boolean[]) => `& \\texttt{${op}} & \\mathtt{${value.map((v) => (v ? "1" : "0")).join("")}} &`;
      let firstNumber = fomratBinaryNumber("", valueA.exponent);
      outputs[1] += firstNumber;
      outputs[1] += "\\\\\n";
      let secondNumber = fomratBinaryNumber("+", valueB.exponent);
      outputs[1] += secondNumber;
      outputs[1] += "\\\\\n";
      let thirdNumber = fomratBinaryNumber("-", BinaryNumber.fromDecimal(eValue).value as boolean[]);
      outputs[1] += thirdNumber;
      outputs[1] += `\\\\\n\\hline ${fomratBinaryNumber("", result.exponent)}`;

      outputs[2] = formatMultiplyNumbers(
        BinaryNumber.fromIEEENumber(valueA).setSign(false),
        BinaryNumber.fromIEEENumber(valueB).setSign(false),
        mantissaSize
      );

      outputs[3] = `\\color{green}\\texttt{2. Normalisieren:}\\color{defaultcolor}`;
      outputs[4] = "";
      outputs[4] += formatLatexNumber(
        "",
        new IEEENumber(
          result.isNegative,
          result.exponent,
          result.value.slice(1),
          result.implicit,
          result.guardBit,
          result.roundBit,
          result.stickyBit,
          result.isNormalized
        )
      );
      outputs[4] += "\\color{defaultcolor}\\texttt{ => }";
      outputs[4] += formatLatexNumber("", result.normalizeMantissa(mantissaSize));
      result = result.normalizeMantissa(mantissaSize);
      outputs[5] = `\\color{green}\\texttt{3. Runden und eventuell erneut normalisieren:}\\color{defaultcolor}`;
      outputs[6] = "";
      outputs[6] += formatLatexNumber("", result, false, true);
      outputs[6] += "\\color{defaultcolor}\\texttt{ => }";
      outputs[6] += formatLatexNumber("", result.normalizeMantissa(mantissaSize).round(mantissaSize), false, true);

      outputs[1] = `\\begin{alignedat}{4}\n${outputs[1]}\n\\end{alignedat}`;
      outputs[4] = `\\begin{alignedat}{6}\n${outputs[4]}\n\\end{alignedat}`;
      outputs[6] = `\\begin{alignedat}{6}\n${outputs[6]}\n\\end{alignedat}`;
      let output = outputs.join("\\\\");
      output += `\\\\ => \\begin{alignedat}{6}\n${formatLatexNumber("", result.normalizeMantissa(mantissaSize))}\n\\end{alignedat}`;

      return output;
    }

    return "";
  }

  return {
    calculationToLatex,
  };
}

export default defineComponent({
  components: { MathOutput },
  props: {
    valueA: {
      type: Object as PropType<IEEENumber>,
      default: () => new IEEENumber(false, [], [], []),
    },

    valueB: {
      type: Object as PropType<IEEENumber>,
      default: () => new IEEENumber(false, [], [], []),
    },
    operator: {
      type: String as PropType<MathJsonMathOperator>,
      default: () => "plus" as MathJsonMathOperator,
    },
    mantissaSize: {
      type: Number,
      default: () => 11,
    },
    eValue: {
      type: Number,
      default: () => 15,
    },
  },
  setup(props, context) {
    const mathPrinting = useMathWithStepsPrinting();

    const output = computed(() => mathPrinting.calculationToLatex(props.valueA, props.valueB, props.operator, props.mantissaSize, props.eValue));

    return {
      value: output,
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
