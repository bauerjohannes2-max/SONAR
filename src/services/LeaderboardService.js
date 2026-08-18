/**
 * SONAR: The Echo Chamber
 * Global & Local Leaderboard Service (Campaign & 3-Star Focused)
 * Supports Worldwide Leaderboards, Rivals/Friends Filtering, and 1v1 Sector-by-Sector Comparisons
 */

import { firebaseService } from './FirebaseService.js';
import { storageManager } from './StorageManager.js';

export function formatTime(seconds) {
  if (seconds === undefined || seconds === null || seconds <= 0 || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

class LeaderboardService {
  constructor() {
    this.cachedList = null;
    this.lastFetchTime = 0;
  }

  formatClearedSector(clearedCount) {
    const num = Number(clearedCount) || 0;
    if (num <= 0) return '0 / 10 SEKTOREN';
    if (num >= 10) return '10 / 10 [MAX]';
    return `0${num} / 10 SEKTOREN`;
  }

  /**
   * Generates benchmark mock sector stats for AI/rival pilots
   */
  generateMockSectorStats(clearedCount, baseTimeMod = 1.0) {
    const stats = {};
    for (let s = 1; s <= clearedCount; s++) {
      const time = Math.max(12, (20 + (s * 4) * baseTimeMod) + (Math.sin(s * 1.7) * 4));
      const pings = Math.max(1, Math.min(5, Math.floor(s / 3) + 1));
      const stars = (time <= 45 && pings <= 3) ? 3 : (time <= 45 || pings <= 3 ? 2 : 1);
      stats[s] = {
        stars,
        time: parseFloat(time.toFixed(2)),
        pingsUsed: pings,
        rank: stars === 3 ? 'S' : (stars === 2 ? 'A' : 'B')
      };
    }
    return stats;
  }

  /**
   * Generates a rich local benchmark leaderboard
   */
  getLocalLeaderboard() {
    const pilot = storageManager.getCurrentPilot();
    const progress = storageManager.getCampaignProgress();

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const playerCleared = progress.maxClearedSector || (progress.unlockedSector > 1 ? progress.unlockedSector - 1 : 0);
    const playerName = pilot && pilot.callsign ? pilot.callsign : 'GAST_PILOT';
    const playerStats = progress.sectorStats || {};
    const playerStars = storageManager.calculateTotalStars(playerStats);

    let playerTotalTime = 0;
    for (let k in playerStats) {
      if (playerStats[k] && playerStats[k].time) playerTotalTime += playerStats[k].time;
    }

    const defaultEntries = [
      { callsign: 'APEX_DRONE', maxClearedSector: 10, totalStars: 30, bestTime: 184.2, date: '12.08.2026', speedMod: 0.7 },
      { callsign: 'ECHO_GHOST', maxClearedSector: 9, totalStars: 26, bestTime: 215.8, date: '14.08.2026', speedMod: 0.8 },
      { callsign: 'PHANTOM_01', maxClearedSector: 8, totalStars: 23, bestTime: 242.0, date: '10.08.2026', speedMod: 0.9 },
      { callsign: 'SHADOW_RUN', maxClearedSector: 7, totalStars: 20, bestTime: 278.4, date: '11.08.2026', speedMod: 1.0 },
      { callsign: 'CYBER_VIPER', maxClearedSector: 6, totalStars: 17, bestTime: 312.1, date: '13.08.2026', speedMod: 1.1 },
      { callsign: 'SONAR_PULSE', maxClearedSector: 5, totalStars: 14, bestTime: 350.5, date: '09.08.2026', speedMod: 1.2 },
      { callsign: 'NOVA_CORE', maxClearedSector: 4, totalStars: 11, bestTime: 388.0, date: '15.08.2026', speedMod: 1.3 },
      { callsign: 'VECTOR_7', maxClearedSector: 3, totalStars: 8, bestTime: 420.2, date: '08.08.2026', speedMod: 1.4 },
      { callsign: 'ZERO_TRACE', maxClearedSector: 2, totalStars: 5, bestTime: 460.9, date: '07.08.2026', speedMod: 1.5 }
    ];

    const all = [
      ...defaultEntries.map((e) => ({
        ...e,
        sectorStats: this.generateMockSectorStats(e.maxClearedSector, e.speedMod)
      })),
      {
        callsign: playerName,
        maxClearedSector: playerCleared,
        totalStars: playerStars,
        bestTime: parseFloat(playerTotalTime.toFixed(2)) || 0,
        date: dateStr,
        sectorStats: playerStats,
        isCurrentPlayer: true
      }
    ];

    // Sort descending by totalStars, then maxClearedSector, then ascending bestTime
    all.sort((a, b) => {
      if (b.totalStars !== a.totalStars) {
        return b.totalStars - a.totalStars;
      }
      if (b.maxClearedSector !== a.maxClearedSector) {
        return b.maxClearedSector - a.maxClearedSector;
      }
      return (a.bestTime || 9999) - (b.bestTime || 9999);
    });

    return all.map((entry, idx) => ({
      rank: idx + 1,
      callsign: entry.callsign,
      maxClearedSector: entry.maxClearedSector,
      highestLevel: this.formatClearedSector(entry.maxClearedSector),
      totalStars: entry.totalStars || 0,
      bestTime: formatTime(entry.bestTime),
      rawTime: entry.bestTime || 0,
      sectorStats: entry.sectorStats || {},
      date: entry.date,
      isCurrentPlayer: !!entry.isCurrentPlayer,
      isRival: storageManager.isRival(entry.callsign)
    }));
  }

  /**
   * Fetch Leaderboard (Firestore Cloud or Local Fallback).
   */
  async getLeaderboard(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cachedList && now - this.lastFetchTime < 15000) {
      return this.cachedList;
    }

    const cloudData = await firebaseService.fetchTopPilots(25);
    const pilot = storageManager.getCurrentPilot();
    const currentCallsign = pilot ? pilot.callsign : 'GAST';

    if (cloudData && cloudData.length > 0) {
      const formatted = cloudData.map((d, idx) => {
        const stats = d.sectorStats || {};
        let tStars = d.totalStars !== undefined ? d.totalStars : 0;
        let tTime = d.bestTime !== undefined ? d.bestTime : 0;

        if (tStars === 0 && stats) {
          for (let k in stats) {
            if (stats[k]) {
              tStars += stats[k].stars || (stats[k].rank === 'S' ? 3 : (stats[k].rank === 'A' ? 2 : 1));
              if (stats[k].time) tTime += stats[k].time;
            }
          }
        }

        return {
          rank: idx + 1,
          callsign: d.callsign,
          maxClearedSector: d.maxClearedSector || 0,
          highestLevel: this.formatClearedSector(d.maxClearedSector || 0),
          totalStars: tStars,
          bestTime: formatTime(tTime),
          rawTime: tTime,
          sectorStats: stats,
          date: d.date || 'ONLINE',
          isCurrentPlayer: d.callsign.toUpperCase() === currentCallsign.toUpperCase(),
          isRival: storageManager.isRival(d.callsign)
        };
      });

      // Ensure current player is always visible in leaderboard
      if (!formatted.some((e) => e.isCurrentPlayer)) {
        const localPlayer = this.getLocalLeaderboard().find((e) => e.isCurrentPlayer);
        if (localPlayer) {
          formatted.push(localPlayer);
        }
      }

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
