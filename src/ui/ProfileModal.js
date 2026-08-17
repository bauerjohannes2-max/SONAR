/**
 * SONAR: The Echo Chamber
 * Pilot Profile Terminal Modal
 * Login & Registration via Callsign + 4-Digit PIN with Instant Feedback
 */

import { storageManager } from '../services/StorageManager.js';
import { firebaseService } from '../services/FirebaseService.js';

export class ProfileModal {
  constructor(audioEngine, onProfileChanged = null) {
    this.audio = audioEngine;
    this.onProfileChanged = onProfileChanged;
    this.isOpen = false;
    this.modalEl = null;

    this.initDOM();
  }

  initDOM() {
    // Remove if already exists
    const old = document.getElementById('pilot-profile-modal');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'pilot-profile-modal';
    container.className = 'terminal-modal-backdrop';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="terminal-modal-box">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span>SPIELER-PROFIL • CLOUD-SYNC</span>
          </div>
          <button id="modal-profile-close-btn" class="modal-close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="pilot-status-banner" id="pilot-current-status-banner">
            <!-- Populated dynamically -->
          </div>

          <div class="modal-form-group">
            <label for="input-pilot-callsign">DEIN SPIELERNAME:</label>
            <input type="text" id="input-pilot-callsign" maxlength="12" placeholder="Z.B. ALEX" autocomplete="off" spellcheck="false" />
            <span class="field-hint">3–12 Zeichen (Buchstaben, Zahlen, Bindestriche)</span>
          </div>

          <div class="modal-form-group">
            <label for="input-pilot-pin">4-STELLIGE PIN:</label>
            <input type="password" id="input-pilot-pin" maxlength="4" placeholder="••••" inputmode="numeric" pattern="[0-9]*" autocomplete="off" />
            <span class="field-hint">4 Ziffern zum Schutz deines Online-Spielstands</span>
          </div>

          <div id="modal-profile-msg" class="modal-message-box"></div>

          <div class="modal-actions-row">
            <button id="btn-profile-submit" class="modal-btn modal-btn-primary">
              ➔ ANMELDEN / REGISTRIEREN
            </button>
            <button id="btn-profile-logout" class="modal-btn modal-btn-secondary">
              ⎋ ABMELDEN (GAST-MODUS)
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button id="btn-profile-back" class="modal-btn modal-btn-dim">
            ← ZURÜCK ZUM MENÜ (ESC)
          </button>
        </div>
      </div>
    `;

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(container);
    this.modalEl = container;

    // Attach Event Listeners
    const closeBtn = container.querySelector('#modal-profile-close-btn');
    const backBtn = container.querySelector('#btn-profile-back');
    const submitBtn = container.querySelector('#btn-profile-submit');
    const logoutBtn = container.querySelector('#btn-profile-logout');
    const callsignInput = container.querySelector('#input-pilot-callsign');
    const pinInput = container.querySelector('#input-pilot-pin');

    const handleClose = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.close();
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
    if (backBtn) {
      backBtn.addEventListener('click', handleClose);
      backBtn.addEventListener('touchstart', handleClose, { passive: false });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handleSubmit());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Submit on Enter & Live input hints
    const handleKey = (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      } else if (e.key === 'Escape') {
        this.close();
      }
    };
    if (callsignInput) callsignInput.addEventListener('keydown', handleKey);
    if (pinInput) pinInput.addEventListener('keydown', handleKey);
  }

  updateStatusBanner() {
    const banner = this.modalEl.querySelector('#pilot-current-status-banner');
    const logoutBtn = this.modalEl.querySelector('#btn-profile-logout');
    const pilot = storageManager.getCurrentPilot();
    const isGuest = storageManager.isGuest();
    const isFbOnline = firebaseService.isConfigured();

    if (banner) {
      if (isGuest) {
        banner.innerHTML = `
          <div class="status-badge guest">STATUS: GAST (NUR LOKAL GESPEICHERT)</div>
          <div class="status-detail">Gib deinen Namen & eine 4-stellige PIN ein, um deinen Spielstand online zu sichern.</div>
        `;
        if (logoutBtn) logoutBtn.style.display = 'none';
      } else {
        const cloudLabel = isFbOnline ? 'CLOUD-SYNC AKTIV ★' : 'LOKAL GESICHERT';
        banner.innerHTML = `
          <div class="status-badge logged-in">SPIELER: <strong>${pilot.callsign}</strong> • [ ${cloudLabel} ]</div>
          <div class="status-detail">Höchster Sektor: 0${pilot.unlockedSector || 1} • Endless Rekord: Etage ${pilot.endlessHighscore || 1}</div>
        `;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
      }
    }
  }

  showMessage(msg, isError = false) {
    const msgBox = this.modalEl.querySelector('#modal-profile-msg');
    if (msgBox) {
      msgBox.textContent = msg;
      msgBox.className = 'modal-message-box ' + (isError ? 'error' : 'success');
      msgBox.style.display = 'block';
    }
  }

  clearMessage() {
    const msgBox = this.modalEl.querySelector('#modal-profile-msg');
    if (msgBox) {
      msgBox.textContent = '';
      msgBox.style.display = 'none';
    }
  }

  async handleSubmit() {
    const callsignInput = this.modalEl.querySelector('#input-pilot-callsign');
    const pinInput = this.modalEl.querySelector('#input-pilot-pin');
    const submitBtn = this.modalEl.querySelector('#btn-profile-submit');

    const callsign = (callsignInput ? callsignInput.value : '').trim();
    const pin = (pinInput ? pinInput.value : '').trim();

    if (!callsign || callsign.length < 3) {
      if (this.audio) this.audio.playWallCrash();
      this.showMessage('Callsign muss mindestens 3 Zeichen lang sein.', true);
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      if (this.audio) this.audio.playWallCrash();
      this.showMessage('PIN muss genau 4 Ziffern lang sein (z.B. 1234).', true);
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'SYNCHRONISIERE...';
    }

    this.showMessage('Verbinde mit Sonar-Cloud...', false);

    const res = await storageManager.login(callsign, pin);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '➔ ANMELDEN / REGISTRIEREN';
    }

    if (res.success) {
      if (this.audio) this.audio.playCrystalPickup();
      this.showMessage(res.message || '✓ CLOUD-SPIELSTAND ERFOLGREICH GELADEN', false);
      this.updateStatusBanner();
      if (pinInput) pinInput.value = '';
      if (callsignInput) callsignInput.value = '';

      if (typeof this.onProfileChanged === 'function') {
        this.onProfileChanged(res.pilot);
      }

      setTimeout(() => {
        if (this.isOpen) this.close();
      }, 1200);
    } else {
      if (this.audio) this.audio.playWallCrash();
      this.showMessage(res.error || 'Fehler beim Anmelden.', true);
    }
  }

  handleLogout() {
    storageManager.logout();
    if (this.audio) this.audio.playUIBlip();
    this.showMessage('Abgemeldet. Gast-Modus aktiv.', false);
    this.updateStatusBanner();

    if (typeof this.onProfileChanged === 'function') {
      this.onProfileChanged(storageManager.getCurrentPilot());
    }
  }

  open() {
    this.isOpen = true;
    if (this.modalEl) {
      this.clearMessage();
      this.updateStatusBanner();
      this.modalEl.style.display = 'flex';

      const callsignInput = this.modalEl.querySelector('#input-pilot-callsign');
      if (callsignInput) {
        setTimeout(() => callsignInput.focus(), 50);
      }
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
}
