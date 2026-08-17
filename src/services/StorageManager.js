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
    const res = await firebaseService.loginOrRegister(callsign, pin);
    if (!res.success) {
      return res;
    }

    const cloudData = res.data || {};
    const pilotCallsign = (cloudData.callsign || callsign).toUpperCase();

    let localPilot = null;
    try {
      const raw = localStorage.getItem('sonar_pilot_' + pilotCallsign);
      if (raw) localPilot = JSON.parse(raw);
    } catch (e) {}

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
      highestLevel: pilotMaxCleared
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
    } catch (e) {
      console.warn('[StorageManager] Local storage save error:', e);
    }

    // Sync to cloud if online
    if (!res.offline) {
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
      isNew: res.isNew,
      pilot: this.currentPilot,
      message: res.message
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
      const rawGuest = localStorage.getItem('sonar_guest_progress');
      if (rawGuest) {
        try { guestProg = JSON.parse(rawGuest); } catch (e) {}
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
   * Reset all local saves.
   */
  resetAll() {
    try {
      localStorage.removeItem(CONFIG.STORAGE.PROGRESS);
      localStorage.removeItem(CONFIG.STORAGE.ENDLESS);
      localStorage.removeItem(CONFIG.STORAGE.PILOT_SESSION);
      this.currentPilot = { callsign: 'GAST', isGuest: true };
    } catch (e) {
      console.warn('[StorageManager] Reset error:', e);
    }
  }
}

export const storageManager = new StorageManager();
