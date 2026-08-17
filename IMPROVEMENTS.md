# SONAR: Continuous Improvements & Pareto-Gauntlet Roadmap

> **System-Status:** Autonomer Continuous Pareto-Gauntlet-Loop aktiv  
> **Aktuelle Version:** `v1.10.0` (Build 20260817)  
> **Zielsetzung:** Maximierung von Immersion, akustischem Thrill, visueller Brillanz und langfristiger Spieler-Retention durch das 80/20-Prinzip (80% Hebelwirkung bei 20% Umsetzungsaufwand).

---

## 📐 Verbindliches SemVer-Regelwerk & 6-Punkte Synchronisation

Jeder Meilenstein und jeder Zyklus erfordert ein zwingendes Semantic Versioning (**SemVer**):
- **PATCH-Bump (`1.x.y` → `1.x.(y+1)`):** Bugfixes, UI-Polish, CSS-Tweaks, isolierte Touch-Korrekturen.
- **MINOR-Bump (`1.x.0` → `1.(x+1).0`):** Neue Features (z. B. 3-Sterne-System, Leaderboard-Rivalen, Touch-Live-Vorschau).
- **MAJOR-Bump (`x.0.0` → `(x+1).0.0`):** Umfassendes Architektur-Rework oder bahnbrechende Versionssprünge.

**Verbindliche 6-Punkte-Synchronisation pro Zyklus:**
1. `version.json`: `{"version": "X.Y.Z", "build": YYYYMMDD_HHMM}`
2. `package.json`: `"version": "X.Y.Z"`
3. `src/config.js`: `VERSION: 'X.Y.Z'`, `BUILD: 'YYYYMMDD_HHMM'`
4. `sw.js`: Cache-Name aktualisieren (`sonar-cache-vX.Y.Z`) & alte Caches bereinigen
5. `index.html` & `manifest.json`: Asset-Query-Strings anpassen (`?v=X.Y.Z`)
6. `test/e2e.spec.js`: Playwright E2E-Tests synchronisieren & validieren

---

## 🏆 Abgeschlossene Gauntlet-Zyklen (Milestones)

### ✅ Zyklus 8 [v1.10.0]: Holistic UI/UX & Gameplay Overhaul (Major Release)
- **Domäne 1 (UI/UX & Menü-Fokus):**
  - **Kampagnen-Fokus:** Endless Mode aus dem Hauptmenü entfernt; 100% Konzentration auf die Kampagnen-Sektoren 01–10.
  - **Hero-CTA-Layout:** Großes Kampagnen-Element mit pulsierendem Cyan-Glow oben; darunter 3 gleichmäßige Kacheln (`[ 🏆 BESTENLISTE ]`, `[ 👤 PILOTEN-PROFIL ]`, `[ ⚙️ EINSTELLUNGEN ]`).
  - **Glassmorphism-Statusbar:** Schlanke Piloten-Leiste oben ohne überladene Symbole.
- **Domäne 2 (Touch-Skalierung & Live-Vorschau):**
  - **Skalierungs-Fix:** Skalierung (80%–150%) transformiert Bedienelemente sofort und sauber am Viewport-Rand.
  - **Interaktive Live-Vorschau:** Mini-Screen in den Einstellungen passt sich bei Skalierungs- & Modus-Änderung in Echtzeit an.
- **Domäne 3 (Progression & 3-Sterne-System):**
  - Klares 3-Sterne-System (Bergung, Tempo <= 45s, Ghost-Meisterschaft <= 3 Pings) ohne doppelte Ränge.
  - Sektorauswahl-Übersicht & Victory-Screen zeigen leuchtende Sterne `⭐⭐⭐` mit Kriterien-Checkliste.
- **Domäne 4 (Social & Rivalen-Bestenliste):**
  - Tabs `[ 🌍 WELTWEIT ]` und `[ 👥 RIVALEN / FREUNDE ]` mit Suchfeld und Favoriten-Stern (`⭐`).
  - **1v1 Direktvergleich-Modal:** Zeigt Sektor-für-Sektor Vergleich (Sterne, Zeit & Duell-Sieger).
