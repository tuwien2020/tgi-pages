<template>
  <div>
    <h1>Base-Converter</h1>
    <!-- TODO: Proper user input (not scuffed)-->
    <label>
      Zahl
      <input type="text" v-model="numberToConvert" />
      Von Basis
      <input type="number" v-model="fromBase" />
      Zu Basis
      <input type="number" v-model="toBase" />
      {{ result }}
    </label>

    <h1>Calculate in base N</h1>
    <label>
      Base:
      <input type="number" v-model="baseForCalculations" />
    </label>
    <br />
    <input type="text" v-model="valueA" /> + <input type="text" v-model="valueB" /> = {{ calculationResult }}
    <br />
    <input type="text" v-model="valueA" /> * <input type="text" v-model="valueB" /> = {{ multiplicationResult }}
    <br />
    <input type="text" v-model="valueA" /> / <input type="text" v-model="valueB" /> = {{ divisionResult }}
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, shallowRef, ComputedRef, unref, Ref, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function xor(a: boolean, b: boolean) {
  // Alternatively, you could use
  // return (a || b) && !(a && b)
  return a ? !b : b;
}

/**
 * Adds two binary arrays that have the same length.
 * Returns a larger array if there was an overflow
 */
function addNumberArray(a: ReadonlyArray<number>, b: ReadonlyArray<number>, base: number) {
  if (a.length !== b.length) throw new Error("Not equal lengths");

  const result: number[] = new Array(a.length).fill(0);

  // Adding binary numbers requires you to visit them backwards
  let carry = 0;
  for (let i = a.length - 1; i >= 0; i--) {
    const sum = a[i] + (b[i] + carry);

    result[i] = sum % base;
    carry = Math.floor(sum / base);
  }

  if (carry > 0) {
    result.unshift(carry);
  }

  return result;
}

/**
 * Subtracts two binary arrays that have the same length
 * a must be larger than b
 * TODO: Handle underflow?
 */
function subtractNumberArray(a: ReadonlyArray<number>, b: ReadonlyArray<number>, base: number) {
  if (a.length !== b.length) throw new Error("Not equal lengths");
  const result: number[] = new Array(a.length).fill(0);

  // We could also just add the numbers and drop the leading one
  // https://www.youtube.com/watch?v=PS5p9caXS4U

  // Subtracting binary numbers requires you to visit them backwards
  let carry = 0;
  for (let i = a.length - 1; i >= 0; i--) {
    const diff = a[i] - (b[i] + carry);
    if (diff >= 0) {
      result[i] = mod(diff, base);
      carry = 0;
    } else {
      result[i] = mod(diff, base);
      carry = Math.ceil(-diff / base);
    }
  }

  return result;
}
/**
 * Compares two number arrays, used for IntegerWithBase
 */
function compareNumberArray(a: ReadonlyArray<number>, b: ReadonlyArray<number>) {
  // a > b would be rewritten as compareNumberArray(a,b) > 0
  const maxBeforeDecimal = Math.max(a.length, b.length);
  const aOffset = maxBeforeDecimal - a.length;
  const bOffset = maxBeforeDecimal - b.length;

  const until = Math.max(a.length + aOffset, b.length + bOffset);
  for (let i = 0; i < until; i++) {
    const aIndex = i - aOffset;
    const bIndex = i - bOffset;
    const valueA = 0 <= aIndex && aIndex < a.length ? a[i - aOffset] : 0;
    const valueB = 0 <= bIndex && bIndex < b.length ? b[i - bOffset] : 0;
    if (valueA > valueB) {
      return 1;
    }
    if (valueA < valueB) {
      return -1;
    }
  }
  return 0;
}

/**
 * A whole number with an arbitrary base
 * TODO: Reduce code duplication with binary-number
 */
class IntegerWithBase {
  public readonly base: number;
  public readonly isNegative: boolean;
  private value: number[]; // TODO: Always guarantee that value has a length of at least one?

