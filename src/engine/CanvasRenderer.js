/**
 * SONAR: The Echo Chamber
 * Canvas 2D Vector-Phosphor Rendering Engine with Stalker, Decoy & Juice Effects
 */

import { CONFIG } from '../config.js';
import { HUNTER_STATES } from '../entities/Hunter.js';
import { STALKER_STATES } from '../entities/Stalker.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = CONFIG.CANVAS_WIDTH;
    this.height = CONFIG.CANVAS_HEIGHT;

    this.animTime = 0;
  }

  reset() {
    // Reset any persistent render animations if needed
  }

  /**
   * Master Render Frame
   */
  render(
    ctx,
    gridMap,
    waveSystem,
    player,
    hunters,
    stalkers,
    resonators,
    lighthouses,
    decoys,
    crystals,
    gate,
    particleEngine,
    time = 0,
    isChased = false
  ) {
    this.animTime = (typeof time === 'number' && !isNaN(time)) ? time : ((typeof this.animTime === 'number' && !isNaN(this.animTime)) ? this.animTime + 0.016 : 0);
    ctx = ctx || this.ctx;

    // Apply Screen Shake Camera Translation
    ctx.save();
    if (particleEngine) {
      ctx.translate(particleEngine.shakeOffset.x, particleEngine.shakeOffset.y);
    }

    // 1. Clear background to pitch black
    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render ambient phosphor dust
    if (particleEngine) {
      particleEngine.renderAmbientDust(ctx);
    }

    // 3. Render illuminated floor grid & walls
    this.renderWorldGrid(ctx, gridMap, waveSystem);

    // 4. Render Gate (Airlock)
    this.renderGate(ctx, gate, waveSystem);

    // 5. Render Crystals
    this.renderCrystals(ctx, crystals, waveSystem);

    // 6. Render Decoys
    this.renderDecoys(ctx, decoys, waveSystem);

    // 7. Render Resonators
    this.renderResonators(ctx, resonators, waveSystem);

    // 8. Render Lighthouses
    this.renderLighthouses(ctx, lighthouses, waveSystem);

    // 9. Render Active Sound Wavefronts
    this.renderWaves(ctx, waveSystem);

    // 10. Render Stalkers (Purple Silent Predators)
    this.renderStalkers(ctx, stalkers, waveSystem);

    // 11. Render Hunters (Red Blind Predators)
    this.renderHunters(ctx, hunters, waveSystem);

    // 12. Render Player (Echo Drone)
    if (player.isAlive) {
      this.renderPlayer(ctx, player);
    }

    // 13. Render Dynamic Burst Particles
    if (particleEngine) {
      particleEngine.render(ctx);
    }

    // 14. Render Red Chase Vignette if any Hunter is sprinting
    this.renderChaseVignette(ctx, hunters);

    ctx.restore();
  }

  /**
   * Renders wall tiles and faint floor grids ONLY where illuminated by phosphor decay (Strict Zero-Light).
   */
  renderWorldGrid(ctx, gridMap, waveSystem) {
    const ts = CONFIG.TILE_SIZE;
    const visGrid = waveSystem.visibilityGrid;

    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const vis = visGrid[r][c];
        if (vis <= 0.05) continue; // 100% pitch black in darkness

        const x = c * ts;
        const y = r * ts;
        const tile = gridMap.getTile(c, r);

        if (tile === CONFIG.TILES.WALL) {
          ctx.save();

          // Illuminated Wall Block
          ctx.fillStyle = `rgba(18, 26, 38, ${vis * 0.95})`;
          ctx.fillRect(x, y, ts, ts);

          // Crisp Neon Cyan Outline
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = `rgba(0, 240, 255, ${vis})`;
          ctx.shadowBlur = 6 * vis;
          ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);

          // White Inner Highlight
          ctx.shadowBlur = 0;
          ctx.strokeStyle = `rgba(255, 255, 255, ${vis * 0.25})`;
          ctx.strokeRect(x + 1.5, y + 1.5, ts - 3, ts - 3);

          // Subtle Cross Grid Lines
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 * vis})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + ts / 2, y + 4);
          ctx.lineTo(x + ts / 2, y + ts - 4);
          ctx.moveTo(x + 4, y + ts / 2);
          ctx.lineTo(x + ts - 4, y + ts / 2);
          ctx.stroke();

          ctx.restore();
        } else {
          // Floor Dot indicator
          ctx.save();
          ctx.fillStyle = `rgba(0, 240, 255, ${vis * 0.15})`;
          ctx.fillRect(x + ts / 2 - 1, y + ts / 2 - 1, 2, 2);
          ctx.restore();
        }
      }
    }
  }

  /**
   * Renders active sound waves as glowing concentric circles.
   */
  renderWaves(ctx, waveSystem) {
    const waves = waveSystem.getActiveWaves();
    if (waves.length === 0) return;

    ctx.save();
    for (let i = 0; i < waves.length; i++) {
      const w = waves[i];
      if (w.alpha <= 0) continue;

      ctx.beginPath();
      ctx.arc(w.x, w.y, Math.max(0, w.radius), 0, Math.PI * 2);
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

      // Rotating beacon cross
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
   * Renders Shadow Stalkers (Purple Silent Predators)
   */
  renderStalkers(ctx, stalkers, waveSystem) {
    if (!stalkers || stalkers.length === 0) return;

    for (let i = 0; i < stalkers.length; i++) {
      const s = stalkers[i];
      const vis = waveSystem.getVisibilityAt(s.x, s.y);
      const isStunned = s.state === STALKER_STATES.STUNNED;

      if (vis <= 0.02 && !isStunned) continue;

      ctx.save();
      ctx.translate(s.x, s.y);

      const angle = Math.atan2(s.facing.dy, s.facing.dx);
      ctx.rotate(angle);

      ctx.globalAlpha = isStunned ? 1.0 : Math.min(1.0, vis * 1.3);

      if (isStunned) {
        // Frozen Crystalline Glow
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = CONFIG.COLORS.STALKER;
        ctx.shadowColor = CONFIG.COLORS.STALKER_GLOW;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.5;

        // Ice crystal octagon
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stunned indicator text
        ctx.restore();
        ctx.save();
        ctx.translate(s.x, s.y - 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = CONFIG.COLORS.STALKER;
        ctx.shadowBlur = 8;
        ctx.fillText('STUNNED', 0, 0);
      } else {
        // Dark Spectral Silhouette
        ctx.fillStyle = '#100518';
        ctx.strokeStyle = CONFIG.COLORS.STALKER;
        ctx.lineWidth = 2;
        ctx.shadowColor = CONFIG.COLORS.STALKER_GLOW;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#9D00FF';
        ctx.beginPath();
        ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Renders Resonance Crystals
   */
  renderCrystals(ctx, crystals, waveSystem) {
    for (let i = 0; i < crystals.length; i++) {
      const c = crystals[i];
      if (c.isCollected) continue;

      const vis = waveSystem.getVisibilityAt(c.x, c.y);
      if (vis <= 0.02) continue;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.globalAlpha = Math.min(1.0, vis * 1.2);

      const size = 9 + Math.sin(this.animTime * 4) * 1.5;

      ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
      ctx.shadowColor = CONFIG.COLORS.CRYSTAL_GLOW;
      ctx.shadowBlur = 12 * vis;

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.7, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Renders Airlock Exit Gate
   */
  renderGate(ctx, gate, waveSystem) {
    if (!gate) return;
    const vis = waveSystem.getVisibilityAt(gate.x, gate.y);
    if (vis <= 0.02 && !gate.isOpen) return;

    const ts = CONFIG.TILE_SIZE;
    const x = gate.x - ts / 2;
    const y = gate.y - ts / 2;

    ctx.save();
    const effectiveAlpha = gate.isOpen ? Math.max(0.85, vis) : vis;
    ctx.globalAlpha = Math.min(1.0, effectiveAlpha);

    if (gate.isOpen) {
      const glow = 10 + Math.sin(gate.pulseAnim) * 6;
      ctx.fillStyle = '#062014';
      ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);

      ctx.strokeStyle = CONFIG.COLORS.GATE_OPEN;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = CONFIG.COLORS.GATE_OPEN;
      ctx.shadowBlur = glow;
      ctx.strokeRect(x + 2, y + 2, ts - 4, ts - 4);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const bob = Math.sin(gate.pulseAnim * 1.5) * 3;
      ctx.moveTo(gate.x - 6, gate.y + 4 + bob);
      ctx.lineTo(gate.x, gate.y - 4 + bob);
      ctx.lineTo(gate.x + 6, gate.y + 4 + bob);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#101720';
      ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);

      ctx.strokeStyle = CONFIG.COLORS.GATE_LOCKED;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, ts - 4, ts - 4);

      ctx.fillStyle = CONFIG.COLORS.HUNTER;
      ctx.fillRect(gate.x - 3, gate.y - 3, 6, 6);
    }

    ctx.restore();
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
   * Renders Hunters (Red Blind Stalkers)
   */
  renderHunters(ctx, hunters, waveSystem) {
    for (let i = 0; i < hunters.length; i++) {
      const h = hunters[i];
      const vis = waveSystem.getVisibilityAt(h.x, h.y);
      const isAlerted = h.state === HUNTER_STATES.CHASE || h.alertFlashTimer > 0;

      if (vis <= 0.02 && !isAlerted) continue;

      ctx.save();
      ctx.translate(h.x, h.y);

      const angle = Math.atan2(h.facing.dy, h.facing.dx);
      ctx.rotate(angle);

      const alpha = isAlerted ? 1.0 : Math.min(1.0, vis * 1.2);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#1e050a';
      ctx.strokeStyle = CONFIG.COLORS.HUNTER;
      ctx.lineWidth = 2;
      ctx.shadowColor = CONFIG.COLORS.HUNTER_GLOW;
      ctx.shadowBlur = isAlerted ? 16 : 8;

      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-9, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      if (h.state === HUNTER_STATES.CHASE) {
        ctx.restore();
        ctx.save();
        ctx.translate(h.x, h.y - 18);
        ctx.fillStyle = CONFIG.COLORS.HUNTER;
        ctx.font = 'bold 12px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = CONFIG.COLORS.HUNTER_GLOW;
        ctx.shadowBlur = 8;
        ctx.fillText('!', 0, 0);
      }

      ctx.restore();
    }
  }

  /**
   * Renders Player (Echo Drone)
   */
  renderPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x, player.y);

    const angle = Math.atan2(player.facing.dy, player.facing.dx);
    ctx.rotate(angle);

    ctx.fillStyle = '#031720';
    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.lineWidth = 2;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-7, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const corePulse = Math.max(0.5, 2 + Math.sin((this.animTime || 0) * 8) * 0.8);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Red pulsing border vignette when player is hunted.
   */
  renderChaseVignette(ctx, hunters) {
    let isChasing = false;
    for (let i = 0; i < hunters.length; i++) {
      if (hunters[i].state === HUNTER_STATES.CHASE) {
        isChasing = true;
        break;
      }
    }

    if (!isChasing) return;

    ctx.save();
    const alpha = 0.15 + Math.sin(this.animTime * 8) * 0.1;
    ctx.strokeStyle = `rgba(255, 30, 68, ${alpha})`;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, this.width - 14, this.height - 14);
    ctx.restore();
  }
}
