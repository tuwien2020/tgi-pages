import { BinaryNumber } from "./binary-number";
import { MathJson, MathJsonOperator } from "./MathJson";

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

  function toLatexRecursive(ast: MathJson): string {
    if (Array.isArray(ast)) {
      const op = mathJsonOperatorMap.get(ast[0]);
      if (!op) {
        throw new Error("Unknown operator " + ast);
      }

      if (ast.length == 0) {
        throw new Error("Not well formed AST tree " + ast);
      } else if (ast.length == 2) {
        let right = toLatexRecursive(ast[1]);
        if (needsBrackets(ast[1])) {
          right = `(${right})`;
        }
        return `${op} ${right}`;
      } else if (ast.length == 3) {
        let left = toLatexRecursive(ast[1]);
        if (needsBrackets(ast[1])) {
          left = `(${left})`;
        }
        let right = toLatexRecursive(ast[2]);
        if (needsBrackets(ast[2])) {
          right = `(${right})`;
        }
        return `${left} ${op} ${right}`; // TODO:
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
      return `\\mathtt{${ast.isNegative ? "-" : ""}${splitIntoChunks(
        ast.value.map((v) => (v ? "1" : "0")).join(""),
        4,
        true
      ).join("\\,")}}`;
    } else if (ast.kind == "number") {
      if (ast.base === 2) {
        const [beforeComma, afterComma] = ast.value.split(".");

        if (afterComma !== undefined) {
          return `\\mathtt{${splitIntoChunks(beforeComma ?? "", 4, true).join(
            "\\,"
          )}.${splitIntoChunks(afterComma ?? "", 4).join("\\,")}}`;
        } else {
          return `\\mathtt{${splitIntoChunks(beforeComma ?? "", 4, true).join(
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

  function mathToLatex(value: { mathJson?: MathJson; error?: string }): string {
    if (value.mathJson) {
      try {
        const output = toLatexRecursive(value.mathJson);
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

  return {
    mathToLatex,
  };
}
