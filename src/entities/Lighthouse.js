/**
 * SONAR: The Echo Chamber
 * Lighthouse Entity - Mobile or Stationary Ambient Sound Buoy
 */

import { CONFIG } from '../config.js';

export class Lighthouse {
  constructor(config) {
    this.id = config.id || 'light_' + Math.random().toString(36).substr(2, 4);
    this.centerGx = config.gx;
    this.centerGy = config.gy;
    this.centerX = config.gx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.centerY = config.gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

    this.x = this.centerX;
    this.y = this.centerY;
    this.pulseTimer = 2000; // First pulse after 2s
    this.orbitAngle = 0;
    this.orbitRadius = 24; // Slight circular drift
  }

  reset() {
    this.pulseTimer = 2000;
    this.orbitAngle = 0;
    this.x = this.centerX;
    this.y = this.centerY;
  }

  update(dt, waveSystem, audioEngine) {
    const dtMs = dt * 1000;
    this.pulseTimer -= dtMs;

    // Gentle orbital drift
    this.orbitAngle += dt * 0.8;
    this.x = this.centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.y = this.centerY + Math.sin(this.orbitAngle) * this.orbitRadius;

    if (this.pulseTimer <= 0) {
      this.pulseTimer = CONFIG.LIGHTHOUSE.PULSE_INTERVAL;
      waveSystem.createLighthouseWave(this.x, this.y);
      audioEngine.playLighthousePulse();
    }
  }
}
