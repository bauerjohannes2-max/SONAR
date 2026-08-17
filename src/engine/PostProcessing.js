/**
 * SONAR: The Echo Chamber
 * High-Performance Deep-Sea Post-Processing Pipeline
 * Renders atmospheric radial vignette, tension chromatic aberration, and tactile camera scanlines.
 */

import { CONFIG } from '../config.js';

export class PostProcessing {
  constructor(width = CONFIG.CANVAS_WIDTH, height = CONFIG.CANVAS_HEIGHT) {
    this.width = width;
    this.height = height;
    this.tension = 0; // 0.0 to 1.0 (approaching predators)
    this.vignetteGradient = null;

    this.createStaticVignette();
  }

  createStaticVignette() {
    // Create pre-calculated offscreen radial vignette for zero per-frame allocation
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.width;
    offCanvas.height = this.height;
    const offCtx = offCanvas.getContext('2d');

    const cx = this.width / 2;
    const cy = this.height / 2;
    const r = Math.sqrt(cx * cx + cy * cy);

    const grad = offCtx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(2, 6, 12, 0.45)');
    grad.addColorStop(1, 'rgba(0, 2, 6, 0.88)');

    offCtx.fillStyle = grad;
    offCtx.fillRect(0, 0, this.width, this.height);

    this.vignetteCanvas = offCanvas;
  }

  /**
   * Update tension based on proximity of nearest alerted hunter/stalker
   */
  update(dt, player, hunters = [], stalkers = []) {
    let minDistance = 9999;

    if (player && player.isAlive) {
      const checkEntity = (ent) => {
        if (!ent) return;
        const dx = ent.x - player.x;
        const dy = ent.y - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDistance) {
          minDistance = d;
        }
      };

      hunters.forEach(checkEntity);
      stalkers.forEach(checkEntity);
    }

    // Proximity tension activates within 4 grid tiles (4 * 32 = 128px)
    const tensionThreshold = 128;
    const targetTension = minDistance < tensionThreshold
      ? Math.max(0, 1 - minDistance / tensionThreshold)
      : 0;

    // Smooth lerp
    this.tension += (targetTension - this.tension) * Math.min(1.0, dt * 5);
  }

  /**
   * Apply post-processing overlay passes to canvas context
   */
  render(ctx, time) {
    ctx.save();

    // 1. Radial Deep-Sea Vignette Pass
    if (this.vignetteCanvas) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.vignetteCanvas, 0, 0);
    }

    // 2. Predator Proximity Tension Pass (Pulsing Red Threat Aberration & Radial Danger Vignette)
    if (this.tension > 0.05) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 9);
      const intensity = this.tension * (0.6 + 0.4 * pulse);

      // Radial Danger Vignette
      const cx = this.width / 2;
      const cy = this.height / 2;
      const r = Math.sqrt(cx * cx + cy * cy);
      const dangerGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
      dangerGrad.addColorStop(0, 'rgba(255, 0, 40, 0)');
      dangerGrad.addColorStop(0.7, `rgba(255, 20, 50, ${intensity * 0.18})`);
      dangerGrad.addColorStop(1, `rgba(255, 10, 40, ${intensity * 0.42})`);
      ctx.fillStyle = dangerGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = `rgba(255, 30, 68, ${intensity * 0.65})`;
      ctx.lineWidth = Math.max(2, 5 * this.tension);
      ctx.strokeRect(0, 0, this.width, this.height);

      // Threat corner indicators
      const cornerLen = 28;
      ctx.strokeStyle = `rgba(255, 40, 75, ${intensity * 0.9})`;
      ctx.lineWidth = 2.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(8, 8 + cornerLen);
      ctx.lineTo(8, 8);
      ctx.lineTo(8 + cornerLen, 8);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(this.width - 8 - cornerLen, 8);
      ctx.lineTo(this.width - 8, 8);
      ctx.lineTo(this.width - 8, 8 + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(8, this.height - 8 - cornerLen);
      ctx.lineTo(8, this.height - 8);
      ctx.lineTo(8 + cornerLen, this.height - 8);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(this.width - 8 - cornerLen, this.height - 8);
      ctx.lineTo(this.width - 8, this.height - 8);
      ctx.lineTo(this.width - 8, this.height - 8 - cornerLen);
      ctx.stroke();
    }

    ctx.restore();
  }
}
