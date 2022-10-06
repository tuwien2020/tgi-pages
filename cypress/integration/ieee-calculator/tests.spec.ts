import { IEEENumber } from "../../../src/math/binary-number";
let rand: any = [];
let results: any = {};

const numberOfCalculations = 100;

const getRand = (size: any, exp: any) => {
  rand = [];
  for (let i = 0; i < 2; ++i) {
    // 2 numbers
    rand[i] = {};
    rand[i].sign = Math.random() < 0.5 ? "0" : "1";
    rand[i].mantissa = Array.from({ length: size }, () => (Math.random() < 0.5 ? "0" : "1"));
    rand[i].exponent = Array.from({ length: exp }, () => (Math.random() < 0.5 ? "0" : "1"));
  }
  return rand;
};

const printNumber = (number: IEEENumber) => {
  return (number.isNegative ? "1" : "0") + number.exponent.map((v) => (v ? "1" : "0")).join("") + number.value.map((v) => (v ? "1" : "0")).join("");
};

const generateIEEE = (value: any) => {
  return new IEEENumber(
    +value.sign === 1,
    value.exponent.map((v: any) => +v === 1),
    value.mantissa.map((v: any) => +v === 1),
    [!value.exponent.every((v: any) => +v === 0)],
    false,
    false,
    false,
    value.exponent.every((v: any) => v === 0)
  );
};

type operation = "plus" | "minus" | "times" | "divide";

const calcNumber = (op: operation, n1: IEEENumber, n2: IEEENumber, mantissaSize: number, exponentSize: number) => {
  cy.get("#sign1")
    .clear()
    .type(n1.isNegative ? "1" : "0");
  cy.get("#mantissa1")
    .clear()
    .type(n1.value.map((v) => (v ? "1" : "0")).join(""));
  cy.get("#exp1")
    .clear()
    .type(n1.exponent.map((v) => (v ? "1" : "0")).join(""));
  cy.get("#sign2")
    .clear()
    .type(n2.isNegative ? "1" : "0");
  cy.get("#mantissa2")
    .clear()
    .type(n2.value.map((v) => (v ? "1" : "0")).join(""));
  cy.get("#exp2")
    .clear()
    .type(n2.exponent.map((v) => (v ? "1" : "0")).join(""));
  cy.get(`#${op}Button`)
    .click()
    .then(() => {
      readNumber();
    })
    .then(() => {
      let r1: IEEENumber = IEEENumber.zero(5, mantissaSize),
        r2: IEEENumber = IEEENumber.zero(5, mantissaSize),
        res: IEEENumber = IEEENumber.zero(5, mantissaSize);
      if (op === "plus") {
        res = n1.add(n2, mantissaSize);
      } else if (op === "minus") {
        res = n1.subtract(n2, mantissaSize);
      } else if (op === "times") {
      } else {
      }
      r1 = res.normalizeMantissa(mantissaSize).noRounding();
      r2 = res.normalizeMantissa(mantissaSize).round(mantissaSize).normalizeMantissa(mantissaSize);
      console.log(printNumber(n1) + (op === "plus" ? "+" : op === "minus" ? "-" : op === "times" ? "*" : "/") + printNumber(n2));
      console.log(n1, n2, res);
      console.log(r1, r2, generateIEEE(results));
      if (r2.compareTo(generateIEEE(results)) !== 0) {
        expect(r1.compareTo(generateIEEE(results))).to.equal(0);
      } else {
        expect(r2.compareTo(generateIEEE(results))).to.equal(0);
      }
    });
};

const readNumber = () => {
  results = {};
  cy.get("#sign3")
    .should(($input) => {
      const val: any = $input.val();
      results.sign = +val;
    })
    .then(() => {
      cy.get("#mantissa3").should(($input) => {
        const val: any = $input.val();
        results.mantissa = val.split("");
      });
    })
    .then(() => {
      cy.get("#exp3").should(($input) => {
        const val: any = $input.val();
        results.exponent = val.split("");
      });
    });
};

describe("addition", () => {
  it("adds random 16-bit numbers on weitz calculator and compares them to the results of our ieee-calculator", () => {
    console.log("------- ADDITION --------");
    console.log("");
    console.log("");

    cy.visit("http://weitz.de/ieee/");
    rand = [];
    results = {};
    cy.get("#sizeButton16")
      .click()
      .then(async () => {
        for (let i = 0; i < numberOfCalculations; ++i) {
          rand = getRand(10, 5);
          let n1 = generateIEEE(rand[0]);
          let n2 = generateIEEE(rand[1]);
          calcNumber("plus", n1, n2, 11, 5);
        }
      });
  });
});

describe("subtraction", () => {
  it("calculates random 16-bit numbers on weitz calculator and compares them to the results of our ieee-calculator", () => {
    console.log("------- SUBTRACTION --------");
    console.log("");
    console.log("");

    cy.visit("http://weitz.de/ieee/");
    rand = [];
    results = {};
    cy.get("#sizeButton16")
      .click()
      .then(async () => {
        for (let i = 0; i < numberOfCalculations; ++i) {
          rand = getRand(10, 5);
          let n1 = generateIEEE(rand[0]);
          let n2 = generateIEEE(rand[1]);
          calcNumber("minus", n1, n2, 11, 5);
        }
      });
  });
});
