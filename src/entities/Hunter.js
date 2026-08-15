/**
 * SONAR: The Echo Chamber
 * Hunter Entity - Blind Predator AI with BFS Pathfinding and Decoy Sensitivity
 */

import { CONFIG } from '../config.js';

export const HUNTER_STATES = {
  PATROL: 'PATROL',
  ALERT: 'ALERT',
  CHASE: 'CHASE',
  SEARCH: 'SEARCH'
};

export class Hunter {
  constructor(idOrConfig, startGx, startGy, waypoints) {
    if (typeof idOrConfig === 'object') {
      this.id = idOrConfig.id || 'hunter_' + Math.random().toString(36).substr(2, 4);
      this.startGx = idOrConfig.startGx || 0;
      this.startGy = idOrConfig.startGy || 0;
      this.waypoints = idOrConfig.waypoints || [{ gx: this.startGx, gy: this.startGy }];
    } else {
      this.id = idOrConfig || 'hunter_' + Math.random().toString(36).substr(2, 4);
      this.startGx = startGx || 0;
      this.startGy = startGy || 0;
      this.waypoints = waypoints || [{ gx: this.startGx, gy: this.startGy }];
    }

    this.gridX = this.startGx;
    this.gridY = this.startGy;
    this.x = this.startGx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = this.startGy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.startX = this.x;
    this.startY = this.y;
    this.endX = this.x;
    this.endY = this.y;

    this.targetGridX = this.startGx;
    this.targetGridY = this.startGy;

    this.state = HUNTER_STATES.PATROL;
    this.currentWaypointIndex = 0;
    this.currentPath = [];

    this.isMoving = false;
    this.moveTimer = 0;
    this.stateTimer = 0;
    this.facing = { dx: 0, dy: 1 };

    this.targetSound = null;
    this.hearingMultiplier = 1.0;
    this.alertFlashTimer = 0;

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

    this.state = HUNTER_STATES.PATROL;
    this.currentWaypointIndex = 0;
    this.currentPath = [];
    this.isMoving = false;
    this.moveTimer = 0;
    this.stateTimer = 0;
    this.targetSound = null;
    this.hearingMultiplier = 1.0;
    this.alertFlashTimer = 0;
  }

  hearSound(soundEvent, gridMap, audioEngine, particleEngine) {
    let hears = false;

    if (soundEvent.isGlobal || soundEvent.type === 'DECOY') {
      hears = true;
    } else {
      const dx = this.gridX - soundEvent.gridX;
      const dy = this.gridY - soundEvent.gridY;
      const distTiles = Math.sqrt(dx * dx + dy * dy);
      const maxDist = (soundEvent.radiusTiles || CONFIG.HUNTER.HEARING_RADIUS_TILES) * this.hearingMultiplier;

      if (distTiles <= maxDist) {
        hears = true;
      }
    }

    if (hears) {
      this.targetSound = { gx: soundEvent.gridX, gy: soundEvent.gridY };
      this.alertFlashTimer = 350;

      if (this.state !== HUNTER_STATES.CHASE) {
        audioEngine.playHunterAlert();
        if (particleEngine) {
          particleEngine.addShake(3, 200);
        }
      }

      this.state = HUNTER_STATES.CHASE;
      this.currentPath = gridMap.findPath(this.targetGridX, this.targetGridY, soundEvent.gridX, soundEvent.gridY);
    }
  }

  update(dt, gridMap, player, waveSystem, audioEngine, particleEngine) {
    const dtMs = dt * 1000;
    if (this.alertFlashTimer > 0) {
      this.alertFlashTimer -= dtMs;
    }

    const stepDuration = (this.state === HUNTER_STATES.CHASE)
      ? CONFIG.HUNTER.CHASE_STEP_DURATION
      : CONFIG.HUNTER.PATROL_STEP_DURATION;

    // 1. Tile Interpolation
    if (this.isMoving) {
      this.moveTimer += dtMs;
      const progress = Math.min(1.0, this.moveTimer / stepDuration);
      this.x = this.startX + (this.endX - this.startX) * progress;
      this.y = this.startY + (this.endY - this.startY) * progress;

      if (progress >= 1.0) {
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.x = this.endX;
        this.y = this.endY;
        this.isMoving = false;

        if (this.state === HUNTER_STATES.CHASE) {
          audioEngine.playHunterStep();
        }
      }
    }

    // 2. State Machine Decisions
    if (!this.isMoving) {
      switch (this.state) {
        case HUNTER_STATES.PATROL:
          this.updatePatrol(gridMap);
          break;

        case HUNTER_STATES.CHASE:
          this.updateChase(gridMap);
          break;

        case HUNTER_STATES.SEARCH:
          this.updateSearch(dtMs, gridMap);
          break;
      }
    }

    // 3. Lethal collision with player
    if (player.isAlive) {
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.HUNTER.COLLISION_DISTANCE) {
        player.kill(audioEngine);
      }
    }
  }

  updatePatrol(gridMap) {
    if (this.waypoints.length === 0) return;

    if (this.currentPath.length === 0) {
      const wp = this.waypoints[this.currentWaypointIndex];
      if (this.gridX === wp.gx && this.gridY === wp.gy) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      }
      const nextWp = this.waypoints[this.currentWaypointIndex];
      this.currentPath = gridMap.findPath(this.gridX, this.gridY, nextWp.gx, nextWp.gy);
    }

    this.takeNextPathStep(gridMap);
  }

  updateChase(gridMap) {
    if (this.currentPath.length === 0) {
      this.state = HUNTER_STATES.SEARCH;
      this.stateTimer = CONFIG.HUNTER.SEARCH_DURATION;
      this.targetSound = null;
      return;
    }

    this.takeNextPathStep(gridMap);
  }

  updateSearch(dtMs, gridMap) {
    this.stateTimer -= dtMs;

    const angle = (Date.now() / 300) % (Math.PI * 2);
    this.facing = { dx: Math.cos(angle), dy: Math.sin(angle) };

    if (this.stateTimer <= 0) {
      this.state = HUNTER_STATES.PATROL;
      const nearestWp = this.waypoints[this.currentWaypointIndex] || { gx: this.startGx, gy: this.startGy };
      this.currentPath = gridMap.findPath(this.gridX, this.gridY, nearestWp.gx, nearestWp.gy);
    }
  }

  takeNextPathStep(gridMap) {
    if (this.currentPath.length === 0) return;

    const nextTile = this.currentPath.shift();
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
