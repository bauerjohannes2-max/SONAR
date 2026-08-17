/**
 * SONAR: The Echo Chamber
 * High-Performance Sci-Fi Sprite & Tileset Manager
 * Handles asynchronous texture loading, caching, frame animation, and vector fallbacks.
 */

export class SpriteManager {
  constructor() {
    this.sprites = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.isLoaded = false;

    this.manifest = {
      drone: 'assets/sprites/drone_sheet.png',
      hunter: 'assets/sprites/hunter_sheet.png',
      stalker: 'assets/sprites/stalker_sheet.png',
      crystal: 'assets/sprites/core_crystal.png',
      walls: 'assets/sprites/tileset_walls.png',
      portal: 'assets/sprites/portal_exit.png'
    };
  }

  async loadAll() {
    if (this.isLoaded && this.sprites.size === Object.keys(this.manifest).length) {
      return this.sprites.size;
    }

    const keys = Object.keys(this.manifest);
    this.totalCount = keys.length;
    this.loadedCount = 0;

    const loadPromises = keys.map((key) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.sprites.set(key, img);
          this.loadedCount++;
          resolve(true);
        };
        img.onerror = () => {
          console.warn(`[SpriteManager] Failed to load sprite: ${this.manifest[key]}. Using vector fallback.`);
          this.sprites.set(key, null);
          resolve(false);
        };
        img.src = this.manifest[key];
      });
    });

    await Promise.all(loadPromises);
    this.isLoaded = true;
    return this.loadedCount;
  }

  get(name) {
    return this.sprites.get(name) || null;
  }

  /**
   * Draw Drone Sprite with smooth heading rotation and thruster glow
   */
  drawDrone(ctx, x, y, angle, time, isSneaking = false) {
    const img = this.get('drone');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (img && img.complete && img.naturalWidth > 0) {
      // 32x32 frame (frame 0: base facing right)
      const frameIdx = 0;
      const size = 32;
      const drawSize = 28;

      ctx.shadowColor = isSneaking ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 240, 255, 0.8)';
      ctx.shadowBlur = isSneaking ? 4 : (8 + Math.sin(time * 8) * 3);

      ctx.drawImage(img, frameIdx * size, 0, size, size, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      // Procedural Vector Fallback
      ctx.fillStyle = '#031720';
      ctx.strokeStyle = isSneaking ? '#00FF88' : '#00F0FF';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = isSneaking ? '#00FF88' : '#00F0FF';
      ctx.shadowBlur = isSneaking ? 4 : 10;

      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-9, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draw Hunter Sprite with animated swimming frame and alert eyes
   */
  drawHunter(ctx, x, y, angle, time, isAlert = false) {
    const img = this.get('hunter');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const frame = Math.floor((time * 6) % 4);
    const size = 32;
    const drawSize = 28;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.shadowColor = isAlert ? '#FF1E44' : 'rgba(255, 30, 68, 0.6)';
      ctx.shadowBlur = isAlert ? 16 : 8;

      ctx.drawImage(img, frame * size, 0, size, size, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      // Fallback
      ctx.fillStyle = '#26060e';
      ctx.strokeStyle = '#FF1E44';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF1E44';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draw Stalker Sprite with phase shift & stun state
   */
  drawStalker(ctx, x, y, angle, time, isStunned = false) {
    const img = this.get('stalker');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const frame = Math.floor((time * 4) % 4);
    const size = 32;
    const drawSize = 26;

    if (isStunned) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 15);
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.shadowColor = isStunned ? '#00F0FF' : '#AA00FF';
      ctx.shadowBlur = isStunned ? 14 : 8;

      ctx.drawImage(img, frame * size, 0, size, size, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      ctx.fillStyle = '#140220';
      ctx.strokeStyle = isStunned ? '#00F0FF' : '#AA00FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draw Nanotech Core Crystal with pulse and orbiting bits
   */
  drawCrystal(ctx, x, y, time) {
    const img = this.get('crystal');
    ctx.save();
    ctx.translate(x, y);

    const pulse = 1.0 + 0.12 * Math.sin(time * 4);
    ctx.scale(pulse, pulse);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur = 10 + 4 * Math.sin(time * 5);
      ctx.drawImage(img, -14, -14, 28, 28);
    } else {
      ctx.fillStyle = '#00FF88';
      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draw Portal Gate (Closed vs. Open Vortex)
   */
  drawGate(ctx, x, y, isOpen, time) {
    const img = this.get('portal');
    ctx.save();
    ctx.translate(x, y);

    if (isOpen) {
      ctx.rotate(time * 1.5);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.shadowColor = '#00FF88';
        ctx.shadowBlur = 16 + 6 * Math.sin(time * 6);
        ctx.drawImage(img, -16, -16, 32, 32);
      } else {
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Locked containment hatch
      ctx.strokeStyle = 'rgba(255, 30, 68, 0.8)';
      ctx.fillStyle = '#1a0408';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.fillRect(-12, -12, 24, 24);

      ctx.fillStyle = '#FF1E44';
      ctx.font = '700 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', 0, 0);
    }
    ctx.restore();
  }

  /**
   * Draw Modular Wall Tile with Sonar Wave Edge Glow
   */
  drawWallTile(ctx, x, y, tileSize, gx, gy, hitIntensity = 0) {
    const img = this.get('walls');
    // Select modular tile variant based on coordinates
    const variant = (gx * 3 + gy * 7) % 4;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.2, hitIntensity);
      ctx.drawImage(img, variant * 32, 0, 32, 32, x, y, tileSize, tileSize);

      if (hitIntensity > 0.4) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${hitIntensity})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = hitIntensity > 0.3 ? `rgba(0, 240, 255, ${hitIntensity * 0.25})` : 'rgba(4, 18, 28, 0.4)';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.strokeStyle = hitIntensity > 0.3 ? `rgba(0, 240, 255, ${hitIntensity})` : 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, tileSize, tileSize);
      ctx.restore();
    }
  }
}

export const spriteManager = new SpriteManager();
