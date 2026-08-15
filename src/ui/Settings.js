/**
 * SONAR: The Echo Chamber
 * Settings & Persistence Management
 */

import { CONFIG } from '../config.js';

export class Settings {
  constructor(audioEngine, particleEngine) {
    this.audio = audioEngine;
    this.particles = particleEngine;

    this.masterVolume = 0.8;
    this.sfxVolume = 0.8;
    this.crtEffects = true;
    this.screenShake = true;

    this.selectedIndex = 0;
    this.options = [
      { id: 'master', label: 'MASTER LAUTSTÄRKE' },
      { id: 'sfx', label: 'EFFEKT LAUTSTÄRKE (SFX)' },
      { id: 'crt', label: 'CRT-SCANLINES & GLOW' },
      { id: 'shake', label: 'SCREEN-SHAKE (ERSCHÜTTERUNG)' },
      { id: 'reset_save', label: '[ FORTSCHRITT ZURÜCKSETZEN ]' },
      { id: 'main_menu', label: '➔ HAUPTMENÜ' },
      { id: 'back', label: '>> ZURÜCK / WEITERSPIELEN <<' }
    ];

    this.resetConfirmTimer = 0;

    this.loadSettings();
    this.applySettings();
  }

  loadSettings() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.masterVolume !== undefined) this.masterVolume = parsed.masterVolume;
        if (parsed.sfxVolume !== undefined) this.sfxVolume = parsed.sfxVolume;
        if (parsed.crtEffects !== undefined) this.crtEffects = parsed.crtEffects;
        if (parsed.screenShake !== undefined) this.screenShake = parsed.screenShake;
      }
    } catch (e) {
      console.warn('localStorage not accessible for settings:', e);
    }
  }

  saveSettings() {
    try {
      const payload = {
        masterVolume: this.masterVolume,
        sfxVolume: this.sfxVolume,
        crtEffects: this.crtEffects,
        screenShake: this.screenShake
      };
      localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(payload));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  applySettings() {
    if (this.audio) {
      this.audio.setMasterVolume(this.masterVolume);
      this.audio.setSfxVolume(this.sfxVolume);
    }
    if (this.particles) {
      this.particles.screenShakeEnabled = this.screenShake;
    }

    // Toggle DOM elements for CRT
    const scanlines = document.querySelector('.scanlines');
    const crtOverlay = document.querySelector('.crt-overlay');
    const vignette = document.querySelector('.vignette');

    if (scanlines) scanlines.style.display = this.crtEffects ? 'block' : 'none';
    if (crtOverlay) crtOverlay.style.display = this.crtEffects ? 'block' : 'none';
    if (vignette) vignette.style.display = this.crtEffects ? 'block' : 'none';
  }

  handleInput(inputHandler) {
    const move = inputHandler.getMovement();
    if (move) {
      if (move.dy < 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        this.audio.playUIBlip();
      } else if (move.dy > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        this.audio.playUIBlip();
      }

      // Adjust sliders with Left/Right
      if (move.dx !== 0) {
        this.adjustOption(this.options[this.selectedIndex].id, move.dx);
      }
    }

    if (inputHandler.consumeAction()) {
      const opt = this.options[this.selectedIndex];
      if (opt.id === 'back') {
        return 'BACK';
      } else if (opt.id === 'level_select') {
        return 'LEVEL_SELECT';
      } else if (opt.id === 'main_menu') {
        return 'MAIN_MENU';
      } else if (opt.id === 'reset_save') {
        return 'RESET_SAVE';
      } else {
        this.toggleOption(opt.id);
      }
    }

    if (inputHandler.consumeEscape()) {
      return 'BACK';
    }

    // Handle mouse click
    const click = inputHandler.consumeMouseClick();
    if (click) {
      const clicked = this.handleClick(click.x, click.y);
      if (clicked) return clicked;
    }

    return null;
  }

  adjustOption(id, delta) {
    if (id === 'master') {
      this.masterVolume = Math.max(0, Math.min(1, Math.round((this.masterVolume + delta * 0.1) * 10) / 10));
      this.applySettings();
      this.saveSettings();
      this.audio.playUIBlip();
    } else if (id === 'sfx') {
      this.sfxVolume = Math.max(0, Math.min(1, Math.round((this.sfxVolume + delta * 0.1) * 10) / 10));
      this.applySettings();
      this.saveSettings();
      this.audio.playUIBlip();
    }
  }

  toggleOption(id) {
    if (id === 'crt') {
      this.crtEffects = !this.crtEffects;
      this.applySettings();
      this.saveSettings();
      this.audio.playUIBlip();
    } else if (id === 'shake') {
      this.screenShake = !this.screenShake;
      this.applySettings();
      this.saveSettings();
      this.audio.playUIBlip();
    }
  }

  handleClick(cx, cy) {
    const startY = 150;
    const itemH = 44;
    for (let i = 0; i < this.options.length; i++) {
      const y = startY + i * itemH;
      if (cx >= 150 && cx <= 650 && cy >= y - 15 && cy <= y + 25) {
        this.selectedIndex = i;
        const opt = this.options[i];
        if (opt.id === 'back') return 'BACK';
        if (opt.id === 'level_select') return 'LEVEL_SELECT';
        if (opt.id === 'main_menu') return 'MAIN_MENU';
        if (opt.id === 'reset_save') return 'RESET_SAVE';
        if (opt.id === 'crt' || opt.id === 'shake') this.toggleOption(opt.id);
        if (opt.id === 'master' || opt.id === 'sfx') {
          // Check if clicked left or right half of bar
          if (cx > 400) this.adjustOption(opt.id, 1);
          else this.adjustOption(opt.id, -1);
        }
      }
    }
    return null;
  }

  render(ctx, time) {
    ctx.save();

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(3, 3, 5, 0.94)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 28px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 2;
    ctx.fillText('SYSTEM-EINSTELLUNGEN & OPTIONEN', CONFIG.CANVAS_WIDTH / 2, 75);

    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
    ctx.shadowBlur = 0;
    ctx.fillText('NAVIGIEREN: [HOCH/RUNTER] // ÄNDERN: [LINKS/RECHTS] // BESTÄTIGEN: [ENTER] / KLICK', CONFIG.CANVAS_WIDTH / 2, 110);

    const startY = 150;
    const itemH = 44;

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const isSelected = i === this.selectedIndex;
      const isReset = opt.id === 'reset_save';
      const y = startY + i * itemH;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = isReset ? 'rgba(255, 30, 68, 0.15)' : 'rgba(0, 240, 255, 0.12)';
        ctx.fillRect(160, y - 16, 480, 32);
        ctx.strokeStyle = isReset ? CONFIG.COLORS.HUNTER : CONFIG.COLORS.PLAYER;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = isReset ? CONFIG.COLORS.HUNTER : CONFIG.COLORS.PLAYER;
        ctx.shadowBlur = 2;
        ctx.strokeRect(160, y - 16, 480, 32);
      }

      ctx.font = isSelected ? 'bold 13px "Share Tech Mono", monospace' : '13px "Share Tech Mono", monospace';
      ctx.shadowBlur = 0;

      if (opt.id === 'back') {
        ctx.textAlign = 'center';
        ctx.fillStyle = isSelected ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.TEXT_DIM;
        ctx.fillText(opt.label, CONFIG.CANVAS_WIDTH / 2, y);
      } else {
        ctx.textAlign = 'left';
        ctx.fillStyle = isReset ? CONFIG.COLORS.HUNTER : (isSelected ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.TEXT_MAIN);
        ctx.fillText((isSelected ? '> ' : '  ') + opt.label, 180, y);

        // Value column (Right)
        ctx.textAlign = 'right';
        if (opt.id === 'master') {
          const pct = Math.round(this.masterVolume * 100);
          ctx.fillText(`[ ${pct}% ]`, 620, y);
        } else if (opt.id === 'sfx') {
          const pct = Math.round(this.sfxVolume * 100);
          ctx.fillText(`[ ${pct}% ]`, 620, y);
        } else if (opt.id === 'crt') {
          ctx.fillStyle = this.crtEffects ? CONFIG.COLORS.CRYSTAL : CONFIG.COLORS.HUNTER;
          ctx.fillText(this.crtEffects ? '[ AN ]' : '[ AUS ]', 620, y);
        } else if (opt.id === 'shake') {
          ctx.fillStyle = this.screenShake ? CONFIG.COLORS.CRYSTAL : CONFIG.COLORS.HUNTER;
          ctx.fillText(this.screenShake ? '[ AN ]' : '[ AUS ]', 620, y);
        } else if (opt.id === 'reset_save') {
          ctx.fillStyle = CONFIG.COLORS.HUNTER;
          ctx.fillText('[ RESET ]', 620, y);
        } else if (opt.id === 'level_select') {
          ctx.fillStyle = CONFIG.COLORS.PLAYER;
          ctx.fillText('[ ÖFFNEN ]', 620, y);
        } else if (opt.id === 'main_menu') {
          ctx.fillStyle = CONFIG.COLORS.PLAYER;
          ctx.fillText('[ ZURÜCK ]', 620, y);
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

export { Settings as SettingsModal };
