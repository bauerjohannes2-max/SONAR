/**
 * SONAR: The Echo Chamber
 * Resonator Entity - Alarm Node with Secondary Counter-Echo
 */

import { CONFIG } from '../config.js';

export class Resonator {
  constructor(config) {
    this.id = config.id || 'res_' + Math.random().toString(36).substr(2, 4);
    this.gridX = config.gx;
    this.gridY = config.gy;
    this.x = config.gx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = config.gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

    this.isCharging = false;
    this.chargeTimer = 0;
    this.cooldownTimer = 0;
    this.onResonated = null; // Callback: (soundEvent) => {}
  }

  reset() {
    this.isCharging = false;
    this.chargeTimer = 0;
    this.cooldownTimer = 0;
  }

  update(dt, waveSystem, audioEngine) {
    const dtMs = dt * 1000;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dtMs;
    }

    // Charging countdown
    if (this.isCharging) {
      this.chargeTimer -= dtMs;
      if (this.chargeTimer <= 0) {
        this.isCharging = false;
        this.cooldownTimer = 3500; // 3.5s cooldown

        // Release yellow shockwave
        waveSystem.createResonatorWave(this.x, this.y);
        audioEngine.playResonatorTrigger();

        // Alert all hunters with global sound event & heightened hearing
        if (this.onResonated) {
          this.onResonated({
            x: this.x,
            y: this.y,
            gridX: this.gridX,
            gridY: this.gridY,
            isGlobal: true,
            intensity: 1.5,
            type: 'RESONATOR'
          });
        }
      }
      return;
    }

    // Check if player's Sonar Ping wave touches this resonator
    if (this.cooldownTimer <= 0 && !this.isCharging) {
      const activeWaves = waveSystem.getActiveWaves();
      for (let i = 0; i < activeWaves.length; i++) {
        const wave = activeWaves[i];
        if (wave.type === 'PING') {
          const dx = this.x - wave.x;
          const dy = this.y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (Math.abs(dist - wave.radius) <= wave.thickness + 10) {
            this.isCharging = true;
            this.chargeTimer = CONFIG.RESONATOR.CHARGE_TIME;
            break;
          }
        }
      }
    }
  }
}
