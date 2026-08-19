/**
 * SONAR: The Echo Chamber
 * Firebase Firestore Service (Zero-Build ES-Module CDN)
 * Manages Pilot Authentication (Callsign + PIN), Cloud Saves & Global Leaderboard
 */

import { FIREBASE_CONFIG } from '../config.js';

// ES Module CDN URLs
const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
const FIREBASE_FIRESTORE_CDN = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.firestoreModule = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.status = 'UNINITIALIZED'; // 'UNINITIALIZED' | 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED'
  }

  /**
   * Check if user has entered real Firebase project keys.
   */
  isConfigured() {
    return !!(
      FIREBASE_CONFIG &&
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.projectId &&
      !FIREBASE_CONFIG.apiKey.includes('YOUR_') &&
      !FIREBASE_CONFIG.projectId.includes('YOUR_')
    );
  }

  /**
   * Dynamically import Firebase libraries and initialize Firestore instance.
   */
  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.isConfigured()) {
        this.status = 'UNCONFIGURED';
        console.log('[FirebaseService] Keine API-Keys in src/config.js hinterlegt. Gast- & Offline-Modus aktiv.');
        return false;
      }

      try {
        const { initializeApp } = await import(FIREBASE_APP_CDN);
        const firestore = await import(FIREBASE_FIRESTORE_CDN);

        this.app = initializeApp(FIREBASE_CONFIG);
        this.db = firestore.getFirestore(this.app);
        this.firestoreModule = firestore;
        this.isInitialized = true;
        this.status = 'ONLINE';
        console.log('[FirebaseService] Firestore erfolgreich initialisiert (SYS_ONLINE).');
        return true;
      } catch (err) {
        console.warn('[FirebaseService] Verbindung zu Firebase CDN / Firestore fehlgeschlagen:', err);
        this.status = 'OFFLINE';
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Hash Callsign + PIN with SHA-256 via Web Crypto API.
   */
  async hashPin(callsign, pin) {
    const cleanCallsign = callsign.trim().toUpperCase();
    const cleanPin = pin.trim();
    const salt = `sonar_salt_${cleanCallsign}_${cleanPin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sanitize and validate Callsign & PIN.
   */
  validateCredentials(callsign, pin) {
    const trimmedCallsign = (callsign || '').trim().toUpperCase();
    const trimmedPin = (pin || '').trim();

    if (!trimmedCallsign || trimmedCallsign.length < 3 || trimmedCallsign.length > 12) {
      return { valid: false, error: 'Callsign muss 3 bis 12 Zeichen lang sein.' };
    }

    if (!/^[A-Z0-9_-]+$/.test(trimmedCallsign)) {
      return { valid: false, error: 'Callsign darf nur Buchstaben, Zahlen, _ und - enthalten.' };
    }

    if (!/^\d{4}$/.test(trimmedPin)) {
      return { valid: false, error: 'PIN muss genau 4 Ziffern lang sein (z.B. 1234).' };
    }

    return { valid: true, callsign: trimmedCallsign, pin: trimmedPin };
  }

  /**
   * Login or Register a Pilot via Callsign + 4-digit PIN.
   */
  async loginOrRegister(callsignInput, pinInput) {
    const val = this.validateCredentials(callsignInput, pinInput);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    const { callsign, pin } = val;
    const pinHash = await this.hashPin(callsign, pin);

    const ready = await this.init();
    if (!ready || !this.db) {
      // Fallback: local session simulation when Firebase is offline / unconfigured
      const localKey = 'sonar_pilot_' + callsign.toUpperCase();
      let storedPilot = null;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) storedPilot = JSON.parse(raw);
      } catch (e) {}

      if (storedPilot) {
        if (storedPilot.pinHash && storedPilot.pinHash !== pinHash) {
          return { success: false, error: 'Falsche PIN für dieses Pilot-Callsign!' };
        }
        return {
          success: true,
          offline: true,
          isNew: false,
          data: {
            callsign: storedPilot.callsign || callsign,
            unlockedSector: storedPilot.unlockedSector || 1,
            maxClearedSector: storedPilot.maxClearedSector || 0,
            sectorStats: storedPilot.sectorStats || {},
            totalStars: storedPilot.totalStars || 0,
            endlessHighscore: storedPilot.endlessHighscore || 0,
            highestLevel: storedPilot.maxClearedSector || storedPilot.unlockedSector || 1,
            upgrades: storedPilot.upgrades || null
          },
          message: `Willkommen zurück, Pilot ${callsign}!`
        };
      }

      const newPilotData = {
        callsign,
        pinHash,
        unlockedSector: 1,
        maxClearedSector: 0,
        totalStars: 0,
        sectorStats: {},
        endlessHighscore: 0,
        highestLevel: 1,
        upgrades: { sonarBooster: 0, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 }
      };
      try {
        localStorage.setItem(localKey, JSON.stringify(newPilotData));
      } catch (e) {}

      return {
        success: true,
        offline: true,
        isNew: true,
        data: newPilotData,
        message: `Neues Pilot-Profil registriert: ${callsign}!`
      };
    }

    try {
      const { doc, getDoc, setDoc, serverTimestamp } = this.firestoreModule;
      const docRef = doc(this.db, 'pilots', callsign.toLowerCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        if (existingData.pinHash !== pinHash) {
          return { success: false, error: 'Falsche PIN für dieses Pilot-Callsign!' };
        }

        return {
          success: true,
          isNew: false,
          data: {
            callsign: existingData.callsign || callsign,
            unlockedSector: existingData.unlockedSector || 1,
            maxClearedSector: existingData.maxClearedSector !== undefined ? existingData.maxClearedSector : (existingData.unlockedSector > 1 ? existingData.unlockedSector - 1 : 0),
            sectorStats: existingData.sectorStats || {},
            totalStars: existingData.totalStars !== undefined ? existingData.totalStars : 0,
            endlessHighscore: existingData.endlessHighscore || 0,
            highestLevel: existingData.highestLevel || existingData.unlockedSector || 1,
            upgrades: existingData.upgrades || null
          },
          message: `Willkommen zurück, Pilot ${callsign}!`
        };
      } else {
        // Register new pilot document
        const newPilot = {
          callsign,
          pinHash,
          unlockedSector: 1,
          maxClearedSector: 0,
          totalStars: 0,
          sectorStats: {},
          endlessHighscore: 0,
          highestLevel: 1,
          upgrades: { sonarBooster: 0, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 },
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };

        await setDoc(docRef, newPilot);

        return {
          success: true,
          isNew: true,
          data: {
            callsign,
            unlockedSector: 1,
            maxClearedSector: 0,
            totalStars: 0,
            sectorStats: {},
            endlessHighscore: 0,
            highestLevel: 1,
            upgrades: { sonarBooster: 0, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 }
          },
          message: `Neues Pilot-Profil registriert: ${callsign}!`
        };
      }
    } catch (err) {
      console.warn('[FirebaseService] Firestore Login/Register Fehler:', err);
      // Graceful offline fallback if local pilot exists
      const localKey = 'sonar_pilot_' + callsign.toUpperCase();
      let storedPilot = null;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) storedPilot = JSON.parse(raw);
      } catch (e) {}

      if (storedPilot) {
        if (storedPilot.pinHash && storedPilot.pinHash !== pinHash) {
          return { success: false, error: 'Falsche PIN für dieses Pilot-Callsign!' };
        }
        return {
          success: true,
          offline: true,
          isNew: false,
          data: {
            callsign: storedPilot.callsign || callsign,
            unlockedSector: storedPilot.unlockedSector || 1,
            maxClearedSector: storedPilot.maxClearedSector || 0,
            sectorStats: storedPilot.sectorStats || {},
            totalStars: storedPilot.totalStars || 0,
            endlessHighscore: storedPilot.endlessHighscore || 0,
            highestLevel: storedPilot.maxClearedSector || storedPilot.unlockedSector || 1,
            upgrades: storedPilot.upgrades || null
          },
          message: `Offline-Modus: Lokales Profil für ${callsign} geladen (Server nicht erreichbar).`
        };
      }

      return { success: false, error: 'Cloud-Sync Verbindungsfehler: Bitte Internetverbindung prüfen.' };
    }
  }

  /**
   * Save / Sync Pilot Progress to Firestore with offline queueing.
   */
  async savePilotProgress(callsign, progressData) {
    if (!callsign || callsign === 'GAST') return false;

    const localKey = 'sonar_pilot_' + callsign.toUpperCase();
    try {
      const existing = localStorage.getItem(localKey);
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(localKey, JSON.stringify({ ...parsed, ...progressData, callsign }));
    } catch (e) {}

    const ready = await this.init();
    if (!ready || !this.db) {
      // Store pending sync payload
      try {
        localStorage.setItem('sonar_pending_sync_' + callsign.toUpperCase(), JSON.stringify(progressData));
      } catch (e) {}
      return true;
    }

    try {
      const { doc, setDoc, serverTimestamp } = this.firestoreModule;
      const docRef = doc(this.db, 'pilots', callsign.toLowerCase());

      const maxClearedSector = progressData.maxClearedSector !== undefined
        ? progressData.maxClearedSector
        : (progressData.unlockedSector > 1 ? progressData.unlockedSector - 1 : 0);

      const stats = progressData.sectorStats || {};
      let totalStars = 0;
      let totalTime = 0;
      for (let s = 1; s <= 10; s++) {
        const item = stats[s] || stats[String(s)] || stats[`0${s}`];
        if (item) {
          totalStars += item.stars || (item.rank === 'S' ? 3 : (item.rank === 'A' ? 2 : 1));
          if (item.time) totalTime += item.time;
        }
      }
      if (progressData.totalStars !== undefined && progressData.totalStars > totalStars) {
        totalStars = progressData.totalStars;
      }

      const payload = {
        callsign,
        unlockedSector: progressData.unlockedSector || 1,
        maxClearedSector: maxClearedSector,
        totalStars: totalStars,
        bestTime: totalTime,
        sectorStats: stats,
        endlessHighscore: progressData.endlessHighscore || 0,
        highestLevel: maxClearedSector,
        lastUpdated: serverTimestamp()
      };

      if (progressData.upgrades) {
        payload.upgrades = progressData.upgrades;
      }

      await setDoc(docRef, payload, { merge: true });
      try {
        localStorage.removeItem('sonar_pending_sync_' + callsign.toUpperCase());
      } catch (e) {}
      return true;
    } catch (err) {
      console.warn('[FirebaseService] Cloud-Save Fehler, speichere in Offline-Queue:', err);
      try {
        localStorage.setItem('sonar_pending_sync_' + callsign.toUpperCase(), JSON.stringify(progressData));
      } catch (e) {}
      return false;
    }
  }

  /**
   * Synchronize pending progress queued while offline.
   */
  async syncPendingProgress(callsign) {
    if (!callsign || callsign === 'GAST') return false;
    try {
      const raw = localStorage.getItem('sonar_pending_sync_' + callsign.toUpperCase());
      if (raw) {
        const pendingData = JSON.parse(raw);
        if (pendingData) {
          return await this.savePilotProgress(callsign, pendingData);
        }
      }
    } catch (e) {}
    return false;
  }

  /**
   * Fetch Top 10 Global Leaderboard entries.
   */
  async fetchTopPilots(limitCount = 10) {
    const ready = await this.init();
    if (!ready || !this.db) {
      return null; // Signals fallback to local leaderboard
    }

    try {
      const { collection, query, orderBy, limit, getDocs } = this.firestoreModule;
      const pilotsRef = collection(this.db, 'pilots');
      // Single-field order avoids requiring manual composite indexes in Firebase Console
      const q = query(pilotsRef, orderBy('highestLevel', 'desc'), limit(Math.max(limitCount, 25)));
      const querySnapshot = await getDocs(q);

      const rawList = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        let dateStr = 'JETZT';
        if (d.lastUpdated && typeof d.lastUpdated.toDate === 'function') {
          const dt = d.lastUpdated.toDate();
          dateStr = `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
        }
        const maxCleared = d.maxClearedSector !== undefined
          ? d.maxClearedSector
          : (d.highestLevel !== undefined ? (d.highestLevel >= 1 && d.highestLevel <= 10 && d.highestLevel === d.unlockedSector ? (d.highestLevel > 1 ? d.highestLevel - 1 : 0) : d.highestLevel) : (d.unlockedSector > 1 ? d.unlockedSector - 1 : 0));

        const stats = d.sectorStats || {};
        let tStars = d.totalStars !== undefined ? d.totalStars : 0;
        let tTime = d.bestTime !== undefined ? d.bestTime : 0;
        if (stats && Object.keys(stats).length > 0) {
          let calculatedStars = 0;
          let calculatedTime = 0;
          for (let s = 1; s <= 10; s++) {
            const item = stats[s] || stats[String(s)] || stats[`0${s}`];
            if (item) {
              calculatedStars += item.stars || (item.rank === 'S' ? 3 : (item.rank === 'A' ? 2 : 1));
              if (item.time) calculatedTime += item.time;
            }
          }
          if (calculatedStars > tStars) tStars = calculatedStars;
          if (calculatedTime > 0 && tTime === 0) tTime = calculatedTime;
        }

        rawList.push({
          callsign: d.callsign || docSnap.id.toUpperCase(),
          maxClearedSector: maxCleared,
          highestLevel: maxCleared,
          totalStars: tStars,
          bestTime: tTime,
          sectorStats: stats,
          endlessHighscore: d.endlessHighscore || 0,
          date: dateStr
        });
      });

      rawList.sort((a, b) => {
        if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
        if (b.maxClearedSector !== a.maxClearedSector) return b.maxClearedSector - a.maxClearedSector;
        return (a.bestTime || 9999) - (b.bestTime || 9999);
      });

      return rawList.slice(0, limitCount).map((item, idx) => ({
        rank: idx + 1,
        ...item
      }));
    } catch (err) {
      console.warn('[FirebaseService] Leaderboard Abruf-Fehler:', err);
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();
