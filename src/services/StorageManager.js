/**
 * SONAR: The Echo Chamber
 * StorageManager - Unified LocalStorage & Firebase Cloud Sync Manager
 * Supports Zero-Friction Guest Mode & Pilot Profile Cloud Synchronization
 */

import { CONFIG } from '../config.js';
import { firebaseService } from './FirebaseService.js';

class StorageManager {
  constructor() {
    this.currentPilot = null;
    this.initSession();
  }

  /**
   * Load existing session or default to Guest mode.
   */
  initSession() {
    try {
      const sessionData = localStorage.getItem(CONFIG.STORAGE.PILOT_SESSION);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed && parsed.callsign && !parsed.isGuest) {
          this.currentPilot = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[StorageManager] Session load warning:', e);
    }

    this.currentPilot = {
      callsign: 'GAST',
      isGuest: true
    };
  }

  getCurrentPilot() {
    return this.currentPilot || { callsign: 'GAST', isGuest: true };
  }

  isGuest() {
    return !this.currentPilot || !!this.currentPilot.isGuest || this.currentPilot.callsign === 'GAST';
  }

  /**
   * Login or Register Pilot. Strictly isolates each pilot's personal progress.
   */
  async login(callsign, pin) {
    const cleanCallsign = (callsign || '').trim().toUpperCase();
    let localPilot = null;
    try {
      const raw = localStorage.getItem('sonar_pilot_' + cleanCallsign);
      if (raw) localPilot = JSON.parse(raw);
    } catch (e) {}

    const res = await firebaseService.loginOrRegister(callsign, pin);
    if (!res.success && !localPilot) {
      return res;
    }

    const cloudData = (res && res.data) ? res.data : {};
    const pilotCallsign = (cloudData.callsign || cleanCallsign).toUpperCase();

    let pilotUnlocked = cloudData.unlockedSector || (localPilot ? localPilot.unlockedSector : 1) || 1;
    let pilotMaxCleared = cloudData.maxClearedSector !== undefined
      ? cloudData.maxClearedSector
      : (localPilot && localPilot.maxClearedSector !== undefined
          ? localPilot.maxClearedSector
          : (pilotUnlocked > 1 ? pilotUnlocked - 1 : 0));

    if (localPilot) {
      pilotUnlocked = Math.max(pilotUnlocked, localPilot.unlockedSector || 1);
      pilotMaxCleared = Math.max(pilotMaxCleared, localPilot.maxClearedSector || 0);
    }

    let pilotSectorStats = { ...(localPilot ? localPilot.sectorStats : {}), ...(cloudData.sectorStats || {}) };
    let pilotEndless = Math.max(cloudData.endlessHighscore || 0, localPilot ? (localPilot.endlessHighscore || 0) : 0);

    let pilotUpgrades = { sonarBooster: 0, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 };
    if (localPilot && localPilot.upgrades) {
      pilotUpgrades = { ...pilotUpgrades, ...localPilot.upgrades };
    }
    try {
      const upRaw = localStorage.getItem('sonar_profile_' + pilotCallsign + '_upgrades');
      if (upRaw) {
        pilotUpgrades = { ...pilotUpgrades, ...JSON.parse(upRaw) };
      }
    } catch (e) {}

    // Only for brand-new registrations from Guest mode: option to preserve initial guest progress
    if (res.isNew && this.isGuest()) {
      const guestProgress = this.getCampaignProgress();
      const guestEndless = this.getEndlessProgress();
      if ((guestProgress.unlockedSector && guestProgress.unlockedSector > 1) || guestProgress.maxClearedSector > 0) {
        pilotUnlocked = Math.max(pilotUnlocked, guestProgress.unlockedSector || 1);
        pilotMaxCleared = Math.max(pilotMaxCleared, guestProgress.maxClearedSector || 0);
        pilotSectorStats = { ...pilotSectorStats, ...(guestProgress.sectorStats || {}) };
        pilotEndless = Math.max(pilotEndless, guestEndless.bestFloor || 0);
      }
    }

    this.currentPilot = {
      callsign: pilotCallsign,
      isGuest: false,
      unlockedSector: pilotUnlocked,
      maxClearedSector: pilotMaxCleared,
      sectorStats: pilotSectorStats,
      endlessHighscore: pilotEndless,
      highestLevel: pilotMaxCleared,
      upgrades: pilotUpgrades
    };

    // Save session to localStorage
    try {
      localStorage.setItem(CONFIG.STORAGE.PILOT_SESSION, JSON.stringify(this.currentPilot));
      localStorage.setItem(CONFIG.STORAGE.PROGRESS, JSON.stringify({
        unlockedSector: pilotUnlocked,
        maxClearedSector: pilotMaxCleared,
        sectorStats: pilotSectorStats
      }));
      localStorage.setItem(CONFIG.STORAGE.ENDLESS, JSON.stringify({
        bestFloor: pilotEndless,
        bestCrystals: 0
      }));
      localStorage.setItem('sonar_pilot_' + pilotCallsign, JSON.stringify(this.currentPilot));
      localStorage.setItem('sonar_profile_' + pilotCallsign + '_upgrades', JSON.stringify(pilotUpgrades));
      localStorage.setItem('sonar_profile_' + pilotCallsign + '_data', JSON.stringify({
        ...this.currentPilot,
        upgrades: pilotUpgrades
      }));
    } catch (e) {
      console.warn('[StorageManager] Local storage save error:', e);
    }

    // Sync to cloud if online
    if (res && !res.offline) {
      firebaseService.savePilotProgress(this.currentPilot.callsign, {
        unlockedSector: pilotUnlocked,
        maxClearedSector: pilotMaxCleared,
        sectorStats: pilotSectorStats,
        endlessHighscore: pilotEndless,
        highestLevel: pilotMaxCleared
      });
    }

    return {
      success: true,
      isNew: res ? res.isNew : false,
      pilot: this.currentPilot,
      message: res ? res.message : `Willkommen zurück, Pilot ${pilotCallsign}!`
    };
  }

