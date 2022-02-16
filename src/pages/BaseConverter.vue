<template>
  <div>
    <h1>t("page.baseConverter.baseConverter")</h1>
    <table class="input-table">
      <tbody>
        <tr>
          <td class="right-align">
            <label> t("page.baseConverter.fromBase") <input type="number" v-model="fromBase" class="basis-field" min="1" step="1" /></label>
          </td>
          <td>
            <label> t("page.baseConverter.number") <input type="text" v-model="numberToConvert" placeholder="42.0" /> </label>
          </td>
        </tr>
        <tr>
          <td class="right-align">
            <label> t("page.baseConverter.toBase") <input type="number" v-model="toBase" class="basis-field" min="1" step="1" /></label>
          </td>
          <td>= {{ result }}</td>
        </tr>
      </tbody>
    </table>

    <h1>t("page.baseConverter.baseCalculator") {{ baseForCalculations }}</h1>
    <label>
      t("page.baseConverter.base")
      <input type="number" v-model="baseForCalculations" class="basis-field" />
    </label>
    <table class="input-table">
      <tbody>
        <tr>
          <td><input type="text" v-model="valueA" /></td>
          <td>+</td>
          <td><input type="text" v-model="valueB" /></td>
          <td>= {{ additionResult }}</td>
        </tr>
        <tr>
          <td><input type="text" v-model="valueA" /></td>
          <td>-</td>
          <td><input type="text" v-model="valueB" /></td>
          <td>= {{ subtractionResult }}</td>
        </tr>
        <tr>
          <td><input type="text" v-model="valueA" /></td>
          <td>*</td>
          <td><input type="text" v-model="valueB" /></td>
          <td>= {{ multiplicationResult }}</td>
        </tr>
        <tr>
          <td><input type="text" v-model="valueA" /></td>
          <td>/</td>
          <td><input type="text" v-model="valueB" /></td>
          <td>= {{ divisionResult }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, shallowRef, ComputedRef, unref, Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useUrlRef } from "../url-ref";

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function xor(a: boolean, b: boolean) {
  // Alternatively, you could use
  // return (a || b) && !(a && b)
  return a ? !b : b;
}

/**
 * Adds two number arrays that have the same length.
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
 * Multiplies a numbmer array with a single digit.
 * Returns a larger array if there was an overflow.
 */
