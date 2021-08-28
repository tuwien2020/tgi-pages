import * as bnb from "bread-n-butter";
import { BinaryNumber } from "./../math/binary-number";

export interface MathExpression {}

export class UnaryOperator implements MathExpression {
  constructor(public operator: string, public right: MathExpression) {}
}

export class BinaryOperator implements MathExpression {
  constructor(public operator: string, public left: MathExpression, public right: MathExpression) {}
}

export class BinaryNumberLiteral implements MathExpression {
  public value: BinaryNumber;
  constructor(value: BinaryNumber) {
    this.value = value;
  }
}

export class NumberLiteral implements MathExpression {
  public value: { kind: string; value: string; base?: number };
  constructor(number: string, base?: number) {
    this.value = {
      kind: "number",
      value: number,
      base: base,
    };
  }
}

export class VariableLiteral implements MathExpression {
  constructor(public value: string) {}
}

// ---[ Parser ]---
let mathWS = bnb.match(/\s*/);

function token<A>(parser: bnb.Parser<A>) {
  return parser.trim(mathWS);
}

function operator<S extends string>(value: { operator: S; match: RegExp }) {
  return bnb
    .match(value.match)
    .thru(token)
    .map((v) => value.operator);
}

const pUnaryOperators = [operator({ operator: "unaryMinus", match: /-/i }), operator({ operator: "unaryPlus", match: /\+/i })];

// Each precedence level builds upon the previous one. Meaning that the previous
// parser is used in the next parser, over and over. An astute reader could
// shorten this code using `reduce`, but it becomes much harder to read when you
// do that, in my opinion.

// Highest level

const pVar = bnb.match(/[a-zA-Z]+((_[a-zA-Z0-9]+)|([0-9]))?/).map((x) => new VariableLiteral(x.replace(/^([^_0-9]+)([0-9]+)$/, "$1_$2")));

const binaryNumberRegex = /([+-])?([0-1]+)([.,]([0-1]+))?/;
function stringToBinaryNumber(value: string): BinaryNumber {
  const matchResults = (value ?? "").match(binaryNumberRegex);
  if (matchResults === null) return new BinaryNumber(false, [], 0);

  const [_, sign, numberValue, __, fractionalPart] = matchResults;

  return new BinaryNumber(
    sign === "-",
    ((numberValue ?? "") + (fractionalPart ?? "")).split("").map((v) => (v === "0" ? false : true)),
    fractionalPart?.length ?? 0
  );
}

export const pBinaryNumber = bnb.match(binaryNumberRegex).map((str) => new BinaryNumberLiteral(stringToBinaryNumber(str)));

// Next level
const mathBasic: bnb.Parser<MathExpression> = bnb.lazy(() => {
  return mathExpr.thru(token).wrap(bnb.text("("), bnb.text(")")).or(pBinaryNumber).or(pVar).trim(mathWS);
});

// Next level
const mathUnaryPrefix: bnb.Parser<MathExpression> = bnb.lazy(() => {
  return bnb
    .choice(...pUnaryOperators)
    .and(mathUnaryPrefix)
    .map(([operator, expr]) => new UnaryOperator(operator, expr))
    .or(mathBasic);
});

const mathPow: bnb.Parser<MathExpression> = mathUnaryPrefix.chain((expr) => {
  // Exponentiaton is right associative, meaning that `2 ** 3 ** 4` is
  // equivalent to `2 ** (3 ** 4)` rather than `(2 ** 3) ** 4`, so we can use
  // recursion to process side by side exponentiation into a nested structure.
  return operator({ operator: "exponent", match: /\*\*/ })
    .and(mathPow)
    .map(([operator, nextExpr]) => {
      return new BinaryOperator(operator, expr, nextExpr);
    })
    .or(bnb.ok(expr));
});

const mathMulDiv: bnb.Parser<MathExpression> = mathUnaryPrefix.chain((expr) => {
  return bnb
    .choice(operator({ operator: "multiply", match: /\*/ }), operator({ operator: "divide" as const, match: /\// }))
    .and(mathUnaryPrefix)
    .repeat(0)
    .map((pairs) => {
      return pairs.reduce((accum, [operator, expr]) => {
        return new BinaryOperator(operator, accum, expr);
      }, expr);
    });
});

// Next level
const mathAddSub: bnb.Parser<MathExpression> = mathMulDiv.chain((expr) => {
  return bnb
    .choice(operator({ operator: "add", match: /\+/ }), operator({ operator: "subtract", match: /-/ }))
    .and(mathMulDiv)
    .repeat(0)
    .map((pairs) => {
      return pairs.reduce((accum, [operator, expr]) => {
        return new BinaryOperator(operator, accum, expr);
      }, expr);
    });
});

const mathEqualsOp: bnb.Parser<MathExpression> = mathAddSub.chain((expr) => {
  return operator({ operator: "equals", match: /equal(s)?|==?|<==?>|≡/i })
    .and(mathAddSub)
    .repeat(0)
    .map((pairs) => {
      return pairs.reduce((accum, [operator, expr]) => {
        return new BinaryOperator(operator, accum, expr);
      }, expr);
    });
});

// Lowest level
const mathExpr = mathEqualsOp;

const pNumber = bnb.match(/[+-]?[0-9]+([.,][0-9]+)?/).map((str) => new NumberLiteral(str.replace(/,/, ".")));

const pAnyBaseNumber = bnb.match(/[+-]?[0-9a-zA-Z]+([.,][0-9a-zA-Z]+)?/).map((str) => new NumberLiteral(str.replace(/,/, ".")));

export function tryParseNumber(value: string, options?: { type?: "number" | "binary" | "any-base" }) {
  const numberType = options?.type ?? "binary";
  if (numberType == "number") {
    return pNumber.tryParse(value);
  } else if (numberType == "binary") {
    return pBinaryNumber.tryParse(value);
  } else if (numberType == "any-base") {
    return pAnyBaseNumber.tryParse(value);
  } else {
    throw new Error("Unknown number type");
  }
}

export function tryParseBinaryNumber(value: string) {
  return pBinaryNumber.tryParse(value);
}

export function tryParse(value: string) {
  return mathExpr.tryParse(value);
}