  /**
   * Log out active pilot and switch back to Guest mode with clean guest state.
   */
  logout() {
    this.currentPilot = {
      callsign: 'GAST',
      isGuest: true
    };
    try {
      localStorage.removeItem(CONFIG.STORAGE.PILOT_SESSION);

      // Restore guest progress (or start clean at sector 1)
      let guestProg = { unlockedSector: 1, maxClearedSector: 0, sectorStats: {} };
      const rawGuest = localStorage.getItem('sonar_guest_progress') || localStorage.getItem('sonar_guest_data');
      if (rawGuest) {
        try { 
          const parsed = JSON.parse(rawGuest);
          guestProg = {
            unlockedSector: parsed.unlockedSector || 1,
            maxClearedSector: parsed.maxClearedSector || 0,
            sectorStats: parsed.sectorStats || {}
          };
        } catch (e) {}
      }
      localStorage.setItem(CONFIG.STORAGE.PROGRESS, JSON.stringify(guestProg));

      let guestEndless = { bestFloor: 1, bestCrystals: 0 };
      const rawEndless = localStorage.getItem('sonar_guest_endless');
      if (rawEndless) {
        try { guestEndless = JSON.parse(rawEndless); } catch (e) {}
      }
      localStorage.setItem(CONFIG.STORAGE.ENDLESS, JSON.stringify(guestEndless));
    } catch (e) {
      console.warn('[StorageManager] Session clear error:', e);
    }
  }

