# SONAR: Continuous Improvements & Pareto-Gauntlet Roadmap

> **System-Status:** Autonomer Continuous Pareto-Gauntlet-Loop aktiv  
> **Aktuelle Version:** `v1.7.0` (Build 20260817)  
> **Zielsetzung:** Maximierung von Immersion, akustischem Thrill, visueller Brillanz und langfristiger Spieler-Retention durch das 80/20-Prinzip (80% Hebelwirkung bei 20% Umsetzungsaufwand).

---

## 📐 Verbindliches SemVer-Regelwerk & 6-Punkte Synchronisation

Jeder Zyklus und jeder Meilenstein erfordert ein zwingendes Semantic Versioning (**SemVer**):
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

### ✅ Zyklus 1 [v1.7.0]: Dynamic Heartbeat Audio, Mobile Touch UX & Escape Portal Beacon
- **Domäne 2 (Audio & Soundscape) & Domäne 1 (Game-Juice):**
  - Implementierung von `AudioEngine.updateHeartbeat(minDist, isChasing, dt)` mit adaptivem Muffled Sub-Bass Pulse (Lub-Dub, 48 Hz → 22 Hz).
  - Dynamische BPM-Modulation von 52 BPM (Distanz < 220px) bis zu 160 BPM bei aktiver Jäger-Verfolgung (`CHASE`).
  - Taktile Mobile-Haptik-Synchronisation (`triggerHaptic('heartbeat')`).
- **Domäne 4 (Mobile UX & Controls):**
  - Vollständiges Touch-Scrolling für Modals & Einstellungsdialog (`touch-action: pan-y`, `-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain`).
- **Domäne 3 (Core Gameloop):**
  - Escape Portal Beacon-Wellen & HUD-Wayfinder-Navigation bei vollständiger Kristallbergung.
- **E2E Test-Gauntlet:** 11/11 Tests erfolgreich bestanden.

---

## 🎯 Top 5 Priorisierte Pareto-Maßnahmen (Nächste Zyklen)

### 1. Biolumineszenter Mikro-Partikelschweif für Drohne ECHO-7 (Hydrodynamic Wake Trail)
- **Domäne:** 1 (Visuelles Feedback & Game-Juice)
- **80/20 Hebel:** Zarter, hydrodynamischer Partikelschweif (cyanblaue Mikrobläschen mit Turbulenzvektor) hinter der Drohne bei Schub; verblasst zu 100% im Schleichgang (`SNEAK`). Gibt sofortiges Feedback für Stealth und geschmeidiges Tiefsee-Gleiten.
- **Module:** `src/engine/ParticleEngine.js`, `src/entities/Player.js`, `src/engine/CanvasRenderer.js`.

### 2. Sektor-Medaillensystem & 3-Sterne Stealth-Bewertung (Tactical Precision Rating)
- **Domäne:** 5 (Onboarding & Progression)
- **80/20 Hebel:** 3-Sterne-Wertung pro Sektor (★ Bergung, ★★ Max 1 Sonar-Ping, ★★★ Par-Zeit ohne Entdeckung). Zeigt goldene Medaillen-Sterne im Sektor-Auswahlmenü an und maximiert den Wiederspielwert.
- **Module:** `src/world/levels.js`, `src/services/StorageManager.js`, `src/ui/MenuSystem.js`, `src/main.js`.

### 3. Akustische Wand-Reflexions-Funken bei Sonar-Pings (Acoustic Splashes)
- **Domäne:** 1 (Visuelles Feedback) & 3 (Core Gameloop)
- **80/20 Hebel:** Treffen Sonar-Wellen auf Kacheln vom Typ `WALL`, entstehen kurze weiße Kanten-Flashes und 2–3 gerichtete Reflexions-Funken. Erleichtert die räumliche Orientierung im Labyrinth drastisch.
- **Module:** `src/engine/WaveSystem.js`, `src/engine/ParticleEngine.js`, `src/engine/CanvasRenderer.js`.

### 4. Sonar-Frequenz-Störung & Glitch-Effekt bei Stalker-Nähe (Electromagnetic Distortion)
- **Domäne:** 1 (Visuelles Feedback) & 2 (Audio & Soundscape)
- **80/20 Hebel:** Befindet sich die Schatten-Raubdrohne (`STALKER`) lautlos in der Nähe, flackert der Sonar-Frequenzbalken im HUD mit subtilem VHS-Glitch und erzeugt leises elektromagnetisches Knistern, bevor der Stalker zuschlägt.
- **Module:** `src/ui/HUD.js`, `src/engine/AudioEngine.js`, `src/entities/Stalker.js`.

### 5. Ghost-Echo Replay-Projektion für Rekord-Läufe (Holographic Shadow Drone)
- **Domäne:** 5 (Progression & Marketing) & 3 (Core Gameloop)
- **80/20 Hebel:** Zeichnet die beste persönliche Zeit für jeden Sektor auf und visualisiert sie als transparente Geister-Drohne (Ghost ECHO-7) für Speedrunner.
- **Module:** `src/services/StorageManager.js`, `src/entities/Player.js`, `src/engine/CanvasRenderer.js`.
