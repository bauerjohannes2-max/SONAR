/**
 * SONAR: The Echo Chamber
 * High-End Visual Leaderboard & 1v1 Friends/Rivals Comparison Terminal Modal
 */

import { leaderboardService } from '../services/LeaderboardService.js';
import { storageManager } from '../services/StorageManager.js';
import { LEVELS } from '../world/levels.js';

export class LeaderboardModal {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.isOpen = false;
    this.modalEl = null;
    this.activeTab = 'WORLD'; // 'WORLD' | 'RIVALS'
    this.searchQuery = '';
    this.cachedEntries = [];

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
      <div class="terminal-modal-box leaderboard-box" style="width: 680px; max-width: 95vw;">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span>BESTENLISTE & RIVALEN-RADAR</span>
          </div>
          <button id="modal-lb-close-btn" class="modal-close-btn" aria-label="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Top Tabs -->
          <div class="lb-tab-group">
            <button id="tab-lb-world" class="lb-tab active">WELTWEIT</button>
            <button id="tab-lb-rivals" class="lb-tab">RIVALEN / FREUNDE</button>
          </div>

          <!-- Search & Status Bar -->
          <div class="lb-header-bar" style="margin-bottom: 8px;">
            <div id="lb-status-indicator" class="lb-status">
              <span class="status-pulse-dot"></span>
              <span id="lb-status-text">STATUS: VERBINDE...</span>
            </div>
            <button id="btn-lb-refresh" class="modal-btn modal-btn-small">
              AKTUALISIEREN
            </button>
          </div>

          <div class="lb-search-bar">
            <input type="text" id="lb-search-input" class="lb-search-input" placeholder="Pilot-Callsign suchen oder als Rivale markieren..." autocomplete="off">
          </div>

          <!-- Main Leaderboard Table -->
          <div class="lb-table-wrapper" style="max-height: 280px;">
            <table class="lb-terminal-table">
              <thead>
                <tr>
                  <th style="width: 10%; text-align: center;">RANG</th>
                  <th style="width: 25%;">PILOT</th>
                  <th style="width: 22%;">SEKTOREN</th>
                  <th style="width: 15%; text-align: center;">STERNE</th>
                  <th style="width: 14%; text-align: right;">ZEIT</th>
                  <th style="width: 14%; text-align: center;">1v1</th>
                </tr>
              </thead>
              <tbody id="lb-table-body">
                <tr>
                  <td colspan="6" class="lb-loading">Lade Rangliste aus der Sonar-Cloud...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button id="btn-lb-back" class="modal-btn modal-btn-dim">
            ← ZURÜCK ZUM MENÜ (ESC)
          </button>
        </div>
      </div>

      <!-- 1v1 Rival Direct Comparison Sub-Modal -->
      <div id="rival-compare-modal" class="terminal-modal-backdrop" style="display: none; z-index: 1100;">
        <div class="terminal-modal-box rival-modal-box">
          <div class="modal-header">
            <div class="modal-title">
              <span class="status-dot"></span>
              <span id="rival-compare-title">1v1 DIREKTVERGLEICH</span>
            </div>
            <button id="modal-rival-close-btn" class="modal-close-btn">✕</button>
          </div>

          <div class="modal-body" id="rival-compare-body">
            <!-- Populated dynamically -->
          </div>

          <div class="modal-footer">
            <button id="btn-rival-compare-back" class="modal-btn modal-btn-dim">
              ← ZURÜCK ZUR BESTENLISTE
            </button>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(container);
    this.modalEl = container;

    // Attach Event Listeners
    const closeBtn = container.querySelector('#modal-lb-close-btn');
    const backBtn = container.querySelector('#btn-lb-back');
    const refreshBtn = container.querySelector('#btn-lb-refresh');
    const tabWorld = container.querySelector('#tab-lb-world');
    const tabRivals = container.querySelector('#tab-lb-rivals');
    const searchInput = container.querySelector('#lb-search-input');

    const handleClose = () => this.close();

