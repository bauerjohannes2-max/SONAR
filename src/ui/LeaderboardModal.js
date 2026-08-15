/**
 * SONAR: The Echo Chamber
 * Global Leaderboard Terminal Modal Overlay
 * Renders Top 10 pilots from Firestore or Local Fallback
 */

import { leaderboardService } from '../services/LeaderboardService.js';

export class LeaderboardModal {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.isOpen = false;
    this.modalEl = null;

    this.initDOM();
  }

  initDOM() {
    const old = document.getElementById('leaderboard-modal');
    if (old) old.remove();

    const container = document.createElement('div');
    container.id = 'leaderboard-modal';
    container.className = 'terminal-modal-backdrop';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="terminal-modal-box leaderboard-box">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span>🏆 GLOBAL FIRESTORE LEADERBOARD // TOP 10 PILOTEN</span>
          </div>
          <button id="modal-lb-close-btn" class="modal-close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="lb-header-bar">
            <div id="lb-status-indicator" class="lb-status">
              <span class="status-pulse-dot"></span>
              <span id="lb-status-text">// STATUS: VERBINDE...</span>
            </div>
            <button id="btn-lb-refresh" class="modal-btn modal-btn-small">
              [ ⟳ AKTUALISIEREN ]
            </button>
          </div>

          <div class="lb-table-wrapper">
            <table class="lb-terminal-table">
              <thead>
                <tr>
                  <th class="col-rank">RANG</th>
                  <th class="col-pilot">PILOT (NAME)</th>
                  <th class="col-level">HÖCHSTES LEVEL</th>
                  <th class="col-date">DATUM</th>
                </tr>
              </thead>
              <tbody id="lb-table-body">
                <tr>
                  <td colspan="4" class="lb-loading">Lade Pilotendaten aus dem Sonar-Netzwerk...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button id="btn-lb-back" class="modal-btn modal-btn-dim">
            << ZURÜCK ZUM MENÜ [ESC]
          </button>
        </div>
      </div>
    `;

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(container);
    this.modalEl = container;

    const closeBtn = container.querySelector('#modal-lb-close-btn');
    const backBtn = container.querySelector('#btn-lb-back');
    const refreshBtn = container.querySelector('#btn-lb-refresh');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (backBtn) backBtn.addEventListener('click', () => this.close());
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadData(true));

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });
  }

  async loadData(forceRefresh = false) {
    const tbody = this.modalEl.querySelector('#lb-table-body');
    const statusText = this.modalEl.querySelector('#lb-status-text');
    const refreshBtn = this.modalEl.querySelector('#btn-lb-refresh');

    if (refreshBtn) refreshBtn.disabled = true;
    if (statusText) statusText.textContent = '// STATUS: LADE DATEN...';

    const data = await leaderboardService.getLeaderboard(forceRefresh);

    if (refreshBtn) refreshBtn.disabled = false;

    if (statusText) {
      if (data.isCloud) {
        statusText.innerHTML = '<span class="online-tag">FIRESTORE CLOUD LIVE</span> // GLOBALE DATENBANK';
      } else {
        statusText.innerHTML = '<span class="fallback-tag">LOKALER SPEICHER / BENCHMARK</span> // GAST-MODUS';
      }
    }

    if (!tbody) return;

    if (!data.entries || data.entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="lb-empty">Keine Piloteneinträge vorhanden.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.entries.map((entry) => {
      const isTop3 = entry.rank <= 3;
      const rankBadge = entry.rank === 1 ? '🥇 01' : (entry.rank === 2 ? '🥈 02' : (entry.rank === 3 ? '🥉 03' : `0${entry.rank}`));
      const rowClass = (entry.isCurrentPlayer ? 'current-player-row ' : '') + (isTop3 ? 'top-rank-row' : '');

      return `
        <tr class="${rowClass}">
          <td class="col-rank"><strong>${rankBadge}</strong></td>
          <td class="col-pilot">
            <span class="pilot-name">${entry.callsign}</span>
            ${entry.isCurrentPlayer ? '<span class="you-tag">[ DU ]</span>' : ''}
          </td>
          <td class="col-level">${entry.highestLevel}</td>
          <td class="col-date">${entry.date}</td>
        </tr>
      `;
    }).join('');
  }

  open() {
    this.isOpen = true;
    if (this.modalEl) {
      this.modalEl.style.display = 'flex';
      this.loadData();
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