- **Domäne 5 (Lore & Kindgerechtes Tutorial):**
  - Umbenennung in **Station ABYSS**.
  - Standardisierter 3-Punkte-Kartenaufbau: `WAS IST DAS?` / `WIE REAGIERST DU?` / `PROFI-TIPP`.
- **Domäne 6 (Audio & Soundscape Rebalance):**
  - Standard-SFX-Lautstärken um 35% gesenkt für ein angenehmes, ermüdungsfreies Klangbild.
  - Tiefsee-Ambientflächen und dynamischer Herzschlag-Sub-Bass bei Feindnähe.
- **E2E Test-Gauntlet:** 24/24 Tests erfolgreich bestanden.

### ✅ Zyklus 7 [v1.9.4]: Tactile Haptic Touch Engine & Immediate Editor Layout Reset
- **Domäne 4 (Mobile UX & Controls):**
  - Taktile Haptik auf D-Pad, Ping, Köder-Wurf und Schleichen via `triggerHaptic`.
  - Sofort-Reset im Touch-Editor auf 100% Standard-Layout.

### ✅ Zyklus 6 [v1.9.3]: Crystal Acoustic Wave Resonance & Sparkle Chime Echo
- **Domäne 2 (Audio) & Domäne 3 (Core Gameloop):**
  - Akustisches Kristall-Resonanz-Echo (`playCrystalResonance`) und smaragdgrüne Glitzerpartikel bei Wellenberührung.

### ✅ Zyklus 5 [v1.9.2]: Stalker Electromagnetic Distortion & VHS HUD Glitch
- **Domäne 1 (Visuelles Feedback) & Domäne 2 (Audio):**
  - Stalker-Distortion mit VHS-Scanline-Jitter, RGB-Split und prozeduralem Knistern.

---

## 🎯 Top 5 Priorisierte Pareto-Maßnahmen (Nächste Zyklen)

### 1. Ghost-Echo Replay-Projektion für Rekord-Läufe (Holographic Shadow Drone)
- **Domäne:** 5 (Progression & Speedrunning) & 3 (Core Gameloop)
- **80/20 Hebel:** Zeichnet die beste persönliche Zeit für jeden Sektor auf und visualisiert sie als transparente Geister-Drohne (Ghost ECHO) für Speedrunner.
- **Module:** `src/services/StorageManager.js`, `src/entities/Player.js`, `src/engine/CanvasRenderer.js`.

### 2. Schockwellen-Verzerrungs-Shader auf Canvas (Radial Displacement Ring)
- **Domäne:** 1 (Visuelles Feedback & Game-Juice)
- **80/20 Hebel:** Wellenfronten verzerren die umgebenden Kacheln minimal radial für spürbare akustische Wucht.
- **Module:** `src/engine/WaveSystem.js`, `src/engine/CanvasRenderer.js`.

### 3. Sektor-Spezifische Gefahren (Druckwellen-Lüfter & EMP-Minen)
- **Domäne:** 3 (Leveldesign & Hindernisse)
- **80/20 Hebel:** Ergänzung einzelner Sektoren mit statischen Strömungsdüsen oder akustischen Störsendern für taktische Vielfalt.
- **Module:** `src/world/levels.js`, `src/engine/CanvasRenderer.js`.

### 4. Dynamische Farbpaletten-Themes (Amber CRT, Phosphor Green, Cyber Cyan)
- **Domäne:** 1 (Aesthetics & Accessibility)
- **80/20 Hebel:** Umschaltbare Farbprofile in den Einstellungen für individuelle visuelle Vorlieben und Barrierefreiheit.
- **Module:** `src/config.js`, `src/ui/Settings.js`.

### 5. Cloud-Ghost Rivalen-Import (Duell gegen Freunde-Geister)
- **Domäne:** 4 (Social & Retention)
- **80/20 Hebel:** Lädt den Bestzeit-Geist des markierten Rivalen aus Firestore herunter und blendet ihn direkt als 1v1-Ghost ein.
- **Module:** `src/services/FirebaseService.js`, `src/ui/LeaderboardModal.js`.
