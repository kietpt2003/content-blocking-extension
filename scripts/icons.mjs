import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
export async function createIcons(directory) {
  await mkdir(directory, { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    const rows = Buffer.alloc((size * 4 + 1) * size);
    // Supersampled leaf lens with a pale central vein, on the brand green background.
    const sample = (nx, ny) => {
      const leaf =
        Math.hypot(nx - 0.34, ny - 0.34) < 0.49 && Math.hypot(nx - 0.66, ny - 0.66) < 0.49;
      const stem = nx > 0.2 && nx < 0.5 && Math.abs(nx + ny - 1.02) < 0.018;
      const vein = leaf && Math.abs(nx + ny - 1.02) < 0.018;
      if (vein || stem) return [243, 250, 227, 255];
      if (leaf) return nx + ny < 1.02 ? [177, 222, 122, 255] : [112, 189, 127, 255];
      return [23, 104, 76, 255];
    };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = [0, 0, 0, 0];
        for (let sy = 0; sy < 4; sy++) {
          for (let sx = 0; sx < 4; sx++) {
            const pixel = sample((x + (sx + 0.5) / 4) / size, (y + (sy + 0.5) / 4) / size);
            for (let c = 0; c < 4; c++) color[c] += pixel[c] / 16;
          }
        }
        const offset = y * (size * 4 + 1) + 1 + x * 4;
        rows.set(color.map(Math.round), offset);
      }
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size);
    header.writeUInt32BE(size, 4);
    header[8] = 8;
    header[9] = 6;
    await writeFile(
      path.join(directory, `${size}.png`),
      Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(rows)),
        chunk('IEND', Buffer.alloc(0)),
      ]),
    );
  }
}
