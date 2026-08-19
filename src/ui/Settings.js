/**
 * SONAR: The Echo Chamber
 * Unified Settings & Pause Modal with Touch Layout Controls, Joystick/D-Pad Switcher & Version Checker
 */

import { CONFIG } from '../config.js';

export class Settings {
  constructor(
    audioEngine,
    particleEngine,
    onResetProgress = null,
    onExitToMenu = null,
    onResumeGame = null,
    touchControls = null,
    onOpenTouchEditor = null
  ) {
    this.audio = audioEngine;
    this.particles = particleEngine;
    this.onResetProgress = onResetProgress;
    this.onExitToMenu = onExitToMenu;
    this.onResumeGame = onResumeGame;
    this.touchControls = touchControls;
    this.onOpenTouchEditor = onOpenTouchEditor;

    this.masterVolume = 0.5;
    this.musicVolume = 0.35;
    this.sfxVolume = 0.35;
    this.crtEffects = false;
    this.screenShake = true;
    this.lowParticles = false;

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
        if (parsed.musicVolume !== undefined) this.musicVolume = parsed.musicVolume;
        if (parsed.sfxVolume !== undefined) this.sfxVolume = parsed.sfxVolume;
        if (parsed.crtEffects !== undefined) this.crtEffects = parsed.crtEffects;
        if (parsed.screenShake !== undefined) this.screenShake = parsed.screenShake;
        if (parsed.lowParticles !== undefined) this.lowParticles = parsed.lowParticles;
      }
    } catch (e) {
      console.warn('localStorage not accessible for settings:', e);
    }
  }

  saveSettings() {
    try {
      const payload = {
        masterVolume: this.masterVolume,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        crtEffects: this.crtEffects,
        screenShake: this.screenShake,
        lowParticles: this.lowParticles
      };
      localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(payload));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  applySettings() {
    if (this.audio) {
      this.audio.setMasterVolume(this.masterVolume);
      this.audio.setMusicVolume(this.musicVolume);
      this.audio.setSfxVolume(this.sfxVolume);
    }
    if (this.particles) {
      this.particles.screenShakeEnabled = this.screenShake;
    }
    const scanlineOverlay = document.querySelector('.scanlines');
    if (scanlineOverlay) {
      scanlineOverlay.style.display = this.crtEffects ? 'block' : 'none';
    }
  }

  initDOM() {
    let container = document.getElementById('settings-modal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'settings-modal';
      container.className = 'terminal-modal-backdrop';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    this.modalEl = container;
    this.renderDOM();
  }

  renderDOM() {
    if (!this.modalEl) return;
    const container = this.modalEl;
    const touchConfig = this.touchControls ? this.touchControls.getConfig() : { controlType: 'DPAD', scale: 1.0 };

    container.innerHTML = `
      <div class="terminal-modal-box settings-modal-box" style="width: 580px; max-width: 95vw;">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span id="settings-modal-title-text">EINSTELLUNGEN</span>
          </div>
          <button id="modal-settings-close-btn" class="modal-close-btn" title="Schließen" aria-label="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- 1. AUDIO SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">1. LAUTSTÄRKE</span>
            <div class="info-badge-wrapper">
              <button class="info-badge-btn" type="button" aria-label="Info">i</button>
              <div class="info-tooltip-popover">SFX regelt Ping-, Alarm- und Interaktionstöne. Musik steuert die atmosphärischen Hintergrund-Soundtracks.</div>
            </div>
            <div class="settings-section-line"></div>
          </div>

          <!-- Master Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-master-volume" class="settings-label">GESAMT-LAUTSTÄRKE</label>
              <span id="val-master-volume" class="settings-value-badge">${Math.round(this.masterVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-master-volume" min="0" max="100" value="${Math.round(this.masterVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- SFX Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-sfx-volume" class="settings-label">EFFEKTE & SFX</label>
              <span id="val-sfx-volume" class="settings-value-badge">${Math.round(this.sfxVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-sfx-volume" min="0" max="100" value="${Math.round(this.sfxVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- Music Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-music-volume" class="settings-label">MUSIK & SOUNDTRACK</label>
              <span id="val-music-volume" class="settings-value-badge">${Math.round(this.musicVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-music-volume" min="0" max="100" value="${Math.round(this.musicVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- 2. TOUCH-GRÖSSE & LAYOUT SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">2. TOUCH-GRÖSSE & LAYOUT</span>
            <div class="info-badge-wrapper">
              <button class="info-badge-btn" type="button" aria-label="Info">i</button>
              <div class="info-tooltip-popover">Skaliert Steuerkreuz und Aktionsbuttons gleichmäßig für optimale Erreichbarkeit.</div>
            </div>
            <div class="settings-section-line"></div>
          </div>

          <div class="settings-row">
            <div class="settings-header-row">
              <div class="settings-label">GRÖSSE (SKALIERUNG)</div>
              <span id="val-touch-scale" class="settings-value-badge">${Math.round((touchConfig.scale || 1.0) * 100)}%</span>
            </div>
            <div class="btn-segment-group">
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 0.8 ? 'active' : ''}" data-scale="0.8">80%</button>
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 1.0 || !touchConfig.scale ? 'active' : ''}" data-scale="1.0">100%</button>
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 1.25 ? 'active' : ''}" data-scale="1.25">125%</button>
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 1.5 ? 'active' : ''}" data-scale="1.5">150%</button>
            </div>
          </div>

          <!-- Touch Controls Live-Preview Mini Screen -->
          <div class="touch-preview-box" id="touch-live-preview-box" style="margin-top: 8px;">
            <div class="touch-preview-header">
              <span>INTERAKTIVE LIVE-VORSCHAU</span>
              <span id="preview-mode-tag" class="preview-mode-tag">STEUERKREUZ (${Math.round((touchConfig.scale || 1.0) * 100)}%)</span>
            </div>
            <div class="touch-preview-viewport" id="touch-preview-viewport">
              <div class="preview-dpad" id="preview-dpad" style="transform: scale(${touchConfig.scale || 1.0}); transform-origin: bottom left;">
                <div class="preview-dpad-btn preview-up">▲</div>
                <div class="preview-dpad-btn preview-down">▼</div>
                <div class="preview-dpad-btn preview-left">◀</div>
                <div class="preview-dpad-btn preview-right">▶</div>
              </div>
              <div class="preview-actions" id="preview-actions" style="transform: scale(${touchConfig.scale || 1.0}); transform-origin: bottom right;">
                <div class="preview-btn-sneak">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </div>
                <div class="preview-btn-decoy">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="3 3"/></svg>
                </div>
                <div class="preview-btn-ping">PING</div>
              </div>
            </div>
          </div>

          <button id="btn-open-touch-editor" class="btn-full-action" style="margin-top: 8px;">
            LAYOUT ANPASSEN
          </button>

          <!-- 3. GRAFIK & PERFORMANCE SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">3. GRAFIK & PERFORMANCE</span>
            <div class="info-badge-wrapper">
              <button class="info-badge-btn" type="button" aria-label="Info">i</button>
              <div class="info-tooltip-popover">Voll: Vollständige Sonar-Echos & Partikeleffekte. Reduziert: Optimiert für ältere Geräte.</div>
            </div>
            <div class="settings-section-line"></div>
          </div>

          <div class="settings-row">
            <div class="btn-segment-group">
              <button id="btn-particles-high" class="btn-segment ${!this.lowParticles ? 'active' : ''}">
                PARTIKEL: VOLL
              </button>
              <button id="btn-particles-low" class="btn-segment ${this.lowParticles ? 'active' : ''}">
                PARTIKEL: REDUZIERT
              </button>
            </div>
          </div>

          <div class="settings-toggle-row" style="margin-top: 8px;">
            <div>
              <div class="settings-label">SCREEN-SHAKE (ERSCHÜTTERUNG)</div>
              <div class="field-hint">Kamera-Erschütterung bei Kollisionen & Schockwellen</div>
            </div>
            <button id="btn-toggle-shake" class="modal-btn modal-btn-toggle ${this.screenShake ? 'active' : ''}">
              ${this.screenShake ? 'AN' : 'AUS'}
            </button>
          </div>

          <!-- 3. STEUERUNG & BEFEHLE SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">3. STEUERUNG & BEFEHLE</span>
            <div class="settings-section-line"></div>
          </div>

          <div class="controls-overview-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; background: rgba(4, 10, 18, 0.65); border: 1px solid rgba(0, 240, 255, 0.2); padding: 12px; border-radius: 4px;">
            <div class="controls-column">
              <div style="font-family: var(--font-tech); font-size: 11px; font-weight: 700; color: #00f0ff; margin-bottom: 6px; letter-spacing: 0.05em;">DESKTOP (TASTATUR)</div>
              <div style="font-size: 11px; color: #e2f4ff; line-height: 1.6; font-family: var(--font-mono);">
                <div><span style="color: #00f0ff; font-weight: 700;">W / A / S / D</span> : Drohne steuern</div>
                <div><span style="color: #00f0ff; font-weight: 700;">Leertaste</span> : Sonar-Ping</div>
                <div><span style="color: #00ffaa; font-weight: 700;">Shift</span> : Lautlos schleichen</div>
                <div><span style="color: #ffaa00; font-weight: 700;">E</span> : Köder werfen</div>
                <div><span style="color: #ff5577; font-weight: 700;">R</span> : Sofort-Neustart</div>
                <div><span style="color: #88aacc; font-weight: 700;">ESC</span> : Pause</div>
              </div>
            </div>
            <div class="controls-column">
              <div style="font-family: var(--font-tech); font-size: 11px; font-weight: 700; color: #00f0ff; margin-bottom: 6px; letter-spacing: 0.05em;">MOBILE (TOUCH)</div>
              <div style="font-size: 11px; color: #e2f4ff; line-height: 1.6; font-family: var(--font-mono);">
                <div><span style="color: #00f0ff; font-weight: 700;">Steuerkreuz links</span> : Navigation</div>
                <div><span style="color: #00f0ff; font-weight: 700;">PING Button</span> : Sonar-Puls</div>
                <div><span style="color: #00ffaa; font-weight: 700;">SCHLEICH Button</span> : Lautlos</div>
                <div><span style="color: #ffaa00; font-weight: 700;">KÖDER Button</span> : Ablenken</div>
                <div><span style="color: #ff5577; font-weight: 700;">Doppel-Tap</span> : Sofort-Neustart</div>
              </div>
            </div>
          </div>

          <!-- SYSTEM-VERSION & UPDATES SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">SYSTEM-VERSION & UPDATES</span>
            <div class="settings-section-line"></div>
          </div>

          <div class="version-info-box">
            <div class="version-text">
              VERSION: <span id="settings-version-label">v${CONFIG.VERSION}</span> (Build ${CONFIG.BUILD})
            </div>
            <button id="btn-check-updates" class="btn-check-update">
              AUF UPDATES PRÜFEN
            </button>
          </div>
          <div id="update-status-msg" style="font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); margin-top: 4px; min-height: 16px;"></div>
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
    const musicSlider = container.querySelector('#slider-music-volume');
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

    // Backdrop Click to close
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        handleClose(e);
      }
    });

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

    if (musicSlider) {
      const updateMusic = (val) => {
        this.musicVolume = val / 100;
        const badge = container.querySelector('#val-music-volume');
        if (badge) badge.textContent = `${val}%`;
        this.applySettings();
        this.saveSettings();
      };
      musicSlider.addEventListener('input', (e) => updateMusic(parseInt(e.target.value, 10)));
      bindTouchSlider(musicSlider, updateMusic);
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

    // Touch Control Type Toggle: D-Pad vs Swipe
    const dpadBtn = container.querySelector('#btn-ctrl-dpad');
    const swipeBtn = container.querySelector('#btn-ctrl-swipe');

    if (dpadBtn && swipeBtn) {
      const selectType = (type) => {
        if (this.touchControls) {
          this.touchControls.setControlType(type);
        }
        dpadBtn.classList.toggle('active', type === 'DPAD');
        swipeBtn.classList.toggle('active', type === 'SWIPE');
        this.updateLivePreview(null, type);
        if (this.audio) this.audio.playUIBlip();
      };

      dpadBtn.addEventListener('click', () => selectType('DPAD'));
      dpadBtn.addEventListener('touchstart', (e) => { e.preventDefault(); selectType('DPAD'); }, { passive: false });

      swipeBtn.addEventListener('click', () => selectType('SWIPE'));
      swipeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); selectType('SWIPE'); }, { passive: false });
    }

    // Touch Scale Step Buttons
    const scaleBtns = container.querySelectorAll('.btn-scale-step');
    const scaleBadge = container.querySelector('#val-touch-scale');
    scaleBtns.forEach((btn) => {
      const selectScale = (e) => {
        if (e) e.preventDefault();
        const sc = parseFloat(btn.dataset.scale);
        if (this.touchControls) {
          this.touchControls.setScale(sc);
        }
        scaleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (scaleBadge) scaleBadge.textContent = `${Math.round(sc * 100)}%`;
        this.updateLivePreview(sc, null);
        if (this.audio) this.audio.playUIBlip();
      };
      btn.addEventListener('click', selectScale);
      btn.addEventListener('touchstart', selectScale, { passive: false });
    });

    // Particle Quality Toggle
    const partHigh = container.querySelector('#btn-particles-high');
    const partLow = container.querySelector('#btn-particles-low');
    if (partHigh && partLow) {
      const setPartQuality = (low) => {
        this.lowParticles = low;
        partHigh.classList.toggle('active', !low);
        partLow.classList.toggle('active', low);
        if (this.particles) {
          this.particles.initMarineSnow(low ? 30 : 80);
        }
        this.saveSettings();
        if (this.audio) this.audio.playUIBlip();
      };
      partHigh.addEventListener('click', () => setPartQuality(false));
      partLow.addEventListener('click', () => setPartQuality(true));
    }

    // Interactive [i] Info Badges (Click toggle on mobile / touch)
    container.querySelectorAll('.info-badge-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrapper = btn.closest('.info-badge-wrapper');
        if (wrapper) {
          const wasOpen = wrapper.classList.contains('show-tooltip');
          container.querySelectorAll('.info-badge-wrapper').forEach(w => w.classList.remove('show-tooltip'));
          if (!wasOpen) wrapper.classList.add('show-tooltip');
        }
      });
    });

    // Touch Layout Editor Trigger
    const openEditorBtn = container.querySelector('#btn-open-touch-editor');
    if (openEditorBtn) {
      const handleOpenEditor = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.close();
        if (typeof this.onOpenTouchEditor === 'function') {
          this.onOpenTouchEditor();
        }
      };
      openEditorBtn.addEventListener('click', handleOpenEditor);
      openEditorBtn.addEventListener('touchstart', handleOpenEditor, { passive: false });
    }

    // Update Checker Button
    const checkUpdateBtn = container.querySelector('#btn-check-updates');
    if (checkUpdateBtn) {
      const handleCheckUpdate = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        this.checkForUpdates();
      };
      checkUpdateBtn.addEventListener('click', handleCheckUpdate);
      checkUpdateBtn.addEventListener('touchstart', handleCheckUpdate, { passive: false });
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
        ? 'PAUSE • EINSTELLUNGEN'
        : 'EINSTELLUNGEN';
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

    // 3. Touch Config State
    if (this.touchControls) {
      const tc = this.touchControls.getConfig();
      const joystickBtn = this.modalEl.querySelector('#btn-ctrl-joystick');
      const dpadBtn = this.modalEl.querySelector('#btn-ctrl-dpad');
      const scaleBadge = this.modalEl.querySelector('#val-touch-scale');
      const scaleBtns = this.modalEl.querySelectorAll('.btn-scale-step');

      if (joystickBtn && dpadBtn) {
        joystickBtn.classList.toggle('active', tc.controlType === 'JOYSTICK');
        dpadBtn.classList.toggle('active', tc.controlType === 'DPAD');
      }

      if (scaleBadge) scaleBadge.textContent = `${Math.round((tc.scale || 1.0) * 100)}%`;
      scaleBtns.forEach((btn) => {
        const sc = parseFloat(btn.dataset.scale);
        btn.classList.toggle('active', Math.abs(sc - (tc.scale || 1.0)) < 0.05);
      });
    }

    // 4. Dynamic Footer Buttons
    const footer = this.modalEl.querySelector('#settings-modal-footer');
    if (footer) {
      if (this.isGameplay) {
        footer.innerHTML = `
          <div style="display: flex; gap: 12px; width: 100%;">
            <button id="btn-settings-resume" class="modal-btn modal-btn-primary" style="flex: 1; min-height: 48px; font-weight: 700; font-size: 13px;">
              WEITERSPIELEN
            </button>
            <button id="btn-settings-mainmenu" class="modal-btn modal-btn-secondary" style="flex: 1; min-height: 48px; font-weight: 700; font-size: 13px;">
              HAUPTMENÜ
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
            ZURÜCK ZUM MENÜ
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

  updateLivePreview(scale = null, controlType = null) {
    if (!this.modalEl) return;
    const touchConfig = this.touchControls ? this.touchControls.config : {};
    const curScale = scale !== null ? scale : (touchConfig.scale || 1.0);
    const curType = controlType !== null ? controlType : (touchConfig.controlType || 'DPAD');

    const previewDpad = this.modalEl.querySelector('#preview-dpad');
    const previewSwipe = this.modalEl.querySelector('#preview-swipe-indicator');
    const previewActions = this.modalEl.querySelector('#preview-actions');
    const modeTag = this.modalEl.querySelector('#preview-mode-tag');

    if (modeTag) {
      modeTag.textContent = `${curType === 'DPAD' ? 'D-PAD' : 'SWIPE'} (${Math.round(curScale * 100)}%)`;
    }

    if (previewDpad && previewSwipe) {
      if (curType === 'DPAD') {
        previewDpad.style.display = 'block';
        previewDpad.style.transform = `scale(${curScale})`;
        previewDpad.style.transformOrigin = 'bottom left';
        previewSwipe.style.display = 'none';
      } else {
        previewDpad.style.display = 'none';
        previewSwipe.style.display = 'flex';
      }
    }

    if (previewActions) {
      previewActions.style.transform = `scale(${curScale})`;
      previewActions.style.transformOrigin = 'bottom right';
    }
  }

  open(isGameplay = false) {
    this.isGameplay = isGameplay;
    this.isOpen = true;
    if (this.modalEl) {
      this.updateDOMValues();
      this.updateLivePreview();
      this.modalEl.style.display = 'flex';

      // Always reset scroll position to the very top upon opening
      this.modalEl.scrollTop = 0;
      const modalBox = this.modalEl.querySelector('.settings-modal-box') || this.modalEl.querySelector('.terminal-modal-box');
      if (modalBox) modalBox.scrollTop = 0;
      const modalBody = this.modalEl.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = 0;

      requestAnimationFrame(() => {
        if (this.modalEl) this.modalEl.scrollTop = 0;
        if (modalBox) modalBox.scrollTop = 0;
        if (modalBody) modalBody.scrollTop = 0;
      });
    }
    if (this.audio) this.audio.playUIBlip();
  }

  close() {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
      this.modalEl.scrollTop = 0;
      const modalBox = this.modalEl.querySelector('.settings-modal-box') || this.modalEl.querySelector('.terminal-modal-box');
      if (modalBox) modalBox.scrollTop = 0;
      const modalBody = this.modalEl.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = 0;
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

  async checkForUpdates() {
    if (!this.modalEl) return;
    if (this.audio) this.audio.playUIBlip();

    const statusEl = this.modalEl.querySelector('#update-status-msg');
    const checkBtn = this.modalEl.querySelector('#btn-check-updates');

    if (statusEl) {
      statusEl.innerHTML = '<span style="color: var(--cyan-primary);">Prüfe Server auf Updates...</span>';
    }
    if (checkBtn) checkBtn.disabled = true;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      }

      const res = await fetch('./version.json?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error('Status: ' + res.status);
      const data = await res.json();
      const currentVer = CONFIG.VERSION;

      const isNewer = data.version && (data.version !== currentVer || (data.build && Number(data.build) > Number(CONFIG.BUILD)));

      if (isNewer) {
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="margin-top: 8px; padding: 10px; background: rgba(0, 240, 255, 0.06); border: 1px solid rgba(0, 240, 255, 0.35); border-radius: 6px;">
              <div style="color: #FFAA00; font-weight: 700; font-size: 11px; margin-bottom: 8px; letter-spacing: 0.5px;">
                NEUE VERSION VERFÜGBAR: v${data.version}
              </div>
              <button id="btn-apply-update" class="modal-btn modal-btn-primary" style="width: 100%; min-height: 38px; font-size: 11px; font-weight: 700; background: #00F0FF; color: #03070D; border: none; border-radius: 4px; cursor: pointer; letter-spacing: 0.5px;">
                JETZT AKTUALISIEREN & NEU LADEN
              </button>
            </div>
          `;
          const applyBtn = statusEl.querySelector('#btn-apply-update');
          if (applyBtn) {
            const handleApply = async (e) => {
              if (e) { e.preventDefault(); e.stopPropagation(); }
              applyBtn.disabled = true;
              applyBtn.textContent = 'WIRD AKTUALISIERT & NEU GELADEN...';
              const banner = document.getElementById('auto-update-banner');
              if (banner) banner.remove();
              if (typeof window.executeAppUpdate === 'function') {
                await window.executeAppUpdate();
              } else {
                const targetUrl = window.location.origin + window.location.pathname + '?updated=' + Date.now();
                window.location.replace(targetUrl);
              }
            };
            applyBtn.addEventListener('click', handleApply);
            applyBtn.addEventListener('touchstart', handleApply, { passive: false });
          }
        }
      } else {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: #00FF88; font-weight: 600;">✓ Du nutzt die neueste Version (v${currentVer}).</span>`;
        }
        const banner = document.getElementById('auto-update-banner');
        if (banner) banner.remove();
      }
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--text-dim);">✓ Version v${CONFIG.VERSION} ist aktuell (Offline-Modus).</span>`;
      }
    } finally {
      if (checkBtn) checkBtn.disabled = false;
    }
  }
}

export { Settings as SettingsModal };
