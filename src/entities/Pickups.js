/**
 * SONAR: The Echo Chamber
 * Resonance Crystals & Airlock Gate Pickups
 */

import { CONFIG } from '../config.js';

export class Crystal {
  constructor(idOrConfig, gx, gy) {
    if (typeof idOrConfig === 'object') {
      this.id = idOrConfig.id || 'c_' + Math.random().toString(36).substr(2, 4);
      this.gridX = idOrConfig.gx || 0;
      this.gridY = idOrConfig.gy || 0;
    } else {
      this.id = idOrConfig || 'c_' + Math.random().toString(36).substr(2, 4);
      this.gridX = gx || 0;
      this.gridY = gy || 0;
    }
    this.x = this.gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = this.gridY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.isCollected = false;
    this.rotation = Math.random() * Math.PI * 2;
    this.resonanceCooldown = 0;
  }

  reset() {
    this.isCollected = false;
    this.resonanceCooldown = 0;
  }

  update(dt, waveSystem = null, audioEngine = null, particleEngine = null) {
    if (this.isCollected) return;
    this.rotation += dt * 2.5;

    if (this.resonanceCooldown > 0) {
      this.resonanceCooldown -= dt;
    }

    // Acoustic Wave Resonance & Chime Echo
    if (waveSystem && this.resonanceCooldown <= 0) {
      const activeWaves = waveSystem.getActiveWaves();
      for (let i = 0; i < activeWaves.length; i++) {
        const w = activeWaves[i];
        const dx = this.x - w.x;
        const dy = this.y - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(dist - w.radius) <= w.thickness + 10) {
          this.resonanceCooldown = 1.0; // Debounce per crystal
          if (audioEngine && typeof audioEngine.playCrystalResonance === 'function') {
            audioEngine.playCrystalResonance();
          }
          if (particleEngine && typeof particleEngine.spawnCrystalSparkle === 'function') {
            particleEngine.spawnCrystalSparkle(this.x, this.y);
          }
          break;
        }
      }
    }
  }

  checkPickup(gx, gy) {
    if (this.isCollected) return false;
    if (gx === this.gridX && gy === this.gridY) {
      this.isCollected = true;
      return true;
    }
    return false;
  }

  get collected() { return this.isCollected; }
  set collected(val) { this.isCollected = val; }

  checkCollection(player, audioEngine) {
    if (this.isCollected || !player.isAlive) return false;

    if (player.gridX === this.gridX && player.gridY === this.gridY) {
      this.isCollected = true;
      if (audioEngine) audioEngine.playCrystalPickup(player.crystalsCollected || 0);
      return true;
    }
    return false;
  }
}

export class Gate {
  constructor(gxOrConfig, gy) {
    if (typeof gxOrConfig === 'object') {
      this.gridX = gxOrConfig.gx || 0;
      this.gridY = gxOrConfig.gy || 0;
    } else {
      this.gridX = gxOrConfig || 0;
      this.gridY = gy || 0;
    }
    this.x = this.gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = this.gridY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.isOpen = false;
    this.pulseAnim = 0;
    this.beaconTimer = 0;
    this.beaconInterval = 2.5; // Emits green beacon wave every 2.5s
  }

  reset() {
    this.isOpen = false;
    this.pulseAnim = 0;
    this.beaconTimer = 0;
  }

  unlock(audioEngine) {
    if (!this.isOpen) {
      this.isOpen = true;
      this.beaconTimer = 2.0; // Trigger first beacon wave almost immediately
      if (audioEngine) audioEngine.playGateUnlock();
    }
  }

  update(dt, waveSystem = null) {
    if (this.isOpen) {
      this.pulseAnim += dt * 4;
      this.beaconTimer += dt;
      if (this.beaconTimer >= this.beaconInterval) {
        this.beaconTimer = 0;
        if (waveSystem && typeof waveSystem.createBeaconWave === 'function') {
          waveSystem.createBeaconWave(this.x, this.y);
        }
      }
    }
  }

  checkEntry(player) {
    if (!this.isOpen || !player.isAlive) return false;
    return player.gridX === this.gridX && player.gridY === this.gridY;
  }
}
