export type MathJsonData = boolean;

export type MathJsonOperator =
  | "not"
  | "implies"
  | "and"
  | "or"
  | "xor"
  | "nand"
  | "nor"
  | "equals";

export type MathJson =
  | [operator: MathJsonOperator, ...args: MathJson[]]
  | MathJsonData;
