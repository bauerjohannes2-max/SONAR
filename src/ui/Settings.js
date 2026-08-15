/**
 * SONAR: The Echo Chamber
 * Unified Settings & Pause Modal with Instant In-Game Main Menu Navigation
 */

import { CONFIG } from '../config.js';

export class Settings {
  constructor(audioEngine, particleEngine, onResetProgress = null, onExitToMenu = null, onResumeGame = null) {
    this.audio = audioEngine;
    this.particles = particleEngine;
    this.onResetProgress = onResetProgress;
    this.onExitToMenu = onExitToMenu;
    this.onResumeGame = onResumeGame;

    this.masterVolume = 0.8;
    this.sfxVolume = 0.8;
    this.crtEffects = false;
    this.screenShake = true;

    this.isOpen = false;
    this.isGameplay = false;
    this.modalEl = null;

    this.loadSettings();
    this.applySettings();
    this.initDOM();
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

    // Toggle DOM CRT elements
    const scanlines = document.querySelector('.scanlines');
    const crtOverlay = document.querySelector('.crt-overlay');
    const vignette = document.querySelector('.vignette');

    if (scanlines) scanlines.style.display = this.crtEffects ? 'block' : 'none';
    if (crtOverlay) crtOverlay.style.display = this.crtEffects ? 'block' : 'none';
    if (vignette) vignette.style.display = this.crtEffects ? 'block' : 'none';
  }

