export type MathJsonNumber = {
  kind: "number";
  value: string;
  base: number;
};
export type MathJsonData = boolean | "string" | MathJsonNumber;

export type MathJsonLogicalOperator =
  | "not"
  | "implies"
  | "and"
  | "or"
  | "xor"
  | "nand"
  | "nor"
  | "equals";

export type MathJsonMathOperator =
  | "unaryMinus"
  | "unaryPlus"
  | "exponent"
  | "multiply"
  | "divide"
  | "add"
  | "subtract"
  | "equals";

export type MathJson =
  | [operator: MathJsonLogicalOperator, ...args: MathJson[]]
  | MathJsonData;