  /**
   * Load campaign progress from localStorage.
   */
  getCampaignProgress() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.PROGRESS);
      if (data) {
        const parsed = JSON.parse(data);
        const unlockedSector = parsed.unlockedSector || 1;
        const maxClearedSector = parsed.maxClearedSector !== undefined
          ? parsed.maxClearedSector
          : (unlockedSector > 1 ? unlockedSector - 1 : 0);
        return {
          unlockedSector,
          maxClearedSector,
          sectorStats: parsed.sectorStats || {}
        };
      }
    } catch (e) {
      console.warn('[StorageManager] Progress read error:', e);
    }
    return { unlockedSector: 1, maxClearedSector: 0, sectorStats: {} };
  }

  /**
   * Save campaign sector progress and auto-sync to cloud.
   */
  saveCampaignProgress(sectorCleared, stats) {
    const current = this.getCampaignProgress();
    const sectorStats = { ...current.sectorStats, [sectorCleared]: stats };
    const maxClearedSector = Math.max(current.maxClearedSector || 0, sectorCleared);
    let unlockedSector = current.unlockedSector;

    if (sectorCleared >= unlockedSector && unlockedSector < 10) {
      unlockedSector = sectorCleared + 1;
    }

    const payload = {
      unlockedSector,
      maxClearedSector,
      sectorStats
    };

    // Save locally
    try {
      localStorage.setItem(CONFIG.STORAGE.PROGRESS, JSON.stringify(payload));
      if (this.isGuest()) {
        localStorage.setItem('sonar_guest_progress', JSON.stringify(payload));
      } else {
        const updatedPilot = {
          ...this.currentPilot,
          ...payload,
          highestLevel: maxClearedSector
        };
        this.currentPilot = updatedPilot;
        localStorage.setItem('sonar_pilot_' + this.currentPilot.callsign, JSON.stringify(updatedPilot));
        localStorage.setItem(CONFIG.STORAGE.PILOT_SESSION, JSON.stringify(updatedPilot));
      }
    } catch (e) {
      console.warn('[StorageManager] Local progress save error:', e);
    }

    // Cloud auto-sync
    if (!this.isGuest()) {
      firebaseService.savePilotProgress(this.currentPilot.callsign, {
        unlockedSector,
        maxClearedSector,
        sectorStats,
        highestLevel: maxClearedSector,
        endlessHighscore: this.currentPilot.endlessHighscore || 0
      });
    }

    return payload;
  }

  /**
   * Load endless mode stats.
   */
  getEndlessProgress() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.ENDLESS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          bestFloor: parsed.bestFloor || 1,
          bestCrystals: parsed.bestCrystals || 0
        };
      }
    } catch (e) {
      console.warn('[StorageManager] Endless progress read error:', e);
    }
    return { bestFloor: 1, bestCrystals: 0 };
  }

  /**
   * Save endless mode highscore and auto-sync to cloud.
   */
  saveEndlessProgress(floor, crystals) {
    const current = this.getEndlessProgress();
    const bestFloor = Math.max(current.bestFloor || 1, floor);
    const bestCrystals = Math.max(current.bestCrystals || 0, crystals);

    const payload = { bestFloor, bestCrystals };

    try {
      localStorage.setItem(CONFIG.STORAGE.ENDLESS, JSON.stringify(payload));
      if (this.isGuest()) {
        localStorage.setItem('sonar_guest_endless', JSON.stringify(payload));
      } else {
        this.currentPilot.endlessHighscore = bestFloor;
        localStorage.setItem('sonar_pilot_' + this.currentPilot.callsign, JSON.stringify(this.currentPilot));
        localStorage.setItem(CONFIG.STORAGE.PILOT_SESSION, JSON.stringify(this.currentPilot));
      }
    } catch (e) {
      console.warn('[StorageManager] Local endless save error:', e);
    }

    if (!this.isGuest()) {
      firebaseService.savePilotProgress(this.currentPilot.callsign, {
        unlockedSector: this.currentPilot.unlockedSector || 1,
        sectorStats: this.currentPilot.sectorStats || {},
        highestLevel: this.currentPilot.unlockedSector || 1,
        endlessHighscore: bestFloor
      });
    }

    return payload;
  }

  /**
   * Rivals / Friends Management
   */
  getRivals() {
    try {
      const raw = localStorage.getItem('sonar_rivals');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return ['ECHO_GHOST', 'SHADOW_RUN']; // Default friendly rivals
  }

  isRival(callsign) {
    if (!callsign) return false;
    const rivals = this.getRivals();
    return rivals.some((r) => r.toUpperCase() === callsign.toUpperCase());
  }

  toggleRival(callsign) {
    if (!callsign) return false;
    let rivals = this.getRivals();
    const upper = callsign.toUpperCase();
    const exists = rivals.some((r) => r.toUpperCase() === upper);

    if (exists) {
      rivals = rivals.filter((r) => r.toUpperCase() !== upper);
    } else {
      rivals.push(upper);
    }

    try {
      localStorage.setItem('sonar_rivals', JSON.stringify(rivals));
    } catch (e) {}

    return !exists;
  }

  calculateTotalStars(sectorStats = null) {
    const stats = sectorStats || this.getCampaignProgress().sectorStats || {};
    let total = 0;
    for (let key in stats) {
      const s = stats[key];
      if (s) {
        total += s.stars || (s.rank === 'S' ? 3 : (s.rank === 'A' ? 2 : 1));
      }
    }
    return total;
  }

  /**
   * Helper keys for profile context separation
   */
  getContextDataKey() {
    if (this.isGuest()) {
      return 'sonar_guest_data';
    }
    const callsign = (this.currentPilot && this.currentPilot.callsign) ? this.currentPilot.callsign.toUpperCase() : 'GAST';
    return `sonar_profile_${callsign}_data`;
  }

  getUpgradesKey() {
    if (this.isGuest()) {
      return 'sonar_guest_upgrades';
    }
    const callsign = (this.currentPilot && this.currentPilot.callsign) ? this.currentPilot.callsign.toUpperCase() : 'GAST';
    return `sonar_profile_${callsign}_upgrades`;
  }

  /**
   * Hangar Metaprogression & Upgrades (Strictly isolated per profile)
   */
  getUpgrades() {
    try {
      const key = this.getUpgradesKey();
      let raw = localStorage.getItem(key);
      if (!raw) {
        const ctxKey = this.getContextDataKey();
        const ctxRaw = localStorage.getItem(ctxKey);
        if (ctxRaw) {
          const parsed = JSON.parse(ctxRaw);
          if (parsed && parsed.upgrades) return parsed.upgrades;
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          sonarBooster: parsed.sonarBooster || 0,
          extraDecoy: parsed.extraDecoy || 0,
          hydroDampener: parsed.hydroDampener || 0,
          emergencyShield: parsed.emergencyShield || 0
        };
      }
      if (!this.isGuest() && this.currentPilot && this.currentPilot.upgrades) {
        return {
          sonarBooster: this.currentPilot.upgrades.sonarBooster || 0,
          extraDecoy: this.currentPilot.upgrades.extraDecoy || 0,
          hydroDampener: this.currentPilot.upgrades.hydroDampener || 0,
          emergencyShield: this.currentPilot.upgrades.emergencyShield || 0
        };
      }
    } catch (e) {}
    return { sonarBooster: 0, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 };
  }

  getSpentStars() {
    const upgrades = this.getUpgrades();
    let spent = 0;
    for (const [key, cfg] of Object.entries(UPGRADE_CONFIG)) {
      const lvl = Math.min(cfg.maxLevel, upgrades[key] || 0);
      for (let i = 0; i < lvl; i++) {
        spent += cfg.costs[i] || 0;
      }
    }
    return spent;
  }

  getAvailableStars() {
    const total = this.calculateTotalStars();
    const spent = this.getSpentStars();
    return Math.max(0, total - spent);
  }

  saveUpgrades(upgrades) {
    try {
      const upKey = this.getUpgradesKey();
      localStorage.setItem(upKey, JSON.stringify(upgrades));

      const ctxKey = this.getContextDataKey();
      let ctxData = {};
      try {
        const raw = localStorage.getItem(ctxKey);
        if (raw) ctxData = JSON.parse(raw);
      } catch (e) {}
      ctxData.upgrades = upgrades;
      localStorage.setItem(ctxKey, JSON.stringify(ctxData));

      if (!this.isGuest() && this.currentPilot) {
        this.currentPilot.upgrades = upgrades;
        localStorage.setItem('sonar_pilot_' + this.currentPilot.callsign, JSON.stringify(this.currentPilot));
        localStorage.setItem(CONFIG.STORAGE.PILOT_SESSION, JSON.stringify(this.currentPilot));
      }
    } catch (e) {}
  }

  purchaseUpgrade(upgradeId) {
    const cfg = UPGRADE_CONFIG[upgradeId];
    if (!cfg) return { success: false, reason: 'INVALID_UPGRADE' };

    const upgrades = this.getUpgrades();
    const currentLvl = upgrades[upgradeId] || 0;
    if (currentLvl >= cfg.maxLevel) return { success: false, reason: 'MAX_LEVEL' };

    const cost = cfg.costs[currentLvl];
    const avail = this.getAvailableStars();
    if (avail < cost) return { success: false, reason: 'INSUFFICIENT_STARS' };

    upgrades[upgradeId] = currentLvl + 1;
    this.saveUpgrades(upgrades);

    return {
      success: true,
      upgradeId,
      newLevel: upgrades[upgradeId],
      cost,
      remainingStars: this.getAvailableStars()
    };
  }

  resetUpgrades() {
    const defaultUpgrades = { sonarBooster: 0, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 };
    this.saveUpgrades(defaultUpgrades);
    return defaultUpgrades;
  }

  /**
   * Reset all local saves.
   */
  resetAll() {
    try {
      localStorage.removeItem(CONFIG.STORAGE.PROGRESS);
      localStorage.removeItem(CONFIG.STORAGE.ENDLESS);
      localStorage.removeItem(CONFIG.STORAGE.PILOT_SESSION);
      localStorage.removeItem('sonar_rivals');
      localStorage.removeItem('sonar_guest_data');
      localStorage.removeItem('sonar_guest_upgrades');
      localStorage.removeItem('sonar_guest_progress');
      localStorage.removeItem('sonar_hangar_upgrades');
      this.currentPilot = { callsign: 'GAST', isGuest: true };
    } catch (e) {
      console.warn('[StorageManager] Reset error:', e);
    }
  }
}