    // Close buttons
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (backBtn) backBtn.addEventListener('click', handleClose);
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadData(true));

    // Tabs
    if (tabWorld && tabRivals) {
      tabWorld.addEventListener('click', () => {
        this.activeTab = 'WORLD';
        tabWorld.classList.add('active');
        tabRivals.classList.remove('active');
        this.renderTable();
        if (this.audio) this.audio.playUIBlip();
      });

      tabRivals.addEventListener('click', () => {
        this.activeTab = 'RIVALS';
        tabRivals.classList.add('active');
        tabWorld.classList.remove('active');
        this.renderTable();
        if (this.audio) this.audio.playUIBlip();
      });
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toUpperCase();
        this.renderTable();
      });
    }

    // Rival modal sub-controls
    const rivalModal = container.querySelector('#rival-compare-modal');
    const rivalCloseBtn = container.querySelector('#modal-rival-close-btn');
    const rivalBackBtn = container.querySelector('#btn-rival-compare-back');
    const closeRival = () => {
      if (rivalModal) rivalModal.style.display = 'none';
      if (this.audio) this.audio.playUIBlip();
    };

    if (rivalCloseBtn) rivalCloseBtn.addEventListener('click', closeRival);
    if (rivalBackBtn) rivalBackBtn.addEventListener('click', closeRival);

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        if (rivalModal && rivalModal.style.display !== 'none') {
          closeRival();
        } else {
          this.close();
        }
      }
    });
  }

  async loadData(forceRefresh = false) {
    const statusText = this.modalEl.querySelector('#lb-status-text');
    const refreshBtn = this.modalEl.querySelector('#btn-lb-refresh');

    if (refreshBtn) refreshBtn.disabled = true;
    if (statusText) statusText.textContent = 'STATUS: LADE DATEN...';

    const data = await leaderboardService.getLeaderboard(forceRefresh);

    if (refreshBtn) refreshBtn.disabled = false;

    if (statusText) {
      if (data.isCloud) {
        statusText.innerHTML = '<span class="online-tag">CLOUD LIVE</span> • GLOBALE BESTENLISTE';
      } else {
        statusText.innerHTML = '<span class="fallback-tag">LOKALER SPEICHER</span> • GAST-MODUS';
      }
    }

    this.cachedEntries = data.entries || [];
    this.renderTable();
  }

  renderTable() {
    const tbody = this.modalEl.querySelector('#lb-table-body');
    if (!tbody) return;

    let list = this.cachedEntries;

    // Filter by Rivals Tab
    if (this.activeTab === 'RIVALS') {
      list = list.filter((e) => e.isRival || e.isCurrentPlayer);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      list = list.filter((e) => e.callsign.toUpperCase().includes(this.searchQuery));
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="lb-empty">${this.activeTab === 'RIVALS' ? 'Keine Rivalen/Freunde markiert. Klicke auf den Stern in der Tabelle, um Rivalen hinzuzufügen!' : 'Keine passenden Spielereinträge gefunden.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((entry) => {
      let rankDisplay = `#${entry.rank < 10 ? '0' + entry.rank : entry.rank}`;

      const isTop3 = entry.rank <= 3;
      const rowClass = (entry.isCurrentPlayer ? 'current-player-row ' : '') + (isTop3 ? 'top-rank-row' : '');
      const isRival = storageManager.isRival(entry.callsign);

      const starSvg = isRival
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

      return `
        <tr class="${rowClass}">
          <td style="text-align: center; font-weight: 700; color: ${isTop3 ? '#FFD700' : 'var(--cyan-primary)'};">${rankDisplay}</td>
          <td>
            <button class="btn-rival-star" data-pilot="${entry.callsign}" title="${isRival ? 'Rivalen entfernen' : 'Als Rivale/Freund markieren'}" style="background: none; border: none; cursor: pointer; padding: 0 4px; vertical-align: middle;">
              ${starSvg}
            </button>
            <span class="pilot-name" style="font-weight: 700;">${entry.callsign}</span>
            ${entry.isCurrentPlayer ? '<span class="you-tag">DU</span>' : ''}
          </td>
          <td style="color: #a0c4d8; font-size: 11px;">${entry.highestLevel}</td>
          <td style="text-align: center; font-weight: 700; color: #FFD700;">${entry.totalStars} ★</td>
          <td style="text-align: right; color: var(--text-dim); font-size: 11px;">${entry.bestTime}</td>
          <td style="text-align: center;">
            <button class="btn-compare-link" data-pilot="${entry.callsign}">
              1v1
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button handlers
    tbody.querySelectorAll('.btn-rival-star').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const callsign = btn.dataset.pilot;
        storageManager.toggleRival(callsign);
        this.cachedEntries.forEach((ent) => {
          if (ent.callsign === callsign) ent.isRival = storageManager.isRival(callsign);
        });
        this.renderTable();
        if (this.audio) this.audio.playUIBlip();
      });
    });

    tbody.querySelectorAll('.btn-compare-link').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const callsign = btn.dataset.pilot;
        this.openRivalComparison(callsign);
      });
    });
  }

  openRivalComparison(rivalCallsign) {
    const rivalModal = this.modalEl.querySelector('#rival-compare-modal');
    const compareBody = this.modalEl.querySelector('#rival-compare-body');
    const titleEl = this.modalEl.querySelector('#rival-compare-title');
    if (!rivalModal || !compareBody) return;

    const currentPilot = storageManager.getCurrentPilot();
    const myCallsign = currentPilot && currentPilot.callsign ? currentPilot.callsign : 'DU';
    const myProgress = storageManager.getCampaignProgress();
    const myStats = myProgress.sectorStats || {};
    const myTotalStars = storageManager.calculateTotalStars(myStats);

    const rivalEntry = this.cachedEntries.find((e) => e.callsign.toUpperCase() === rivalCallsign.toUpperCase()) || {
      callsign: rivalCallsign,
      totalStars: 15,
      highestLevel: '05 / 10 SEKTOREN',
      sectorStats: leaderboardService.generateMockSectorStats(5, 1.0)
    };
    const rivalStats = rivalEntry.sectorStats || {};
    const rivalTotalStars = rivalEntry.totalStars || 0;

    if (titleEl) {
      titleEl.textContent = `1v1 DIREKTVERGLEICH: ${myCallsign} vs. ${rivalCallsign}`;
    }

    let sectorRowsHtml = '';
    const totalSectors = LEVELS.length; // 10
    let myWins = 0;
    let rivalWins = 0;

    for (let s = 1; s <= totalSectors; s++) {
      const mySec = myStats[s];
      const rivalSec = rivalStats[s];

      const myStars = mySec ? (mySec.stars || 1) : 0;
      const myTime = mySec ? mySec.time : null;

      const rivalS = rivalSec ? (rivalSec.stars || 1) : 0;
      const rivalT = rivalSec ? rivalSec.time : null;

      let verdict = '--';
      if (mySec && rivalSec) {
        if (myStars > rivalS || (myStars === rivalS && myTime <= rivalT)) {
          verdict = `<span class="cell-winner">DU (${myStars}★ vs ${rivalS}★)</span>`;
          myWins++;
        } else {
          verdict = `<span style="color: #ff5577;">${rivalCallsign} (${rivalS}★ vs ${myStars}★)</span>`;
          rivalWins++;
        }
      } else if (mySec && !rivalSec) {
        verdict = `<span class="cell-winner">DU (VORSPRUNG)</span>`;
        myWins++;
      } else if (!mySec && rivalSec) {
        verdict = `<span style="color: #ff5577;">${rivalCallsign}</span>`;
        rivalWins++;
      }

      sectorRowsHtml += `
        <tr>
          <td style="font-weight: 700;">SEKTOR 0${s}</td>
          <td style="color: #00FF88;">${myStars > 0 ? `${myStars} ★ (${myTime.toFixed(1)}s)` : 'OFFEN'}</td>
          <td style="color: #00F0FF;">${rivalS > 0 ? `${rivalS} ★ (${rivalT ? rivalT.toFixed(1) + 's' : ''})` : 'OFFEN'}</td>
          <td>${verdict}</td>
        </tr>
      `;
    }

    compareBody.innerHTML = `
      <div class="rival-compare-grid">
        <div class="rival-pilot-card">
          <div class="rival-pilot-name" style="color: #00FF88;">${myCallsign} (DU)</div>
          <div class="rival-pilot-stars">${myTotalStars} / 30 ★</div>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Siege: ${myWins} Sektoren</div>
        </div>
        <div class="rival-vs-divider">VS</div>
        <div class="rival-pilot-card">
          <div class="rival-pilot-name" style="color: #00F0FF;">${rivalCallsign}</div>
          <div class="rival-pilot-stars">${rivalTotalStars} / 30 ★</div>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Siege: ${rivalWins} Sektoren</div>
        </div>
      </div>

      <div style="font-size: 11px; font-weight: 700; color: var(--cyan-primary); margin: 6px 0;">SEKTOR-FÜR-SEKTOR VERGLEICH:</div>
      <div style="max-height: 220px; overflow-y: auto; border: 1px solid rgba(0, 240, 255, 0.2);">
        <table class="rival-sectors-table">
          <thead>
            <tr>
              <th>SEKTOR</th>
              <th>DEINE LEISTUNG</th>
              <th>${rivalCallsign}</th>
              <th>SEKTOR-DUELL</th>
            </tr>
          </thead>
          <tbody>
            ${sectorRowsHtml}
          </tbody>
        </table>
      </div>
    `;

    rivalModal.style.display = 'flex';
    if (this.audio) this.audio.playUIBlip();
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
      const rivalModal = this.modalEl.querySelector('#rival-compare-modal');
      if (rivalModal) rivalModal.style.display = 'none';
    }
    if (this.audio) this.audio.playUIBlip();
  }
}
