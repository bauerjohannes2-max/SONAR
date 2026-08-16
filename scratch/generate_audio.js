import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavBuffer(samplesLeft, samplesRight = samplesLeft) {
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = samplesLeft.length;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // audioFormat 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * blockAlign, 28); // byteRate
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sL = Math.max(-1, Math.min(1, samplesLeft[i]));
    const sR = Math.max(-1, Math.min(1, samplesRight[i]));
    const intL = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;
    const intR = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
    buffer.writeInt16LE(Math.round(intL), offset);
    buffer.writeInt16LE(Math.round(intR), offset + 2);
    offset += 4;
  }

  return buffer;
}

// 1. Sonar Ping (2.5s): Deep submarine ping with resonant reverb decay
function generateSonarPing() {
  const duration = 2.4;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.015);
    const decay = Math.exp(-t * 1.8);
    const subDecay = Math.exp(-t * 3.5);

    // Primary acoustic sine sweep
    const f0 = 920 - (t * 260);
    const osc1 = Math.sin(2 * Math.PI * f0 * t);
    // Harmonic overtone
    const osc2 = Math.sin(2 * Math.PI * (f0 * 1.5) * t) * 0.35;
    // Sub-bass resonance
    const sub = Math.sin(2 * Math.PI * 72 * t) * 0.45 * subDecay;

    // Room echo impulse delay
    let echo = 0;
    const d1 = Math.floor(0.18 * SAMPLE_RATE);
    const d2 = Math.floor(0.38 * SAMPLE_RATE);
    const d3 = Math.floor(0.62 * SAMPLE_RATE);
    if (i >= d1) echo += left[i - d1] * 0.38;
    if (i >= d2) echo += right[i - d2] * 0.22;
    if (i >= d3) echo += left[i - d3] * 0.12;

    const sample = (osc1 * 0.6 + osc2 + sub) * attack * decay + echo;
    left[i] = sample;
    right[i] = sample * 0.95 + echo * 0.2;
  }
  return createWavBuffer(left, right);
}

// 2. Crystal Pickup (0.85s): Shimmering crystalline arpeggio chime
function generateCrystalPickup() {
  const duration = 0.85;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (let n = 0; n < freqs.length; n++) {
      const noteDelay = n * 0.05;
      if (t >= noteDelay) {
        const nt = t - noteDelay;
        const env = Math.exp(-nt * 6.5) * Math.min(1, nt / 0.005);
        const osc = Math.sin(2 * Math.PI * freqs[n] * nt) +
                    0.25 * Math.sin(2 * Math.PI * freqs[n] * 2 * nt) +
                    0.10 * Math.sin(2 * Math.PI * freqs[n] * 3 * nt);
        s += osc * env * 0.32;
      }
    }
    left[i] = s;
    right[i] = s * 0.92;
  }
  return createWavBuffer(left, right);
}

// 3. Death Explosion (1.8s): Heavy sub-bass impact & filtered decompression rumble
function generateDeathExplosion() {
  const duration = 1.8;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  let noiseState = 0;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const impactEnv = Math.exp(-t * 8.0);
    const rumbleEnv = Math.exp(-t * 2.2);

    // Deep sub pitch drop (120Hz down to 32Hz)
    const pitch = Math.max(30, 120 - t * 80);
    const sub = Math.sin(2 * Math.PI * pitch * t) * 0.7 * impactEnv;

    // Filtered noise rumble
    const white = Math.random() * 2 - 1;
    noiseState = noiseState * 0.92 + white * 0.08;
    const rumble = noiseState * rumbleEnv * 0.65;

    // Crunch distortion
    let out = sub + rumble;
    out = Math.tanh(out * 1.5);

    left[i] = out;
    right[i] = out * (1 - (Math.random() * 0.1));
  }
  return createWavBuffer(left, right);
}

// 4. Enemy Alert (1.1s): Menacing metallic sonar growl
function generateEnemyAlert() {
  const duration = 1.1;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 2.8) * Math.min(1, t / 0.03);

    // Frequency modulated growl
    const lfo = Math.sin(2 * Math.PI * 16 * t);
    const carrierFreq = 180 + lfo * 70;
    const saw = (t * carrierFreq % 1) * 2 - 1;
    const sine = Math.sin(2 * Math.PI * (carrierFreq * 1.5) * t);

    const metallic = (saw * 0.4 + sine * 0.6) * env * 0.7;
    left[i] = metallic;
    right[i] = metallic * (0.9 + 0.1 * lfo);
  }
  return createWavBuffer(left, right);
}

// 5. Portal Open (2.6s): Epic sci-fi fanfare chords & ascension beacon
function generatePortalOpen() {
  const duration = 2.6;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const chord = [261.63, 329.63, 392.0, 523.25, 659.25]; // C major triad ascension

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    for (let c = 0; c < chord.length; c++) {
      const delay = c * 0.08;
      if (t >= delay) {
        const ct = t - delay;
        const env = Math.exp(-ct * 1.2) * Math.min(1, ct / 0.04);
        const osc = Math.sin(2 * Math.PI * chord[c] * ct) +
                    0.3 * Math.sin(2 * Math.PI * chord[c] * 2 * ct);
        s += osc * env * 0.22;
      }
    }

    // High sweep shimmer
    const sweepFreq = 600 + Math.pow(t / 2.6, 2) * 1800;
    const sweep = Math.sin(2 * Math.PI * sweepFreq * t) * Math.exp(-t * 1.5) * 0.15;

    const out = s + sweep;
    left[i] = out;
    right[i] = out * 0.95;
  }
  return createWavBuffer(left, right);
}

// 6. Ambient Drone (6.0s seamless loop): Deep oceanic trench hum
function generateAmbientDrone() {
  const duration = 6.0;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Base 55Hz & 110Hz drone
    const osc1 = Math.sin(2 * Math.PI * 55 * t);
    const osc2 = Math.sin(2 * Math.PI * 82.5 * t) * 0.4;
    const osc3 = Math.sin(2 * Math.PI * 110 * t) * 0.25;

    // Slow ambient wave modulation (looping perfectly at 6s)
    const swell = 0.8 + 0.2 * Math.sin(2 * Math.PI * (t / 6.0));

    const s = (osc1 * 0.5 + osc2 + osc3) * swell * 0.35;
    left[i] = s;
    right[i] = s;
  }
  return createWavBuffer(left, right);
}

// Output directory
const audioDir = path.resolve('assets/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

fs.writeFileSync(path.join(audioDir, 'sonar_ping.mp3'), generateSonarPing());
console.log('Saved assets/audio/sonar_ping.mp3');

fs.writeFileSync(path.join(audioDir, 'crystal_pickup.mp3'), generateCrystalPickup());
console.log('Saved assets/audio/crystal_pickup.mp3');

fs.writeFileSync(path.join(audioDir, 'death_explosion.mp3'), generateDeathExplosion());
console.log('Saved assets/audio/death_explosion.mp3');

fs.writeFileSync(path.join(audioDir, 'enemy_alert.mp3'), generateEnemyAlert());
console.log('Saved assets/audio/enemy_alert.mp3');

fs.writeFileSync(path.join(audioDir, 'portal_open.mp3'), generatePortalOpen());
console.log('Saved assets/audio/portal_open.mp3');

fs.writeFileSync(path.join(audioDir, 'ambient_drone.mp3'), generateAmbientDrone());
console.log('Saved assets/audio/ambient_drone.mp3');
