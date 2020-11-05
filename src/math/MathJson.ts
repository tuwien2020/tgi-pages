import { BinaryNumber } from "./binary-number";

export type MathJsonNumber = {
  kind: "number";
  value: string;
  base: number;
};
export type MathJsonData = boolean | "string" | MathJsonNumber | BinaryNumber;

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

export type MathJsonOperator = MathJsonLogicalOperator | MathJsonMathOperator;

export type MathJson =
  | [
      operator: MathJsonLogicalOperator | MathJsonMathOperator,
      ...args: MathJson[]
    ]
  | MathJsonData;
