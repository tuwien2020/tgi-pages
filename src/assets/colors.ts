function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export class Color {
  public r: number;
  public g: number;
  public b: number;
  public a: number;

  static fromHex(colorStr: string): Color {
    if (colorStr.indexOf("#") === 0) {
      colorStr = colorStr.substring(colorStr.indexOf("#") + 1);
      let r = parseInt(colorStr.substring(0, 2), 16);
      let g = parseInt(colorStr.substring(2, 4), 16);
      let b = parseInt(colorStr.substring(4, 6), 16);
      if (colorStr.length === 8) {
        let a = parseInt(colorStr.substring(6, 8), 16);
        return new Color(r, g, b, a);
      } else {
        return new Color(r, g, b);
      }
    } else {
      throw new Error("Invalid color string");
    }
  }

  /**
   * @param r - red value, an int between 0 and 255
   * @param g - green value, an int between 0 and 255
   * @param b - blue value, an int between 0 and 255
   * @param a - alpha value, an optional int between 0 and 255
   */
  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = clamp(r, 0, 255);
    this.g = clamp(g, 0, 255);
    this.b = clamp(b, 0, 255);
    this.a = clamp(a, 0, 255);
  }

  toHex() {
    return "#" + mapNumberToHexString(this.r) + mapNumberToHexString(this.g) + mapNumberToHexString(this.b);
  }

  toRgb() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }

  toRgba() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}

// hex RGB color values need 00 instead of a single 0
// because 00 is parsed to 0, we need to add a 0 when printing back again
function mapNumberToHexString(n: number) {
  return n != 0 ? n.toString(16) : "00";
}

export const defaultPalette: Color[] = [
  Color.fromHex("#648fff"),
  Color.fromHex("#d35100"),
  Color.fromHex("#785ef0"),
  Color.fromHex("#cf8e00"),
  Color.fromHex("#b31b65"),
];
