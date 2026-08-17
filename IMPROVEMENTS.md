# SONAR: Continuous Improvements & Pareto-Gauntlet Roadmap

> **System-Status:** Autonomer Continuous Pareto-Gauntlet-Loop aktiv  
> **Aktuelle Version:** `v1.8.0` (Build 20260817)  
> **Zielsetzung:** Maximierung von Immersion, akustischem Thrill, visueller Brillanz und langfristiger Spieler-Retention durch das 80/20-Prinzip (80% Hebelwirkung bei 20% Umsetzungsaufwand).

---

## 📐 Verbindliches SemVer-Regelwerk & 6-Punkte Synchronisation

Jeder Meilenstein und jeder Zyklus erfordert ein zwingendes Semantic Versioning (**SemVer**):
- **PATCH-Bump (`1.x.y` → `1.x.(y+1)`):** Bugfixes, UI-Polish, CSS-Tweaks, isolierte Touch-Korrekturen.
- **MINOR-Bump (`1.x.0` → `1.(x+1).0`):** Neue Features (z. B. dynamisches Herzschlag-Audiosystem, Hydrodynamic Trail, 3-Sterne-Medaillensystem).
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

### ✅ Zyklus 2 [v1.8.0]: Hydrodynamic Wake Trail & Acoustic Wall Reflection Sparks
- **Domäne 1 (Visuelles Feedback & Game-Juice):**
  - Neuer Partikeltyp `WAKE_TRAIL` mit additivem Blending (`lighter`), weichem Phosphor-Gleiten und Turbulenz-Drift.
  - 100%ige optische Unterdrückung im Schleichgang (`SNEAK`) für sofort spürbares Stealth-Feedback.
- **Domäne 3 (Core Gameloop & Wellenphysik):**
  - Implementierung von `WaveSystem.update(dt, gridMap, particleEngine)` mit Kantenreflexion: Beim Auftreffen von Schallwellen auf unbeleuchtete Wände (`TILES.WALL`) entstehen feine, weiße & cyanfarbene Funken (*Acoustic Reflection Sparks*).
- **E2E Test-Gauntlet:** 12/12 Tests erfolgreich bestanden.

### ✅ Zyklus 1 [v1.7.0]: Dynamic Heartbeat Audio, Mobile Touch UX & Escape Portal Beacon
- **Domäne 2 (Audio & Soundscape) & Domäne 1 (Game-Juice):**
  - Implementierung von `AudioEngine.updateHeartbeat(minDist, isChasing, dt)` mit adaptivem Muffled Sub-Bass Pulse (Lub-Dub, 48 Hz → 22 Hz).
  - Dynamische BPM-Modulation von 52 BPM (Distanz < 220px) bis zu 160 BPM bei aktiver Jäger-Verfolgung (`CHASE`).
  - Taktile Mobile-Haptik-Synchronisation (`triggerHaptic('heartbeat')`).
- **Domäne 4 (Mobile UX & Controls):**
  - Vollständiges Touch-Scrolling für Modals & Einstellungsdialog (`touch-action: pan-y`, `-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain`).
- **Domäne 3 (Core Gameloop):**
  - Escape Portal Beacon-Wellen & HUD-Wayfinder-Navigation bei vollständiger Kristallbergung.
- **E2E Test-Gauntlet:** 11/11 Tests bestanden.

---

## 🎯 Top 5 Priorisierte Pareto-Maßnahmen (Nächste Zyklen)

### 1. Sektor-Medaillensystem & 3-Sterne Stealth-Bewertung (Tactical Precision Rating)
- **Domäne:** 5 (Onboarding & Progression)
- **80/20 Hebel:** 3-Sterne-Wertung pro Sektor (★ Bergung, ★★ Max 1 Sonar-Ping, ★★★ Par-Zeit ohne Entdeckung). Zeigt goldene Medaillen-Sterne im Sektor-Auswahlmenü an und maximiert den Wiederspielwert.
- **Module:** `src/world/levels.js`, `src/services/StorageManager.js`, `src/ui/MenuSystem.js`, `src/main.js`.

### 2. Sonar-Frequenz-Störung & Glitch-Effekt bei Stalker-Nähe (Electromagnetic Distortion)
- **Domäne:** 1 (Visuelles Feedback) & 2 (Audio & Soundscape)
- **80/20 Hebel:** Befindet sich die Schatten-Raubdrohne (`STALKER`) lautlos in der Nähe, flackert der Sonar-Frequenzbalken im HUD mit subtilem VHS-Glitch und erzeugt leises elektromagnetisches Knistern, bevor der Stalker zuschlägt.
- **Module:** `src/ui/HUD.js`, `src/engine/AudioEngine.js`, `src/entities/Stalker.js`.

### 3. Kristall-Resonanz-Echo & Ambient Sparkle (Audio & Visual Resonance)
- **Domäne:** 2 (Audio & Soundscape) & 3 (Core Gameloop)
- **80/20 Hebel:** Noch ungesammelte Kristalle erzeugen bei Wellenberührung ein sanftes, melodisches Chime-Echo, wodurch erfahrene Spieler Kacheln im Labyrinth auditiv lokalisieren können.
- **Module:** `src/entities/Pickups.js`, `src/engine/AudioEngine.js`, `src/engine/CanvasRenderer.js`.

### 4. Freier Touch-Element-Reset & Haptischer Klick auf Buttons (Tactile Polish)
- **Domäne:** 4 (Mobile UX & Controls)
- **80/20 Hebel:** Taktile Haptik bei allen Touch-Buttons (D-Pad, Ping, Sneak, Decoy) via `navigator.vibrate(8)` und Sofort-Reset im Touch-Editor.
- **Module:** `src/engine/TouchControls.js`, `src/ui/TouchLayoutEditor.js`.

### 5. Ghost-Echo Replay-Projektion für Rekord-Läufe (Holographic Shadow Drone)
- **Domäne:** 5 (Progression & Marketing) & 3 (Core Gameloop)
- **80/20 Hebel:** Zeichnet die beste persönliche Zeit für jeden Sektor auf und visualisiert sie als transparente Geister-Drohne (Ghost ECHO-7) für Speedrunner.
- **Module:** `src/services/StorageManager.js`, `src/entities/Player.js`, `src/engine/CanvasRenderer.js`.