  constructor(value: string, base: number);
  constructor(isNegative: boolean, value: number[], base: number);
  constructor(valueOrIsNegative: string | boolean, baseOrValue: number | number[], nothingOrBase?: number) {
    if (typeof valueOrIsNegative === "string" && typeof baseOrValue === "number") {
      this.base = baseOrValue;
      this.isNegative = valueOrIsNegative.startsWith("-");
      this.value = valueOrIsNegative
        .replace(/^-/, "")
        .split("")
        .map((v) => this.parseCharacter(v));
    } else if (typeof nothingOrBase === "number" && typeof valueOrIsNegative === "boolean" && Array.isArray(baseOrValue)) {
      this.base = nothingOrBase;
      this.isNegative = valueOrIsNegative;
      this.value = baseOrValue.slice();
    } else {
      throw new Error("Invalid args");
    }

    if (this.value.length < 1) {
      this.value = [0];
    }
  }

  private parseCharacter(c: string): number {
    if (c.length != 1) throw new Error("Invalid character");

    const charCode = c.toLowerCase().charCodeAt(0);
    let result;
    if (charCode >= "0".charCodeAt(0) && charCode <= "9".charCodeAt(0)) {
      result = charCode - "0".charCodeAt(0);
    } else if (charCode >= "a".charCodeAt(0) && charCode <= "z".charCodeAt(0)) {
      result = charCode - "a".charCodeAt(0) + 10;
    } else {
      throw new Error("Invalid character");
    }

    if (result >= this.base) {
      throw new Error("Invalid character");
    }
    return result;
  }

  add(other: IntegerWithBase): IntegerWithBase {
    if (other.base != this.base) throw new Error("Cannot perform mixed-base arithmetic");

    // TODO: Output which part of that is padding
    let a = this as IntegerWithBase;
    let b = other;
    const padding = Math.max(a.value.length, b.value.length);
    a = a.extend(padding);
    b = b.extend(padding);

    if (a.isNegative == b.isNegative) {
      // a and b have the same sign
      return new IntegerWithBase(a.isNegative, addNumberArray(a.value, b.value, a.base), a.base);
    } else {
      // Test cases
      // -10 + 1   => -
      // 1 + (-10) => -
      // 10 + (-1) => +
      // -1 + 10   => +
      // -10 + 10  => 0
      const comparison = compareNumberArray(a.value, b.value);
      if (comparison === 0) {
        // zero
        return new IntegerWithBase(false, [], a.base);
      } else if (comparison > 0) {
        // a is larger than b
        return new IntegerWithBase(a.isNegative, subtractNumberArray(a.value, b.value, a.base), a.base);
      } else {
        // b is larger than a
        return new IntegerWithBase(b.isNegative, subtractNumberArray(b.value, a.value, a.base), b.base);
      }
    }
  }

  subtract(other: IntegerWithBase): IntegerWithBase {
    const negatedOther = other.setSign(!other.isNegative);
    return this.add(negatedOther);
  }

  multiply(other: IntegerWithBase): IntegerWithBase {
    if (other.base != this.base) throw new Error("Cannot perform mixed-base arithmetic");
    if (other.isZero()) return new IntegerWithBase(false, [0], this.base);

    // Visit other backwards, take the value
    // multiply and shift by i++
    // add to result

    let result = new IntegerWithBase(false, [0], this.base);

    let shift = 0;
    for (let i = other.value.length - 1; i >= 0; i--) {
      const valueB = other.value[i];
      // TODO: "return" those values
      const valueToAdd = new IntegerWithBase(
        false,
        this.value.map((v) => v * valueB),
        this.base
      ).shiftLeft(shift);
      result = result.add(valueToAdd);
      shift += 1;
    }

    // Set the correct sign
    result = result.setSign(xor(this.isNegative, other.isNegative));

    return result;
  }

