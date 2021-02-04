import * as bnb from "bread-n-butter";
import { BinaryNumber } from "./../math/binary-number";
import { pBinaryNumber, MathExpression, BinaryOperator } from "./grammar-math";

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
