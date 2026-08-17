import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 table & implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len);
  return chunk;
}

function createPngBuffer(width, height, getPixelRGBA) {
  // 1. Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // 2. IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // 3. Raw Scanlines
  // Filter byte (0 = None) + 4 bytes per pixel (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = Math.max(0, Math.min(255, Math.round(r)));
      rawData[pxOffset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rawData[pxOffset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      rawData[pxOffset + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // 4. IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ----------------------------------------------------
// 1. Drone Spritesheet (128x32 - 4 rotation frames: Right, Down, Left, Up, 32x32 each)
// ----------------------------------------------------
function generateDroneSheet() {
  const W = 128;
  const H = 32;

  return createPngBuffer(W, H, (x, y) => {
    const frame = Math.floor(x / 32); // 0: Right, 1: Down, 2: Left, 3: Up
    const fx = x % 32;
    const fy = y;
    const cx = 16;
    const cy = 16;

    // Transform (fx, fy) relative to (cx, cy) based on frame angle
    const angle = frame * (Math.PI / 2);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const rx = (fx - cx) * cos - (fy - cy) * sin;
    const ry = (fx - cx) * sin + (fy - cy) * cos;

    // Outer hull (aerodynamic triangle drone)
    // Tip at (rx = 10, ry = 0), wings at (rx = -8, ry = ±8), thruster indent at (rx = -4, ry = 0)
    let inHull = false;
    let inGlow = false;
    let inCockpit = false;

    // Triangle / Arrow check
    if (rx >= -8 && rx <= 10) {
      const halfW = (10 - rx) * 0.55;
      if (Math.abs(ry) <= halfW) {
        if (rx < -4 && Math.abs(ry) <= 2.5) {
          // Thruster nozzle notch
          inGlow = true;
        } else {
          inHull = true;
        }
      }
    }

    // Glowing core / cockpit eye
    const distCore = Math.sqrt(rx * rx + ry * ry);
    if (distCore <= 3.5) {
      inCockpit = true;
    }

    // Outer edge aura
    const edgeDist = Math.abs(Math.abs(ry) - (10 - rx) * 0.55);
    const isEdge = inHull && (rx > 8 || edgeDist < 1.2 || rx < -6.5);

    if (inCockpit) {
      return [255, 255, 255, 255]; // Pure White Core
    }
    if (inGlow) {
      return [0, 240, 255, 230]; // Cyan Plasma Thruster
    }
    if (isEdge) {
      return [0, 240, 255, 255]; // Neon Cyan Hull Trim
    }
    if (inHull) {
      return [4, 24, 38, 245]; // Dark Metallic Titanium Armor
    }

    // Soft surrounding bloom
    if (rx >= -11 && rx <= 13 && Math.abs(ry) <= 11) {
      const dBloom = Math.max(0, 1 - (Math.abs(rx) + Math.abs(ry)) / 14);
      if (dBloom > 0) {
        return [0, 240, 255, Math.round(dBloom * 75)];
      }
    }

    return [0, 0, 0, 0];
  });
}

// ----------------------------------------------------
// 2. Hunter Spritesheet (128x32 - 4 frames: swimming/pulsing animation)
// ----------------------------------------------------
function generateHunterSheet() {
  const W = 128;
  const H = 32;

  return createPngBuffer(W, H, (x, y) => {
    const frame = Math.floor(x / 32);
    const fx = x % 32;
    const fy = y;
    const cx = 16;
    const cy = 16;
    const dx = fx - cx;
    const dy = fy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const pulse = 1.0 + 0.15 * Math.sin(frame * (Math.PI / 2));
    const rOuter = 10 * pulse;

    // Serrated biomachine predator diamond body
    const inDiamond = (Math.abs(dx) / (12 * pulse) + Math.abs(dy) / (9 * pulse)) <= 1.0;
    const inEye = (Math.abs(dx - 3) <= 2.5 && Math.abs(dy) <= 2.5);
    const inTentacle = (dx < -6 && Math.abs(dy) <= 5 && (fx % 3 === 0));

    if (inEye) {
      return [255, 255, 255, 255]; // Blazing Eye
    }
    if (inDiamond) {
      if (dist > rOuter - 2.5) {
        return [255, 30, 68, 255]; // Neon Crimson Warning Edge
      }
      return [38, 6, 14, 245]; // Obsidian Bio-Armor
    }
    if (inTentacle) {
      return [255, 40, 75, 200]; // Trailing Sensor Filaments
    }

    // Red aura
    if (dist < 14) {
      const a = (1 - dist / 14) * 80;
      return [255, 30, 68, Math.round(a)];
    }

    return [0, 0, 0, 0];
  });
}

// ----------------------------------------------------
// 3. Stalker Spritesheet (128x32 - 4 stealth shadow frames)
// ----------------------------------------------------
function generateStalkerSheet() {
  const W = 128;
  const H = 32;

  return createPngBuffer(W, H, (x, y) => {
    const frame = Math.floor(x / 32);
    const fx = x % 32;
    const fy = y;
    const cx = 16;
    const cy = 16;
    const dx = fx - cx;
    const dy = fy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const wave = Math.sin(frame * (Math.PI / 2) + dy * 0.4);
    const inBody = (Math.abs(dx + wave) / 6 + Math.abs(dy) / 11) <= 1.0;
    const inCore = dist <= 3.2;

    if (inCore) {
      return [220, 160, 255, 255]; // Violet Core
    }
    if (inBody) {
      if (dist > 7) {
        return [170, 0, 255, 220]; // Purple Glow Edge
      }
      return [20, 2, 32, 230]; // Shadow Chitin
    }

    if (dist < 14) {
      const a = (1 - dist / 14) * 65;
      return [170, 0, 255, Math.round(a)];
    }

    return [0, 0, 0, 0];
  });
}

// ----------------------------------------------------
// 4. Core Crystal Sprite (32x32 - Nanotech Resonance Core)
// ----------------------------------------------------
function generateCoreCrystal() {
  const W = 32;
  const H = 32;

  return createPngBuffer(W, H, (x, y) => {
    const cx = 16;
    const cy = 16;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Octagonal Diamond Nanocrystal
    const inOctagon = (Math.abs(dx) <= 7 && Math.abs(dy) <= 7 && (Math.abs(dx) + Math.abs(dy) <= 10));
    const inInner = dist <= 4.0;
    const isEdge = inOctagon && !inInner;

    // Orbiting data nodes at corners
    const isNode = (Math.abs(dx) === 9 && Math.abs(dy) === 9) || (Math.abs(dx) === 11 && dy === 0) || (dx === 0 && Math.abs(dy) === 11);

    if (inInner) {
      return [255, 255, 255, 255]; // White Core
    }
    if (isEdge) {
      return [0, 255, 136, 255]; // Vibrant Emerald
    }
    if (isNode) {
      return [0, 255, 170, 240]; // Orbiting Bits
    }
    if (dist <= 13) {
      const a = (1 - dist / 13) * 90;
      return [0, 255, 136, Math.round(a)];
    }

    return [0, 0, 0, 0];
  });
}

// ----------------------------------------------------
// 5. Modular Sci-Fi Wall Tileset (128x32 - 4 tiles: Solid Panel, Pipe Bulkhead, Corner, Reinforced Strut)
// ----------------------------------------------------
function generateTilesetWalls() {
  const W = 128;
  const H = 32;

  return createPngBuffer(W, H, (x, y) => {
    const tileIdx = Math.floor(x / 32); // 0: Solid, 1: Pipe, 2: Corner/Vent, 3: Strut
    const tx = x % 32;
    const ty = y;

    const isBorder = (tx === 0 || tx === 31 || ty === 0 || ty === 31);
    const isInnerBorder = (tx === 2 || tx === 29 || ty === 2 || ty === 29);
    const isRivet = (tx === 4 || tx === 27) && (ty === 4 || ty === 27);

    // Tile 0: Heavy Armor Bulkhead
    if (tileIdx === 0) {
      if (isBorder) return [0, 240, 255, 180]; // Cyan Vector Outline
      if (isRivet) return [0, 240, 255, 255];
      if (isInnerBorder) return [14, 42, 60, 255];
      const grid = (tx % 8 === 0 || ty % 8 === 0);
      if (grid) return [8, 28, 42, 255];
      return [5, 18, 28, 255]; // Deep Steel Base
    }

    // Tile 1: Hydro-Pipe Conduit
    if (tileIdx === 1) {
      if (isBorder) return [0, 240, 255, 180];
      // Horizontal central pipe
      if (ty >= 11 && ty <= 20) {
        if (ty === 11 || ty === 20) return [0, 240, 255, 240];
        if (ty >= 14 && ty <= 17) return [0, 200, 220, 255]; // Pipe Highlight
        return [0, 80, 110, 255];
      }
      return [4, 15, 24, 255];
    }

    // Tile 2: Tech Vent / Grid
    if (tileIdx === 2) {
      if (isBorder) return [0, 240, 255, 180];
      if (tx >= 6 && tx <= 25 && ty >= 6 && ty <= 25) {
        if (ty % 4 === 0) return [0, 240, 255, 200]; // Vent Grille Slits
        return [2, 10, 16, 255];
      }
      return [6, 20, 30, 255];
    }

    // Tile 3: Cross Reinforced Strut
    if (tileIdx === 3) {
      if (isBorder) return [0, 240, 255, 180];
      const diag1 = Math.abs(tx - ty) <= 2;
      const diag2 = Math.abs(tx - (31 - ty)) <= 2;
      if (diag1 || diag2) return [0, 240, 255, 230];
      return [5, 16, 25, 255];
    }

    return [0, 0, 0, 0];
  });
}

// ----------------------------------------------------
// 6. Portal Hyper-Gate (32x32 - Rotating whirlpool evac portal)
// ----------------------------------------------------
function generatePortalExit() {
  const W = 32;
  const H = 32;

  return createPngBuffer(W, H, (x, y) => {
    const cx = 16;
    const cy = 16;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Swirling spiral arms
    const spiral = (angle * 3 + dist * 0.6) % (Math.PI * 2);
    const inSpiralArm = Math.sin(spiral) > 0.45 && dist <= 14 && dist >= 3;

    if (dist <= 3.5) {
      return [255, 255, 255, 255]; // Event horizon core
    }
    if (inSpiralArm) {
      return [0, 255, 136, 255]; // Plasma vortex
    }
    if (dist <= 14 && dist >= 12.5) {
      return [0, 240, 255, 240]; // Containment Ring
    }
    if (dist <= 15) {
      const a = (1 - dist / 15) * 80;
      return [0, 255, 136, Math.round(a)];
    }

    return [0, 0, 0, 0];
  });
}

// Write all generated sprite files to assets/sprites/
const spriteDir = path.resolve('assets/sprites');
if (!fs.existsSync(spriteDir)) {
  fs.mkdirSync(spriteDir, { recursive: true });
}

fs.writeFileSync(path.join(spriteDir, 'drone_sheet.png'), generateDroneSheet());
console.log('Saved assets/sprites/drone_sheet.png');

fs.writeFileSync(path.join(spriteDir, 'hunter_sheet.png'), generateHunterSheet());
console.log('Saved assets/sprites/hunter_sheet.png');

fs.writeFileSync(path.join(spriteDir, 'stalker_sheet.png'), generateStalkerSheet());
console.log('Saved assets/sprites/stalker_sheet.png');

fs.writeFileSync(path.join(spriteDir, 'core_crystal.png'), generateCoreCrystal());
console.log('Saved assets/sprites/core_crystal.png');

fs.writeFileSync(path.join(spriteDir, 'tileset_walls.png'), generateTilesetWalls());
console.log('Saved assets/sprites/tileset_walls.png');

fs.writeFileSync(path.join(spriteDir, 'portal_exit.png'), generatePortalExit());
console.log('Saved assets/sprites/portal_exit.png');
