/**
 * SONAR: The Echo Chamber
 * Particle & Screen Shake Juice Engine
 */

export class ParticleEngine {
  constructor() {
    this.particles = [];
    this.ambientDust = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.screenShakeEnabled = true;

    this.initDust();
  }

  initDust(count = 45) {
    this.ambientDust = [];
    for (let i = 0; i < count; i++) {
      const baseAlpha = Math.random() * 0.25 + 0.08;
      this.ambientDust.push({
        x: Math.random() * 800,
        y: Math.random() * 576,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: baseAlpha,
        baseAlpha: baseAlpha,
        glow: 0,
        size: Math.random() * 1.5 + 0.6
      });
    }
  }

  reset() {
    this.particles = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
    for (let d of this.ambientDust) {
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
        size: Math.random() * size + 1
      });
    }
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

    // 2. Update dynamic burst particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.life -= timeScale;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update ambient phosphor micro-dust & wave illumination
    for (let i = 0; i < this.ambientDust.length; i++) {
      const d = this.ambientDust[i];
      d.x += d.vx * timeScale;
      d.y += d.vy * timeScale;

      if (d.x < 0) d.x = 800;
      if (d.x > 800) d.x = 0;
      if (d.y < 0) d.y = 576;
      if (d.y > 576) d.y = 0;

      // Illuminate particle if active sound wave passes over it
      if (waveSystem && Array.isArray(waveSystem.waves)) {
        for (let j = 0; j < waveSystem.waves.length; j++) {
          const w = waveSystem.waves[j];
          const distToWaveCenter = Math.hypot(d.x - w.x, d.y - w.y);
          if (Math.abs(distToWaveCenter - w.radius) < 22) {
            d.glow = Math.max(d.glow, (w.alpha || 0.8) * 1.0);
          }
        }
      }

      // Smooth decay of excitation glow
      if (d.glow > 0) {
        d.glow = Math.max(0, d.glow - 0.022 * timeScale);
      }
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = p.life / p.maxLife;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.size * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderAmbientDust(ctx) {
    ctx.save();
    for (let i = 0; i < this.ambientDust.length; i++) {
      const d = this.ambientDust[i];
      const glow = d.glow || 0;
      const alpha = Math.min(1.0, d.baseAlpha + glow * 0.75);

      ctx.fillStyle = glow > 0.3 ? '#e0f8ff' : '#00F0FF';
      ctx.globalAlpha = alpha;

      if (glow > 0.15) {
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 8 * glow;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size + glow * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
