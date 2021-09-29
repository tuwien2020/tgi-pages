export const RGB_COLOR_REGEX = /\((\d+),\s*(\d+),\s*(\d+)(,\s*(\d*.\d*))?\)/;

export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(colorStr?: string)
    constructor(r?: string|number, g?: number, b?: number)
    constructor(r?: string|number, g?: number, b?: number, a?: number) {
        if (typeof r === 'string') {
            r = r.trim();
            if (r.indexOf('#') === 0) {
                r = r.substr(r.indexOf('#') + 1);
                this.r = parseInt(r.substr(0, 2), 16);
                this.g = parseInt(r.substr(2, 2), 16);
                this.b = parseInt(r.substr(4, 2), 16);
            } else if (r.indexOf('rgb') === 0) {
                const res = RGB_COLOR_REGEX.exec(r);
                this.r = parseInt(res[1], 10);
                this.g = parseInt(res[2], 10);
                this.b = parseInt(res[3], 10);
                this.a = res[5] ? parseFloat(res[5]) : 1;
            }
        } else if(r != undefined && g != undefined && b != undefined){
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a || 1;
        }
    }

    toHex() {
        return '#' 
            + mapNumberToHexString(this.r)
            + mapNumberToHexString(this.g)
            + mapNumberToHexString(this.b);
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
    return (n != 0 ? n.toString(16) : '00');
}

export const defaultPalette: Color[] = [
  new Color('#648fff'),
  new Color('#d35100'),
  new Color('#785ef0'),
  new Color('#cf8e00'),
  new Color('#b31b65'),
]