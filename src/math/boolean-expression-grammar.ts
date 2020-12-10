import * as bnb from "bread-n-butter";

export interface LogicalExpression {}

export class UnaryOperator implements LogicalExpression {
  constructor(public operator: string, public right: LogicalExpression) {}
}

export class BinaryOperator implements LogicalExpression {
  constructor(
    public operator: string,
    public left: LogicalExpression,
    public right: LogicalExpression
  ) {}
}

export class BooleanLiteral implements LogicalExpression {
  constructor(public value: boolean) {}
}

export class VariableLiteral implements LogicalExpression {
  constructor(public value: string) {}
}

export class ITELiteral implements LogicalExpression {
  constructor(public params: LogicalExpression[]) {}
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

const pUnaryOperators = [operator({ operator: "not", match: /not|!|¬/i })];

// Each precedence level builds upon the previous one.

// Highest level
const pVar = bnb
  .match(/[a-zA-Z]+((_[a-zA-Z0-9]+)|([0-9]))?/)
  .map((x) => new VariableLiteral(x.replace(/^([^_0-9]+)([0-9]+)$/, "$1_$2")));

const pBooleanFalse = bnb
  .match(/[Ff][Aa][Ll][Ss]([Ee]|[Cc][Hh])|0/)
  .map((x) => new BooleanLiteral(false));

const pBooleanTrue = bnb
  .match(/[Tt][Rr][Uu][Ee]|1|[Ww][Aa][Hh][Rr]/)
  .map((x) => new BooleanLiteral(true));

const pBoolean = pBooleanFalse.or(pBooleanTrue);

const logicalIte = bnb.lazy(() => {
  return (
    bnb
      .match(/[iI][tT][eE]\(/)
      .next(
        mathUnaryPrefix.trim(mathWS).sepBy(bnb.text(","), 3, 3).trim(mathWS)
      )
      .skip(bnb.text(")"))
      // Rewrite ITE(a, b, c) as (a and b) or (!a and c)
      .map(
        (params) =>
          new BinaryOperator(
            "or",
            new BinaryOperator("and", params[0], params[1]),
            new BinaryOperator(
              "and",
              new UnaryOperator("not", params[0]),
              params[2]
            )
          )
      )
  );
  // TODO: Actually implement ITEs instead of cheating
  // .map((params) => new ITELiteral(params));
});

// Next level
// Lazy is being used, because "booleanExpr" is defined all the way at the bottom of the file
const mathBasic: bnb.Parser<LogicalExpression> = bnb.lazy(() => {
  return booleanExpr
    .thru(token)
    .wrap(bnb.text("("), bnb.text(")"))
    .or(pBoolean)
    .or(logicalIte)
    .or(pVar)
    .trim(mathWS);
});

// Next level
// Lazy is being used, because mathUnaryPrefix uses itself
const mathUnaryPrefix: bnb.Parser<LogicalExpression> = bnb.lazy(() => {
  return bnb
    .choice(...pUnaryOperators)
    .and(mathUnaryPrefix)
    .map(([operator, expr]) => new UnaryOperator(operator, expr))
    .or(mathBasic);
});

const logicalAndOps: bnb.Parser<LogicalExpression> = mathUnaryPrefix.chain(
  (expr) => {
    return bnb
      .choice(
        operator({ operator: "and", match: /and|&&?|∧/i }),
        operator({ operator: "nand" as const, match: /nand|!&&?|↑/i })
      )
      .and(mathUnaryPrefix)
      .repeat(0)
      .map((pairs) => {
        return pairs.reduce((accum, [operator, expr]) => {
          return new BinaryOperator(operator, accum, expr);
        }, expr);
      });
  }
);

const logicalOrOps: bnb.Parser<LogicalExpression> = logicalAndOps.chain(
  (expr) => {
    return bnb
      .choice(
        operator({ operator: "or", match: /or|\|\|?|∨/i }),
        operator({ operator: "nor" as const, match: /nor|!\|\|?|↓/i }),
        operator({ operator: "xor" as const, match: /xor|\^|⊕/i })
      )
      .and(logicalAndOps)
      .repeat(0)
      .map((pairs) => {
        return pairs.reduce((accum, [operator, expr]) => {
          return new BinaryOperator(operator, accum, expr);
        }, expr);
      });
  }
);

const logicalImpliesOp: bnb.Parser<LogicalExpression> = logicalOrOps.chain(
  (expr) => {
    return operator({ operator: "implies", match: /impl(y|ies)|==?>|⇒/i })
      .and(logicalOrOps)
      .repeat(0)
      .map((pairs) => {
        return pairs.reduce((accum, [operator, expr]) => {
          return new BinaryOperator(operator, accum, expr);
        }, expr);
      });
  }
);

const logicalEqualsOp: bnb.Parser<LogicalExpression> = logicalImpliesOp.chain(
  (expr) => {
    return operator({ operator: "equals", match: /equal(s)?|==?|<==?>|≡/i })
      .and(logicalImpliesOp)
      .repeat(0)
      .map((pairs) => {
        return pairs.reduce((accum, [operator, expr]) => {
          return new BinaryOperator(operator, accum, expr);
        }, expr);
      });
  }
);

// Lowest level
const booleanExpr = logicalEqualsOp;

export function tryParse(value: string) {
  return booleanExpr.tryParse(value);
}
