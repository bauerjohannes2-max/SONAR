/**
 * SONAR: The Echo Chamber
 * Player Entity (Echo Drone) with Sneak, Decoy Flare and Run Stat Tracking
 */

import { CONFIG } from '../config.js';
import { Decoy } from './Decoy.js';

export class Player {
  constructor(gx = 0, gy = 0) {
    this.gridX = gx;
    this.gridY = gy;
    this.targetGridX = gx;
    this.targetGridY = gy;
    this.x = gx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.startX = this.x;
    this.startY = this.y;
    this.endX = this.x;
    this.endY = this.y;

    this.isMoving = false;
    this.isSneaking = false;
    this.moveTimer = 0;
    this.facing = { dx: 0, dy: -1 };

    this.pingCooldownTimer = 0;
    this.decoysRemaining = CONFIG.PLAYER.DECOYS_PER_SECTOR;
    this.isAlive = true;
    this.crystalsCollected = 0;
    this.totalCrystals = 3;

    // Run Stats for Rank Calculation
    this.stepsTaken = 0;
    this.pingsUsed = 0;
    this.timeElapsed = 0;
    this.decoysUsed = 0;

    this.onSoundEmitted = null; // (soundEvent) => {}
    this.onDecoySpawned = null; // (decoy) => {}

    if (gx !== 0 || gy !== 0) {
      this.reset(gx, gy);
    }
  }

  reset(gx, gy) {
    this.gridX = gx;
    this.gridY = gy;
    this.targetGridX = gx;
    this.targetGridY = gy;

    this.x = gx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.y = gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.startX = this.x;
    this.startY = this.y;
    this.endX = this.x;
    this.endY = this.y;

    this.isMoving = false;
    this.isSneaking = false;
    this.moveTimer = 0;
    this.facing = { dx: 0, dy: -1 };
    this.pingCooldownTimer = 0;
    this.decoysRemaining = CONFIG.PLAYER.DECOYS_PER_SECTOR;
    this.isAlive = true;
    this.deathCause = null;
    this.crystalsCollected = 0;

    this.stepsTaken = 0;
    this.pingsUsed = 0;
    this.timeElapsed = 0;
    this.decoysUsed = 0;
  }

  throwDecoy(gridMap) {
    if (this.decoysRemaining <= 0) return null;
    this.decoysRemaining--;
    this.decoysUsed++;
    return new Decoy(this.gridX, this.gridY, this.facing.dx, this.facing.dy, gridMap);
  }

  update(dt, gridMap, inputHandler, waveSystem, audioEngine, particleEngine) {
    if (!this.isAlive) return;

    this.timeElapsed += dt;

    // 1. Cooldown timers
    if (this.pingCooldownTimer > 0) {
      this.pingCooldownTimer = Math.max(0, this.pingCooldownTimer - dt * 1000);
    }

    // 2. Big Sonar Ping Trigger (Space)

    // 3. Big Sonar Ping Trigger (Space)
    if (inputHandler.consumePing()) {
      if (this.pingCooldownTimer <= 0) {
        this.pingCooldownTimer = CONFIG.PLAYER.PING_COOLDOWN;
        this.pingsUsed++;
        audioEngine.playSonarPing();
        waveSystem.createSonarPing(this.x, this.y);

        if (this.onSoundEmitted) {
          this.onSoundEmitted({
            x: this.x,
            y: this.y,
            gridX: this.gridX,
            gridY: this.gridY,
            isGlobal: true,
            intensity: 1.0,
            type: 'PING'
          });
        }
      }
    }

    // 4. Movement Step Interpolation
    const stepDuration = this.isSneaking
      ? CONFIG.PLAYER.SNEAK_STEP_DURATION
      : CONFIG.PLAYER.STEP_DURATION;

    if (this.isMoving) {
      this.moveTimer += dt * 1000;
      const progress = Math.min(1.0, this.moveTimer / stepDuration);
      const ease = Math.sin((progress * Math.PI) / 2);

      this.x = this.startX + (this.endX - this.startX) * ease;
      this.y = this.startY + (this.endY - this.startY) * ease;

      if (progress >= 1.0) {
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.x = this.endX;
        this.y = this.endY;
        this.isMoving = false;
        this.stepsTaken++;

        // Only emit footstep noise & waves if NOT sneaking!
        if (!this.isSneaking) {
          audioEngine.playFootstep();
          waveSystem.createStepWave(this.x, this.y);

          if (this.onSoundEmitted) {
            this.onSoundEmitted({
              x: this.x,
              y: this.y,
              gridX: this.gridX,
              gridY: this.gridY,
              isGlobal: false,
              radiusTiles: CONFIG.HUNTER.HEARING_RADIUS_TILES,
              intensity: 0.5,
              type: 'STEP'
            });
          }
        }
      }
    }

    // 5. Accept next movement if not moving
    if (!this.isMoving) {
      this.isSneaking = inputHandler.isSneaking();
      const move = inputHandler.getMovement();

      if (move) {
        const nextGx = this.gridX + move.dx;
        const nextGy = this.gridY + move.dy;

        this.facing = { dx: move.dx, dy: move.dy };

        if (gridMap.isWalkable(nextGx, nextGy)) {
          this.targetGridX = nextGx;
          this.targetGridY = nextGy;
          this.startX = this.x;
          this.startY = this.y;
          this.endX = nextGx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.endY = nextGy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.moveTimer = 0;
          this.isMoving = true;
        } else {
          // LETHAL WALL COLLISION: Crash into wall & destroy drone!
          this.deathCause = 'WALL_CRASH';
          const crashX = this.x + move.dx * (CONFIG.TILE_SIZE * 0.45);
          const crashY = this.y + move.dy * (CONFIG.TILE_SIZE * 0.45);
          if (particleEngine) {
            particleEngine.spawnSparks(crashX, crashY, CONFIG.COLORS.WALL, 24);
            particleEngine.addShake(8, 400);
          }
          this.kill(audioEngine, 'WALL_CRASH');
        }
      }
    }
  }

  kill(audioEngine, cause = 'PREDATOR') {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.deathCause = cause;
    if (audioEngine) {
      if (cause === 'WALL_CRASH') {
        audioEngine.playWallCrash();
      } else {
        audioEngine.playDeath();
      }
    }
  }

  getPingCooldownRatio() {
    if (this.pingCooldownTimer <= 0) return 1.0;
    return 1.0 - this.pingCooldownTimer / CONFIG.PLAYER.PING_COOLDOWN;
  }

  getPingRemainingSeconds() {
    if (this.pingCooldownTimer <= 0) return 0;
    return (this.pingCooldownTimer / 1000).toFixed(1);
  }

  calculateRank() {
    let rank = 'A';
    if (this.timeElapsed <= 25 && this.pingsUsed <= 3) rank = 'S';
    else if (this.timeElapsed <= 40) rank = 'A';
    else if (this.timeElapsed <= 60) rank = 'B';
    else rank = 'C';

    return {
      rank,
      time: this.timeElapsed,
      pingsUsed: this.pingsUsed,
      stepsTaken: this.stepsTaken,
      decoysUsed: this.decoysUsed,
      deathCause: this.deathCause
    };
  }
}
