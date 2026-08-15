/**
 * SONAR: The Echo Chamber
 * Decoy Flare Entity - Thrown Acoustic Distraction
 */

import { CONFIG } from '../config.js';

export class Decoy {
  constructor(startGx, startGy, dirX, dirY, gridMap) {
    // Trace trajectory up to 4 tiles forward or until wall
    let currGx = startGx;
    let currGy = startGy;
    const maxDist = CONFIG.DECOY.THROW_DISTANCE;

    for (let i = 1; i <= maxDist; i++) {
      const nextGx = startGx + dirX * i;
      const nextGy = startGy + dirY * i;
      if (gridMap.isWalkable(nextGx, nextGy)) {
        currGx = nextGx;
        currGy = nextGy;
      } else {
        break;
      }
    }

    this.gridX = currGx;
    this.gridY = currGy;
    this.x = currGx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = currGy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

    this.lifeTimer = CONFIG.DECOY.DURATION; // 3000ms
    this.pulseTimer = 0; // First pulse immediately
    this.isExpired = false;

    this.onDecoyPulse = null; // Callback: (soundEvent) => {}
  }

  update(dt, waveSystem, audioEngine) {
    if (this.isExpired) return;

    const dtMs = dt * 1000;
    this.lifeTimer -= dtMs;
    this.pulseTimer -= dtMs;

    if (this.pulseTimer <= 0) {
      this.pulseTimer = CONFIG.DECOY.PULSE_INTERVAL; // 400ms

      // Visual acoustic shockwave
      waveSystem.createDecoyWave(this.x, this.y);
      audioEngine.playDecoyBeep();

      // Alert all hunters to decoy location
      if (this.onDecoyPulse) {
        this.onDecoyPulse({
          x: this.x,
          y: this.y,
          gridX: this.gridX,
          gridY: this.gridY,
          isGlobal: true,
          intensity: 2.0,
          type: 'DECOY'
        });
      }
    }

    if (this.lifeTimer <= 0) {
      this.isExpired = true;
    }
  }
}