export const UPGRADE_CONFIG = {
  sonarBooster: {
    id: 'sonarBooster',
    title: 'SONAR-VERSTÄRKER',
    desc: 'Erhöht Reichweite & Ausbreitungsgeschwindigkeit des Pings (+10% / Stufe).',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><path d="M12 10a2 2 0 0 1 2 2"/><line x1="12" y1="12" x2="12" y2="22"/><circle cx="12" cy="12" r="1"/></svg>',
    maxLevel: 3,
    costs: [2, 4, 6]
  },
  extraDecoy: {
    id: 'extraDecoy',
    title: 'ZUSATZ-KÖDER',
    desc: 'Startet jeden Sektor mit einem zusätzlichen Täuschkörper (+1 Köder).',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="10" stroke-opacity="0.5"/></svg>',
    maxLevel: 1,
    costs: [4]
  },
  hydroDampener: {
    id: 'hydroDampener',
    title: 'HYDRO-DÄMPFER',
    desc: 'Dämpft Drohnengeräusche bei normaler Fahrt um 15% / 30%.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    maxLevel: 2,
    costs: [3, 5]
  },
  emergencyShield: {
    id: 'emergencyShield',
    title: 'NOTFALL-SCHILD',
    desc: 'Absorbiert 1x pro Sektor einen versehentlichen Wandaufprall.',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    maxLevel: 1,
    costs: [6]
  }
};

export const storageManager = new StorageManager();
