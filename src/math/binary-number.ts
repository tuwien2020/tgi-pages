import { LogicalExpression } from "../assets/grammar-logical";

function xor(a: boolean, b: boolean) {
  // Alternatively, you could use
  // return (a || b) && !(a && b)
  return a ? !b : b;
}

/**
 * Adds two binary arrays that have the same length
 * TODO: Handle overflow?
 */
function addBitArray(a: ReadonlyArray<boolean>, b: ReadonlyArray<boolean>) {
  if (a.length !== b.length) throw new Error("Not equal lengths");

  const result = new Array(a.length).fill(false);

  // Adding binary numbers requires you to visit them backwards
  let carry = false;
  for (let i = a.length - 1; i >= 0; i--) {
    const bitA = a[i];
    const bitB = b[i];

    // See https://de.wikipedia.org/wiki/Datei:Volladdierer_Aufbau_DIN40900.svg
    const aXorB = xor(bitA, bitB);
    result[i] = xor(aXorB, carry);
    carry = (bitA && bitB) || (aXorB && carry);
  }

  return result;
}

/**
 * Subtracts two binary arrays that have the same length
 * a must be larger than b
 * TODO: Handle underflow?
 */
function subtractBitArray(
  a: ReadonlyArray<boolean>,
  b: ReadonlyArray<boolean>
) {
  if (a.length !== b.length) throw new Error("Not equal lengths");
  const result = new Array(a.length).fill(false);

  // Subtracting binary numbers requires you to visit them backwards
  let carry = false;
  for (let i = a.length - 1; i >= 0; i--) {
    const bitA = a[i];
    const bitB = b[i];

    // See https://en.wikipedia.org/wiki/Subtractor#Full_subtractor
    // or https://en.m.wikipedia.org/wiki/File:Full_subtractor_circuit_.jpg
    const aXorB = xor(bitA, bitB);
    result[i] = xor(aXorB, carry);
    carry = (!bitA && bitB) || (!aXorB && carry);
  }

  return result;
}

/**
 * Compares two binary arrays
 */
function compareBinaryArray(
  a: ReadonlyArray<boolean>,
  b: ReadonlyArray<boolean>
) {
  // a < b would be rewritten as compareBinaryArray(a,b) < 0

  let flipped = false;
  if (b.length > a.length) {
    const temp = a;
    a = b;
    b = temp;
    flipped = true;
  }

  // a is longer than b, now check the first few bits of a
  const aDiff = a.length - b.length;
  for (let i = 0; i < aDiff; i++) {
    const bitA = a[i];
    if (bitA) {
      return flipped ? 1 : -1;
    }
  }

  for (let i = 0; i < b.length; i++) {
    const bitA = a[i + aDiff];
    const bitB = b[i];
    if (bitA && !bitB) {
      return flipped ? 1 : -1;
    }
    if (bitB && !bitA) {
      return flipped ? -1 : 1;
    }
  }

  return 0;
}

export class BinaryNumber implements LogicalExpression {
  kind: "logical-expression" = "logical-expression";

  public readonly isNegative: boolean;
  public readonly value: ReadonlyArray<boolean>;

  constructor(isNegative: boolean, value: ReadonlyArray<boolean>) {
    this.isNegative = isNegative;
    this.value = value.slice();
  }

  static fromSize(size: number) {
    return new BinaryNumber(true, new Array(size).fill(false));
  }

  static fromSignMagnitude(value: ReadonlyArray<boolean>) {
    return new BinaryNumber(value[0], value.slice(1));
  }

  static fromOnesComplement(value: ReadonlyArray<boolean>) {
    const isNegative = value[0];
    const bitArray = value.slice(1);
    if (isNegative) {
      for (let i = 0; i < bitArray.length; i++) {
        bitArray[i] = !bitArray[i];
      }
    }
    return new BinaryNumber(isNegative, bitArray);
  }

  static fromTwosComplement(value: ReadonlyArray<boolean>) {
    const isNegative = value[0];
    const bitArray = value.slice(1);
    if (isNegative) {
      for (let i = 0; i < bitArray.length; i++) {
        bitArray[i] = !bitArray[i];
      }
      const oneInBinary = new BinaryNumber(false, [true]);
      return new BinaryNumber(isNegative, bitArray).add(oneInBinary);
    } else {
      return new BinaryNumber(isNegative, bitArray);
    }
  }

  clone() {
    return new BinaryNumber(this.isNegative, this.value);
  }

  extend(length: number) {
    if (length > this.value.length) {
      const padding: boolean[] = new Array(length - this.value.length).fill(
        false
      );

      return new BinaryNumber(this.isNegative, padding.concat(this.value));
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

    if (a.isNegative == b.isNegative) {
      // a and b have the same sign
      return new BinaryNumber(a.isNegative, addBitArray(a.value, b.value));
    } else {
      // Test cases
      // -10 + 1   => -
      // 1 + (-10) => -
      // 10 + (-1) => +
      // -1 + 10   => +
      // -10 + 10  => 0
      const comparison = compareBinaryArray(a.value, b.value);
      if (comparison === 0) {
        return BinaryNumber.fromSize(a.value.length);
      } else if (comparison > 0) {
        // a is larger than b
        return new BinaryNumber(
          a.isNegative,
          subtractBitArray(a.value, b.value)
        );
      } else {
        // b is larger than a
        return new BinaryNumber(
          b.isNegative,
          subtractBitArray(b.value, a.value)
        );
      }
    }
  }

  subtract(other: BinaryNumber): BinaryNumber {
    const negatedOther = other.setSign(!other.isNegative);
    return this.add(negatedOther);
  }

  setSign(sign: boolean): BinaryNumber {
    return new BinaryNumber(sign, this.value);
  }
}
