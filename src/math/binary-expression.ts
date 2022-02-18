import { BinaryNumber, IEEENumber } from "./binary-number";
import { MathJson, MathJsonMathOperator } from "./math-parsing";

interface BinaryNumberPrintingOptions {
  showSign?: "always" | "minus" | "never";
  zeroWidthDecimal?: boolean;
  groupZeros?: boolean;
}

export function useBinaryExpressions(opts?: BinaryNumberPrintingOptions) {
  function extractGetters(ast: MathJson<BinaryNumber>) {
    const getters = new Set<string>();

    function extractGettersRecursive(ast: MathJson<BinaryNumber>) {
      if (Array.isArray(ast)) {
        const [functionName, ...args] = ast;
        for (let i = 0; i < args.length; i++) {
          extractGettersRecursive(args[i]);
        }
      } else if (typeof ast === "string") {
        getters.add(ast);
      }
    }
    extractGettersRecursive(ast);

    return getters;
  }

  function transformIEEE(ast: MathJson, binaryOperation: number): MathJson<IEEENumber> {
    if (Array.isArray(ast)) {
      const [functionName, ...args] = ast;
      if (functionName === "Plus") {
        // Plus should be ignored
        if (args.length != 1) {
          return ["Error", `Invalid MathJson ${ast}`];
        } else {
          return transformIEEE(args[0], binaryOperation);
        }
      } else if (functionName === "Negate") {
        // Negate should put a minus sign in front of the number
        if (args.length != 1) {
          return ["Error", `Invalid MathJson ${ast}`];
        } else {
          const value = transformIEEE(args[0], binaryOperation);
          if (value instanceof IEEENumber) {
            return value.setSign(!value.isNegative);
          } else {
            return value;
          }
        }
      } else if (mathJsonOperatorMap.has(functionName as MathJsonMathOperator)) {
        return [functionName, ...args.map((v) => transformIEEE(v, binaryOperation))];
      } else if (functionName === "Error") {
        return [functionName, ...args.map((v) => "" + v)];
      } else {
        return ["Error", `Unknown function ${functionName}`];
      }
    } else if (typeof ast === "string") {
      return ["Error", `Variables not supported ${ast}`];
    } else if (ast?.type === "number") {
      return stringToIEEENumber(ast.value, binaryOperation) ?? ["Error", `Expected a binary number in the IEEE-format (${binaryOperation} bit): ${ast.value}`];
    } else {
      return ["Error", `Expected binary number: ${JSON.stringify(ast)}`];
    }
  }

  function transform(ast: MathJson): MathJson<BinaryNumber> {
    if (Array.isArray(ast)) {
      const [functionName, ...args] = ast;
      if (functionName === "Plus") {
        // Plus should be ignored
        if (args.length != 1) {
          return ["Error", `Invalid MathJson ${ast}`];
        } else {
          return transform(args[0]);
        }
      } else if (functionName === "Negate") {
        // Negate should put a minus sign in front of the number
        if (args.length != 1) {
          return ["Error", `Invalid MathJson ${ast}`];
        } else {
          const value = transform(args[0]);
          if (value instanceof BinaryNumber) {
            return value.setSign(!value.isNegative);
          } else {
            return value;
          }
        }
      } else if (mathJsonOperatorMap.has(functionName as MathJsonMathOperator)) {
        return [functionName, ...args.map((v) => transform(v))];
      } else if (functionName === "Error") {
        return [functionName, ...args.map((v) => "" + v)];
      } else {
        return ["Error", `Unknown function ${functionName}`];
      }
    } else if (typeof ast === "string") {
      return ["Error", `Variables not supported ${ast}`];
    } else if (ast?.type === "number") {
      return stringToBinaryNumber(ast.value) ?? ["Error", `Expected a binary number: ${ast.value}`];
    } else {
      return ["Error", `Expected binary number: ${JSON.stringify(ast)}`];
    }
  }

  function customPrinter(value: MathJson<BinaryNumber> | MathJson<IEEENumber>): string | null {
    if (value instanceof BinaryNumber) {
      return binaryNumberToLatex(value, opts);
    } else if (value instanceof IEEENumber) {
      return IEEENumberToLatex(value, opts);
    } else {
      return null;
    }
  }

  function stringToIEEENumber(value: string, binaryOperation: number) : IEEENumber | null {
    const binaryNumberRegex = `^([0-1])\s?([0-1]{${IEEENumber.getExponentSize(binaryOperation)}})\s?`+
    `([0-1]{${binaryOperation - 1 - IEEENumber.getExponentSize(binaryOperation)}})([0-1])?([0-1])?([0-1])?$`

    const r = new RegExp(binaryNumberRegex);
    const matchResults = (value ?? "").match(r);
    if (matchResults === null) return null;

    const [_, sign, exponent, mantissa, guardBit, roundBit, stickyBit] = matchResults;

    return new IEEENumber(
      sign === "1",
      exponent.split("").map((v) => (v === "0" ? false : true)),
      mantissa.split("").map((v) => (v === "0" ? false : true)),
      [!exponent.split("").every(v => v === "0")],
      guardBit === "1",
      roundBit === "1",
      stickyBit === "1",
      exponent.split("").every((v) => (v === "0")));
  }

  function stringToBinaryNumber(value: string): BinaryNumber | null {
    const binaryNumberRegex = /^([+-])?([0-1]+)([.,]([0-1]+))?$/;

    const matchResults = (value ?? "").match(binaryNumberRegex);
    if (matchResults === null) return null;

    const [_, sign, numberValue, __, fractionalPart] = matchResults;

    return new BinaryNumber(
      sign === "-",
      ((numberValue ?? "") + (fractionalPart ?? "")).split("").map((v) => (v === "0" ? false : true)),
      fractionalPart?.length ?? 0
    );
  }

  function IEEENumberToLatex(value: IEEENumber, options?: BinaryNumberPrintingOptions) {
    let printOptions = {
      showSign: "minus",
      zeroWidthDecimal: false,
      groupZeros: false,
      ...options,
    };

    // TODO: Currently unused, we could deprecate/remove the showSign option
    const sign = printOptions.showSign === "never" ? "" : value.isNegative ? "-" : printOptions.showSign === "always" ? "+" : "";

    if (value.isZero()) {
      return "\\mathtt{0}";
    } else if (value.isInfinity()) {
      return `${sign}\\mathtt{\\infty}`;
    }

    let places = value.value
      .map((v) => (v ? "1" : "0"))
      .join("");
    
    let text = "\\mathtt{" + (value.isNegative ? "1" : "0") + "\\," + (value.exponent.map((v) => (v ? "1" : "0")).join("")) + 
      "\\,}\\color{grey}"+(value.isNormalized ? "0" : "1")+"\\color{black}\\mathtt{\\,}";

    if (printOptions.groupZeros) {
      places = splitIntoChunks(places, 4, true).join("\\,");
    }
    
    let output = text + `\\mathtt{${places}}`;

    return output;
  }

  function binaryNumberToLatex(value: BinaryNumber, options?: BinaryNumberPrintingOptions) {
    let printOptions = {
      showSign: "minus",
      zeroWidthDecimal: false,
      groupZeros: true,
      ...options,
    };

    // TODO: Currently unused, we could deprecate/remove the showSign option
    const sign = printOptions.showSign === "never" ? "" : value.isNegative ? "-" : printOptions.showSign === "always" ? "+" : "";

    let beforeDecimal = value
      .getValueBeforeDecimal()
      .map((v) => (v ? "1" : "0"))
      .join("");

    let afterDecimal = value
      .getValueAfterDecimal()
      .map((v) => (v ? "1" : "0"))
      .join("");

    if (printOptions.groupZeros) {
      beforeDecimal = splitIntoChunks(beforeDecimal, 4, true).join("\\,");
      afterDecimal = splitIntoChunks(afterDecimal, 4, false).join("\\,");
    }
    
    let output = `\\texttt{\\mathllap{${sign}}}` + `\\mathtt{${beforeDecimal}}`;

    if (afterDecimal !== undefined && afterDecimal.length > 0) {
      const decimalPoint = printOptions.zeroWidthDecimal ? "\\mathclap{\\raisebox{-0.1em}{.}}" : "\\mathtt{.}";

      output += decimalPoint + `\\mathtt{${afterDecimal}}`;
    }

    return output;
  }

  function splitIntoChunks(value: string, chunkSize: number, backwards: boolean = false) {
    const chunkCount = Math.ceil(value.length / chunkSize);
    const chunks = new Array(chunkCount);

    // If we have 100 and want the first block to be 4 bits long, we have to shift by -1
    const nextLargestMultiple = chunkCount * chunkSize;
    const startOffset = backwards ? value.length - nextLargestMultiple : 0;

    for (let i = 0; i < chunks.length; i++) {
      const position = i * chunkSize + startOffset;
      chunks[i] = value.substring(position, position + chunkSize);
    }

    return chunks;
  }

  const mathJsonOperatorMap = new Set<MathJsonMathOperator>(["Add", "Subtract", "Multiply", "Divide", "Power", "Equal", "Negate", "Plus"]);

  return {
    extractGetters,
    transform,
    transformIEEE,
    customPrinter,
    binaryNumberToLatex,
    IEEENumberToLatex,
  };
}
