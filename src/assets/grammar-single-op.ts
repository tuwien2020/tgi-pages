import * as bnb from "bread-n-butter";
import { BinaryNumber } from "./../math/binary-number";
import { MathExpression, BinaryOperator } from "./grammar-math";

export class BinaryNumberLiteral implements MathExpression {
  public value: BinaryNumber;
  constructor(value: BinaryNumber) {
    this.value = value;
  }
}

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

const binaryNumberRegex = /([+-])?([0-1]+)([.,][0-1]+)?/;
function stringToBinaryNumber(value: string): BinaryNumber {
  const matchResults = (value ?? "").match(binaryNumberRegex);
  if (matchResults === null) return new BinaryNumber(false, []);

  const [_, sign, numberValue, fractionalPart] = matchResults;

  if (fractionalPart) throw new Error("Fractional numbers not yet supported");
  return new BinaryNumber(
    sign === "-",
    (numberValue ?? "").split("").map((v) => (v === "0" ? false : true))
  );
}

const pBinaryNumber = bnb
  .match(binaryNumberRegex)
  .map((str) => new BinaryNumberLiteral(stringToBinaryNumber(str)));

const mathSingleOperator: bnb.Parser<MathExpression> = pBinaryNumber.chain(
  (expr) => {
    return bnb
      .choice(
        operator({ operator: "multiply" as const, match: /\*/ }),
        operator({ operator: "divide" as const, match: /\// }),
        operator({ operator: "add" as const, match: /\+/ }),
        operator({ operator: "subtract" as const, match: /-/ })
      )
      .and(pBinaryNumber)
      .map(([operator, nextExpr]) => {
        return new BinaryOperator(operator, expr, nextExpr);
      });
  }
);

export function tryParseBinaryNumber(value: string): BinaryNumber {
  return pBinaryNumber.tryParse(value).value;
}

export function tryParse(value: string) {
  return mathSingleOperator.tryParse(value);
}
