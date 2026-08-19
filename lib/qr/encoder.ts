/**
 * Minimal QR Code encoder (byte mode, ISO/IEC 18004).
 *
 * Warranty verification depends on a genuinely scannable code, so the matrix is
 * generated locally rather than pulled from an image service — the certificate
 * and verification pages stay self-contained and work offline.
 *
 * Supports all 40 versions and the four error-correction levels.
 */

export type EccLevel = "L" | "M" | "Q" | "H";

const ECC_FORMAT_BITS: Record<EccLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };
const ECC_ORDER: EccLevel[] = ["L", "M", "Q", "H"];

// prettier-ignore
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

// prettier-ignore
const NUM_ECC_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

function getBit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}

/** Total data + ECC modules available for a version, in bits. */
function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(version: number, ecc: EccLevel): number {
  const eccIndex = ECC_ORDER.indexOf(ecc);
  return (
    Math.floor(getNumRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[eccIndex][version] * NUM_ECC_BLOCKS[eccIndex][version]
  );
}

/* ------------------------------------------------------------------ */
/* Reed–Solomon over GF(2^8), primitive polynomial 0x11D              */
/* ------------------------------------------------------------------ */

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsComputeDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;

  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsComputeRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Encoder                                                             */
/* ------------------------------------------------------------------ */

function charCountBits(version: number): number {
  // Byte mode character-count indicator width.
  return version <= 9 ? 8 : 16;
}

function toUtf8Bytes(text: string): number[] {
  if (typeof TextEncoder !== "undefined") {
    return Array.from(new TextEncoder().encode(text));
  }
  return Array.from(unescape(encodeURIComponent(text))).map((char) =>
    char.charCodeAt(0),
  );
}

function buildDataCodewords(
  bytes: number[],
  version: number,
  ecc: EccLevel,
): number[] {
  const bits: boolean[] = [];
  const append = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push(getBit(value, i));
  };

  append(0b0100, 4); // Byte mode indicator
  append(bytes.length, charCountBits(version));
  bytes.forEach((byte) => append(byte, 8));

  const capacityBits = getNumDataCodewords(version, ecc) * 8;
  // Terminator, then pad to a byte boundary.
  for (let i = 0; i < Math.min(4, capacityBits - bits.length); i += 1) {
    bits.push(false);
  }
  while (bits.length % 8 !== 0) bits.push(false);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | (bits[i + j] ? 1 : 0);
    codewords.push(byte);
  }

  // Alternating pad bytes fill the remaining capacity.
  for (
    let pad = 0xec;
    codewords.length < capacityBits / 8;
    pad = pad === 0xec ? 0x11 : 0xec
  ) {
    codewords.push(pad);
  }

  return codewords;
}

function addEccAndInterleave(
  data: number[],
  version: number,
  ecc: EccLevel,
): number[] {
  const eccIndex = ECC_ORDER.indexOf(ecc);
  const numBlocks = NUM_ECC_BLOCKS[eccIndex][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[eccIndex][version];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const divisor = rsComputeDivisor(blockEccLen);
  const blocks: number[][] = [];

  for (let i = 0, offset = 0; i < numBlocks; i += 1) {
    const dataLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const block = data.slice(offset, offset + dataLen);
    offset += dataLen;
    const eccBytes = rsComputeRemainder(block, divisor);
    if (i < numShortBlocks) block.push(0); // placeholder keeps columns aligned
    blocks.push(block.concat(eccBytes));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, blockIndex) => {
      if (i !== shortBlockLen - blockEccLen || blockIndex >= numShortBlocks) {
        result.push(block[i]);
      }
    });
  }
  return result;
}

function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step =
    version === 32
      ? 26
      : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (
    let pos = version * 4 + 10;
    result.length < numAlign;
    pos -= step
  ) {
    result.splice(1, 0, pos);
  }
  return result;
}

class QrMatrix {
  readonly size: number;
  readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  constructor(
    readonly version: number,
    readonly ecc: EccLevel,
    codewords: number[],
    forcedMask?: number,
  ) {
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () =>
      new Array<boolean>(this.size).fill(false),
    );
    this.isFunction = Array.from({ length: this.size }, () =>
      new Array<boolean>(this.size).fill(false),
    );

    this.drawFunctionPatterns();
    this.drawCodewords(addEccAndInterleave(codewords, version, ecc));

