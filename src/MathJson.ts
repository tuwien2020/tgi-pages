export type MathJsonData = boolean | "string";

export type MathJsonLogicalOperator =
  | "not"
  | "implies"
  | "and"
  | "or"
  | "xor"
  | "nand"
  | "nor"
  | "equals";

export type MathJson =
  | [operator: MathJsonLogicalOperator, ...args: MathJson[]]
  | MathJsonData;
