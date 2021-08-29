import * as bnb from "bread-n-butter";
import { match } from "bread-n-butter";

export type MathJsonNumber = {
  type: "number";
  value: string;
};

export type MathJsonLogicalOperator = "Not" | "Implies" | "And" | "Or" | "Xor" | "Nand" | "Nor" | "Equal" | "Subset";

// FYI "Negate" and "Plus" are unary operators
export type MathJsonMathOperator = "Power" | "Multiply" | "Divide" | "Add" | "Subtract" | "Equal" | "Negate" | "Plus";

export type MathJsonOperator = MathJsonLogicalOperator | MathJsonMathOperator | "Error";

export type MathJson<V = MathJsonNumber> = [operator: MathJsonOperator, ...args: MathJson<V>[]] | string | V;

/** Strips away the whitespace */
function token<A>(parser: bnb.Parser<A>) {
  const whitespace = match(/\s*/);
  return parser.trim(whitespace);
}

/** Define a simple operator */
function operator<S extends string>(value: { operator: S; match: RegExp }) {
  return match(value.match)
    .thru(token)
    .map(() => value.operator);
}

/**
 * When we parse something like `a+b+c`, we get
 * @param pairs contains the not yet nested expressions, so `["Add", "b"]` and `["Add", "c"]`
 * @param startingExpression is the expression at the start, so `"a"`
 * @returns A proper MathJson tree, so `["Add", ["Add", "a", "b"], "c"]`
 */
function accumulateToMathJson(pairs: [MathJsonOperator, MathJson][], startingExpression: MathJson): MathJson {
  return pairs.reduce((accumulator, [operator, nextExpression]) => {
    return [operator, accumulator, nextExpression];
  }, startingExpression);
}

// The order is from highest precedence to lowest precedence. So multiplication before addition

const mathLiteral: bnb.Parser<MathJson> = bnb.lazy(() => {
  // An expression with brackets around it
  const bracketedExpression = expressionParser.thru(token).wrap(bnb.text("("), bnb.text(")"));

  // TODO: Should we also allow, say, base12 numbers?
  const number = match(/([0-9]+)([.,]([0-9]+))?/)
    .thru(token)
    .map<MathJsonNumber>((v) => {
      return { type: "number", value: v.replace(",", ".") };
    });

  // A variable name
  const variable = match(/[a-zA-Z]+((_[a-zA-Z0-9]+)|([0-9]))?/)
    .thru(token)
    .map<string>((v) => v.replace(/^([^_0-9]+)([0-9]+)$/, "$1_$2"));

  return bracketedExpression.or(number).or(variable);
});

// Lots of stuff, if you want a properly commented parser, please scroll to the bottom
// TODO: More stuff that could be parsed (if needed)
// - sqrt()
// - bit shifts << and >>
// - remainder %
// - ITEs
/*
const logicalIte = bnb.lazy(() => {
  return (
    bnb
      .match(/[iI][tT][eE]\(/)
      .next(mathUnaryPrefix.trim(mathWS).sepBy(bnb.text(","), 3, 3).trim(mathWS))
      .skip(bnb.text(")"))
      // Rewrite ITE(a, b, c) as (a and b) or (!a and c)
      .map(
        (params) =>
          new BinaryOperator(
            "or",
            new BinaryOperator("and", params[0], params[1]),
            new BinaryOperator("and", new UnaryOperator("not", params[0]), params[2])
          )
      )
  );
  // TODO: Actually implement ITEs instead of cheating
  // .map((params) => new ITELiteral(params));
});
*/

const operatorExponent: bnb.Parser<MathJson> =
  // We start by parsing a variable (or a number or an expression in brackets)
  mathLiteral.chain((expression) => {
    // Then we parse an exponent operator
    return (
      operator({ operator: "Power", match: /\*\*/ })
        // Usually we would parse another variable (or ...)
        // Exponents are "right associative", which means that 2 ** 3 ** -4 should be parsed as 2 ** (3 ** (-4))
        // So we need to "recursively" parse the exponents, including the potential unary prefixes
        .and(operatorUnaryPrefix)
        // We don't have a repeat(0), so the mapping code looks slightly different
        .map(([operator, nextExpression]) => {
          return [operator, expression, nextExpression] as MathJson;
        })
        // I think this is the "exit" case of the recursion ^
        .or(bnb.ok(expression))
    );
  });

// Unary operators are a bit special
// -a**b should be parsed as -(a**b)
// a**-b should be parsed as a**(-b)
// -a+b should be parsed as (-a)+b
// --a should be parsed as -(-a)
// a+-b should be parsed as a+(-b)
const operatorUnaryPrefix: bnb.Parser<MathJson> = bnb.lazy(() => {
  // Start by parsing a unary operator
  return (
    bnb
      .choice(
        // Unary operators
        operator({ operator: "Negate", match: /-/i }),
        operator({ operator: "Plus", match: /\+/i })
      )
      // And keep parsing more unary operators
      .and(operatorUnaryPrefix)
      // Turn it into MathJson
      .map(([operator, nextExpression]) => {
        return [operator, nextExpression] as MathJson;
      })
      // And if we cannot keep parsing unary operators, we have to parse an exponent or a literal
      .or(operatorExponent)
  );
});

