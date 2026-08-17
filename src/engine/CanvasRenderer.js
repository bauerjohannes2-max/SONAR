/**
 * SONAR: The Echo Chamber
 * High-Performance Sci-Fi Canvas 2D Renderer
 * Integrates CC0 Sprite Sheets, Modular Tileset Walls, Particle Wake & Post-Processing.
 */

import { CONFIG } from '../config.js';
import { spriteManager } from './SpriteManager.js';
import { PostProcessing } from './PostProcessing.js';
import { HUNTER_STATES } from '../entities/Hunter.js';
import { STALKER_STATES } from '../entities/Stalker.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = CONFIG.CANVAS_WIDTH;
    this.height = CONFIG.CANVAS_HEIGHT;

    this.postProcessing = new PostProcessing(this.width, this.height);
    this.animTime = 0;
    this.camera = null;
  }

  reset() {
    this.camera = null;
  }

  /**
   * Master Render Frame
   */
  render(
    ctx,
    gridMap,
    waveSystem,
    player,
    hunters = [],
    stalkers = [],
    resonators = [],
    lighthouses = [],
    decoys = [],
    crystals = [],
    gate = null,
    particleEngine = null,
    time = 0,
    isChased = false
  ) {
    this.animTime = (typeof time === 'number' && !isNaN(time)) ? time : ((typeof this.animTime === 'number' && !isNaN(this.animTime)) ? this.animTime + 0.016 : 0);
    ctx = ctx || this.ctx;

    // 1. Smooth Camera Tracking (Player Centered)
    if (player && typeof player.x === 'number') {
      if (!this.camera) {
        this.camera = { x: player.x, y: player.y };
      } else {
        this.camera.x += (player.x - this.camera.x) * 0.18;
        this.camera.y += (player.y - this.camera.y) * 0.18;
      }
    } else {
      this.camera = { x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT / 2 };
    }

    const camX = Math.round(CONFIG.CANVAS_WIDTH / 2 - this.camera.x);
    const camY = Math.round(CONFIG.CANVAS_HEIGHT / 2 - this.camera.y);

    // 2. Clear background to pitch black in screen space
    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. World Space Rendering with Camera Translation & Screen Shake
    ctx.save();
    const shakeX = particleEngine ? particleEngine.shakeOffset.x : 0;
    const shakeY = particleEngine ? particleEngine.shakeOffset.y : 0;
    ctx.translate(camX + shakeX, camY + shakeY);

    // Render ambient marine snow & plankton in world
    if (particleEngine) {
      particleEngine.renderAmbientDust(ctx);
    }

    // Render modular sci-fi walls & illuminated floor grid
    this.renderWorldGrid(ctx, gridMap, waveSystem);

    // Render Gate (Airlock Hyper-Gate)
    this.renderGate(ctx, gate, waveSystem);

    // Render Nanotech Core Crystals
    this.renderCrystals(ctx, crystals, waveSystem);

    // Render Decoys
    this.renderDecoys(ctx, decoys, waveSystem);

    // Render Resonators
    this.renderResonators(ctx, resonators, waveSystem);

    // Render Lighthouses
    this.renderLighthouses(ctx, lighthouses, waveSystem);

    // Render Active Sound Wavefronts with Radial Bloom
    this.renderWaves(ctx, waveSystem);

    // Render Stalkers (Shadow Predators)
    this.renderStalkers(ctx, stalkers, waveSystem);

    // Render Hunters (Red Bio-Mechanical Predators)
    this.renderHunters(ctx, hunters, waveSystem);

    // Render Player (Echo Drone) & Wayfinder Arrow
    if (player && player.isAlive) {
      this.renderPlayer(ctx, player);
      this.renderPortalWayfinder(ctx, player, gate);
    }

    // Render Dynamic Burst Particles, Bubbles & Ghost Trails
    if (particleEngine) {
      particleEngine.render(ctx);
    }

    ctx.restore();

    // 4. Post-Processing Passes (Deep-Sea Vignette, Threat Tension Aberration, Screen Shake)
    this.postProcessing.update(0.016, player, hunters, stalkers);
    this.postProcessing.render(ctx, this.animTime);
  }

  /**
   * Renders modular wall tiles and faint floor grids ONLY where illuminated by phosphor decay.
   */
  renderWorldGrid(ctx, gridMap, waveSystem) {
    const ts = CONFIG.TILE_SIZE;
    const visGrid = waveSystem.visibilityGrid;

    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const vis = visGrid[r][c];
        if (vis <= 0.04) continue; // 100% pitch black in darkness

        const x = c * ts;
        const y = r * ts;
        const tile = gridMap.getTile(c, r);

        if (tile === CONFIG.TILES.WALL) {
          spriteManager.drawWallTile(ctx, x, y, ts, c, r, vis);
        } else {
          // Floor micro-phosphor dot indicator
          ctx.save();
          ctx.fillStyle = `rgba(0, 240, 255, ${vis * 0.18})`;
          ctx.fillRect(x + ts / 2 - 1, y + ts / 2 - 1, 2, 2);
          ctx.restore();
        }
      }
    }
  }

  /**
   * Renders active sound waves with glowing radial wavefronts.
   */
  renderWaves(ctx, waveSystem) {
    const waves = waveSystem.getActiveWaves();
    if (waves.length === 0) return;

    ctx.save();
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      if (w.alpha <= 0 || w.radius <= 0) continue;

      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = Math.min(1.0, w.alpha);
      ctx.lineWidth = w.type === 'PING' ? 3 : (w.type === 'RESONATOR' ? 3.5 : 2);
      ctx.shadowColor = w.color;
      ctx.shadowBlur = w.type === 'PING' ? 14 : 8;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renders Decoy Flares
   */
  renderDecoys(ctx, decoys, waveSystem) {
    if (!decoys || decoys.length === 0) return;

    for (let i = 0; i < decoys.length; i++) {
      const d = decoys[i];
      if (d.isExpired) continue;

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(this.animTime * 6);

      ctx.fillStyle = CONFIG.COLORS.DECOY;
      ctx.shadowColor = CONFIG.COLORS.DECOY_GLOW;
      ctx.shadowBlur = 12;
      ctx.fillRect(-5, -5, 10, 10);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Renders Stalkers with SpriteManager
   */
  renderStalkers(ctx, stalkers, waveSystem) {
    if (!stalkers || stalkers.length === 0) return;

    for (let i = 0; i < stalkers.length; i++) {
      const s = stalkers[i];
      const vis = waveSystem.getVisibilityAt(s.x, s.y);
      const isStunned = s.state === STALKER_STATES.STUNNED;

      if (vis <= 0.02 && !isStunned) continue;

      const angle = s.headingAngle !== undefined
        ? s.headingAngle
        : Math.atan2(s.facing.dy, s.facing.dx);

      spriteManager.drawStalker(ctx, s.x, s.y, angle, this.animTime, isStunned);

      if (isStunned) {
        ctx.save();
        ctx.translate(s.x, s.y - 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 10.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText('STUNNED', 0, 0);
        ctx.restore();
      }
    }
  }

  /**
   * Renders Hunters with SpriteManager
   */
  renderHunters(ctx, hunters, waveSystem) {
    if (!hunters || hunters.length === 0) return;

    for (let i = 0; i < hunters.length; i++) {
      const h = hunters[i];
      const vis = waveSystem.getVisibilityAt(h.x, h.y);
      const isAlerted = h.state === HUNTER_STATES.CHASE || h.alertFlashTimer > 0;

      if (vis <= 0.02 && !isAlerted) continue;

      const angle = h.headingAngle !== undefined
        ? h.headingAngle
        : Math.atan2(h.facing.dy, h.facing.dx);

      spriteManager.drawHunter(ctx, h.x, h.y, angle, this.animTime, isAlerted);

      if (h.state === HUNTER_STATES.CHASE) {
        ctx.save();
        ctx.translate(h.x, h.y - 18);
        ctx.fillStyle = '#FF1E44';
        ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText('!', 0, 0);
        ctx.restore();
      }
    }
  }

  /**
   * Renders Resonance Crystals with SpriteManager
   */
  renderCrystals(ctx, crystals, waveSystem) {
    for (let i = 0; i < crystals.length; i++) {
      const c = crystals[i];
      if (c.isCollected) continue;

      const vis = waveSystem.getVisibilityAt(c.x, c.y);
      if (vis <= 0.02) continue;

      spriteManager.drawCrystal(ctx, c.x, c.y, this.animTime);
    }
  }

  /**
   * Renders Airlock Exit Gate with SpriteManager
   */
  renderGate(ctx, gate, waveSystem) {
    if (!gate) return;
    const vis = waveSystem.getVisibilityAt(gate.x, gate.y);
    if (vis <= 0.02 && !gate.isOpen) return;

    spriteManager.drawGate(ctx, gate.x, gate.y, gate.isOpen, this.animTime);
  }

  /**
   * Renders Yellow Resonators
   */
  renderResonators(ctx, resonators, waveSystem) {
    for (let i = 0; i < resonators.length; i++) {
      const res = resonators[i];
      const vis = waveSystem.getVisibilityAt(res.x, res.y);
      if (vis <= 0.02 && !res.isCharging) continue;

      ctx.save();
      ctx.translate(res.x, res.y);
      ctx.globalAlpha = res.isCharging ? 1.0 : Math.min(1.0, vis * 1.2);

      const sz = 10;
      ctx.fillStyle = CONFIG.COLORS.RESONATOR;
      ctx.shadowColor = CONFIG.COLORS.RESONATOR_GLOW;
      ctx.shadowBlur = res.isCharging ? 20 : 10;

      ctx.beginPath();
      ctx.moveTo(-sz, -sz * 0.4);
      ctx.lineTo(-sz * 0.4, -sz);
      ctx.lineTo(sz * 0.4, -sz);
      ctx.lineTo(sz, -sz * 0.4);
      ctx.lineTo(sz, sz * 0.4);
      ctx.lineTo(sz * 0.4, sz);
      ctx.lineTo(-sz * 0.4, sz);
      ctx.lineTo(-sz, sz * 0.4);
      ctx.closePath();
      ctx.fill();

      if (res.isCharging) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, sz + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Renders Blue Lighthouses
   */
  renderLighthouses(ctx, lighthouses, waveSystem) {
    for (let i = 0; i < lighthouses.length; i++) {
      const lh = lighthouses[i];
      const vis = waveSystem.getVisibilityAt(lh.x, lh.y);
      if (vis <= 0.02) continue;

      ctx.save();
      ctx.translate(lh.x, lh.y);
      ctx.globalAlpha = Math.max(0.6, vis);

      ctx.rotate(this.animTime * 2);
      ctx.fillStyle = CONFIG.COLORS.LIGHTHOUSE;
      ctx.shadowColor = CONFIG.COLORS.LIGHTHOUSE;
      ctx.shadowBlur = 12;

      ctx.fillRect(-6, -6, 12, 12);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Renders Player (Echo Drone) with SpriteManager and Stealth Aura
   */
  renderPlayer(ctx, player) {
    const angle = player.headingAngle !== undefined
      ? player.headingAngle
      : Math.atan2(player.facing.dy, player.facing.dx);

    spriteManager.drawDrone(ctx, player.x, player.y, angle, this.animTime, player.isSneaking);

    // Pulsing stealth field when sneaking
    if (player.isSneaking) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Renders pulsating directional wayfinder arrow pointing to unlocked Escape Portal.
   */
  renderPortalWayfinder(ctx, player, gate) {
    if (!gate || !gate.isOpen || !player || !player.isAlive) return;

    const dx = gate.x - player.x;
    const dy = gate.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 32) return; // Right on top of the gate

    const angle = Math.atan2(dy, dx);
    const pulse = 0.8 + 0.2 * Math.sin(this.animTime * 6);

    ctx.save();
    // Orbiting arrow in front of player towards portal
    const orbitDist = 34 + Math.sin(this.animTime * 8) * 3;
    const px = player.x + Math.cos(angle) * orbitDist;
    const py = player.y + Math.sin(angle) * orbitDist;

    ctx.translate(px, py);
    ctx.rotate(angle);

    ctx.fillStyle = '#00FF88';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 12 * pulse;

    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
