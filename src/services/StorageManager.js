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
   * Login or Register Pilot. Merges cloud and local progress (highest level wins).
   */
  async login(callsign, pin) {
    const res = await firebaseService.loginOrRegister(callsign, pin);
    if (!res.success) {
      return res;
    }

    const cloudData = res.data || {};
    const localProgress = this.getCampaignProgress();
    const localEndless = this.getEndlessProgress();

    // Smart Merge: take the highest progress
    const mergedUnlockedSector = Math.max(localProgress.unlockedSector || 1, cloudData.unlockedSector || 1);
    const mergedMaxClearedSector = Math.max(
      localProgress.maxClearedSector || (localProgress.unlockedSector > 1 ? localProgress.unlockedSector - 1 : 0),
      cloudData.maxClearedSector !== undefined ? cloudData.maxClearedSector : (cloudData.highestLevel > 1 ? cloudData.highestLevel - 1 : 0)
    );
    const mergedSectorStats = { ...(cloudData.sectorStats || {}), ...(localProgress.sectorStats || {}) };
    const mergedEndlessHighscore = Math.max(localEndless.bestFloor || 1, cloudData.endlessHighscore || 0);

    this.currentPilot = {
      callsign: cloudData.callsign || callsign.toUpperCase(),
      isGuest: false,
      unlockedSector: mergedUnlockedSector,
      maxClearedSector: mergedMaxClearedSector,
      sectorStats: mergedSectorStats,
      endlessHighscore: mergedEndlessHighscore,
      highestLevel: mergedMaxClearedSector
    };

    // Save session to localStorage
    try {
      localStorage.setItem(CONFIG.STORAGE.PILOT_SESSION, JSON.stringify(this.currentPilot));
      localStorage.setItem(CONFIG.STORAGE.PROGRESS, JSON.stringify({
        unlockedSector: mergedUnlockedSector,
        maxClearedSector: mergedMaxClearedSector,
        sectorStats: mergedSectorStats
      }));
      localStorage.setItem(CONFIG.STORAGE.ENDLESS, JSON.stringify({
        bestFloor: mergedEndlessHighscore,
        bestCrystals: localEndless.bestCrystals || 0
      }));
    } catch (e) {
      console.warn('[StorageManager] Local storage save error:', e);
    }

    // Sync merged state back to cloud
    if (!res.offline) {
      firebaseService.savePilotProgress(this.currentPilot.callsign, {
        unlockedSector: mergedUnlockedSector,
        maxClearedSector: mergedMaxClearedSector,
        sectorStats: mergedSectorStats,
        endlessHighscore: mergedEndlessHighscore,
        highestLevel: mergedMaxClearedSector
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
   * Log out active pilot and switch back to Guest mode.
   */
  logout() {
    this.currentPilot = {
      callsign: 'GAST',
      isGuest: true
    };
    try {
      localStorage.removeItem(CONFIG.STORAGE.PILOT_SESSION);
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
    } catch (e) {
      console.warn('[StorageManager] Local progress save error:', e);
    }

    // Cloud auto-sync
    if (!this.isGuest()) {
      this.currentPilot.unlockedSector = unlockedSector;
      this.currentPilot.maxClearedSector = maxClearedSector;
      this.currentPilot.sectorStats = sectorStats;
      this.currentPilot.highestLevel = maxClearedSector;

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
    } catch (e) {
      console.warn('[StorageManager] Local endless save error:', e);
    }

    if (!this.isGuest()) {
      this.currentPilot.endlessHighscore = bestFloor;
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
