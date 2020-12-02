function xor(a: boolean, b: boolean) {
  // Alternatively, you could use
  // return (a || b) && !(a && b)
  return a ? !b : b;
}

// TODO: Maybe write a "addOne" function

/**
 * Adds two binary arrays that have the same length.
 * Returns a larger array if there was an overflow
 */
function addBitArray(a: ReadonlyArray<boolean>, b: ReadonlyArray<boolean>) {
  if (a.length !== b.length) throw new Error("Not equal lengths");

  const result: boolean[] = new Array(a.length).fill(false);

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

  if (carry) {
    result.unshift(true);
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
  aDecimalPoint: number,
  b: ReadonlyArray<boolean>,
  bDecimalPoint: number
) {
  // a > b would be rewritten as compareBinaryArray(a,b) > 0
  const aBeforeDecimal = a.length - aDecimalPoint;
  const bBeforeDecimal = b.length - bDecimalPoint;
  const maxBeforeDecimal = Math.max(aBeforeDecimal, bBeforeDecimal);
  const aOffset = maxBeforeDecimal - aBeforeDecimal;
  const bOffset = maxBeforeDecimal - bBeforeDecimal;

  const until = Math.max(a.length + aOffset, b.length + bOffset);
  for (let i = 0; i < until; i++) {
    const aIndex = i - aOffset;
    const bIndex = i - bOffset;
    const bitA = 0 <= aIndex && aIndex < a.length ? a[i - aOffset] : false;
    const bitB = 0 <= bIndex && bIndex < b.length ? b[i - bOffset] : false;
    if (bitA && !bitB) {
      return 1;
    }
    if (bitB && !bitA) {
      return -1;
    }
  }
  return 0;
}

export class BinaryNumber {
  /**
   * The sign
   */
  public readonly isNegative: boolean;

  /**
   * The bits
   */
  public readonly value: ReadonlyArray<boolean>;

  /**
   * Tells you where the decimal point is
   */
  public readonly decimalPoint: number;

  constructor(
    isNegative: boolean,
    value: ReadonlyArray<boolean>,
    decimalPoint: number
  ) {
    this.isNegative = isNegative;
    this.value = value.slice();
    this.decimalPoint = Math.round(decimalPoint);
  }

  static fromSize(size: number, decimalPoint: number = 0) {
    return new BinaryNumber(false, new Array(size).fill(false), decimalPoint);
  }

  static fromSignMagnitude(value: ReadonlyArray<boolean>) {
    return new BinaryNumber(value[0], value.slice(1), 0);
  }

  static fromOnesComplement(value: ReadonlyArray<boolean>) {
    const isNegative = value[0];
    const bitArray = value.slice();
    if (isNegative) {
      for (let i = 0; i < bitArray.length; i++) {
        bitArray[i] = !bitArray[i];
      }
    }
    return new BinaryNumber(isNegative, bitArray, 0);
  }

  static fromTwosComplement(value: ReadonlyArray<boolean>) {
    const isNegative = value[0];
    const bitArray = value.slice();
    if (isNegative) {
      for (let i = 0; i < bitArray.length; i++) {
        bitArray[i] = !bitArray[i];
      }

      const oneInBinary = new BinaryNumber(false, [true], 0);
      const bitArrayPlusOne = new BinaryNumber(false, bitArray, 0).add(
        oneInBinary
      );

      return new BinaryNumber(isNegative, bitArrayPlusOne.value, 0);
    } else {
      return new BinaryNumber(isNegative, bitArray, 0);
    }
  }

  static fromOffsetBinary(
    value: ReadonlyArray<boolean>,
    offset: ReadonlyArray<boolean>
  ) {
    return new BinaryNumber(false, value, 0).subtract(
      new BinaryNumber(false, offset, 0)
    );
  }

  getValueBeforeDecimal() {
    return this.value.slice(0, this.value.length - this.decimalPoint);
  }

  getValueAfterDecimal() {
    return this.value.slice(this.value.length - this.decimalPoint);
  }

  clone() {
    return new BinaryNumber(this.isNegative, this.value, this.decimalPoint);
  }

  extend(length: number, lengthOfFractional: number = 0) {
    if (
      length > this.value.length - this.decimalPoint ||
      lengthOfFractional > this.decimalPoint
    ) {
      const paddingLeft: boolean[] = new Array(
        length - (this.value.length - this.decimalPoint)
      ).fill(false);
      const paddingRight: boolean[] = new Array(
        lengthOfFractional - this.decimalPoint
      ).fill(false);

      return new BinaryNumber(
        this.isNegative,
        paddingLeft.concat(this.value).concat(paddingRight),
        lengthOfFractional
      );
    } else {
      return this;
    }
  }

  trimZerosBeforeDecimal() {
    // Removes all zeros before the decimal
    let skipZeros = 0;
    for (let i = 0; i < this.value.length - this.decimalPoint; i++) {
      const bit = this.value[skipZeros];
      if (bit) {
        break;
      } else {
        skipZeros++;
      }
    }
    return new BinaryNumber(
      this.isNegative,
      this.value.slice(skipZeros),
      this.decimalPoint
    );
  }

  add(other: BinaryNumber): BinaryNumber {
    let a = this as BinaryNumber;
    let b = other;

    // Pad the numbers
    const paddingBeforeDecimal = Math.max(
      a.value.length - a.decimalPoint,
      b.value.length - b.decimalPoint
    );
    const paddingAfterDecimal = Math.max(a.decimalPoint, b.decimalPoint);
    a = a.extend(paddingBeforeDecimal, paddingAfterDecimal);
    b = b.extend(paddingBeforeDecimal, paddingAfterDecimal);

    if (a.isNegative == b.isNegative) {
      // a and b have the same sign
      return new BinaryNumber(
        a.isNegative,
        addBitArray(a.value, b.value),
        a.decimalPoint
      );
    } else {
      // Test cases
      // -10 + 1   => -
      // 1 + (-10) => -
      // 10 + (-1) => +
      // -1 + 10   => +
      // -10 + 10  => 0
      const comparison = compareBinaryArray(a.value, 0, b.value, 0);
      if (comparison === 0) {
        return BinaryNumber.fromSize(a.value.length, a.decimalPoint);
      } else if (comparison > 0) {
        // a is larger than b
        return new BinaryNumber(
          a.isNegative,
          subtractBitArray(a.value, b.value),
          a.decimalPoint
        );
      } else {
        // b is larger than a
        return new BinaryNumber(
          b.isNegative,
          subtractBitArray(b.value, a.value),
          b.decimalPoint
        );
      }
    }
  }

  subtract(other: BinaryNumber): BinaryNumber {
    const negatedOther = other.setSign(!other.isNegative);
    return this.add(negatedOther);
  }

  multiply(other: BinaryNumber): BinaryNumber {
    if (other.value.length == 0) return new BinaryNumber(false, [false], 0);

    // Skip the zeros at the beginning of number b
    let skipZeros = 0;
    for (let i = 0; i < other.value.length; i++) {
      const bitB = other.value[skipZeros];
      if (bitB) {
        break;
      } else {
        skipZeros++;
      }
    }

    let resultBits = new BinaryNumber(false, this.value, 0);
    let thisValueBits = new BinaryNumber(false, this.value, 0);
    // Multiply the remaining numbers
    for (let i = 1 + skipZeros; i < other.value.length; i++) {
      const bitB = other.value[i];
      resultBits = resultBits.multiplyByPowerOfTwo(1);
      if (bitB) {
        resultBits = resultBits.add(thisValueBits);
      }
    }

    return new BinaryNumber(
      xor(this.isNegative, other.isNegative),
      resultBits.value,
      this.decimalPoint + other.decimalPoint
    );
  }

  multiplyByPowerOfTwo(value: number) {
    if (value == 0) return this;
    if (value > 0) {
      if (this.decimalPoint - value >= 0) {
        return new BinaryNumber(
          this.isNegative,
          this.value,
          this.decimalPoint - value
        );
      } else {
        const paddingArray = new Array(value - this.decimalPoint).fill(false);
        return new BinaryNumber(
          this.isNegative,
          this.value.concat(paddingArray),
          0
        );
      }
    } else {
      throw new Error("Negative powers of two are not supported yet");
    }
  }

  divide(
    other: BinaryNumber,
    placesAfterDecimal: number
  ): { result: BinaryNumber; remainder?: boolean[] } {
    if (other.value.length == 0) throw new Error("Division by zero");

    // Shift the decimal points away
    const maxDecimal = Math.max(this.decimalPoint, other.decimalPoint);
    const a = this.setSign(false).multiplyByPowerOfTwo(maxDecimal);
    let b = other
      .setSign(false)
      .multiplyByPowerOfTwo(maxDecimal)
      .trimZerosBeforeDecimal();

    if (b.value.length <= 0) {
      throw new Error("Division by zero");
    }

    // Do the division like https://en.wikipedia.org/wiki/Division_algorithm#Integer_division_(unsigned)_with_remainder
    let index = 0;
    const maxLength = a.value.length + placesAfterDecimal;
    const resultBits = new Array<boolean>(maxLength).fill(false);
    let remainder = new BinaryNumber(false, [], 0);

    while (!a.isZero() && index < maxLength) {
      // Pull down the next bit
      const newBit = index < a.value.length ? a.value[index] : false;
      remainder = new BinaryNumber(false, remainder.value.concat(newBit), 0);

      // If we can subtract, do so
      if (remainder.compareTo(b) >= 0) {
        remainder = remainder.subtract(b);
        resultBits[index] = true;
      } else {
        resultBits[index] = false;
      }
      index += 1;
    }

    return {
      result: new BinaryNumber(
        xor(this.isNegative, other.isNegative),
        resultBits,
        placesAfterDecimal
      ),
      remainder: a.value.slice(),
    };
  }

  compareTo(other: BinaryNumber): number {
    // a < b gets rewritten as a.compareTo(b) < 0
    if (this.isNegative == other.isNegative) {
      const comparison = compareBinaryArray(
        this.value,
        this.decimalPoint,
        other.value,
        other.decimalPoint
      );
      if (comparison == 0) {
        return 0;
      } else {
        return this.isNegative ? -comparison : comparison;
      }
    } else {
      return this.isNegative ? -1 : 1;
    }
  }

  isZero(): boolean {
    return this.value.every((v) => !v);
  }

  setSign(isNegative: boolean): BinaryNumber {
    return new BinaryNumber(isNegative, this.value, this.decimalPoint);
  }
}
