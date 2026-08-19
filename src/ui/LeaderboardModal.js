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
      <div class="terminal-modal-box leaderboard-box" style="width: 700px; max-width: 95vw;">
        <div class="modal-header">
          <div class="modal-title">
            <span class="status-dot"></span>
            <span>BESTENLISTE & FREUNDE-RADAR</span>
          </div>
          <button id="modal-lb-close-btn" class="modal-close-btn" aria-label="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Top Tabs -->
          <div class="lb-tab-group">
            <button id="tab-lb-world" class="lb-tab active">🌍 WELTWEIT</button>
            <button id="tab-lb-rivals" class="lb-tab">👥 MEINE FREUNDE</button>
          </div>

          <!-- Add Friend Input Row (Visible in Friends Tab) -->
          <div id="lb-friend-add-container" style="display: none; margin-bottom: 10px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" id="input-friend-callsign" class="lb-search-input" placeholder="Callsign des Freundes eingeben..." style="flex: 1; height: 34px;" autocomplete="off" />
              <button id="btn-submit-add-friend" class="modal-btn modal-btn-primary" style="height: 34px; white-space: nowrap; font-size: 11px;">
                + FREUND HINZUFÜGEN
              </button>
            </div>
            <div id="friend-add-feedback" style="font-family: var(--font-mono); font-size: 11px; margin-top: 4px; display: none;"></div>
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

          <div class="lb-search-bar" id="lb-search-wrapper">
            <input type="text" id="lb-search-input" class="lb-search-input" placeholder="🔍 Spieler suchen..." autocomplete="off">
          </div>

          <!-- Main Leaderboard Table -->
          <div class="lb-table-wrapper" style="max-height: 280px;">
            <table class="lb-terminal-table">
              <thead>
                <tr>
                  <th style="width: 10%; text-align: center;">RANG</th>
                  <th style="width: 25%;">PILOT</th>
                  <th style="width: 20%;">SEKTOREN</th>
                  <th style="width: 14%; text-align: center;">STERNE</th>
                  <th style="width: 15%; text-align: right;">GESAMTZEIT</th>
                  <th style="width: 16%; text-align: center;">VERGLEICH</th>
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
            ZURÜCK ZUM MENÜ
          </button>
        </div>
      </div>

      <!-- 1v1 Rival Direct Comparison Sub-Modal -->
      <div id="rival-compare-modal" class="terminal-modal-backdrop" style="display: none; z-index: 1100;">
        <div class="terminal-modal-box rival-modal-box" style="width: 640px; max-width: 95vw;">
          <div class="modal-header">
            <div class="modal-title">
              <span class="status-dot"></span>
              <span id="rival-compare-title">SPIELER-VERGLEICH</span>
            </div>
            <button id="modal-rival-close-btn" class="modal-close-btn" aria-label="Schließen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal-body" id="rival-compare-body">
            <!-- Populated dynamically -->
          </div>

          <div class="modal-footer">
            <button id="btn-rival-compare-back" class="modal-btn modal-btn-dim">
              ZURÜCK ZUR BESTENLISTE
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
    const friendContainer = container.querySelector('#lb-friend-add-container');
    const friendInput = container.querySelector('#input-friend-callsign');
    const addFriendBtn = container.querySelector('#btn-submit-add-friend');
    const friendFeedback = container.querySelector('#friend-add-feedback');

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
        if (friendContainer) friendContainer.style.display = 'none';
        this.renderTable();
        if (this.audio) this.audio.playUIBlip();
      });

      tabRivals.addEventListener('click', () => {
        this.activeTab = 'RIVALS';
        tabRivals.classList.add('active');
        tabWorld.classList.remove('active');
        if (friendContainer) friendContainer.style.display = 'block';
        this.renderTable();
        if (this.audio) this.audio.playUIBlip();
      });
    }

    // Add Friend Button Handler
    if (addFriendBtn && friendInput) {
      const handleAddFriend = () => {
        const val = friendInput.value.trim().toUpperCase();
        if (!val || val.length < 3) {
          if (friendFeedback) {
            friendFeedback.textContent = 'Callsign muss mindestens 3 Zeichen lang sein.';
            friendFeedback.style.color = '#ff5577';
            friendFeedback.style.display = 'block';
          }
          return;
        }

        storageManager.addRival(val);
        friendInput.value = '';
        if (friendFeedback) {
          friendFeedback.textContent = `✓ ${val} zu deinen Freunden hinzugefügt!`;
          friendFeedback.style.color = '#00ff88';
          friendFeedback.style.display = 'block';
          setTimeout(() => {
            if (friendFeedback) friendFeedback.style.display = 'none';
          }, 3500);
        }
        if (this.audio) this.audio.playUIBlip();
        this.renderTable();
      };

      addFriendBtn.addEventListener('click', handleAddFriend);
      friendInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddFriend();
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

    // Filter by Rivals/Friends Tab
    if (this.activeTab === 'RIVALS') {
      list = list.filter((e) => e.isRival || storageManager.isRival(e.callsign) || e.isCurrentPlayer);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      list = list.filter((e) => e.callsign.toUpperCase().includes(this.searchQuery));
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="lb-empty">${this.activeTab === 'RIVALS' ? 'Keine Freunde markiert. Gib oben das Callsign deines Freundes ein!' : 'Keine passenden Spielereinträge gefunden.'}</td></tr>`;
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
            <button class="btn-rival-star" data-pilot="${entry.callsign}" title="${isRival ? 'Freund entfernen' : 'Als Freund markieren'}" style="background: none; border: none; cursor: pointer; padding: 0 4px; vertical-align: middle;">
              ${starSvg}
            </button>
            <span class="pilot-name" style="font-weight: 700;">${entry.callsign}</span>
            ${entry.isCurrentPlayer ? '<span class="you-tag">DU</span>' : ''}
          </td>
          <td style="color: #a0c4d8; font-size: 11px;">${entry.highestLevel}</td>
          <td style="text-align: center; font-weight: 700; color: #FFD700;">${entry.totalStars} ★</td>
          <td style="text-align: right; color: var(--text-dim); font-size: 11px;">${entry.bestTime}</td>
          <td style="text-align: center;">
            <button class="btn-compare-link modal-btn modal-btn-small" data-pilot="${entry.callsign}" style="padding: 3px 8px; font-size: 10px;">
              ⚔️ VERGLEICHEN
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
    const myCleared = myProgress.maxClearedSector || (myProgress.unlockedSector > 1 ? myProgress.unlockedSector - 1 : 0);

    const rivalEntry = this.cachedEntries.find((e) => e.callsign.toUpperCase() === rivalCallsign.toUpperCase()) || {
      callsign: rivalCallsign,
      totalStars: 15,
      maxClearedSector: 5,
      highestLevel: '05 / 10 SEKTOREN',
      sectorStats: leaderboardService.generateMockSectorStats(5, 1.0)
    };
    const rivalStats = rivalEntry.sectorStats || {};
    const rivalTotalStars = rivalEntry.totalStars || 0;
    const rivalCleared = rivalEntry.maxClearedSector || 5;

    if (titleEl) {
      titleEl.textContent = `SPIELER-VERGLEICH: ${myCallsign} vs. ${rivalCallsign}`;
    }

    let sectorRowsHtml = '';
    const totalSectors = LEVELS.length; // 10
    let myWins = 0;
    let rivalWins = 0;

    for (let s = 1; s <= totalSectors; s++) {
      const mySec = myStats[s] || myStats[String(s)] || myStats[`0${s}`];
      const rivalSec = rivalStats[s] || rivalStats[String(s)] || rivalStats[`0${s}`];

      const myTime = mySec && mySec.time ? mySec.time : null;
      const rivalT = rivalSec && rivalSec.time ? rivalSec.time : null;

      let verdict = '<span style="color: #8da8b8;">Nicht gespielt</span>';
      if (myTime !== null && rivalT !== null) {
        const diff = rivalT - myTime;
        if (diff > 0.05) {
          verdict = `<span style="color: #00ff88; font-weight: 700;">+${diff.toFixed(1)}s (Gewonnen)</span>`;
          myWins++;
        } else if (diff < -0.05) {
          verdict = `<span style="color: #ff5577; font-weight: 700;">${diff.toFixed(1)}s (Rückstand)</span>`;
          rivalWins++;
        } else {
          verdict = `<span style="color: #ffaa00; font-weight: 700;">0.0s (Gleichstand)</span>`;
        }
      } else if (myTime !== null && rivalT === null) {
        verdict = `<span style="color: #00ff88; font-weight: 700;">+ (Gewonnen)</span>`;
        myWins++;
      } else if (myTime === null && rivalT !== null) {
        verdict = `<span style="color: #ff5577; font-weight: 700;">- (Rückstand)</span>`;
        rivalWins++;
      }

      const myTimeStr = myTime !== null ? `${myTime.toFixed(1)}s` : '--';
      const rivalTimeStr = rivalT !== null ? `${rivalT.toFixed(1)}s` : '--';

      sectorRowsHtml += `
        <tr style="border-bottom: 1px solid rgba(0, 240, 255, 0.08);">
          <td style="padding: 6px 8px; font-weight: 700; color: var(--cyan-primary);">SEKTOR 0${s}</td>
          <td style="padding: 6px 8px; color: ${myTime !== null ? '#00FF88' : '#8da8b8'}; font-weight: 600;">${myTimeStr}</td>
          <td style="padding: 6px 8px; color: ${rivalT !== null ? '#00F0FF' : '#8da8b8'}; font-weight: 600;">${rivalTimeStr}</td>
          <td style="padding: 6px 8px;">${verdict}</td>
        </tr>
      `;
    }

    compareBody.innerHTML = `
      <div class="rival-compare-grid" style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; margin-bottom: 12px;">
        <div class="rival-pilot-card" style="background: rgba(0, 255, 136, 0.08); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 6px; padding: 10px; text-align: center;">
          <div class="rival-pilot-name" style="color: #00FF88; font-weight: 700; font-size: 13px;">${myCallsign} (DU)</div>
          <div class="rival-pilot-stars" style="color: #FFD700; font-weight: 700; font-size: 13px; margin: 4px 0;">${myTotalStars} / 30 ★</div>
          <div style="font-size: 11px; color: #a0c4d8;">Erreicht: 0${myCleared} / 10</div>
          <div style="font-size: 11px; color: #00FF88; margin-top: 2px;">Siege: ${myWins} Sektoren</div>
        </div>
        <div class="rival-vs-divider" style="font-weight: 800; color: var(--text-dim); font-size: 14px;">VS</div>
        <div class="rival-pilot-card" style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 6px; padding: 10px; text-align: center;">
          <div class="rival-pilot-name" style="color: #00F0FF; font-weight: 700; font-size: 13px;">${rivalCallsign}</div>
          <div class="rival-pilot-stars" style="color: #FFD700; font-weight: 700; font-size: 13px; margin: 4px 0;">${rivalTotalStars} / 30 ★</div>
          <div style="font-size: 11px; color: #a0c4d8;">Erreicht: 0${rivalCleared} / 10</div>
          <div style="font-size: 11px; color: #00F0FF; margin-top: 2px;">Siege: ${rivalWins} Sektoren</div>
        </div>
      </div>

      <div style="font-size: 11px; font-weight: 700; color: var(--cyan-primary); margin: 6px 0;">SEKTOR-FÜR-SEKTOR VERGLEICH:</div>
      <div style="max-height: 220px; overflow-y: auto; border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 4px;">
        <table class="rival-sectors-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: rgba(0, 240, 255, 0.1); border-bottom: 1px solid rgba(0, 240, 255, 0.2);">
              <th style="padding: 6px 8px; text-align: left;">SEKTOR</th>
              <th style="padding: 6px 8px; text-align: left;">DEINE ZEIT</th>
              <th style="padding: 6px 8px; text-align: left;">${rivalCallsign} ZEIT</th>
              <th style="padding: 6px 8px; text-align: left;">DUELL</th>
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
      this.modalEl.scrollTop = 0;
      const modalBox = this.modalEl.querySelector('.terminal-modal-box');
      if (modalBox) modalBox.scrollTop = 0;
      const modalBody = this.modalEl.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = 0;
      this.loadData();
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
      const rivalModal = this.modalEl.querySelector('#rival-compare-modal');
      if (rivalModal) rivalModal.style.display = 'none';
    }
    if (this.audio) this.audio.playUIBlip();
  }
}
