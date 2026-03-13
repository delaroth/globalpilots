/**
 * Generate PWA icons from SVG.
 * Run: node scripts/generate-icons.js
 *
 * This creates simple skyblue circle + white "G" PNG icons.
 * For production, replace with professionally designed icons.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPngIcon(size, filepath) {
  const width = size;
  const height = size;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  // Build raw RGBA rows with filter bytes
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // PNG filter: None
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        if (isGPixel(x, y, size)) {
          raw[px] = 255; raw[px+1] = 255; raw[px+2] = 255; raw[px+3] = 255;
        } else {
          raw[px] = 56; raw[px+1] = 189; raw[px+2] = 248; raw[px+3] = 255;
        }
      } else {
        raw[px] = 0; raw[px+1] = 0; raw[px+2] = 0; raw[px+3] = 0;
      }
    }
  }

  writePng(filepath, width, height, raw);
}

function isGPixel(x, y, size) {
  const nx = x / size;
  const ny = y / size;
  const gcx = 0.5, gcy = 0.5;
  const outerR = 0.30, innerR = 0.20;
  const dx = nx - gcx;
  const dy = ny - gcy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= innerR && dist <= outerR) {
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angleDeg >= -35 && angleDeg <= 15) return false;
    return true;
  }

  // Horizontal bar
  const barTop = gcy - 0.03;
  const barBottom = gcy + 0.07;
  const barLeft = gcx - 0.02;
  const barRight = gcx + outerR;
  if (nx >= barLeft && nx <= barRight && ny >= barTop && ny <= barBottom) {
    if (nx >= gcx + innerR * 0.3) return true;
  }

  return false;
}

function writePng(filepath, width, height, rawData) {
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const chunk = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(chunk) >>> 0, 0);
    return Buffer.concat([len, chunk, crc]);
  }

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
      }
    }
    return c ^ 0xFFFFFFFF;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = makeChunk('IDAT', compressed);

  const iend = makeChunk('IEND', Buffer.alloc(0));

  fs.writeFileSync(filepath, Buffer.concat([signature, ihdr, idat, iend]));
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

createPngIcon(192, path.join(iconsDir, 'icon-192.png'));
createPngIcon(512, path.join(iconsDir, 'icon-512.png'));

console.log('Icons generated successfully!');
console.log('  icon-192.png:', fs.statSync(path.join(iconsDir, 'icon-192.png')).size, 'bytes');
console.log('  icon-512.png:', fs.statSync(path.join(iconsDir, 'icon-512.png')).size, 'bytes');
