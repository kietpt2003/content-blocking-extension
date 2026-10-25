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
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5) / size,
          ny = (y + 0.5) / size;
        const inside =
          ny > 0.12 && ny < 0.87 && Math.abs(nx - 0.5) < (ny < 0.55 ? 0.31 : (0.87 - ny) * 0.97);
        const check =
          inside &&
          ((nx > 0.31 && nx < 0.49 && Math.abs(ny - (0.36 + nx * 0.45)) < 0.045) ||
            (nx >= 0.46 && nx < 0.7 && Math.abs(ny - (0.97 - nx * 0.85)) < 0.045));
        const color = check
          ? [23, 104, 76, 255]
          : inside
            ? [237, 249, 223, 255]
            : [23, 104, 76, 255];
        const offset = y * (size * 4 + 1) + 1 + x * 4;
        rows.set(color, offset);
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
