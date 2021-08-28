// ITE(b, ITE(!c, ITE(!b, c, !c), ITE(!c, 1, 0)), ITE(!c, 1, !a))

class VariableLiteral {
  constructor(public value: string, public isNegated: boolean) {}
}

class IteNode {
  constructor(public children: (VariableLiteral | IteNode)[]) {}
}

class TokenStream {
  constructor(public value: string, public offset: number) {}

  /**
   * Gets the current string
   */
  get currentValue() {
    return this.value.substring(this.offset);
  }

  /**
   * Checks if the token stream at the current position starts with a string
   */
  startsWith(value: string) {
    return this.currentValue.startsWith(value);
  }

  /**
   * Consumes n characters
   */
  consume(value: number) {
    if (this.offset + value > this.value.length) {
      throw new Error("Cannot consume");
    }
    this.offset += value;
  }

  /**
   * Checks if it's at the end of the file
   */
  eof() {
    return this.offset >= this.value.length - 1;
  }
}

function parseIteRecursive(value: TokenStream): VariableLiteral | IteNode {
  if (value.startsWith("ITE(")) {
    value.consume(4);
    let children = [];

    while (true) {
      const returnValue = parseIteRecursive(value);
      children.push(returnValue);

      if (value.startsWith(")")) {
        value.consume(1);
        break;
      } else {
        value.consume(1); // Comma
      }
    }

    return new IteNode(children);
  } else {
    const currentValue = value.currentValue;
    let endOfVariable = currentValue.search(/[,)]/);
    if (endOfVariable == -1) {
      throw new Error("Invalid string " + currentValue);
    }
    const variable = currentValue.substring(0, endOfVariable);
    value.consume(endOfVariable);

    return new VariableLiteral(variable.replace(/\!/, ""), variable.startsWith("!"));
  }
}

export function parseIte(value: string) {
  return parseIteRecursive(new TokenStream(value.replace(/\s/g, ""), 0));
}

console.log(parseIte("ITE(b, ITE(!c, ITE(!b, c, !c), ITE(!c, 1, 0)), ITE(!c, 1, !a))"));