    let bestMask = forcedMask ?? 0;
    if (forcedMask === undefined) {
      let minPenalty = Number.MAX_SAFE_INTEGER;
      for (let mask = 0; mask < 8; mask += 1) {
        this.applyMask(mask);
        this.drawFormatBits(mask);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          bestMask = mask;
          minPenalty = penalty;
        }
        this.applyMask(mask); // XOR again to undo
      }
    }
    this.applyMask(bestMask);
    this.drawFormatBits(bestMask);
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i += 1) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const positions = getAlignmentPatternPositions(this.version);
    const count = positions.length;
    for (let i = 0; i < count; i += 1) {
      for (let j = 0; j < count; j += 1) {
        const isFinderCorner =
          (i === 0 && j === 0) ||
          (i === 0 && j === count - 1) ||
          (i === count - 1 && j === 0);
        if (!isFinderCorner) {
          this.drawAlignmentPattern(positions[i], positions[j]);
        }
      }
    }

    this.drawFormatBits(0); // placeholder, rewritten once the mask is chosen
    this.drawVersion();
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, distance !== 2 && distance !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        this.setFunctionModule(
          x + dx,
          y + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
        );
      }
    }
  }

  private drawFormatBits(mask: number): void {
    const data = (ECC_FORMAT_BITS[this.ecc] << 3) | mask;
    let remainder = data;
    for (let i = 0; i < 10; i += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    }
    const bits = ((data << 10) | remainder) ^ 0x5412;

    for (let i = 0; i <= 5; i += 1) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i += 1) {
      this.setFunctionModule(14 - i, 8, getBit(bits, i));
    }

    for (let i = 0; i < 8; i += 1) {
      this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    }
    for (let i = 8; i < 15; i += 1) {
      this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    }
    this.setFunctionModule(8, this.size - 8, true); // always-dark module
  }

  private drawVersion(): void {
    if (this.version < 7) return;
    let remainder = this.version;
    for (let i = 0; i < 12; i += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    }
    const bits = (this.version << 12) | remainder;

    for (let i = 0; i < 18; i += 1) {
      const bit = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  }

  private drawCodewords(data: number[]): void {
    let bitIndex = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip the vertical timing column
      for (let vert = 0; vert < this.size; vert += 1) {
        for (let j = 0; j < 2; j += 1) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && bitIndex < data.length * 8) {
            this.modules[y][x] = getBit(data[bitIndex >>> 3], 7 - (bitIndex & 7));
            bitIndex += 1;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.isFunction[y][x]) continue;
        let invert = false;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  private finderPenaltyAddHistory(runLength: number, history: number[]): void {
    let length = runLength;
    if (history[0] === 0) length += this.size; // add light border to the front
    history.pop();
    history.unshift(length);
  }

  private finderPenaltyCountPatterns(history: number[]): number {
    const n = history[1];
    const core =
      n > 0 &&
      history[2] === n &&
      history[3] === n * 3 &&
      history[4] === n &&
      history[5] === n;
    return (
      (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) +
      (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0)
    );
  }

  private finderPenaltyTerminateAndCount(
    currentRunColor: boolean,
    currentRunLength: number,
    history: number[],
  ): number {
    let runLength = currentRunLength;
    if (currentRunColor) {
      this.finderPenaltyAddHistory(runLength, history);
      runLength = 0;
    }
    runLength += this.size;
    this.finderPenaltyAddHistory(runLength, history);
    return this.finderPenaltyCountPatterns(history);
  }

  private getPenaltyScore(): number {
    let result = 0;

    for (let y = 0; y < this.size; y += 1) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x += 1) {
        if (this.modules[y][x] === runColor) {
          runLength += 1;
          if (runLength === 5) result += PENALTY_N1;
          else if (runLength > 5) result += 1;
        } else {
          this.finderPenaltyAddHistory(runLength, history);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(history) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runLength = 1;
        }
      }
      result +=
        this.finderPenaltyTerminateAndCount(runColor, runLength, history) *
        PENALTY_N3;
    }

    for (let x = 0; x < this.size; x += 1) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y += 1) {
        if (this.modules[y][x] === runColor) {
          runLength += 1;
          if (runLength === 5) result += PENALTY_N1;
          else if (runLength > 5) result += 1;
        } else {
          this.finderPenaltyAddHistory(runLength, history);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(history) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runLength = 1;
        }
      }
      result +=
        this.finderPenaltyTerminateAndCount(runColor, runLength, history) *
        PENALTY_N3;
    }

    for (let y = 0; y < this.size - 1; y += 1) {
      for (let x = 0; x < this.size - 1; x += 1) {
        const color = this.modules[y][x];
        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        ) {
          result += PENALTY_N2;
        }
      }
    }

    let dark = 0;
    this.modules.forEach((row) => {
      row.forEach((module) => {
        if (module) dark += 1;
      });
    });
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    return result + k * PENALTY_N4;
  }
}

export interface QrCode {
  size: number;
  modules: boolean[][];
  version: number;
  ecc: EccLevel;
}

/**
 * Encodes text as a QR matrix, choosing the smallest version that fits.
 *
 * @param forcedMask Pins the mask pattern instead of picking the lowest-penalty
 *   one. Used by the encoder's conformance tests; leave unset in the app.
 */
export function encodeQr(
  text: string,
  ecc: EccLevel = "M",
  forcedMask?: number,
): QrCode {
  const bytes = toUtf8Bytes(text);

  let version = 0;
  for (let candidate = 1; candidate <= 40; candidate += 1) {
    const capacityBits = getNumDataCodewords(candidate, ecc) * 8;
    const usedBits = 4 + charCountBits(candidate) + bytes.length * 8;
    if (usedBits <= capacityBits) {
      version = candidate;
      break;
    }
  }
  if (version === 0) {
    throw new Error("Content is too long to encode in a QR code");
  }

  const matrix = new QrMatrix(
    version,
    ecc,
    buildDataCodewords(bytes, version, ecc),
    forcedMask,
  );

  return {
    size: matrix.size,
    modules: matrix.modules,
    version,
    ecc,
  };
}

/**
 * Builds a single SVG path covering every dark module, using a 1-unit module
 * grid so the caller only sets width/height and the quiet-zone margin.
 */
export function qrToSvgPath(code: QrCode): string {
  const parts: string[] = [];
  for (let y = 0; y < code.size; y += 1) {
    for (let x = 0; x < code.size; x += 1) {
      if (code.modules[y][x]) parts.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return parts.join("");
}
