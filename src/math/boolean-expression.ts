import { MathJson, MathJsonLogicalOperator } from "./MathJson";
import { tryParse } from "./boolean-expression-grammar";

export function useBooleanExpressionParsing() {
  function toMathJsonRecursive(ast: any): MathJson {
    if (ast.left) {
      return [
        ast.operator,
        toMathJsonRecursive(ast.left),
        toMathJsonRecursive(ast.right),
      ];
    } else if (ast.right && ast.operator) {
      return [ast.operator, toMathJsonRecursive(ast.right)];
    } else if (ast.right) {
      return toMathJsonRecursive(ast.right);
    } else {
      return ast.value;
    }
  }

  function parse(value: string): { mathJson?: MathJson; error?: string } {
    try {
      const parsed = tryParse(value);
      return { mathJson: toMathJsonRecursive(parsed) };
    } catch (e) {
      return { error: "" + e };
    }
  }

  return {
    parse,
  };
}

export function useBooleanExpressions() {
  function extractGetters(ast: MathJson) {
    const getters = new Set<string>();

    function extractGettersRecursive(ast: MathJson) {
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

  const mathJsonOperatorMap = new Map<
    MathJsonLogicalOperator,
    (a: boolean, b: boolean) => boolean
  >([
    ["not", (a) => !a],
    ["implies", (a, b) => !a || b],
    ["and", (a, b) => a && b],
    ["or", (a, b) => a || b],
    ["xor", (a, b) => (a ? !b : b)],
    ["nand", (a, b) => !(a && b)],
    ["nor", (a, b) => !(a || b)],
    ["equals", (a, b) => a == b],
  ]);

  function evaluateRecursive(
    ast: MathJson,
    getters: Map<string, boolean>
  ): boolean {
    if (Array.isArray(ast)) {
      const op = mathJsonOperatorMap.get(ast[0] as MathJsonLogicalOperator);
      if (!op) throw new Error("Unknown operation " + ast);

      if (ast.length === 3) {
        return op(
          evaluateRecursive(ast[1], getters),
          evaluateRecursive(ast[2], getters)
        );
      } else if (ast.length === 2) {
        return op(evaluateRecursive(ast[1], getters), false);
      } else {
        throw new Error("Unable to evaluate " + ast);
      }
    } else if (ast === true) {
      return true;
    } else if (ast === false) {
      return false;
    } else if (typeof ast === "string") {
      const result = getters.get(ast);
      if (result === undefined) throw new Error("Unable to evaluate " + ast);
      return result;
    } else {
      throw new Error("Unable to evaluate " + ast);
    }
  }

  function evaluate(ast: MathJson, getters?: Map<string, boolean>): boolean {
    return evaluateRecursive(ast, getters ?? new Map());
  }

  return {
    extractGetters,
    evaluate,
  };
}
