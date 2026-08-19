/**
 * SONAR: The Echo Chamber
 * HangarModal - Metaprogression & Drone Upgrade Terminal
 * Allows pilots to invest earned campaign stars into tactical drone enhancements.
 */

import { storageManager, UPGRADE_CONFIG } from '../services/StorageManager.js';

export class HangarModal {
  constructor(audioEngine, onUpgradesChanged = null) {
    this.audio = audioEngine;
    this.onUpgradesChanged = onUpgradesChanged;
    this.isOpen = false;
    this.modalEl = null;

    this.initDOM();
  }

  initDOM() {
    const old = document.getElementById('hangar-modal');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'hangar-modal';
    container.className = 'terminal-modal-backdrop';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="terminal-modal-box hangar-box" style="width: 660px; max-width: 95vw;">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot" style="background: #00F0FF; box-shadow: 0 0 10px #00F0FF;"></span>
            <span>DROHNEN-HANGAR & TAKTISCHE UPGRADES</span>
          </div>
          <button id="modal-hangar-close-btn" class="modal-close-btn" aria-label="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Star Currency Header -->
          <div class="hangar-currency-bar">
            <div class="hangar-star-badge">
              <span class="hangar-star-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
              <span id="hangar-available-stars" class="hangar-star-val">0</span>
              <span class="hangar-star-label">VERFÜGBARE STERNE</span>
            </div>
            <div class="hangar-meta-info">
              <span id="hangar-total-stars">0 / 30 VERDIENT</span>
              <button id="btn-hangar-reset-all" class="modal-btn modal-btn-small" style="margin-left: 12px; border-color: #883344; color: #ff8899; display: inline-flex; align-items: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                ZURÜCKSETZEN
              </button>
            </div>
          </div>

          <div class="hangar-description">
            Investiere Kampagnen-Sterne in permanente Drohnen-Module. Alle Upgrades können jederzeit kostenlos zurückgesetzt werden.
          </div>

          <!-- Upgrade Cards Grid -->
          <div id="hangar-cards-grid" class="hangar-cards-grid">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end;">
          <button id="btn-hangar-close-footer" class="modal-btn modal-btn-primary">
            ZURÜCK
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.modalEl = container;
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = document.getElementById('modal-hangar-close-btn');
    const footerClose = document.getElementById('btn-hangar-close-footer');
    const resetBtn = document.getElementById('btn-hangar-reset-all');

    if (closeBtn) closeBtn.onclick = () => this.close();
    if (footerClose) footerClose.onclick = () => this.close();

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (this.audio) this.audio.playUIBlip();
        storageManager.resetUpgrades();
        this.renderUpgrades();
        if (this.onUpgradesChanged) this.onUpgradesChanged();
      };
    }

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });
  }

  renderUpgrades() {
    const grid = document.getElementById('hangar-cards-grid');
    const availStarsEl = document.getElementById('hangar-available-stars');
    const totalStarsEl = document.getElementById('hangar-total-stars');

    if (!grid) return;

    const totalStars = storageManager.calculateTotalStars();
    const availableStars = storageManager.getAvailableStars();
    const upgrades = storageManager.getUpgrades();

    if (availStarsEl) availStarsEl.textContent = availableStars;
    if (totalStarsEl) totalStarsEl.textContent = `${totalStars} / 30 VERDIENT`;

    let html = '';

    for (const [key, cfg] of Object.entries(UPGRADE_CONFIG)) {
      const currentLevel = upgrades[key] || 0;
      const isMax = currentLevel >= cfg.maxLevel;
      const nextCost = isMax ? 0 : cfg.costs[currentLevel];
      const canAfford = !isMax && availableStars >= nextCost;

      // Build Level Pips
      let pipsHtml = '';
      for (let i = 1; i <= cfg.maxLevel; i++) {
        const isFilled = i <= currentLevel;
        pipsHtml += `<span class="hangar-pip ${isFilled ? 'filled' : ''}"></span>`;
      }

      // Bonus Text
      let bonusText = '';
      if (key === 'sonarBooster') {
        bonusText = currentLevel > 0 ? `+${currentLevel * 10}% PING-REICHWEITE` : 'STANDARD-REICHWEITE';
      } else if (key === 'extraDecoy') {
        bonusText = currentLevel > 0 ? '2 KÖDER PRO SEKTOR' : '1 KÖDER PRO SEKTOR';
      } else if (key === 'hydroDampener') {
        bonusText = currentLevel > 0 ? `-${currentLevel * 15}% SCHRITT-LAUTSTÄRKE` : 'STANDARD-LAUTSTÄRKE';
      } else if (key === 'emergencyShield') {
        bonusText = currentLevel > 0 ? '1x WAND-CRASH ABSORPTION' : 'KEIN SCHILD AKTIV';
      }

      html += `
        <div class="hangar-card ${isMax ? 'card-max' : ''}">
          <div class="hangar-card-header">
            <div class="hangar-card-icon">${cfg.icon}</div>
            <div class="hangar-card-info">
              <div class="hangar-card-title">${cfg.title}</div>
              <div class="hangar-card-level">STUFE ${currentLevel} / ${cfg.maxLevel}</div>
            </div>
            <div class="hangar-pips-wrapper">${pipsHtml}</div>
          </div>

          <div class="hangar-card-desc">${cfg.desc}</div>
          <div class="hangar-card-bonus">STATUS: <span class="bonus-val">${bonusText}</span></div>

          <div class="hangar-card-action">
            ${isMax
              ? `<button class="modal-btn modal-btn-installed" disabled>MAXIMAL STUFE</button>`
              : `<button class="modal-btn modal-btn-upgrade ${canAfford ? 'can-buy' : 'disabled'}" data-upgrade="${key}" ${canAfford ? '' : 'disabled'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${nextCost} INSTALLIEREN
                </button>`
            }
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Attach Buy Button Handlers
    const buyBtns = grid.querySelectorAll('.modal-btn-upgrade.can-buy');
    buyBtns.forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-upgrade');
        const res = storageManager.purchaseUpgrade(id);
        if (res.success) {
          if (this.audio) {
            this.audio.playCrystalPickup(4);
            this.audio.triggerHaptic('pickup');
          }
          this.renderUpgrades();
          if (this.onUpgradesChanged) this.onUpgradesChanged();
        }
      };
    });
  }

  open() {
    this.isOpen = true;
    if (this.modalEl) {
      this.modalEl.style.display = 'flex';
      this.modalEl.scrollTop = 0;
      const modalBox = this.modalEl.querySelector('.terminal-modal-box');
      if (modalBox) modalBox.scrollTop = 0;
      const modalBody = this.modalEl.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = 0;
      this.renderUpgrades();
    }
    if (this.audio) this.audio.playUIBlip();
  }

  close() {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
      this.modalEl.scrollTop = 0;
      const modalBox = this.modalEl.querySelector('.terminal-modal-box');
      if (modalBox) modalBox.scrollTop = 0;
      const modalBody = this.modalEl.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = 0;
    }
    if (this.audio) this.audio.playUIBlip();
  }

  handleInput(inputHandler) {
    if (!this.isOpen) return null;
    if (inputHandler.consumeEscape()) {
      this.close();
      return 'CLOSE';
    }
    return null;
  }
}
