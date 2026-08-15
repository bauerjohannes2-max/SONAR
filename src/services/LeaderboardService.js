/**
 * SONAR: The Echo Chamber
 * Global & Local Leaderboard Service
 * Fetches Firestore Cloud Rankings with Zero-Crash Local Highscore Fallback
 */

import { firebaseService } from './FirebaseService.js';
import { storageManager } from './StorageManager.js';

class LeaderboardService {
  constructor() {
    this.cachedList = null;
    this.lastFetchTime = 0;
  }

  /**
   * Generates a realistic local fallback leaderboard based on local progress and benchmark logs.
   */
  getLocalLeaderboard() {
    const pilot = storageManager.getCurrentPilot();
    const progress = storageManager.getCampaignProgress();
    const endless = storageManager.getEndlessProgress();

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const playerLevel = Math.max(progress.unlockedSector || 1, endless.bestFloor || 1);
    const playerName = pilot && pilot.callsign ? pilot.callsign : 'GAST_PILOT';

    const defaultEntries = [
      { callsign: 'APEX_DRONE', highestLevel: 10, endlessHighscore: 24, date: '12.08.2026' },
      { callsign: 'ECHO_GHOST', highestLevel: 9, endlessHighscore: 19, date: '14.08.2026' },
      { callsign: 'PHANTOM_01', highestLevel: 8, endlessHighscore: 15, date: '10.08.2026' },
      { callsign: 'SHADOW_RUN', highestLevel: 7, endlessHighscore: 12, date: '11.08.2026' },
      { callsign: 'CYBER_VIPER', highestLevel: 6, endlessHighscore: 10, date: '13.08.2026' },
      { callsign: 'SONAR_PULSE', highestLevel: 5, endlessHighscore: 8, date: '09.08.2026' },
      { callsign: 'NOVA_CORE', highestLevel: 4, endlessHighscore: 6, date: '15.08.2026' },
      { callsign: 'VECTOR_7', highestLevel: 3, endlessHighscore: 4, date: '08.08.2026' },
      { callsign: 'ZERO_TRACE', highestLevel: 2, endlessHighscore: 3, date: '07.08.2026' }
    ];

    // Insert current player's stats
    const all = [
      ...defaultEntries,
      {
        callsign: playerName,
        highestLevel: playerLevel,
        endlessHighscore: endless.bestFloor || 1,
        date: dateStr,
        isCurrentPlayer: true
      }
    ];

    // Sort descending by highestLevel then endlessHighscore
    all.sort((a, b) => {
      if (b.highestLevel !== a.highestLevel) {
        return b.highestLevel - a.highestLevel;
      }
      return b.endlessHighscore - a.endlessHighscore;
    });

    // Top 10 with rank
    return all.slice(0, 10).map((entry, idx) => ({
      rank: idx + 1,
      callsign: entry.callsign,
      highestLevel: entry.highestLevel >= 10 ? 'SEKTOR 10 [MAX]' : `SEKTOR 0${entry.highestLevel}`,
      endlessHighscore: `ETAGE ${entry.endlessHighscore || 1}`,
      date: entry.date,
      isCurrentPlayer: !!entry.isCurrentPlayer
    }));
  }

  /**
   * Fetch Top 10 Leaderboard (Firestore Cloud or Local Fallback).
   */
  async getLeaderboard(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cachedList && now - this.lastFetchTime < 15000) {
      return this.cachedList;
    }

    const cloudData = await firebaseService.fetchTopPilots(10);
    const pilot = storageManager.getCurrentPilot();
    const currentCallsign = pilot ? pilot.callsign : 'GAST';

    if (cloudData && cloudData.length > 0) {
      const formatted = cloudData.map((d, idx) => ({
        rank: idx + 1,
        callsign: d.callsign,
        highestLevel: d.highestLevel >= 10 ? 'SEKTOR 10 [MAX]' : `SEKTOR 0${d.highestLevel}`,
        endlessHighscore: `ETAGE ${d.endlessHighscore || 1}`,
        date: d.date,
        isCurrentPlayer: d.callsign.toUpperCase() === currentCallsign.toUpperCase()
      }));

      this.cachedList = {
        source: 'FIRESTORE_LIVE',
        isCloud: true,
        entries: formatted
      };
      this.lastFetchTime = now;
      return this.cachedList;
    }

    // Fallback if cloud has no entries or Firebase is not connected
    const localEntries = this.getLocalLeaderboard();
    this.cachedList = {
      source: firebaseService.isConfigured() ? 'OFFLINE_FALLBACK' : 'LOCAL_STORAGE',
      isCloud: false,
      entries: localEntries
    };
    this.lastFetchTime = now;
    return this.cachedList;
  }
}

export const leaderboardService = new LeaderboardService();
