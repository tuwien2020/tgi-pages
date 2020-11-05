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

const pBitArrayNumber = bnb.match(/[0-1]+/).map(
  (str) =>
    new BinaryNumberLiteral(
      new BinaryNumber(
        false,
        str
          .replace(/,/, ".")
          .split("")
          .map((v) => (v === "0" ? false : true))
      )
    )
);

const mathSingleOperator: bnb.Parser<MathExpression> = pBitArrayNumber.chain(
  (expr) => {
    return bnb
      .choice(
        operator({ operator: "multiply" as const, match: /\*/ }),
        operator({ operator: "divide" as const, match: /\// }),
        operator({ operator: "add" as const, match: /\+/ }),
        operator({ operator: "subtract" as const, match: /-/ })
      )
      .and(pBitArrayNumber)
      .map(([operator, nextExpr]) => {
        return new BinaryOperator(operator, expr, nextExpr);
      });
  }
);

export function tryParse(value: string) {
  return mathSingleOperator.tryParse(value);
}
