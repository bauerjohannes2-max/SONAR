/**
 * SONAR: The Echo Chamber
 * Modern Terminal Settings Modal with Sliders & Instant Feedback
 */

import { CONFIG } from '../config.js';

export class Settings {
  constructor(audioEngine, particleEngine, onResetProgress = null) {
    this.audio = audioEngine;
    this.particles = particleEngine;
    this.onResetProgress = onResetProgress;

    this.masterVolume = 0.8;
    this.sfxVolume = 0.8;
    this.crtEffects = false; // Turned off by default per user specification for maximum clarity
    this.screenShake = true;

    this.isOpen = false;
    this.modalEl = null;
    this.resetConfirmPending = false;
    this.resetConfirmTimeout = null;

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
            <span>SYSTEM-EINSTELLUNGEN // AUDIO & GRAFIK</span>
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

        <div class="modal-footer">
          <button id="btn-settings-back" class="modal-btn modal-btn-dim" style="min-height: 48px; font-weight: 700;">
            ✕ ZURÜCK ZUM SPIEL / MENÜ (ESC)
          </button>
        </div>
      </div>
    `;

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(container);
    this.modalEl = container;

    // Attach Listeners with reliable touch & click handling
    const closeBtn = container.querySelector('#modal-settings-close-btn');
    const backBtn = container.querySelector('#btn-settings-back');
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
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose);
      closeBtn.addEventListener('touchstart', handleClose, { passive: false });
    }
    if (backBtn) {
      backBtn.addEventListener('click', handleClose);
      backBtn.addEventListener('touchstart', handleClose, { passive: false });
    }

    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.masterVolume = val / 100;
        const badge = container.querySelector('#val-master-volume');
        if (badge) badge.textContent = `${val}%`;
        this.applySettings();
        this.saveSettings();
      });
    }

    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.sfxVolume = val / 100;
        const badge = container.querySelector('#val-sfx-volume');
        if (badge) badge.textContent = `${val}%`;
        this.applySettings();
        this.saveSettings();
      });
      sfxSlider.addEventListener('change', () => {
        if (this.audio) this.audio.playUIBlip();
      });
    }

    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        this.crtEffects = !this.crtEffects;
        crtBtn.textContent = this.crtEffects ? 'AN' : 'AUS';
        crtBtn.className = `modal-btn modal-btn-toggle ${this.crtEffects ? 'active' : ''}`;
        this.applySettings();
        this.saveSettings();
        if (this.audio) this.audio.playUIBlip();
      });
    }

    if (shakeBtn) {
      shakeBtn.addEventListener('click', () => {
        this.screenShake = !this.screenShake;
        shakeBtn.textContent = this.screenShake ? 'AN' : 'AUS';
        shakeBtn.className = `modal-btn modal-btn-toggle ${this.screenShake ? 'active' : ''}`;
        this.applySettings();
        this.saveSettings();
        if (this.audio) this.audio.playUIBlip();
      });
    }



    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });
  }

  updateDOMValues() {
    if (!this.modalEl) return;
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
  }

  open() {
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

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
}

export { Settings as SettingsModal };
