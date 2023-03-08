import { MathJson, MathJsonOperator } from "./math-parsing";

export interface MathFormattingOptions {
  bracketIds?: boolean;
  customPrinter?: (value: MathJson<any>) => string | null;
}

export function useMathPrinting() {
  const mathJsonOperatorMap = new Map<MathJsonOperator, (expression: [MathJsonOperator, ...MathJson[]]) => string>([
    ["Not", () => "\\neg"],
    ["Implies", () => "\\implies"],
    ["And", () => "\\land"],
    ["Or", () => "\\lor"],
    ["Xor", () => "\\mathbin{\\mathtt{xor}}"],
    ["Nand", () => "\\mathbin{\\mathtt{nand}}"],
    ["Nor", () => "\\mathbin{\\mathtt{nor}}"],
    ["Equal", () => "\\Leftrightarrow"],

    ["Add", () => "+"],
    ["Subtract", () => "-"],
    ["Multiply", () => "\\cdot"],
    ["Divide", () => "\\div"],
    ["Subset", () => "\\subset"],
    ["Negate", () => "-"],
    ["Plus", () => "+"],
    ["Power", () => "^"],
    [
      "Error",
      (v) => {
        const escaped = (v[1] + "")
          .replace(/\\/g, "\\textbackslash")
          .replace(/[&%$#_{}]/g, "\\$&")
          .replace(/\[/g, "{[}")
          .replace(/\]/g, "{]}")
          .replace(/~/g, "{\\textasciitilde}")
          .replace(/\^/g, "{\\textasciicircum}")
          .replace(/[^\x00-\x7F]/g, (c) => `\\char"${c.codePointAt(0)!.toString(16)}`);
        // TODO: Prevent KaTeX warnings when encountering Unicode symbols

        v[1] = ""; // Clear it
        return `\\textcolor{red}{\\texttt{${escaped}}}`;
      },
    ],
  ]);

  function needsBrackets(ast: MathJson) {
    // For a correct implementation, you'd need to implement operator precedence...
    if (Array.isArray(ast) && ast.length >= 3) {
      return true;
    } else {
      return false;
    }
  }

  function brackets(value: string, bracketIds: boolean | undefined) {
    if (bracketIds !== false) {
      const bracketId = crypto.randomUUID();
      return `\\htmlData{bracketId=${bracketId}}{(}${value}\\htmlData{bracketId=${bracketId}}{)}`;
    } else {
      return `(${value})`;
    }
  }

  function toLatexRecursive(ast: MathJson, options?: MathFormattingOptions): string {
    if (Array.isArray(ast)) {
      // Make a copy
      ast = ast.slice() as [MathJsonOperator, ...MathJson[]];

      // Print the operator
      const functionPrinter = mathJsonOperatorMap.get(ast[0]) ?? options?.customPrinter;
      if (!functionPrinter) {
        throw new Error("Unknown operator " + ast);
      }
      const op = functionPrinter(ast);
      if (!op) {
        throw new Error("Unknown operator " + ast);
      }

      // Print the operands
      if (ast.length === 2) {
        let right = toLatexRecursive(ast[1], options);
        if (needsBrackets(ast[1])) {
          right = brackets(right, options?.bracketIds);
        }
        return `${op} ${right}`;
      } else if (ast.length === 3) {
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
        throw new Error("Not well formed MathJson " + ast);
      }
    } else if (typeof ast === "string") {
      return ast.replace(/^([^_]+)_([^]+)$/, "$1_{$2}");
    } else if (ast?.type === "number") {
      return ast.value;
    } else {
      const value = options?.customPrinter?.(ast);
      if (typeof value === "string") {
        return value;
      } else {
        throw new Error("Unknown ast element " + ast);
      }
    }
  }

  function mathToLatex(value: MathJson, options?: MathFormattingOptions): string {
    if (value === null || value === undefined) return ""; // TODO: This is a hack
    return toLatexRecursive(value, options);
  }

  return {
    mathToLatex,
  };
}
