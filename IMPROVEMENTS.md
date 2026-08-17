# SONAR: Continuous Improvements & Pareto-Gauntlet Roadmap

> **System-Status:** Autonomer Continuous Pareto-Gauntlet-Loop aktiv  
> **Aktuelle Version:** `v1.9.3` (Build 20260817)  
> **Zielsetzung:** Maximierung von Immersion, akustischem Thrill, visueller Brillanz und langfristiger Spieler-Retention durch das 80/20-Prinzip (80% Hebelwirkung bei 20% Umsetzungsaufwand).

---

## 📐 Verbindliches SemVer-Regelwerk & 6-Punkte Synchronisation

Jeder Meilenstein und jeder Zyklus erfordert ein zwingendes Semantic Versioning (**SemVer**):
- **PATCH-Bump (`1.x.y` → `1.x.(y+1)`):** Bugfixes, UI-Polish, CSS-Tweaks, isolierte Touch-Korrekturen.
- **MINOR-Bump (`1.x.0` → `1.(x+1).0`):** Neue Features (z. B. 3-Sterne-Medaillensystem, dynamisches Herzschlag-Audiosystem, Hydrodynamic Trail).
- **MAJOR-Bump (`x.0.0` → `(x+1).0.0`):** Umfassendes Architektur-Rework oder bahnbrechende Versionssprünge.

**Verbindliche 6-Punkte-Synchronisation pro Zyklus:**
1. `version.json`: `{"version": "X.Y.Z", "build": YYYYMMDD_HHMM}`
2. `package.json`: `"version": "X.Y.Z"`
3. `src/config.js`: `VERSION: 'X.Y.Z'`, `BUILD: 'YYYYMMDD_HHMM'`
4. `sw.js`: Cache-Name aktualisieren (`sonar-cache-vX.Y.Z`) & alte Caches bereinigen
5. `index.html` & `manifest.json`: Asset-Query-Strings anpassen (`?v=X.Y.Z`)
6. In-Game HUD, Menü und Einstellungsmodal: Version dynamisch aus `CONFIG.VERSION` anzeigen

---

## 🏆 Abgeschlossene Gauntlet-Zyklen (Milestones)

### ✅ Zyklus 6 [v1.9.3]: Crystal Acoustic Wave Resonance & Sparkle Chime Echo
- **Domäne 2 (Audio & Soundscape) & Domäne 3 (Core Gameloop):**
  - **Akustisches Kristall-Resonanz-Echo:** Noch nicht geborgene Datenkerne (`Crystal`) beginnen harmonisch zu singen (`playCrystalResonance`), wenn sie von einer Schallwelle (Ping, Step, Beacon) getroffen werden (1046.5 Hz C6 Chime mit Oberton).
  - **Auditiver Echo-Standort-Scan:** Ermöglicht erfahrenen Piloten die akustische Ortung von Kristallen in noch unerforschten Labyrinthen ohne direkten Sichtkontakt.
  - **Kristall-Glitzerpartikel:** Spawnt funkelnde smaragdgrüne und weiße Mikropartikel (`spawnCrystalSparkle`) bei Resonanz.
- **E2E Test-Gauntlet:** 17/17 Tests erfolgreich bestanden.

### ✅ Zyklus 5 [v1.9.2]: Stalker Electromagnetic Distortion & VHS HUD Glitch
- **Domäne 1 (Visuelles Feedback) & Domäne 2 (Audio & Soundscape):**
  - **Elektromagnetische Störung bei Stalker-Nähe:** Befindet sich die Schatten-Drohne (`STALKER`) im Umkreis von 220px, flackert der Sonar-Frequenzbalken im HUD mit VHS-Scanline-Jitter und chromatischem RGB-Split.
  - **Prozedurales Knistern & Hiss:** Synthetisiert dynamische elektromagnetische Knister- und Entladungsgeräusche (`playStaticCrackle`) mit ansteigender Frequenz bei Annäherung.
  - **HUD Störungs-Warnung:** Dynamischer Text-Glitch (`⚡ STÖRUNG`) bei extrem naher Schatten-Drohne.
- **E2E Test-Gauntlet:** 16/16 Tests erfolgreich bestanden.

### ✅ Zyklus 4 [v1.9.0]: 3-Star Tactical Precision Rating & Sector Medal System
- **Domäne 5 (Onboarding, Progression & Gamification) & Domäne 3 (Core Gameloop):**
  - **3-Sterne-Bewertungssystem:**
    - ★ **Stern 1 (Bergung):** Sektor erfolgreich abgeschlossen.
    - ★★ **Stern 2 (Stealth-Disziplin):** Maximal 2 Sonar-Pings eingesetzt (`pingsUsed <= 2`).
    - ★★★ **Stern 3 (Apex-Pilot):** Sektor in Bestzeit unter 28s und maximal 3 Pings absolviert (`rank === 'S'`).
  - **Goldene Sterne im Sektor-Auswahlmenü:** Kacheln zeigen goldene Sterne `★ ★ ★` und Rangabzeichen an.
  - **Medaillen-Header:** Anzeige des Gesamtfortschritts `★ X / 30 STERNE GESAMMELT` im Sektor-Menü.
  - **Victory-Card Polish:** HUD `renderSectorCleared` präsentiert gold glühende Sterne über den Missionsstatistiken.
