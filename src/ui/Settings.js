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
      <div class="terminal-modal-box settings-modal-box">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span id="settings-modal-title-text">SYSTEM-EINSTELLUNGEN</span>
          </div>
          <button id="modal-settings-close-btn" class="modal-close-btn" title="Schließen (ESC)">✕</button>
        </div>

        <div class="modal-body">
          <!-- AUDIO & GRAFIK SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">AUDIO & GRAFIK</span>
            <div class="settings-section-line"></div>
          </div>

          <!-- Master Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-master-volume" class="settings-label">GESAMT-LAUTSTÄRKE (MASTER)</label>
              <span id="val-master-volume" class="settings-value-badge">${Math.round(this.masterVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-master-volume" min="0" max="100" value="${Math.round(this.masterVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- Music Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-music-volume" class="settings-label">MUSIK-LAUTSTÄRKE (HINTERGRUND)</label>
              <span id="val-music-volume" class="settings-value-badge">${Math.round(this.musicVolume * 100)}%</span>
            </div>
            <input type="range" id="slider-music-volume" min="0" max="100" value="${Math.round(this.musicVolume * 100)}" class="terminal-range-slider" />
          </div>

          <!-- SFX Volume Slider -->
          <div class="settings-row">
            <div class="settings-header-row">
              <label for="slider-sfx-volume" class="settings-label">EFFEKTE & SFX (SONAR, PING, KRISTALLE)</label>
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

          <!-- STEUERUNG & TOUCH-LAYOUT SECTION -->
          <div class="settings-section-divider">
            <span class="settings-section-title">STEUERUNG & TOUCH-LAYOUT</span>
            <div class="settings-section-line"></div>
          </div>

          <!-- Control Type Toggle: D-Pad vs. Swipe -->
          <div class="settings-row">
            <div class="settings-label">MOBILE STEUERUNG</div>
            <div class="btn-segment-group">
              <button id="btn-ctrl-dpad" class="btn-segment ${touchConfig.controlType === 'DPAD' || !touchConfig.controlType ? 'active' : ''}">
                🔲 STEUERKREUZ (D-PAD)
              </button>
              <button id="btn-ctrl-swipe" class="btn-segment ${touchConfig.controlType === 'SWIPE' ? 'active' : ''}">
                👆 WISCH-GESTEN (SWIPE)
              </button>
            </div>
          </div>

          <!-- Element Size / Scale -->
          <div class="settings-row">
            <div class="settings-header-row">
              <div class="settings-label">ELEMENT-GRÖSSE (SKALIERUNG)</div>
              <span id="val-touch-scale" class="settings-value-badge">${Math.round((touchConfig.scale || 1.0) * 100)}%</span>
            </div>
            <div class="btn-segment-group">
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 0.8 ? 'active' : ''}" data-scale="0.8">80%</button>
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 1.0 || !touchConfig.scale ? 'active' : ''}" data-scale="1.0">100%</button>
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 1.25 ? 'active' : ''}" data-scale="1.25">125%</button>
              <button class="btn-segment btn-scale-step ${touchConfig.scale === 1.5 ? 'active' : ''}" data-scale="1.5">150%</button>
            </div>
          </div>

          <!-- Visual Layout Editor Action Button -->
          <button id="btn-open-touch-editor" class="btn-full-action">
            🛠️ TOUCH-LAYOUT ANPASSEN (POSITION & GRÖSSE)
          </button>

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
              🔄 AUF UPDATES PRÜFEN
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
        if (this.audio) this.audio.playUIBlip();
      };
      btn.addEventListener('click', selectScale);
      btn.addEventListener('touchstart', selectScale, { passive: false });
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
    const updateMsg = container.querySelector('#update-status-msg');
    if (checkUpdateBtn) {
      const handleCheckUpdate = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (this.audio) this.audio.playUIBlip();

        if (updateMsg) {
          updateMsg.style.color = 'var(--cyan-primary)';
          updateMsg.textContent = 'Prüfe Server auf Updates...';
        }

        try {
          // 1. Revalidate Service Worker if active
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) await reg.update();
          }

          // 2. Fetch version.json with cache bust
          const res = await fetch(`./version.json?t=${Date.now()}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (data && data.version) {
            if (data.version === CONFIG.VERSION && (!data.build || data.build === CONFIG.BUILD)) {
              if (updateMsg) {
                updateMsg.style.color = '#00FF88';
                updateMsg.textContent = `✓ Du nutzt die neueste Version (v${CONFIG.VERSION}).`;
              }
            } else {
              if (updateMsg) {
                updateMsg.style.color = '#FFAA00';
                updateMsg.innerHTML = `⚡ Neue Version v${data.version} verfügbar! <a href="#" id="link-reload-update" style="color: #00F0FF; font-weight: 700; text-decoration: underline; margin-left: 6px;">[ JETZT AKTUALISIEREN ]</a>`;
                const reloadLink = container.querySelector('#link-reload-update');
                if (reloadLink) {
                  reloadLink.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    if ('caches' in window) {
                      caches.keys().then((keys) => {
                        keys.forEach((k) => caches.delete(k));
                        window.location.reload();
                      });
                    } else {
                      window.location.reload();
                    }
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn('Update check error:', err);
          if (updateMsg) {
            updateMsg.style.color = 'var(--text-dim)';
            updateMsg.textContent = `✓ Version v${CONFIG.VERSION} ist aktuell (Offline-Modus).`;
          }
        }
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

  async checkForUpdates() {
    if (!this.modalEl) return;
    const statusEl = this.modalEl.querySelector('#update-status-msg');
    const checkBtn = this.modalEl.querySelector('#btn-check-updates');

    if (statusEl) {
      statusEl.innerHTML = '<span style="color: var(--cyan-primary);">⏳ PRÜFE AUF UPDATES...</span>';
    }
    if (checkBtn) checkBtn.disabled = true;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      }

      const res = await fetch('./version.json?t=' + Date.now());
      if (!res.ok) throw new Error('Status: ' + res.status);
      const data = await res.json();
      const currentVer = CONFIG.VERSION || '1.2.1';

      if (data.version && data.version !== currentVer) {
        if (statusEl) {
          statusEl.innerHTML = `
            <div style="margin-top: 4px;">
              <div style="color: #ffaa00; font-weight: 700; margin-bottom: 6px;">
                ★ NEUE VERSION VERFÜGBAR: v${data.version}
              </div>
              <button id="btn-apply-update" class="modal-btn modal-btn-primary" style="width: 100%; min-height: 38px; font-size: 11.5px; font-weight: 700;">
                🚀 JETZT AKTUALISIEREN & NEU LADEN
              </button>
            </div>
          `;
          const applyBtn = statusEl.querySelector('#btn-apply-update');
          if (applyBtn) {
            applyBtn.addEventListener('click', async () => {
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
              window.location.reload(true);
            });
          }
        }
      } else {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: #00ffaa; font-weight: 600;">✓ VERSION IST AKTUELL (v${currentVer})</span>`;
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #ff5555;">Update-Prüfung offline oder fehlgeschlagen.</span>`;
      }
    } finally {
      if (checkBtn) checkBtn.disabled = false;
    }
  }
}

export { Settings as SettingsModal };
