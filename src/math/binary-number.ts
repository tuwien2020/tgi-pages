import { LogicalExpression } from "../assets/grammar-logical";

function xor(a: boolean, b: boolean) {
  // Alternatively, you could use
  // return (a || b) && !(a && b)
  return a ? !b : b;
}

export class BinaryNumber implements LogicalExpression {
  kind: "logical-expression" = "logical-expression";

  public readonly value: ReadonlyArray<boolean>;

  constructor(value: ReadonlyArray<boolean>) {
    this.value = value.slice();
  }

  static fromSize(size: number) {
    return new BinaryNumber(new Array(size).fill(false));
  }

  clone() {
    return new BinaryNumber(this.value);
  }

  extend(length: number) {
    if (length > this.value.length) {
      const padding: boolean[] = new Array(length - this.value.length).fill(
        false
      );

      return new BinaryNumber(padding.concat(this.value));
    } else {
      return this;
    }
  }

  add(other: BinaryNumber): BinaryNumber {
    let a = this as BinaryNumber;
    let b = other;

    // Pad the smaller number
    if (a.value.length > b.value.length) {
      b = b.extend(a.value.length);
    } else if (a.value.length < b.value.length) {
      a = a.extend(b.value.length);
    }

    const result = new Array(a.value.length).fill(false);

    // Adding binary numbers requires you to visit them backwards
    let carry = false;
    for (let i = a.value.length - 1; i >= 0; i--) {
      const bitA = a.value[i];
      const bitB = b.value[i];

      // See https://de.wikipedia.org/wiki/Datei:Volladdierer_Aufbau_DIN40900.svg
      const aXorB = xor(bitA, bitB);
      result[i] = xor(aXorB, carry);
      carry = (bitA && bitB) || (aXorB && carry);
    }

    return new BinaryNumber(result);
  }
}