- **E2E Test-Gauntlet:** 15/15 Tests erfolgreich bestanden.

### ✅ Zyklus 3 [v1.8.1]: Strict Multi-User Profile Isolation & Update Engine Loop Fix
- **Domäne 5 (User Profiles) & Domäne 4 (UX):**
  - Strikte Spieler-Trennung (`sonar_pilot_${CALLSIGN}`) verhindert Level-Bleeding zwischen Profilen.
  - Neutraler Gast-Modus beim Abmelden (`sonar_guest_progress`).
  - Deep ServiceWorker Deregistrierung & harter Cache-Busting-Reload bei Updates.
- **E2E Test-Gauntlet:** 14/14 Tests bestanden.

### ✅ Zyklus 2 [v1.8.0]: Hydrodynamic Wake Trail & Acoustic Wall Reflection Sparks
- **Domäne 1 (Visuelles Feedback) & Domäne 3 (Wellenphysik):**
  - Partikeltyp `WAKE_TRAIL` mit 100% Stealth-Unterdrückung im Schleichgang (`SNEAK`).
  - Akustische Reflexionsfunken beim Auftreffen von Schallwellen auf Wände.
- **E2E Test-Gauntlet:** 12/12 Tests bestanden.

### ✅ Zyklus 1 [v1.7.0]: Dynamic Heartbeat Audio, Mobile Touch UX & Escape Portal Beacon
- **Domäne 2 (Audio) & Domäne 4 (Mobile UX):**
  - Prozeduraler Herzschlag-Sub-Bass (52–160 BPM) mit Mobile-Haptik bei Feindnähe.
  - Touch-Scrolling für Modals & Escape Portal Beacon-Wellen.
- **E2E Test-Gauntlet:** 11/11 Tests bestanden.

---

## 🎯 Top 5 Priorisierte Pareto-Maßnahmen (Nächste Zyklen)

### 1. Sonar-Frequenz-Störung & Glitch-Effekt bei Stalker-Nähe (Electromagnetic Distortion)
- **Domäne:** 1 (Visuelles Feedback) & 2 (Audio & Soundscape)
- **80/20 Hebel:** Befindet sich die Schatten-Raubdrohne (`STALKER`) lautlos in der Nähe, flackert der Sonar-Frequenzbalken im HUD mit subtilem VHS-Glitch und erzeugt leises elektromagnetisches Knistern.
- **Module:** `src/ui/HUD.js`, `src/engine/AudioEngine.js`, `src/entities/Stalker.js`.

### 2. Kristall-Resonanz-Echo & Ambient Sparkle (Audio & Visual Resonance)
- **Domäne:** 2 (Audio & Soundscape) & 3 (Core Gameloop)
- **80/20 Hebel:** Noch ungesammelte Kristalle erzeugen bei Wellenberührung ein sanftes, melodisches Chime-Echo, wodurch erfahrene Spieler Kacheln im Labyrinth auditiv lokalisieren können.
- **Module:** `src/entities/Pickups.js`, `src/engine/AudioEngine.js`, `src/engine/CanvasRenderer.js`.

### 3. Taktiler Klick auf Touch-Buttons & Sofort-Reset im Touch-Editor (Tactile Polish)
- **Domäne:** 4 (Mobile UX & Controls)
- **80/20 Hebel:** Taktile Haptik bei allen Touch-Buttons (D-Pad, Ping, Sneak, Decoy) via `navigator.vibrate(8)` und Sofort-Reset im Touch-Editor.
- **Module:** `src/engine/TouchControls.js`, `src/ui/TouchLayoutEditor.js`.

### 4. Ghost-Echo Replay-Projektion für Rekord-Läufe (Holographic Shadow Drone)
- **Domäne:** 5 (Progression & Marketing) & 3 (Core Gameloop)
- **80/20 Hebel:** Zeichnet die beste persönliche Zeit für jeden Sektor auf und visualisiert sie als transparente Geister-Drohne (Ghost ECHO-7) für Speedrunner.
- **Module:** `src/services/StorageManager.js`, `src/entities/Player.js`, `src/engine/CanvasRenderer.js`.

### 5. Schockwellen-Verzerrungs-Shader auf Canvas (Radial Displacement Ring)
- **Domäne:** 1 (Visuelles Feedback & Game-Juice)
- **80/20 Hebel:** Wellenfronten verzerren die umgebenden Kacheln minimal radial für spürbare akustische Wucht.
- **Module:** `src/engine/WaveSystem.js`, `src/engine/CanvasRenderer.js`.