  initDOM() {
    const old = document.getElementById('settings-modal');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'settings-modal';
    container.className = 'terminal-modal-backdrop';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="terminal-modal-box settings-modal-box">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span id="settings-modal-title-text">SYSTEM-EINSTELLUNGEN</span>
          </div>
          <button id="modal-settings-close-btn" class="modal-close-btn" title="Schließen (ESC)">✕</button>
        </div>

        <div class="modal-body">
          <!-- Master Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-master-volume" class="settings-label">MASTER-LAUTSTÄRKE</label>
              <span id="val-master-volume" class="settings-value-badge">${Math.round(this.masterVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-master-volume" min="0" max="100" value="${Math.round(this.masterVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- SFX Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-sfx-volume" class="settings-label">SFX-LAUTSTÄRKE (EFFEKTE & SONAR)</label>
              <span id="val-sfx-volume" class="settings-value-badge">${Math.round(this.sfxVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-sfx-volume" min="0" max="100" value="${Math.round(this.sfxVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- CRT Scanlines Toggle -->
          <div class="settings-toggle-row">
            <div>
              <div class="settings-label">CRT-SCANLINES & RETRO-GLOW</div>
              <div class="field-hint">Aktiviert subtile Röhrenmonitor-Scanlines</div>
            </div>
            <button id="btn-toggle-crt" class="modal-btn modal-btn-toggle ${this.crtEffects ? 'active' : ''}">
              ${this.crtEffects ? 'AN' : 'AUS'}
            </button>
          </div>

          <!-- Screen Shake Toggle -->
          <div class="settings-toggle-row">
            <div>
              <div class="settings-label">SCREEN-SHAKE (ERSCHÜTTERUNG)</div>
              <div class="field-hint">Kamera-Erschütterung bei Kollisionen & Schockwellen</div>
            </div>
            <button id="btn-toggle-shake" class="modal-btn modal-btn-toggle ${this.screenShake ? 'active' : ''}">
              ${this.screenShake ? 'AN' : 'AUS'}
            </button>
          </div>
        </div>

        <div class="modal-footer" id="settings-modal-footer">
          <!-- Populated dynamically based on game state -->
        </div>
      </div>
    `;

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(container);
    this.modalEl = container;

    // Attach Sliders & Toggles Listeners
    const closeBtn = container.querySelector('#modal-settings-close-btn');
    const masterSlider = container.querySelector('#slider-master-volume');
    const sfxSlider = container.querySelector('#slider-sfx-volume');
    const crtBtn = container.querySelector('#btn-toggle-crt');
    const shakeBtn = container.querySelector('#btn-toggle-shake');

    const handleClose = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.close();
      if (this.isGameplay && typeof this.onResumeGame === 'function') {
        this.onResumeGame();
      }
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose);
      closeBtn.addEventListener('touchstart', handleClose, { passive: false });
    }

    const bindTouchSlider = (slider, onValChange) => {
      if (!slider) return;
      const updateFromTouch = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const touch = e.touches[0];
        const rect = slider.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        const val = Math.round(ratio * 100);
        slider.value = val;
        onValChange(val);
      };

      slider.addEventListener('touchstart', updateFromTouch, { passive: true });
      slider.addEventListener('touchmove', updateFromTouch, { passive: true });
    };

    if (masterSlider) {
      const updateMaster = (val) => {
        this.masterVolume = val / 100;
        const badge = container.querySelector('#val-master-volume');
        if (badge) badge.textContent = `${val}%`;
        this.applySettings();
        this.saveSettings();
      };
      masterSlider.addEventListener('input', (e) => updateMaster(parseInt(e.target.value, 10)));
      bindTouchSlider(masterSlider, updateMaster);
    }

    if (sfxSlider) {
      const updateSfx = (val) => {
        this.sfxVolume = val / 100;
        const badge = container.querySelector('#val-sfx-volume');
        if (badge) badge.textContent = `${val}%`;
        this.applySettings();
        this.saveSettings();
      };
      sfxSlider.addEventListener('input', (e) => updateSfx(parseInt(e.target.value, 10)));
      bindTouchSlider(sfxSlider, updateSfx);
      sfxSlider.addEventListener('change', () => {
        if (this.audio) this.audio.playUIBlip();
      });
    }

    if (crtBtn) {
      const toggleCrt = (e) => {
        if (e && e.type === 'touchstart') {
          e.preventDefault();
          e.stopPropagation();
        }
        this.crtEffects = !this.crtEffects;
        crtBtn.textContent = this.crtEffects ? 'AN' : 'AUS';
        crtBtn.className = `modal-btn modal-btn-toggle ${this.crtEffects ? 'active' : ''}`;
        this.applySettings();
        this.saveSettings();
        if (this.audio) this.audio.playUIBlip();
      };
      crtBtn.addEventListener('click', toggleCrt);
      crtBtn.addEventListener('touchstart', toggleCrt, { passive: false });
    }

    if (shakeBtn) {
      const toggleShake = (e) => {
        if (e && e.type === 'touchstart') {
          e.preventDefault();
          e.stopPropagation();
        }
        this.screenShake = !this.screenShake;
        shakeBtn.textContent = this.screenShake ? 'AN' : 'AUS';
        shakeBtn.className = `modal-btn modal-btn-toggle ${this.screenShake ? 'active' : ''}`;
        this.applySettings();
        this.saveSettings();
        if (this.audio) this.audio.playUIBlip();
      };
      shakeBtn.addEventListener('click', toggleShake);
      shakeBtn.addEventListener('touchstart', toggleShake, { passive: false });
    }

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
        if (this.isGameplay && typeof this.onResumeGame === 'function') {
          this.onResumeGame();
        }
      }
    });
  }

  updateDOMValues() {
    if (!this.modalEl) return;

    // 1. Header Title
    const titleText = this.modalEl.querySelector('#settings-modal-title-text');
    if (titleText) {
      titleText.textContent = this.isGameplay
        ? 'PAUSE // SYSTEM-EINSTELLUNGEN'
        : 'SYSTEM-EINSTELLUNGEN // AUDIO & GRAFIK';
    }

    // 2. Sliders & Toggles
    const masterSlider = this.modalEl.querySelector('#slider-master-volume');
    const sfxSlider = this.modalEl.querySelector('#slider-sfx-volume');
    const masterBadge = this.modalEl.querySelector('#val-master-volume');
    const sfxBadge = this.modalEl.querySelector('#val-sfx-volume');
    const crtBtn = this.modalEl.querySelector('#btn-toggle-crt');
    const shakeBtn = this.modalEl.querySelector('#btn-toggle-shake');

    if (masterSlider) masterSlider.value = Math.round(this.masterVolume * 100);
    if (sfxSlider) sfxSlider.value = Math.round(this.sfxVolume * 100);
    if (masterBadge) masterBadge.textContent = `${Math.round(this.masterVolume * 100)}%`;
    if (sfxBadge) sfxBadge.textContent = `${Math.round(this.sfxVolume * 100)}%`;
    if (crtBtn) {
      crtBtn.textContent = this.crtEffects ? 'AN' : 'AUS';
      crtBtn.className = `modal-btn modal-btn-toggle ${this.crtEffects ? 'active' : ''}`;
    }
    if (shakeBtn) {
      shakeBtn.textContent = this.screenShake ? 'AN' : 'AUS';
      shakeBtn.className = `modal-btn modal-btn-toggle ${this.screenShake ? 'active' : ''}`;
    }

    // 3. Dynamic Footer Buttons
    const footer = this.modalEl.querySelector('#settings-modal-footer');
    if (footer) {
      if (this.isGameplay) {
        footer.innerHTML = `
          <div style="display: flex; gap: 12px; width: 100%;">
            <button id="btn-settings-resume" class="modal-btn modal-btn-primary" style="flex: 1; min-height: 48px; font-weight: 700; font-size: 13px;">
              ▶ WEITERSPIELEN
            </button>
            <button id="btn-settings-mainmenu" class="modal-btn modal-btn-secondary" style="flex: 1; min-height: 48px; font-weight: 700; font-size: 13px;">
              ⎋ HAUPTMENÜ
            </button>
          </div>
        `;

        const resumeBtn = footer.querySelector('#btn-settings-resume');
        const menuBtn = footer.querySelector('#btn-settings-mainmenu');

        const handleResume = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          this.close();
          if (typeof this.onResumeGame === 'function') this.onResumeGame();
        };

        const handleMainMenu = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          this.close();
          if (typeof this.onExitToMenu === 'function') this.onExitToMenu();
        };

        if (resumeBtn) {
          resumeBtn.addEventListener('click', handleResume);
          resumeBtn.addEventListener('touchstart', handleResume, { passive: false });
        }
        if (menuBtn) {
          menuBtn.addEventListener('click', handleMainMenu);
          menuBtn.addEventListener('touchstart', handleMainMenu, { passive: false });
        }
      } else {
        footer.innerHTML = `
          <button id="btn-settings-back" class="modal-btn modal-btn-dim" style="width: 100%; min-height: 48px; font-weight: 700;">
            ✕ ZURÜCK ZUM MENÜ (ESC)
          </button>
        `;

        const backBtn = footer.querySelector('#btn-settings-back');
        const handleBack = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          this.close();
        };
        if (backBtn) {
          backBtn.addEventListener('click', handleBack);
          backBtn.addEventListener('touchstart', handleBack, { passive: false });
        }
      }
    }
  }

  open(isGameplay = false) {
    this.isGameplay = isGameplay;
    this.isOpen = true;
    if (this.modalEl) {
      this.updateDOMValues();
      this.modalEl.style.display = 'flex';
    }
    if (this.audio) this.audio.playUIBlip();
  }

  close() {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    if (this.audio) this.audio.playUIBlip();
  }

  toggle(isGameplay = false) {
    if (this.isOpen) {
      this.close();
      if (this.isGameplay && typeof this.onResumeGame === 'function') {
        this.onResumeGame();
      }
    } else {
      this.open(isGameplay);
    }
  }
}

export { Settings as SettingsModal };
