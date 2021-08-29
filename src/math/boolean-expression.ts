import { MathJson, MathJsonLogicalOperator } from "./math-parsing";

export function useBooleanExpressions() {
  function extractGetters(ast: MathJson<boolean>) {
    const getters = new Set<string>();

    function extractGettersRecursive(ast: MathJson<boolean>) {
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

  function transform(ast: MathJson): MathJson<boolean> {
    if (Array.isArray(ast)) {
      const [functionName, ...args] = ast;
      if (mathJsonOperatorMap.has(functionName as any)) {
        return [functionName, ...args.map((v) => transform(v))];
      } else {
        return ["Error", `Unknown function ${functionName}`];
      }
    } else {
      if (typeof ast === "string") {
        const isFalse = /false|falsch|0/i.test(ast);
        const isTrue = /true|wahr|1/i.test(ast);
        if (isFalse) {
          return false;
        } else if (isTrue) {
          return true;
        } else {
          // It's a variable
          return ast;
        }
      } else if (ast?.type === "number") {
        if (ast.value === "0") {
          return false;
        } else if (ast.value === "1") {
          return true;
        }
      }
      return ["Error", `Expected true or false: ${ast}`];
    }
  }

  function customPrinter(value: MathJson<boolean>): string | null {
    if (value === true) {
      return "\\mathtt{1}";
    } else if (value === false) {
      return "\\mathtt{0}";
    } else {
      return null;
    }
  }

  const mathJsonOperatorMap = new Map<MathJsonLogicalOperator, (a: boolean, b: boolean) => boolean>([
    ["Not", (a) => !a],
    ["Implies", (a, b) => !a || b],
    ["And", (a, b) => a && b],
    ["Or", (a, b) => a || b],
    ["Xor", (a, b) => (a ? !b : b)],
    ["Nand", (a, b) => !(a && b)],
    ["Nor", (a, b) => !(a || b)],
    ["Equal", (a, b) => a == b],
    ["Subset", (a, b) => !b || a],
  ]);

  function evaluateRecursive(ast: MathJson<boolean>, getters: Map<string, boolean>): boolean {
    if (Array.isArray(ast)) {
      const op = mathJsonOperatorMap.get(ast[0] as MathJsonLogicalOperator);
      if (!op) throw new Error("Unknown operation " + ast);

      if (ast.length === 3) {
        return op(evaluateRecursive(ast[1], getters), evaluateRecursive(ast[2], getters));
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

  function evaluate(ast: MathJson<boolean>, getters?: Map<string, boolean>): boolean {
    return evaluateRecursive(ast, getters ?? new Map());
  }

  return {
    extractGetters,
    transform,
    evaluate,
    customPrinter,
  };
}
