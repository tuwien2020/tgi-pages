export interface ParsedInstruction {
  aMux: boolean;
  mbr: boolean;
  mar: boolean;
  rdWr: boolean;
  ms: boolean;
  enS: boolean;
  cond: number;
  alu: number;
  sh: number;
  sBus: number;
  bBus: number;
  aBus: number;
  adr: number;
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
  let rdWr = convertBitToBool(getRange(9, 1));
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
    case 0:
      s = a;
      break;
    case 1:
      s = a + " + " + b;
      break;
    case 2:
      s = a + " & " + b;
      break;
    case 3:
      s = "~" + a;
      break;
  }
  switch (inst.sh) {
    case 1:
      s = "lsh(" + s + ")";
      break;
    case 2:
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
  return check;
}

export function interpret(binarycode: string): string {
  let inst = parse(binarycode);
  let checked = checkInput(binarycode, inst);
  if (!checked.correct) {
    return checked.message;
  }
  let decompiled = "";
  let s = getRegistry(inst.sBus);
  let a = inst.aMux ? "MBR" : getRegistry(inst.aBus);
  let b = getRegistry(inst.bBus);

  let rightSide = calc(a, b, inst);

  if (inst.enS) {
    decompiled += "" + getRegistry(inst.sBus) + " <- " + rightSide + "; ";
  }

  if (inst.mbr) {
    decompiled += "MBR <- " + rightSide + "; ";
  }

  if (inst.mar) {
    decompiled += "MAR <- " + b + "; ";
  }

  if (inst.ms) {
    decompiled += inst.rdWr ? "rd; " : "wr; ";
  }

  if (!inst.enS && !inst.mbr && !inst.mar && !inst.ms) {
    decompiled += rightSide + "; ";
  }

  switch (inst.cond) {
    case 1:
      decompiled += "if N goto " + inst.adr;
      break;
    case 2:
      decompiled += "if Z goto " + inst.adr;
      break;
    case 3:
      decompiled += "goto " + inst.adr;
  }

  return decompiled;
}
