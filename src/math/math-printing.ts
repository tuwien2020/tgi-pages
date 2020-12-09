import { BinaryNumber } from "./binary-number";
import { MathJson, MathJsonOperator } from "./MathJson";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

export interface MathFormattingOptions {
  bracketIds?: boolean;
}

export function useMathPrinting() {
  const mathJsonOperatorMap = new Map<MathJsonOperator, string>([
    ["not", "\\neg"],
    ["implies", "\\implies"],
    ["and", "\\land"],
    ["or", "\\lor"],
    ["xor", "\\mathbin{\\mathtt{xor}}"],
    ["nand", "\\mathbin{\\mathtt{nand}}"],
    ["nor", "\\mathbin{\\mathtt{nor}}"],
    ["equals", "\\Leftrightarrow"],

    ["add", "+"],
    ["subtract", "-"],
    ["multiply", "\\cdot"],
    ["divide", "\\div"],
  ]);

  function needsBrackets(ast: MathJson) {
    // For a correct implementation, you'd need to implement operator precedence...
    if (Array.isArray(ast) && ast.length == 3) {
      return true;
    } else {
      return false;
    }
  }

  function brackets(value: string, bracketIds: boolean | undefined) {
    if (bracketIds) {
      const bracketId = uuidv4();
      return `\\htmlData{bracketId=${bracketId}}{(}${value}\\htmlData{bracketId=${bracketId}}{)}`;
    } else {
      return `(${value})`;
    }
  }

  function toLatexRecursive(
    ast: MathJson,
    options?: MathFormattingOptions
  ): string {
    if (Array.isArray(ast)) {
      const op = mathJsonOperatorMap.get(ast[0]);
      if (!op) {
        throw new Error("Unknown operator " + ast);
      }

      if (ast.length == 0) {
        throw new Error("Not well formed AST tree " + ast);
      } else if (ast.length == 2) {
        let right = toLatexRecursive(ast[1], options);
        if (needsBrackets(ast[1])) {
          right = brackets(right, options?.bracketIds);
        }
        return `${op} ${right}`;
      } else if (ast.length == 3) {
        let left = toLatexRecursive(ast[1], options);
        if (needsBrackets(ast[1])) {
          left = brackets(left, options?.bracketIds);
        }
        let right = toLatexRecursive(ast[2], options);
        if (needsBrackets(ast[2])) {
          right = brackets(right, options?.bracketIds);
        }
        return `${left} ${op} ${right}`;
      } else {
        throw new Error("Not well formed AST tree " + ast);
      }
    } else if (ast === true) {
      return "\\mathtt{1}";
    } else if (ast === false) {
      return "\\mathtt{0}";
    } else if (typeof ast === "string") {
      return ast.replace(/^([^_]+)_([^]+)$/, "$1_{$2}");
    } else if (ast instanceof BinaryNumber) {
      return binaryNumberToLatex(ast);
    } else if (ast.kind == "number") {
      if (ast.base === 2) {
        const [beforeDecimal, afterDecimal] = ast.value.split(".");

        if (afterDecimal !== undefined && afterDecimal.length > 0) {
          return `\\mathtt{${splitIntoChunks(beforeDecimal ?? "", 4, true).join(
            "\\,"
          )}.${splitIntoChunks(afterDecimal ?? "", 4).join("\\,")}}`;
        } else {
          return `\\mathtt{${splitIntoChunks(beforeDecimal ?? "", 4, true).join(
            "\\,"
          )}}`;
        }
      } else {
        return ast.value;
      }
    } else {
      throw new Error("Unknown ast element " + ast);
    }
  }

  function splitIntoChunks(
    value: string,
    chunkSize: number,
    backwards: boolean = false
  ) {
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

  // TODO: Pass formatting options?
  function mathToLatex(
    value: { mathJson?: MathJson; error?: string },
    options?: MathFormattingOptions
  ): string {
    if (value.mathJson) {
      try {
        const output = toLatexRecursive(value.mathJson, options);
        return output;
      } catch (e) {
        value.error = "" + e;
      }
    }

    if (value.error) {
      // https://tex.stackexchange.com/a/34586
      let escaped = value.error
        .replace(/\\/g, "\\textbackslash")
        .replace(/[&%$#_{}]/g, "\\$&")
        .replace(/\[/g, "{[}")
        .replace(/\]/g, "{]}")
        .replace(/~/g, "{\\textasciitilde}")
        .replace(/\^/g, "{\\textasciicircum}")
        .replace(/[^\x00-\x7F]/g, function (c) {
          return `\\char"${c.codePointAt(0)!.toString(16)}`;
        });
      // TODO: Prevent KaTeX warnings when encountering Unicode symbols
      return `\\textcolor{red}{\\texttt{${escaped}}}`;
    }

    return "";
  }

  function binaryNumberToLatex(
    value: BinaryNumber,
    options?: {
      showSign?: "always" | "minus" | "never";
      zeroWidthDecimal?: boolean;
      groupZeros?: boolean;
    }
  ) {
    let printOptions = {
      showSign: "minus",
      zeroWidthDecimal: false,
      groupZeros: true,
      ...options,
    };

    const sign =
      printOptions.showSign === "never"
        ? ""
        : value.isNegative
        ? "-"
        : printOptions.showSign === "always"
        ? "+"
        : "";

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
      const decimalPoint = printOptions.zeroWidthDecimal
        ? "\\mathclap{\\raisebox{-0.1em}{.}}"
        : "\\mathtt{.}";

      output += decimalPoint + `\\mathtt{${afterDecimal}}`;
    }

    return output;
  }

  return {
    mathToLatex,
    binaryNumberToLatex,
  };
}