const operatorMultiply: bnb.Parser<MathJson> = operatorUnaryPrefix.chain((expression) => {
  return bnb
    .choice(
      // Multiplication and division
      operator({ operator: "Multiply", match: /\*/ }),
      operator({ operator: "Divide", match: /\// })
    )
    .and(operatorUnaryPrefix)
    .repeat(0)
    .map((pairs) => accumulateToMathJson(pairs, expression));
});

const operatorAdd: bnb.Parser<MathJson> = operatorMultiply.chain((expression) => {
  return bnb
    .choice(
      // Addition and subtraction
      operator({ operator: "Add", match: /\+/ }),
      operator({ operator: "Subtract", match: /-/ })
    )
    .and(operatorMultiply)
    .repeat(0)
    .map((pairs) => accumulateToMathJson(pairs, expression));
});

const operatorAnd: bnb.Parser<MathJson> = operatorAdd.chain((expression) => {
  return bnb
    .choice(
      // The "and" operators
      // TODO: Add Xnand?
      operator({ operator: "And", match: /and|&&?|∧/i }),
      operator({ operator: "Nand" as const, match: /nand|!&&?|↑/i })
    )
    .and(operatorAdd)
    .repeat(0)
    .map((pairs) => accumulateToMathJson(pairs, expression));
});

const operatorOr: bnb.Parser<MathJson> = operatorAnd.chain((expression) => {
  return bnb
    .choice(
      operator({ operator: "Or", match: /or|\|\|?|∨/i }),
      operator({ operator: "Nor" as const, match: /nor|!\|\|?|↓/i }),
      operator({ operator: "Xor" as const, match: /xor|\^|⊕/i })
    )
    .and(operatorAnd)
    .repeat(0)
    .map((pairs) => accumulateToMathJson(pairs, expression));
});

const operatorImplies: bnb.Parser<MathJson> =
  // We start by parsing something fancier, like a variable or a*b
  operatorOr.chain((expression) => {
    // Followed by some operator
    return (
      bnb
        .choice(
          // a => b
          operator({ operator: "Implies", match: /impl(y|ies)|==?>|⇒|⊃/i }),
          // a <= b
          operator({ operator: "Subset", match: /if|subset|<==?|⊂/i })
        )
        // And another variable on the right side
        .and(operatorOr)
        // This can be repeated as often as we like, including zero times
        .repeat(0)
        // And then we turn the result into MathJson
        .map((pairs) => accumulateToMathJson(pairs, expression))
    );
  });

const operatorEqual: bnb.Parser<MathJson> =
  // We start by parsing something fancier, like a variable or a*b or a => b
  operatorImplies
    // And then we parse
    .chain((expression) => {
      // An equals sign
      return (
        operator({ operator: "Equal", match: /equal(s)?|==?|<==?>|≡/i })
          // Followed by another thing with a higher 'precedence'
          .and(operatorImplies)
          // This can be repeated as often as we like
          .repeat(0)
          // And then we turn the result into MathJson
          .map((pairs) => accumulateToMathJson(pairs, expression))
      );
    });

// Final level (this gets called when we want to parse some maths)
const expressionParser = operatorEqual;

export function parseMath(value: string): MathJson {
  if (!value) return "";

  const result = expressionParser.parse(value);
  if (result.type === "ParseOK") {
    return result.value;
  } else {
    const { expected, location } = result;
    const { line, column } = location;
    const message = `parse error at line ${line} column ${column}: ` + `expected ${expected.join(", ")}`;
    return ["Error", message];
  }
}

export function hasError<T>(value: MathJson<T>): boolean {
  if (Array.isArray(value)) {
    const [functionName, ...args] = value;
    if (functionName === "Error") return true;
    else return args.some((v) => hasError(v));
  } else {
    return false;
  }
}

// Test cases
/*
console.log(expression.parse("a=b"));
console.log(expression.parse("a==b"));
console.log(expression.parse("a=b=c"));
console.log(expression.parse("a=b=c=d3"));
console.log(expression.parse("a+b**c**d"));
console.log(expression.parse("-a"));
console.log(expression.parse("--a"));
console.log(expression.parse("--+-a"));
console.log(expression.parse("-a**2"));
console.log(expression.parse("--a**-2"));
console.log(expression.parse("-a**b"));
console.log(expression.parse("a**-b"));
console.log(expression.parse("-a+b"));
console.log(expression.parse("a+-b"));
*/