  /**
   * Whole number division. If you want the fractional part, first shift the number to the left.
   */
  divide(other: IntegerWithBase): { result: IntegerWithBase; remainder: IntegerWithBase; divisionByZero: boolean } {
    if (other.base != this.base) throw new Error("Cannot perform mixed-base arithmetic");

    const sign = xor(this.isNegative, other.isNegative);

    const comparison = compareNumberArray(this.value, other.value);
    if (comparison < 0) {
      return {
        result: new IntegerWithBase(false, [0], this.base),
        remainder: this.clone().setSign(sign),
        divisionByZero: false,
      };
    }

    if (other.isZero()) {
      return {
        result: new IntegerWithBase(false, [0], this.base),
        remainder: new IntegerWithBase(false, [0], this.base),
        divisionByZero: true,
      };
    }

    // Do long division
    const resultDigits: number[] = [];
    let remainder = new IntegerWithBase(false, [0], 0);

    for (let i = 0; i < this.value.length; i++) {
      // Pull down the next value
      const nextValue = this.value[i];
      remainder = new IntegerWithBase(false, remainder.value.concat(nextValue), this.base);

      // Compute the result at this place (how many times can we subtract)
      let result = 0;
      while (remainder.compareTo(other) >= 0) {
        remainder = remainder.subtract(other);
        result++;
      }

      resultDigits.push(result);
    }

    return {
      result: new IntegerWithBase(sign, resultDigits, this.base),
      remainder: remainder,
      divisionByZero: false,
    };
  }

  /**
   * Shifts a number to the left, same as multiplying by the base.
   * Makes the number larger.
   */
  shiftLeft(places: number): IntegerWithBase {
    if (places == 0) return this.clone();
    if (places > 0) {
      const paddingArray = new Array(places).fill(0);
      return new IntegerWithBase(this.isNegative, this.value.concat(paddingArray), this.base);
    } else {
      throw new Error("Places cannot be negative");
    }
  }

  clone() {
    return new IntegerWithBase(this.isNegative, this.value, this.base);
  }

  extend(length: number) {
    if (length > this.value.length) {
      const paddingLeft: number[] = new Array(length - this.value.length).fill(0);
      return new IntegerWithBase(this.isNegative, paddingLeft.concat(this.value), this.base);
    } else {
      return this;
    }
  }

  trimLeadingZeros() {
    let skipZeros = 0;
    for (let i = 0; i < this.value.length; i++) {
      const bit = this.value[skipZeros];
      if (bit === 0) {
        skipZeros++;
      } else {
        break;
      }
    }
    return new IntegerWithBase(this.isNegative, this.value.slice(skipZeros), this.base);
  }

  setSign(isNegative: boolean): IntegerWithBase {
    return new IntegerWithBase(isNegative, this.value, this.base);
  }

  isZero(): boolean {
    return this.value.every((v) => v === 0);
  }

  compareTo(other: IntegerWithBase): number {
    // a < b gets rewritten as a.compareTo(b) < 0
    if (this.isNegative == other.isNegative) {
      const comparison = compareNumberArray(this.value, other.value);
      if (comparison == 0) {
        return 0;
      } else {
        return this.isNegative ? -comparison : comparison;
      }
    } else {
      return this.isNegative ? -1 : 1;
    }
  }

  toString() {
    const digits =
      this.base <= 9 + 26
        ? this.value.map((v) => (v <= 9 ? v + "" : String.fromCharCode("a".charCodeAt(0) + (v - 10)))).join("")
        : "[" + this.value.join(",") + "]";
    return `(${this.isNegative ? "-" : ""}${digits})_${this.base}`;
  }
}

export default defineComponent({
  components: {},
  setup() {
    const numberToConvert = ref("");
    const fromBase = ref(10);
    const toBase = ref(2);
    const result = computed(() => {
      try {
        let n = new IntegerWithBase(numberToConvert.value, fromBase.value);
        return n;
      } catch (e) {
        return e + "";
      }
    });

    const baseForCalculations = ref(10);
    const valueA = ref("");
    const valueB = ref("");
    const calculationResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        return a.add(b);
      } catch (e) {
        return e + "";
      }
    });

    const multiplicationResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        return a.multiply(b);
      } catch (e) {
        return e + "";
      }
    });

    const divisionResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        return a.divide(b);
      } catch (e) {
        return e + "";
      }
    });

    return {
      numberToConvert,
      fromBase,
      toBase,
      result,
      baseForCalculations,
      valueA,
      valueB,
      calculationResult,
      multiplicationResult,
      divisionResult,
    };
  },
});
</script>
