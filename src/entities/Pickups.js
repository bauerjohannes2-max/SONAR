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
  }

  reset() {
    this.isCollected = false;
  }

  update(dt) {
    if (this.isCollected) return;
    this.rotation += dt * 2.5;
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
      if (audioEngine) audioEngine.playCrystalPickup();
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
  }

  reset() {
    this.isOpen = false;
    this.pulseAnim = 0;
  }

  unlock(audioEngine) {
    if (!this.isOpen) {
      this.isOpen = true;
      if (audioEngine) audioEngine.playGateUnlock();
    }
  }

  update(dt) {
    if (this.isOpen) {
      this.pulseAnim += dt * 4;
    }
  }

  checkEntry(player) {
    if (!this.isOpen || !player.isAlive) return false;
    return player.gridX === this.gridX && player.gridY === this.gridY;
  }
}
