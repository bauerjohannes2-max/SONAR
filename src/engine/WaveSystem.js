/**
 * SONAR: The Echo Chamber
 * Wave System - Wavefront Physics, Tile Illumination & Phosphor Decay Engine
 */

import { CONFIG } from '../config.js';

export class WaveSystem {
  constructor() {
    this.waves = [];
    this.visibilityGrid = [];
    this.initGrid();
  }

  initGrid() {
    this.visibilityGrid = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      const row = new Float32Array(CONFIG.GRID_COLS);
      this.visibilityGrid.push(row);
    }
  }

  reset() {
    this.waves = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      this.visibilityGrid[r].fill(0);
    }
  }

  clear() {
    this.reset();
  }

  /**
   * Spawns a footstep wave (localized, fast decay).
   */
  createStepWave(x, y) {
    this.waves.push({
      x,
      y,
      radius: 4,
      maxRadius: CONFIG.PLAYER.STEP_WAVE_RADIUS,
      speed: CONFIG.PLAYER.STEP_WAVE_SPEED,
      alpha: 1.0,
      decay: CONFIG.PLAYER.STEP_WAVE_DECAY,
      color: CONFIG.COLORS.WAVE_STEP,
      thickness: 12,
      type: 'STEP'
    });
  }

  /**
   * Spawns a global Sonar Ping wave (large, persistent decay).
   */
  createSonarPing(x, y) {
    this.waves.push({
      x,
      y,
      radius: 8,
      maxRadius: CONFIG.PLAYER.PING_WAVE_RADIUS,
      speed: CONFIG.PLAYER.PING_WAVE_SPEED,
      alpha: 1.0,
      decay: CONFIG.PLAYER.PING_WAVE_DECAY,
      color: CONFIG.COLORS.WAVE_PING,
      thickness: 20,
      type: 'PING'
    });
  }

  /**
   * Spawns a yellow decoy flare acoustic pulse.
   */
  createDecoyWave(x, y) {
    this.waves.push({
      x,
      y,
      radius: 6,
      maxRadius: CONFIG.DECOY.PULSE_RADIUS,
      speed: CONFIG.DECOY.PULSE_SPEED,
      alpha: 1.0,
      decay: CONFIG.DECOY.PULSE_DECAY,
      color: CONFIG.COLORS.WAVE_DECOY,
      thickness: 16,
      type: 'DECOY'
    });
  }

  /**
   * Spawns a yellow resonator counter-shockwave.
   */
  createResonatorWave(x, y) {
    this.waves.push({
      x,
      y,
      radius: 6,
      maxRadius: CONFIG.RESONATOR.SHOCKWAVE_RADIUS,
      speed: CONFIG.RESONATOR.SHOCKWAVE_SPEED,
      alpha: 1.0,
      decay: CONFIG.RESONATOR.SHOCKWAVE_DECAY,
      color: CONFIG.COLORS.WAVE_RESONATOR,
      thickness: 18,
      type: 'RESONATOR'
    });
  }

  /**
   * Spawns a harmless ambient lighthouse pulse.
   */
  createLighthouseWave(x, y) {
    this.waves.push({
      x,
      y,
      radius: 6,
      maxRadius: CONFIG.LIGHTHOUSE.PULSE_RADIUS,
      speed: CONFIG.LIGHTHOUSE.PULSE_SPEED,
      alpha: 0.85,
      decay: CONFIG.LIGHTHOUSE.PULSE_DECAY,
      color: CONFIG.COLORS.WAVE_LIGHTHOUSE,
      thickness: 14,
      type: 'LIGHTHOUSE'
    });
  }

  /**
   * Spawns a high-intensity red death shockwave that reveals the obstacle/predator for 1.5s.
   */
  createDeathShockwave(x, y) {
    this.waves.push({
      x,
      y,
      radius: 8,
      maxRadius: 600,
      speed: 12,
      alpha: 1.0,
      decay: 0.010,
      color: 'rgba(255, 30, 68, 0.95)',
      thickness: 22,
      type: 'DEATH'
    });
  }

  /**
   * Spawns a pulsing escape portal beacon wave (green, global reach).
   */
  createBeaconWave(x, y) {
    this.waves.push({
      x,
      y,
      radius: 8,
      maxRadius: 520,
      speed: 180,
      alpha: 1.0,
      decay: 0.35,
      color: '#00FF88',
      thickness: 18,
      type: 'BEACON'
    });
  }

  createDeathWave(x, y) {
    this.createDeathShockwave(x, y);
  }

  /**
   * Update physics of waves and calculate tile visibility with phosphor decay.
   * @param {number} dt Delta time in seconds
   * @param {object} gridMap Optional GridMap reference for wall collisions
   * @param {object} particleEngine Optional ParticleEngine reference for acoustic sparks
   */
  update(dt, gridMap = null, particleEngine = null) {
    const timeScale = dt * 60;
    const halfTile = CONFIG.TILE_SIZE / 2;

    // 1. Update existing waves & illuminate tiles
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      const prevRadius = wave.radius;
      wave.radius += wave.speed * timeScale;
      wave.alpha -= wave.decay * timeScale;

      if (wave.alpha <= 0.01 || wave.radius >= wave.maxRadius) {
        this.waves.splice(i, 1);
        continue;
      }

      // Check all grid tiles for intersection with the advancing wavefront
      for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
        const tileCenterY = r * CONFIG.TILE_SIZE + halfTile;
        const dy = tileCenterY - wave.y;
        const dy2 = dy * dy;

        for (let c = 0; c < CONFIG.GRID_COLS; c++) {
          const tileCenterX = c * CONFIG.TILE_SIZE + halfTile;
          const dx = tileCenterX - wave.x;
          const distSq = dx * dx + dy2;
          const dist = Math.sqrt(distSq);

          if (dist >= prevRadius - 8 && dist <= wave.radius + wave.thickness) {
            const intensity = wave.alpha * Math.max(0.2, 1 - (dist / wave.maxRadius) * 0.4);
            const prevVis = this.visibilityGrid[r][c];

            if (intensity > prevVis) {
              this.visibilityGrid[r][c] = intensity;

              // If hitting a wall that was previously dark, spawn subtle acoustic refraction sparks
              if (prevVis < 0.08 && intensity > 0.35 && particleEngine && gridMap) {
                if (gridMap.isWall && gridMap.isWall(c, r) && Math.random() < 0.15) {
                  particleEngine.spawnWallRefractionSparks(tileCenterX, tileCenterY, wave.color, 2);
                }
              }
            }
          }
        }
      }
    }

    // 2. Exponential Phosphor Decay
    const decayMultiplier = Math.pow(CONFIG.PHOSPHOR.BASE_DECAY_RATE, timeScale);
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      const row = this.visibilityGrid[r];
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        row[c] *= decayMultiplier;
        if (row[c] < CONFIG.PHOSPHOR.MIN_VISIBLE_ALPHA) {
          row[c] = 0;
        }
      }
    }
  }

  getVisibilityAt(worldX, worldY) {
    const col = Math.floor(worldX / CONFIG.TILE_SIZE);
    const row = Math.floor(worldY / CONFIG.TILE_SIZE);

    let baseAlpha = 0;
    if (row >= 0 && row < CONFIG.GRID_ROWS && col >= 0 && col < CONFIG.GRID_COLS) {
      baseAlpha = this.visibilityGrid[row][col];
    }

    for (let i = 0; i < this.waves.length; i++) {
      const wave = this.waves[i];
      const dx = worldX - wave.x;
      const dy = worldY - wave.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(dist - wave.radius) <= wave.thickness) {
        if (wave.alpha > baseAlpha) {
          baseAlpha = wave.alpha;
        }
      }
    }

    return Math.min(1.0, baseAlpha);
  }

  getActiveWaves() {
    return this.waves;
  }
}
