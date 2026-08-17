/**
 * SONAR: The Echo Chamber
 * Advanced Deep-Sea Particle & Hydrodynamic Juice Engine
 * Manages Marine Snow, Sound-Excited Plankton, Bubble Wakes, and Screen Shake.
 */

export class ParticleEngine {
  constructor() {
    this.particles = [];
    this.marineSnow = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.screenShakeEnabled = true;

    this.initMarineSnow(80);
  }

  initMarineSnow(count = 80) {
    this.marineSnow = [];
    for (let i = 0; i < count; i++) {
      const baseAlpha = Math.random() * 0.12 + 0.04;
      this.marineSnow.push({
        x: Math.random() * 800,
        y: Math.random() * 576,
        vx: (Math.random() - 0.5) * 0.18,
        vy: Math.random() * 0.25 + 0.05, // Gentle downward drift
        alpha: baseAlpha,
        baseAlpha: baseAlpha,
        glow: 0,
        size: Math.random() * 1.8 + 0.7,
        hue: Math.random() > 0.3 ? '#00f0ff' : '#00ff88'
      });
    }
  }

  reset() {
    this.particles = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
    for (let d of this.marineSnow) {
      d.glow = 0;
    }
  }

  clear() {
    this.reset();
  }

  /**
   * Adds traumatic screen shake.
   */
  addShake(intensity = 6, duration = 300) {
    if (!this.screenShakeEnabled) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /**
   * Spawns explosive sparks or collection particles.
   */
  spawnSparks(x, y, color, count = 16, speed = 3, maxLife = 40, size = 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.8 + 0.2) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color,
        life: maxLife,
        maxLife,
        size: Math.random() * size + 1,
        type: 'SPARK'
      });
    }
  }

  /**
   * Spawns bioluminescent hydrodynamic wake trail behind moving drone.
   */
  spawnWakeParticle(x, y, droneAngle, isSneaking = false) {
    if (isSneaking) return; // 100% stealth suppression - no visible wake trail

    const backAngle = droneAngle + Math.PI + (Math.random() - 0.5) * 0.6;
    const speed = Math.random() * 0.6 + 0.25;

    this.particles.push({
      x: x + Math.cos(backAngle) * 9,
      y: y + Math.sin(backAngle) * 9,
      vx: Math.cos(backAngle) * speed + (Math.random() - 0.5) * 0.15,
      vy: Math.sin(backAngle) * speed + (Math.random() - 0.5) * 0.15,
      color: Math.random() > 0.3 ? '#00f0ff' : '#00ffaa',
      life: 28,
      maxLife: 28,
      size: Math.random() * 2.2 + 1.2,
      type: 'WAKE_TRAIL'
    });
  }

  /**
   * Spawns acoustic wall refraction sparks when sound waves hit solid boundaries.
   */
  spawnWallRefractionSparks(x, y, color = '#00F0FF', count = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#FFFFFF' : color,
        life: 18,
        maxLife: 18,
        size: Math.random() * 1.6 + 0.8,
        type: 'SPARK'
      });
    }
  }

  /**
   * Spawns acoustic crystal resonance sparkles when waves touch uncollected crystals.
   */
  spawnCrystalSparkle(x, y, color = '#00FF88', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.2 + 0.4;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.35, // subtle upward drift
        color: Math.random() > 0.35 ? color : '#FFFFFF',
        life: 24,
        maxLife: 24,
        size: Math.random() * 1.8 + 1.0,
        type: 'SPARK'
      });
    }
  }

  /**
   * Spawns hydrodynamic wake bubbles behind moving drone.
   */
  spawnWakeBubble(x, y, droneAngle, isSneaking = false) {
    if (Math.random() > (isSneaking ? 0.15 : 0.45)) return;

    // Emit slightly behind drone heading
    const backAngle = droneAngle + Math.PI + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 0.8 + 0.3;

    this.particles.push({
      x: x + Math.cos(backAngle) * 8,
      y: y + Math.sin(backAngle) * 8,
      vx: Math.cos(backAngle) * speed,
      vy: Math.sin(backAngle) * speed,
      color: isSneaking ? '#00ff88' : '#00f0ff',
      life: isSneaking ? 20 : 35,
      maxLife: isSneaking ? 20 : 35,
      size: Math.random() * 1.5 + 0.8,
      type: 'BUBBLE'
    });
  }

  /**
   * Spawns Ghost-Echo Trail for predators
   */
  spawnGhostEcho(x, y, angle, color) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      angle,
      color,
      life: 14,
      maxLife: 14,
      size: 10,
      type: 'GHOST'
    });
  }

  /**
   * Spawns Stalker stun crystallization sparks.
   */
  spawnStalkerStun(x, y) {
    this.spawnSparks(x, y, '#9D00FF', 24, 4, 50, 2.5);
    this.spawnSparks(x, y, '#FFFFFF', 12, 2.5, 30, 1.5);
  }

  update(dt, waveSystem = null) {
    const timeScale = dt * 60;

    // 1. Update Screen Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt * 1000;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffset.x = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffset.y = (Math.random() * 2 - 1) * currentIntensity;

      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
      }
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    // 2. Update dynamic burst particles & bubbles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.life -= timeScale;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update Marine Snow & Physical Sonar Wave Interaction
    for (let i = 0; i < this.marineSnow.length; i++) {
      const d = this.marineSnow[i];
      d.x += d.vx * timeScale;
      d.y += d.vy * timeScale;

      if (d.x < 0) d.x = 800;
      if (d.x > 800) d.x = 0;
      if (d.y < 0) d.y = 576;
      if (d.y > 576) d.y = 0;

      // Sonar Wave Illumination & Hydrodynamic Displacement
      if (waveSystem && Array.isArray(waveSystem.waves)) {
        for (let j = 0; j < waveSystem.waves.length; j++) {
          const w = waveSystem.waves[j];
          const dx = d.x - w.x;
          const dy = d.y - w.y;
          const distToWaveCenter = Math.hypot(dx, dy);

          if (Math.abs(distToWaveCenter - w.radius) < 26) {
            d.glow = Math.max(d.glow, (w.alpha || 0.8) * 0.9);
            // Push particle slightly outward along wave normal
            if (distToWaveCenter > 0.1) {
              d.x += (dx / distToWaveCenter) * 0.4 * timeScale;
              d.y += (dy / distToWaveCenter) * 0.4 * timeScale;
            }
          }
        }
      }

      // Smooth decay of illumination
      if (d.glow > 0) {
        d.glow = Math.max(0, d.glow - 0.024 * timeScale);
      }
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = p.life / p.maxLife;

      if (p.type === 'GHOST') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.35;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'BUBBLE') {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'WAKE_TRAIL') {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.75;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6 * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Sparks
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.restore();
  }

  /**
   * Renders ambient Marine Snow & Plankton
   */
  renderAmbientDust(ctx) {
    if (this.marineSnow.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.marineSnow.length; i++) {
      const d = this.marineSnow[i];
      const isIlluminated = d.glow > 0.05;
      const alpha = isIlluminated
        ? Math.min(0.85, d.baseAlpha + d.glow * 0.75)
        : d.baseAlpha;

      if (isIlluminated) {
        ctx.fillStyle = d.hue;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = d.hue;
        ctx.shadowBlur = 6 * d.glow;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * (1 + d.glow * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#6090a8';
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.fillRect(d.x, d.y, d.size, d.size);
      }
    }
    ctx.restore();
  }
}
