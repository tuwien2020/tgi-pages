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
function subtractBitArray(a: ReadonlyArray<boolean>, b: ReadonlyArray<boolean>) {
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
function compareBinaryArray(a: ReadonlyArray<boolean>, aDecimalPoint: number, b: ReadonlyArray<boolean>, bDecimalPoint: number) {
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

export function arraysEqual(arr1: Array<any>, arr2: Array<any>): boolean {
  if (arr1 === arr2) {
    return true;
  }
  if (arr1 === null || arr2 === null || arr1.length !== arr2.length) {
    return false;
  }

  for (let i in arr1) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
// Tests
/*
console.log(arraysEqual([1,2,3], [1,2,3]));
console.log(arraysEqual([1,2,3], [1,2,2]));
console.log(arraysEqual([1,2,3], [3,2,1]));
console.log(arraysEqual([1,2,3], [1,3,2]));
console.log(arraysEqual([1,2,3], ["1","2","3"]));
console.log(arraysEqual([], []));
console.log(arraysEqual([1, 2, "3"], [1, 2, 3]));
*/

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
   * Tells you where the decimal point is, starting from the end
   */
  public readonly decimalPoint: number;

  constructor(isNegative: boolean, value: ReadonlyArray<boolean>, decimalPoint: number) {
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
      const bitArrayPlusOne = new BinaryNumber(false, bitArray, 0).add(oneInBinary);

      return new BinaryNumber(isNegative, bitArrayPlusOne.value, 0);
    } else {
      return new BinaryNumber(isNegative, bitArray, 0);
    }
  }

  static fromOffsetBinary(value: ReadonlyArray<boolean>, offset: ReadonlyArray<boolean>) {
    return new BinaryNumber(false, value, 0).subtract(new BinaryNumber(false, offset, 0));
  }

  static fromIEEENumber(n: IEEENumber, removeLeadingZeros: boolean = true): BinaryNumber {
    const number = new BinaryNumber(n.isNegative, n.implicit.concat(n.value).concat([n.guardBit, n.roundBit, n.stickyBit]), 0);
    return removeLeadingZeros ? number.removeLeadingZeros() : number;
  }

  static fromIEEEMantissa(n: IEEENumber, removeLeadingZeros: boolean = true): BinaryNumber {
    const number = new BinaryNumber(n.isNegative, n.implicit.concat(n.value), 0);
    return removeLeadingZeros ? number.removeLeadingZeros() : number;
  }

  removeLeadingZeros(): BinaryNumber {
    let arr = this.value as boolean[];
    let i = 0;
    for (let val of arr) {
      if (val) {
        break;
      }
      i++;
    }
    if (i === arr.length - 1) i--;
    return new BinaryNumber(this.isNegative, arr.slice(i), this.decimalPoint);
  }

  static fromDecimal(decimal: number): BinaryNumber {
    const sign = decimal < 0;

    let beforeDecimal = 0, afterDecimal = 0;
    if (decimal !== Math.trunc(decimal)) {
      afterDecimal = decimal - Math.trunc(decimal);
    }
    beforeDecimal = Math.trunc(decimal);
    let decimalPoint = 0;

    let arr: boolean[] = [];
    while (beforeDecimal !== 0) {
      beforeDecimal /= 2;
      const number = beforeDecimal - Math.trunc(beforeDecimal);
      beforeDecimal = Math.trunc(beforeDecimal);
      arr = [number !== 0].concat(arr);
    }
    while (afterDecimal != 0) {
      decimalPoint++;
      afterDecimal *= 2;
      const number = Math.trunc(afterDecimal);
      afterDecimal = afterDecimal - Math.trunc(afterDecimal);
      arr = arr.concat([number !== 0]);
    }

    return new BinaryNumber(sign, arr, decimalPoint);
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
    if (length > this.value.length - this.decimalPoint || lengthOfFractional > this.decimalPoint) {
      const paddingLeft: boolean[] = new Array(length - (this.value.length - this.decimalPoint)).fill(false);
      const paddingRight: boolean[] = new Array(lengthOfFractional - this.decimalPoint).fill(false);

      return new BinaryNumber(this.isNegative, paddingLeft.concat(this.value).concat(paddingRight), lengthOfFractional);
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
    return new BinaryNumber(this.isNegative, this.value.slice(skipZeros), this.decimalPoint);
  }

  add(other: BinaryNumber): BinaryNumber {
    let a = this as BinaryNumber;
    let b = other;

    // Pad the numbers
    const paddingBeforeDecimal = Math.max(a.value.length - a.decimalPoint, b.value.length - b.decimalPoint);
    const paddingAfterDecimal = Math.max(a.decimalPoint, b.decimalPoint);
    a = a.extend(paddingBeforeDecimal, paddingAfterDecimal);
    b = b.extend(paddingBeforeDecimal, paddingAfterDecimal);

    if (a.isNegative == b.isNegative) {
      // a and b have the same sign
      return new BinaryNumber(a.isNegative, addBitArray(a.value, b.value), a.decimalPoint);
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
        return new BinaryNumber(a.isNegative, subtractBitArray(a.value, b.value), a.decimalPoint);
      } else {
        // b is larger than a
        return new BinaryNumber(b.isNegative, subtractBitArray(b.value, a.value), b.decimalPoint);
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

    return new BinaryNumber(xor(this.isNegative, other.isNegative), resultBits.value, this.decimalPoint + other.decimalPoint);
  }

  multiplyByPowerOfTwo(value: number) {
    if (value == 0) return this;
    if (value > 0) {
      // Make number larger
      if (this.decimalPoint - value >= 0) {
        return new BinaryNumber(this.isNegative, this.value, this.decimalPoint - value);
      } else {
        const paddingArray = new Array(value - this.decimalPoint).fill(false);
        return new BinaryNumber(this.isNegative, this.value.concat(paddingArray), 0);
      }
    } else {
      // Make number smaller
      const shift = Math.abs(value);
      if (shift < this.value.length - this.decimalPoint) {
        return new BinaryNumber(this.isNegative, this.value, this.decimalPoint + shift);
      } else {
        const paddingArray = new Array(shift - (this.value.length - this.decimalPoint) + 1).fill(false);
        return new BinaryNumber(this.isNegative, paddingArray.concat(this.value), this.decimalPoint + shift);
      }
    }
  }

  divide(other: BinaryNumber, placesAfterDecimal: number): { result: BinaryNumber; remainder: boolean[]; divisionByZero: boolean } {
    // Shift the decimal points away
    const maxDecimal = Math.max(this.decimalPoint, other.decimalPoint);
    const a = this.setSign(false).multiplyByPowerOfTwo(maxDecimal);
    const b = other.setSign(false).multiplyByPowerOfTwo(maxDecimal).trimZerosBeforeDecimal();

    if (b.value.length <= 0) {
      return {
        result: new BinaryNumber(false, [], 0),
        remainder: [],
        divisionByZero: true,
      };
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
      result: new BinaryNumber(xor(this.isNegative, other.isNegative), resultBits, placesAfterDecimal),
      remainder: remainder.value.slice(),
      divisionByZero: false,
    };
  }

  compareTo(other: BinaryNumber): number {
    // a < b gets rewritten as a.compareTo(b) < 0
    if (this.isNegative == other.isNegative) {
      const comparison = compareBinaryArray(this.value, this.decimalPoint, other.value, other.decimalPoint);
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

  getDecimalValue(): Number {
    let val = 0;
    for (let i = 1; i <= this.value.length; ++i) {
      val += Math.pow(2, this.value.length - i - this.decimalPoint) * (this.value[i-1] ? 1 : 0);
    }
    return (this.isNegative ? -1 : 1) * val;
  }
}

export class IEEENumber {
  /**
   * The sign
   */
  public readonly isNegative: boolean;
  public readonly exponent: boolean[];
  public readonly implicit: boolean[];
  public readonly value: boolean[];

  public readonly guardBit: boolean;
  public readonly roundBit: boolean;
  public readonly stickyBit: boolean;

  isNormalized: boolean;

  public static zero(exponentSize: number, mantissaSize: number): IEEENumber {
    return new IEEENumber(false, new Array(exponentSize).fill(false), new Array(mantissaSize).fill(false), [false], false, false, false, true);
  }

  constructor(sign: boolean, exponent: boolean[], value: boolean[], implicit: boolean[], guardBit: boolean = false, roundBit: boolean = false, stickyBit: boolean = false, normalized: boolean = false) {
    this.isNegative = sign;
    this.exponent = exponent;
    this.value = value;
    this.implicit = implicit;
    this.guardBit = guardBit;
    this.roundBit = roundBit;
    this.stickyBit = stickyBit;
    this.isNormalized = normalized;
  }
  
  static fromBinaryNumber(n: BinaryNumber, exponent: boolean[], size: number): IEEENumber {
    return new IEEENumber(n.isNegative, exponent,
      n.value.slice(0, size),
      [exponent.every(v => v === false)],
      n.value.slice(size, size+1)[0], 
      n.value.slice(size+1, size+2)[0], 
      n.value.slice(size+2, size+3)[0]);
  }

  private static getNormalizedExponent(number1: IEEENumber, number2: IEEENumber): BinaryNumber {
    const n1: BinaryNumber = new BinaryNumber(false, number1.exponent, 0);
    const n2: BinaryNumber = new BinaryNumber(false, number2.exponent, 0);

    return (n1.compareTo(n2) > 0 ? n1 : n2);
  }

  normalizeExpression(other: IEEENumber): IEEENumber[] {
    return IEEENumber.normalizeExpression(this, other);
  }

  compareToAbs(other: IEEENumber): number {
    if (!arraysEqual(this.exponent, other.exponent)) {
      throw "Exponents do not match!";
    }
    return BinaryNumber.fromIEEENumber(this.setSign(false)).compareTo(BinaryNumber.fromIEEENumber(other.setSign(false)));
  }

  compareTo(other: IEEENumber): number {
    if (!arraysEqual(this.exponent, other.exponent)) {
      throw "Exponents do not match!";
    }    
    return BinaryNumber.fromIEEENumber(this).compareTo(BinaryNumber.fromIEEENumber(other));
  }

  static normalizeExpression(number1: IEEENumber, number2: IEEENumber): IEEENumber[] {
    const n1: BinaryNumber = new BinaryNumber(false, number1.exponent, 0);
    const n2: BinaryNumber = new BinaryNumber(false, number2.exponent, 0);
    const exponent = this.getNormalizedExponent(number1, number2);

    // diff1 = exponent - n1
    // diff2 = exponent - n2
    let diff1 = exponent.subtract(n1), diff2 = exponent.subtract(n2);

    let numbers = [number1, number2];
    
    if (diff1.isZero() && !diff2.isZero()) {
      // diff1 == 0 && diff2 != 0 => exponent of n2 is off (too small)
      let values = number2.value;
      // exponent [0..00] === [0..01]
      if (!n2.isZero()) {
        const moveBy = diff2.getDecimalValue();
        values = new Array<boolean>(Math.max(moveBy as number - 1, 0)).fill(false).concat(!number2.isNormalized).concat(number2.value);
      }
      numbers[1] = new IEEENumber(number2.isNegative, exponent.value as boolean[], 
        values.slice(0, number2.value.length),
        [false],
        values.slice(number2.value.length, number2.value.length + 3)[0],
        values.slice(number2.value.length, number2.value.length + 3)[1],
        values.slice(number2.value.length, number2.value.length + 3)[2]);
      numbers[1].isNormalized = true;
    } else if (diff2.isZero() && !diff1.isZero()) {
      // diff2 == 0 && diff1 != 0 => exponent of n1 is off (too small)
      let values = number1.value;
      // exponent [0..00] === [0..01]
      if (!n1.isZero()) {
        const moveBy = diff1.getDecimalValue();
        values = new Array<boolean>(Math.max(moveBy as number - 1, 0)).fill(false).concat(!number1.isNormalized).concat(number1.value);
      }
      numbers[0] = new IEEENumber(number1.isNegative, exponent.value as boolean[], 
        values.slice(0, number1.value.length),
        [false],
        values.slice(number1.value.length, number1.value.length + 3)[0],
        values.slice(number1.value.length, number1.value.length + 3)[1],
        values.slice(number1.value.length, number1.value.length + 3)[2]);
      numbers[0].isNormalized = true;
    }   

    // console.log(numbers, numbers.sort((a, b) => (a.compareToAbs(b))));
    return numbers.sort((a, b) => (a.compareToAbs(b)));
  }

  setSign(isNegative: boolean): IEEENumber {
    return new IEEENumber(isNegative, this.exponent, this.value, this.implicit, this.guardBit, this.roundBit, this.stickyBit, this.isNormalized);
  }

  static getExponentSize(binaryOperator: number): number {
    switch (binaryOperator) {
      case 16: return 5;
      case 32: return 8;
      case 64: return 11;
      case 128: return 15;
      default: return -1;
    }
  }

  isDenormalizedValue(): boolean {
    return new BinaryNumber(false, this.exponent, 0).isZero();
  }

  isZero(): boolean {
    return this.isDenormalizedValue() && BinaryNumber.fromIEEENumber(this).isZero();
  }

  isInfinity(): boolean {
    return this.exponent.every((v) => (v === true)) && this.value.every((v) => (v === true));
  }

  setNormalize(normalized: boolean): IEEENumber {
    this.isNormalized = normalized;
    return this;
  }

  negate(): IEEENumber {
    return this.setSign(!this.isNegative);
  }

  noRounding(): IEEENumber {
    return this.clone(true, true, true, false, this.isNormalized);
  }

  clone(withSign: boolean, withExponent: boolean, withMantissa: boolean, withRounds: boolean, isNormalized: boolean = false, mantissaValue: number = 0): IEEENumber {
    return new IEEENumber(withSign ? this.isNegative : false,
      withExponent ? this.exponent : new Array(this.exponent.length).fill(false), 
      withMantissa ? this.value : (mantissaValue === 0 ? new Array(this.value.length).fill(false) : 
        BinaryNumber.fromSize(this.value.length).add(BinaryNumber.fromDecimal(mantissaValue)).value as boolean[]),
      this.implicit,
      withRounds ? this.guardBit : false,
      withRounds ? this.roundBit : false,
      withRounds ? this.stickyBit : false).setNormalize(isNormalized);
  }

  round(mantissaSize: number): IEEENumber {
    let n: IEEENumber;
    let t: IEEENumber = this.noRounding();
    
    if (this.guardBit === false) {
      n = t;
    } else if (this.guardBit === true && (this.stickyBit || this.roundBit)) {
      n = t.increaseMantissaByOne(mantissaSize);
    } else if (this.value[-1] === false) {
      n = t
    } else {
      n = t.increaseMantissaByOne(mantissaSize);
    }
    
    return n.noRounding();
  }

  increaseMantissaByOne(mantissaSize: number): IEEENumber {
    const mantissa = BinaryNumber.fromIEEEMantissa(this).add(BinaryNumber.fromDecimal(1).setSign(this.isNegative)).value;
    const mantFrom = -mantissaSize + 1;    
    
    return new IEEENumber(this.isNegative, this.exponent, mantissa.slice(mantFrom), mantissa.slice(0, mantFrom), false, false, false, this.exponent.every(v => v === false));
  }

  normalizeMantissa(mantissaSize: number): IEEENumber {
    let res = this.value.concat([this.guardBit, this.roundBit, this.stickyBit]);
    
    let exponent, mantissa, implicit;
    
    if (this.implicit.length > 1) {
      // mantissa too big -> increase exponent
      const diff = this.implicit.length - 1;
      
      exponent = new BinaryNumber(false, this.exponent, 0).add(BinaryNumber.fromDecimal(diff)).value;
      mantissa = this.implicit.slice(1).concat(res).slice(0, mantissaSize + 3 - 1);
    } else if (this.isZero()) {
      mantissa = Array(mantissaSize + 2).fill(false);
      exponent = this.exponent;
    } else {
      let diff = 0;
      mantissa = res;
      exponent = this.exponent;
      
      if (!this.implicit[0]) {
        for (let v of res) {
          let e: BinaryNumber = new BinaryNumber(false, exponent, 0);
          if (v === false && e.compareTo(BinaryNumber.fromDecimal(1)) >= 0) {
            exponent = e.subtract(BinaryNumber.fromDecimal(1)).value;
            implicit = [!exponent.every(v => v === false)];
            if (implicit[0]) {
              mantissa = mantissa.slice(1);
            }
            diff++;
          }
          else break;
        }
      }
    
      mantissa = mantissa.concat(new Array(Math.max(mantissaSize - (mantissa.length - 2), 0)).fill(false));
    }
    
    return new IEEENumber(this.isNegative, exponent as boolean[], mantissa.slice(0, -3), implicit || this.implicit.slice(0, 1), mantissa.slice(-3)[0], mantissa.slice(-3)[1], mantissa.slice(-3)[2], exponent.every(v => v === false));
  }

  multiply(other: IEEENumber, eValue: number, mantissaSize: number): IEEENumber {
    let newExponent = BinaryNumber.fromOffsetBinary(this.exponent, []).add(BinaryNumber.fromOffsetBinary(other.exponent, [])).subtract(BinaryNumber.fromDecimal(eValue));
    if (newExponent.isNegative) {
      // exponent too small -> result is zero
      return IEEENumber.zero(newExponent.value.length, mantissaSize);
    }
    const exponent = newExponent.value;
    let mantissa = BinaryNumber.fromIEEENumber(this).multiply(BinaryNumber.fromIEEENumber(other)).value;

    if (2 * BinaryNumber.fromIEEENumber(this).value.length === mantissa.length) {
      // two implicit bits, three bits for rounding (guard, round, sticky)
      mantissa = mantissa.slice(0, mantissaSize + 5 - 1);
    } else {
      // one implicit bit, three bits for rounding (guard, round, sticky)
      mantissa = mantissa.slice(0, mantissaSize + 4 - 1);
    }

    const m = mantissa.slice(Math.max(-mantissa.length, -2 - mantissaSize), -3);
    const grs = mantissa.slice(-3);
    const i = mantissa.slice(0, Math.max(-mantissa.length, -2 - mantissaSize));
    
    return new IEEENumber(this.isNegative !== other.isNegative, exponent as boolean[], m, i || [false], grs[0], grs[1], grs[2], exponent.every(v => v === false) || i.length > 0);
  }

  subtract(other: IEEENumber, mantissaSize: number): IEEENumber {
    // A - B = A + (-B)
    return this.add(other.negate(), mantissaSize);
  }

  add(other: IEEENumber, mantissaSize: number): IEEENumber {
    const numbers = this.normalizeExpression(other);
    let result, isNegative;

    if (numbers[0].isNegative !== numbers[1].isNegative) {
      // only one of the numbers is negative -> numbers[0] is always smaller
      result = BinaryNumber.fromIEEENumber(numbers[1].setSign(false)).subtract(BinaryNumber.fromIEEENumber(numbers[0].setSign(false)));
      isNegative = numbers[1].isNegative;
    } else {
      result = BinaryNumber.fromIEEENumber(numbers[0]).add(BinaryNumber.fromIEEENumber(numbers[1]));
      isNegative = numbers[1].isNegative;
    }
    let exponent = numbers[0].exponent;
    let mantissa = result.value;

    const m = mantissa.slice(Math.max(-mantissa.length, -2 - mantissaSize), -3);
    const grs = mantissa.slice(-3);
    const i = mantissa.slice(0, Math.max(-mantissa.length, -2 - mantissaSize));

    return new IEEENumber(isNegative, exponent as boolean[], m, i || [false], grs[0], grs[1], grs[2], exponent.every(v => v === false) || i.length > 0);
  }
}
