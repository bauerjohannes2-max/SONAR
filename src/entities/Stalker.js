/**
 * SONAR: The Echo Chamber
 * Shadow Stalker Entity - Silent Shadow Predator
 */

import { CONFIG } from '../config.js';

export const STALKER_STATES = {
  HUNTING: 'HUNTING',
  STUNNED: 'STUNNED'
};

export class Stalker {
  constructor(idOrConfig, startGx, startGy) {
    if (typeof idOrConfig === 'object') {
      this.id = idOrConfig.id || 'stalker_' + Math.random().toString(36).substr(2, 4);
      this.startGx = idOrConfig.startGx || idOrConfig.gx || 0;
      this.startGy = idOrConfig.startGy || idOrConfig.gy || 0;
    } else {
      this.id = idOrConfig || 'stalker_' + Math.random().toString(36).substr(2, 4);
      this.startGx = startGx || 0;
      this.startGy = startGy || 0;
    }

    this.gridX = this.startGx;
    this.gridY = this.startGy;
    this.targetGridX = this.startGx;
    this.targetGridY = this.startGy;

    this.x = this.startGx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = this.startGy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.startX = this.x;
    this.startY = this.y;
    this.endX = this.x;
    this.endY = this.y;

    this.state = STALKER_STATES.HUNTING;
    this.currentPath = [];
    this.isMoving = false;
    this.moveTimer = 0;
    this.stunTimer = 0;
    this.facing = { dx: 0, dy: 1 };
    this.headingAngle = Math.PI / 2;
    this.targetAngle = Math.PI / 2;
    this.lastKnownPlayerTile = null;

    this.reset();
  }

  reset() {
    this.gridX = this.startGx;
    this.gridY = this.startGy;
    this.targetGridX = this.startGx;
    this.targetGridY = this.startGy;

    this.x = this.gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = this.gridY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.startX = this.x;
    this.startY = this.y;
    this.endX = this.x;
    this.endY = this.y;

    this.headingAngle = Math.PI / 2;
    this.targetAngle = Math.PI / 2;

    this.state = STALKER_STATES.HUNTING;
    this.currentPath = [];
    this.isMoving = false;
    this.moveTimer = 0;
    this.stunTimer = 0;
    this.lastKnownPlayerTile = null;
  }

  /**
   * Check if hit by a Sonar Ping wave to stun the stalker.
   */
  checkSonarHit(waveSystem, audioEngine, particleEngine) {
    if (this.state === STALKER_STATES.STUNNED) return;

    const activeWaves = waveSystem.getActiveWaves();
    for (let i = 0; i < activeWaves.length; i++) {
      const wave = activeWaves[i];
      if (wave.type === 'PING') {
        const dx = this.x - wave.x;
        const dy = this.y - wave.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(dist - wave.radius) <= wave.thickness + 8) {
          this.state = STALKER_STATES.STUNNED;
          this.stunTimer = CONFIG.STALKER.STUN_DURATION;
          audioEngine.playStalkerStun();
          particleEngine.spawnStalkerStun(this.x, this.y);
          particleEngine.addShake(4, 250);
          break;
        }
      }
    }
  }

  update(dt, gridMap, player, waveSystem, audioEngine, particleEngine) {
    const dtMs = dt * 1000;

    // 1. Check if hit by Sonar Ping
    this.checkSonarHit(waveSystem, audioEngine, particleEngine);

    // 2. Handle Stun countdown
    if (this.state === STALKER_STATES.STUNNED) {
      this.stunTimer -= dtMs;
      if (this.stunTimer <= 0) {
        this.state = STALKER_STATES.HUNTING;
      }
      return; // Cannot move or attack while stunned
    }

    // 3. Tile Interpolation
    const stepDuration = CONFIG.STALKER.STEP_DURATION;
    if (this.isMoving) {
      this.moveTimer += dtMs;
      const progress = Math.min(1.0, this.moveTimer / stepDuration);
      this.x = this.startX + (this.endX - this.startX) * progress;
      this.y = this.startY + (this.endY - this.startY) * progress;

      if (particleEngine && Math.random() < 0.25) {
        particleEngine.spawnGhostEcho(this.x, this.y, this.headingAngle, '#AA00FF');
      }

      if (progress >= 1.0) {
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.x = this.endX;
        this.y = this.endY;
        this.isMoving = false;
      }
    }

    if (this.facing && (this.facing.dx !== 0 || this.facing.dy !== 0)) {
      this.targetAngle = Math.atan2(this.facing.dy, this.facing.dx);
    }
    let diff = this.targetAngle - this.headingAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.headingAngle += diff * Math.min(1.0, dt * 10);

    // 4. Stalk toward player's position (Strict BFS Shortest Path at every single step)
    if (!this.isMoving && player.isAlive) {
      // Strictly recalculate mathematically shortest BFS path to player's current tile
      const path = gridMap.findPath(this.gridX, this.gridY, player.gridX, player.gridY);
      this.currentPath = path;

      if (path && path.length > 0) {
        const nextTile = path[0];
        if (gridMap.isWalkable(nextTile.gx, nextTile.gy)) {
          this.targetGridX = nextTile.gx;
          this.targetGridY = nextTile.gy;
          this.facing = {
            dx: nextTile.gx - this.gridX,
            dy: nextTile.gy - this.gridY
          };
          this.startX = this.x;
          this.startY = this.y;
          this.endX = nextTile.gx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.endY = nextTile.gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.moveTimer = 0;
          this.isMoving = true;
        }
      }
    }

    // 5. Collision with Player
    if (player.isAlive && this.state !== STALKER_STATES.STUNNED) {
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.STALKER.COLLISION_DISTANCE) {
        player.kill(audioEngine);
      }
    }
  }
}

export { Stalker as ShadowStalker };

