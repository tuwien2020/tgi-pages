import * as bnb from "bread-n-butter";
import { BinaryNumber } from "./../math/binary-number";
import { MathExpression, BinaryOperator } from "./grammar-math";

class BinaryNumberExpression extends BinaryNumber implements MathExpression {
  kind: "math-expression" = "math-expression";
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
    new BinaryNumberExpression(
      false,
      str
        .replace(/,/, ".")
        .split("")
        .map((v) => (v === "0" ? false : true))
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
