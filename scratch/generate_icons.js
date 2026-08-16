import fs from 'fs';
import zlib from 'zlib';

/**
 * Pure Node.js PNG encoder without external dependencies.
 */
function createPng(width, height, getPixelRgba) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Deflate compression
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method
  const ihdr = createChunk('IHDR', ihdrData);

  // Raw image scanlines with filter byte 0 (None)
  const rawBytesPerRow = width * 4 + 1;
  const rawBuffer = Buffer.alloc(rawBytesPerRow * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawBytesPerRow;
    rawBuffer[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawBuffer[pxOffset] = Math.max(0, Math.min(255, Math.round(r)));
      rawBuffer[pxOffset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rawBuffer[pxOffset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      rawBuffer[pxOffset + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  // Deflate compress image data
  const compressed = zlib.deflateSync(rawBuffer, { level: 9 });
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  // CRC32 calculation over type + data
  const crcTarget = Buffer.alloc(4 + len);
  buf.copy(crcTarget, 0, 4, 8 + len);
  const crc = crc32(crcTarget);
  buf.writeUInt32BE(crc, 8 + len);

  return buf;
}

// CRC32 table & function
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Procedural Art Generator for SONAR High-CTR Clickbait Icon:
 * - Deep carbon hex/grid background (#05070a)
 * - Glowing concentric cyan sonar rings (#00f0ff)
 * - Menacing predator hunter silhouette (#ff1e44) with glowing apex sensor
 * - Center ECHO-7 cyan drone facing off against predator
 */
function renderSonarIconPixel(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Base background: Deep sci-fi zero-light gradient
  let r = 5 + (1 - Math.min(1, dist)) * 4;
  let g = 7 + (1 - Math.min(1, dist)) * 8;
  let b = 10 + (1 - Math.min(1, dist)) * 14;
  let a = 255;

  // Carbon grid / diagonal texture
  const gridX = Math.abs((x % 16) - 8) / 8;
  const gridY = Math.abs((y % 16) - 8) / 8;
  const carbonPattern = (gridX * gridY) * 0.15;
  r += carbonPattern * 20;
  g += carbonPattern * 30;
  b += carbonPattern * 40;

  // Concentric Sonar Waves (Cyan)
  const ringRadii = [0.28, 0.48, 0.68, 0.88];
  for (let rad of ringRadii) {
    const ringDist = Math.abs(dist - rad);
    if (ringDist < 0.08) {
      const intensity = Math.pow(1 - ringDist / 0.08, 2) * (1 - rad * 0.4);
      r += 0 * intensity;
      g += 240 * intensity;
      b += 255 * intensity;
    }
  }

  // Crosshair Radar lines (decent cyan glow)
  if (Math.abs(nx) < 0.008 || Math.abs(ny) < 0.008) {
    const lineGlow = 0.25 * (1 - dist * 0.6);
    if (lineGlow > 0) {
      r += 0 * lineGlow;
      g += 240 * lineGlow;
      b += 255 * lineGlow;
    }
  }

  // Menacing Predator Silhouette (Top-Right / Center Threat)
  // Sharp triangular predator jaws / head at (0.15, -0.15)
  const px = nx - 0.08;
  const py = ny + 0.08;
  const pDist = Math.sqrt(px * px + py * py);

  // Red Predator Head Silhouette
  const headAngle = Math.atan2(py, px);
  // Angular demon hunter shape
  const inPredatorHead = (pDist < 0.42 && py < 0.25 && (Math.abs(px) < 0.35));
  
  if (inPredatorHead) {
    // Red glowing predator body
    const glowFactor = (1 - pDist / 0.42);
    r += 255 * glowFactor * 0.8;
    g += 30 * glowFactor * 0.2;
    b += 68 * glowFactor * 0.3;
  }

  // Glowing Predator Eyes (Lethal Crimson & White Core)
  const leftEyeDist = Math.sqrt(Math.pow(nx - (-0.08), 2) + Math.pow(ny - (-0.12), 2));
  const rightEyeDist = Math.sqrt(Math.pow(nx - 0.20, 2) + Math.pow(ny - (-0.12), 2));
  
  if (leftEyeDist < 0.065 || rightEyeDist < 0.065) {
    const eDist = Math.min(leftEyeDist, rightEyeDist);
    const eyeIntensity = Math.pow(1 - eDist / 0.065, 1.5);
    r += 255 * eyeIntensity;
    g += (eDist < 0.02 ? 255 : 40) * eyeIntensity;
    b += (eDist < 0.02 ? 255 : 60) * eyeIntensity;
  }

  // ECHO-7 Cyan Drone (Bottom-Left Counterpart)
  const dx = nx - (-0.22);
  const dy = ny - 0.28;
  const droneDist = Math.sqrt(dx * dx + dy * dy);

  // Drone Vector Triangle
  if (droneDist < 0.16) {
    const droneGlow = (1 - droneDist / 0.16);
    r += 0 * droneGlow;
    g += 240 * droneGlow;
    b += 255 * droneGlow;
  }
  // Drone white hyper-core
  if (droneDist < 0.04) {
    r = 255;
    g = 255;
    b = 255;
  }

  // Outer border chamfer & vignette
  if (dist > 0.94) {
    const edgeFade = Math.max(0, (1 - dist) / 0.06);
    r *= edgeFade;
    g *= edgeFade;
    b *= edgeFade;
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), a];
}

// Generate 192x192 and 512x512 icons
const icon192 = createPng(192, 192, renderSonarIconPixel);
fs.writeFileSync('assets/icon-192.png', icon192);
console.log('Created assets/icon-192.png (' + icon192.length + ' bytes)');

const icon512 = createPng(512, 512, renderSonarIconPixel);
fs.writeFileSync('assets/icon-512.png', icon512);
console.log('Created assets/icon-512.png (' + icon512.length + ' bytes)');