function multiplyNumberArray(a: ReadonlyArray<number>, value: number, base: number) {
  if (value >= base) throw new Error("Only values that are smaller than the base are supported");

  const result: number[] = new Array(a.length).fill(0);

  let carry = 0;
  for (let i = a.length - 1; i >= 0; i--) {
    const product = a[i] * value + carry;

    result[i] = product % base;
    carry = Math.floor(product / base);
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
      if (this.base <= 0) {
        throw new Error("Invalid base");
      }
      this.isNegative = valueOrIsNegative.startsWith("-");
      this.value = valueOrIsNegative
        .replace(/^-/, "")
        .split("")
        .map((v) => this.parseCharacter(v));
    } else if (typeof nothingOrBase === "number" && typeof valueOrIsNegative === "boolean" && Array.isArray(baseOrValue)) {
      this.base = nothingOrBase;
      if (this.base <= 0) {
        throw new Error("Invalid base");
      }
      this.isNegative = valueOrIsNegative;
      this.value = baseOrValue.slice();
      for (let i = 0; i < this.value.length; i++) {
        if (this.value[i] < 0 || this.value[i] >= this.base) {
          console.log([this.value, this.base]);
          throw new Error("Invalid value");
        }
      }
    } else {
      throw new Error("Invalid args");
    }

    if (this.value.length < 1) {
      this.value = [0];
    }
  }

  static fromNumber(value: number, targetBase: number): IntegerWithBase {
    if (targetBase < 2) throw new Error("Target base cannot be less than 2");
    let digits: number[] = [];
    let isNegative = value < 0;
    value = Math.abs(value);
    while (value > 0) {
      digits.unshift(value % targetBase);
      value = Math.floor(value / targetBase);
    }
    return new IntegerWithBase(isNegative, digits, targetBase);
  }

  private parseCharacter(c: string): number {
    if (c.length != 1) throw new Error("Invalid character");

    const charCode = c.toLowerCase().charCodeAt(0);
    let result;
    if (charCode >= "0".charCodeAt(0) && charCode <= "9".charCodeAt(0)) {
      result = charCode - "0".charCodeAt(0);
    } else if (charCode >= "a".charCodeAt(0) && charCode <= "z".charCodeAt(0)) {
      result = charCode - "a".charCodeAt(0) + 10;
      // "z" ends up being 35
    } else {
      throw new Error("Invalid character");
    }

    if (result >= this.base) {
      throw new Error("Invalid character");
    }
    return result;
  }

  private static trimLeadingZeros(value: number[]) {
    let skipZeros = 0;
    for (let i = 0; i < value.length; i++) {
      const bit = value[skipZeros];
      if (bit === 0) {
        skipZeros++;
      } else {
        break;
      }
    }
    return value.slice(skipZeros);
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
      const valueToAdd = new IntegerWithBase(false, multiplyNumberArray(this.value, valueB, this.base), this.base).shiftLeft(shift);
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
    let remainder = new IntegerWithBase(false, [0], this.base);

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
      result: new IntegerWithBase(sign, resultDigits, this.base).trimLeadingZeros(),
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

  convertToBase(toBase: number) {
    // Using Horner's method as described here: https://math.stackexchange.com/a/111161
    let result = new IntegerWithBase(false, [0], toBase);
    let toBaseIntger = IntegerWithBase.fromNumber(this.base, toBase);
    for (let i = 0; i < this.value.length; i++) {
      // "Shift"
      result = result.multiply(toBaseIntger);
      // And add, notice how we're doing all the calculations in the target base
      result = result.add(IntegerWithBase.fromNumber(this.value[i], toBase));
    }

    result = result.setSign(this.isNegative);
    return result.trimLeadingZeros();
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
    return new IntegerWithBase(this.isNegative, IntegerWithBase.trimLeadingZeros(this.value), this.base);
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

  getValue() {
    return this.value.slice();
  }

  static formatValue(value: number[], base: number) {
    value = IntegerWithBase.trimLeadingZeros(value);
    return base <= 10 + 26
      ? value.map((v) => (v <= 9 ? v + "" : String.fromCharCode("A".charCodeAt(0) + (v - 10)))).join("")
      : "[" + value.join(",") + "]";
  }

  toString(withBase: boolean = true) {
    const digits = IntegerWithBase.formatValue(this.value, this.base);
    const numberText = `${this.isNegative ? "-" : ""}${digits}`;
    return withBase ? `(${numberText})_${this.base}` : numberText;
  }
}

export default defineComponent({
  components: {},
  setup() {
    // Note: Feel free to use Wolfram Alpha to validate the results
    // https://www.wolframalpha.com/input/?i=%2834%29_7+to+base+2
    const router = useRouter();
    const route = useRoute();
    const { urlRef } = useUrlRef(router, route);
    const { t } = useI18n();

    const numberToConvert = urlRef("value", "");
    const fromBase = urlRef("from-base", 10);
    const toBase = urlRef("to-base", 2);
    const result = computed(() => {
      if (!/[+-]?[0-9a-zA-Z]*(\.[0-9a-zA-Z]*)?/.test(numberToConvert.value)) {
        return t("page.baseConverter.invalidNumber");
      }

      try {
        let [beforeDecimal, afterDecimal] = numberToConvert.value.split(".");

        // Might be negative
        let beforeDecimalInteger = new IntegerWithBase(beforeDecimal, fromBase.value).convertToBase(toBase.value);

        const digits = IntegerWithBase.formatValue(beforeDecimalInteger.getValue(), beforeDecimalInteger.base);
        let result = `${beforeDecimalInteger.isNegative ? "-" : ""}${digits}`;

        if (afterDecimal) {
          // Shift/multiply by N, which is the decimal places we want
          // Do division by (source base)**(number of places)
          // Now since we did a whole number division, the "." is at the end
          // Finally, shift the "." to the left by N places

          let extraPlaces = 20; // TODO: Be configureable?
          let numberOfPlaces = afterDecimal.length + extraPlaces;
          let afterDecimalInteger = new IntegerWithBase(afterDecimal, fromBase.value).convertToBase(toBase.value);

          let fromBaseInteger = IntegerWithBase.fromNumber(fromBase.value, toBase.value);
          let divideBy = fromBaseInteger;
          for (let i = 1; i < afterDecimal.length; i++) {
            divideBy = divideBy.multiply(fromBaseInteger);
          }

          let divisionResult = afterDecimalInteger.shiftLeft(numberOfPlaces).divide(divideBy);
          if (divisionResult.divisionByZero) {
            return "Target base is zero";
          }

          // Here, we have to "shift" the imaginary comma, which is at the end of the number
          let afterDecimalValue = divisionResult.result.getValue();
          if (afterDecimalValue.length > numberOfPlaces) {
            throw new Error("This should never happen, the 'after decimal' result is wrong");
          }

          // We sometimes need to add a few zeroes at the beginning, like if we convert 0.0001 to another base
          afterDecimalValue = new Array<number>(numberOfPlaces - afterDecimalValue.length).fill(0).concat(afterDecimalValue);

          result += "." + IntegerWithBase.formatValue(afterDecimalValue, toBase.value) + "…";
        }

        return result;
      } catch (e) {
        return e + "";
      }
    });

    const baseForCalculations = urlRef("calc-base", 10);
    const valueA = urlRef("calc-value-a", "");
    const valueB = urlRef("calc-value-b", "");
    const additionResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        return a.add(b).toString(false);
      } catch (e) {
        return e + "";
      }
    });

    const subtractionResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        return a.subtract(b).toString(false);
      } catch (e) {
        return e + "";
      }
    });

    const multiplicationResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        return a.multiply(b).toString(false);
      } catch (e) {
        return e + "";
      }
    });

    const divisionResult = computed(() => {
      try {
        let a = new IntegerWithBase(valueA.value, baseForCalculations.value);
        let b = new IntegerWithBase(valueB.value, baseForCalculations.value);
        let result = a.divide(b);
        if (result.divisionByZero) {
          return t("page.baseConverter.divisionByZero");
        } else {
          return t("page.baseConverter.resultAndRemainder", { result: result.result.toString(false), remainder: result.remainder.toString(false) });
        }
      } catch (e) {
        return e + "";
      }
    });

    return {
      t,
      numberToConvert,
      fromBase,
      toBase,
      result,
      baseForCalculations,
      valueA,
      valueB,
      additionResult,
      subtractionResult,
      multiplicationResult,
      divisionResult,
    };
  },
});
</script>
<style scoped>
.input-table {
  width: auto;
}
.basis-field {
  width: 5em;
}
.right-align {
  text-align: right;
}
</style>
