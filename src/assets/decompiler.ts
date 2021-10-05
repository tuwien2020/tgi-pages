export interface ParsedInstruction {
  aMux: boolean;
  mbr: boolean;
  mar: boolean;
  rdWr: ReadWrite;
  ms: boolean;
  enS: boolean;
  cond: Condition;
  alu: Alu;
  sh: Shift;
  sBus: number;
  bBus: number;
  aBus: number;
  adr: number;
  originalInstruction: string;
}

export enum InstructionParts {
  aMux = "aMux",
  mbr = "mbr",
  mar = "mar",
  rdWr = "rdWr",
  ms = "ms",
  enS = "enS",
  cond = "cond",
  alu = "alu",
  sh = "sh",
  sBus = "sBus",
  bBus = "bBus",
  aBus = "aBus",
  adr = "adr",
}

export enum Condition {
  Never = 0,
  Negative = 1,
  Zero = 2,
  Everytime = 3
}

export enum Alu {
  Pass = 0,
  Plus = 1,
  And = 2,
  Negate = 3
}

export enum Shift {
  Never = 0,
  L = 1,
  R = 2,
  Invalid = 3
}

export enum ReadWrite {
  Read = 1,
  Write = 0
}

export function parse(binaryCode: string): ParsedInstruction {
  let getRange = (start: number, length: number): string => {
    let string = "";
    for (let i = 0; i < length; i++) {
      string += binaryCode[i + start];
    }
    return string;
  };

  let convertBinaryToDecimal = (binary: string): number => {
    let sum = 0;
    for (let i = 0; i < binary.length; i++) {
      sum += Math.pow(2, binary.length - 1 - i) * parseInt(binary[i]);
    }
    return sum;
  };
  let convertBitToBool = (bit: string): boolean => {
    return "1" === bit;
  };

  let aMux = convertBitToBool(getRange(0, 1));
  let cond = convertBinaryToDecimal(getRange(1, 2));
  let alu = convertBinaryToDecimal(getRange(3, 2));
  let sh = convertBinaryToDecimal(getRange(5, 2));
  let mbr = convertBitToBool(getRange(7, 1));
  let mar = convertBitToBool(getRange(8, 1));
  let rdWr = convertBinaryToDecimal(getRange(9, 1));
  let ms = convertBitToBool(getRange(10, 1));
  let enS = convertBitToBool(getRange(11, 1));
  let sBus = convertBinaryToDecimal(getRange(12, 4));
  let bBus = convertBinaryToDecimal(getRange(16, 4));
  let aBus = convertBinaryToDecimal(getRange(20, 4));
  let adr = convertBinaryToDecimal(getRange(24, 8));

  return {
    aMux,
    cond,
    alu,
    sh,
    mbr,
    mar,
    rdWr,
    ms,
    enS,
    sBus,
    bBus,
    aBus,
    adr,
    originalInstruction: binaryCode
  };
}

export function getRegistry(address: number): string {
  switch (address) {
    case 0:
      return "0";
    case 1:
      return "1";
    case 2:
      return "-1";
    case 3:
      return "PC";
    case 15:
      return "AC";
    default:
      return "R" + (address - 4);
  }
}

export function calc(a: string, b: string, inst: ParsedInstruction) {
  let s = "";
  switch (inst.alu) {
    case Alu.Pass:
      s = a;
      break;
    case Alu.Plus:
      s = a + " + " + b;
      break;
    case Alu.And:
      s = a + " & " + b;
      break;
    case Alu.Negate:
      s = "~" + a;
      break;
  }
  switch (inst.sh) {
    case Shift.L:
      s = "lsh(" + s + ")";
      break;
    case Shift.R:
      s = "rsh(" + s + ")";
      break;
  }
  return s;
}

export interface Check {
  correct: boolean;
  message: string;
}

export function checkInput(input: string, inst: ParsedInstruction): Check {
  let check = { correct: true, message: "" };

  if (input.length != 32) {
    check.correct = false;
    check.message += `instruction should be 32 bit long, currently it is ${input.length}; `;
  }

  for (let c of input) {
    if (c != "0" && c != "1") {
      check.correct = false;
      check.message += 'instruction should only contain "0" and "1" as characters; ';
      break;
    }
  }

  if (inst.sh == 3) {
    check.correct = false;
    check.message += "shift cannot be 11; ";
  }

  if(inst.enS && inst.sBus >= 0 && inst.sBus <= 2) {
    check.correct = false;
    check.message += "S-Bus cannot be 0, 1 or 2";
  }
  return check;
}

export function interpretParsedExpression(inst: ParsedInstruction): string {
  return interpret(inst);
}

export function parseAndInterpret(binarycode: string): string {
  let inst = parse(binarycode);
  return interpret(inst);
}


function interpret(inst: ParsedInstruction) {
  let checked = checkInput(inst.originalInstruction, inst);
  if (!checked.correct) {
    return checked.message;
  }
  let decompiled = "";
  let s = getRegistry(inst.sBus);
  let a = inst.aMux ? "MBR" : getRegistry(inst.aBus);
  let b = getRegistry(inst.bBus);

  let rightSide = calc(a, b, inst);

  if (inst.enS) {
    decompiled += "" + s + " <- " + rightSide + "; ";
  }

  if (inst.mbr) {
    decompiled += "MBR <- " + rightSide + "; ";
  }

  if (inst.mar) {
    decompiled += "MAR <- " + b + "; ";
  }

  if (inst.ms) {
    decompiled += inst.rdWr == ReadWrite.Read ? "rd; " : "wr; ";
  }

  if (!inst.enS && !inst.mbr && !inst.mar && !inst.ms) {
    decompiled += rightSide + "; ";
  }

  switch (inst.cond) {
    case Condition.Negative:
      decompiled += "if N goto " + inst.adr;
      break;
    case Condition.Zero:
      decompiled += "if Z goto " + inst.adr;
      break;
    case Condition.Everytime:
      decompiled += "goto " + inst.adr;
  }

  return decompiled;
}
