# SONAR: Continuous Improvements & Pareto-Gauntlet Roadmap

> **System-Status:** Autonomer Continuous Pareto-Gauntlet-Loop aktiv  
> **Aktuelle Version:** `v1.12.0` (Build 20260817)  
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

### ✅ Phase 2 [v1.12.0]: Metaprogression & Hangar-System (Sucht- & Grindfaktor)
- **Hangar-Modal (`HangarModal.js`):** Cyberpunk-Upgrade-Terminal im Hauptmenü (`[ 🚀 HANGAR ]`) mit visueller Sternen-Währung.
- **4 Permanente Drohnen-Upgrades:**
  - *📡 Sonar-Verstärker:* +10% / +20% / +30% Ping-Reichweite & Ausbreitungsgeschwindigkeit (Stufen 0/3).
  - *🎯 Zusatz-Köder:* Startet jeden Sektor mit 2 Täuschkörpern statt 1 (Stufe 0/1).
  - *🔇 Hydro-Dämpfer:* Dämpft normale Drohnengeräusche um 15% / 30% (Stufen 0/2).
  - *🛡️ Notfall-Schild:* Absorbiert 1x pro Sektor eine versehentliche Wandkollision mit Schutzschild-Funken und HUD-Statusanzeige.
- **Kostenloses Respec-System:** Beliebig oft alle Sterne via `[ ↺ ZURÜCKSETZEN ]` zu 100% zurückerstatten.
- **E2E Test-Gauntlet:** 27/27 Tests erfolgreich bestanden.

### ✅ Phase 1 [v1.11.0]: The 10 Quick-Wins (Instant Dopamine & Haptic Boost)
- **1. Kristall-Tonleiter:** Jeder gesammelte Kristall spielt den Chime in der pentatonischen Tonleiter höher ($C \to D \to E \to G \to A \to C5$).
- **2. Haptisches Feedback:** Feine Mobile-Vibration (`navigator.vibrate`) bei Pings, Kristallen, Gefahr und Kollisionen.
- **3. Danger-Vignette:** Pulsierender roter Rand & Radial-Glow bei Feindnähe (< 4 Blöcke / < 128px).
- **4. Thruster-Bläschen:** Feine hydrodynamische Wasserbläschen (`BUBBLE`) beim Bewegen der Drohne.
- **5. Instant-Quick-Restart:** Sofortiger Neustart bei Druck auf Taste <kbd>R</kbd> oder mobilem Doppel-Tap bei `DYING` / `GAME_OVER`.
- **6. Victory Slow-Motion:** 0.6s Zeitlupe + greller weiß-grüner Licht-Flash beim Betreten des Fluchtportals.
- **7. Ghost-Spur:** Zarter, nach 1.5s sanft verblassender Biolumineszenz-Pfad (`DRONE_GHOST`) hinter der Drohne.
- **8. Muffled-Audio:** Low-Pass-Biquad-Filter (420Hz) auf Musik/Sounds während des Schleich-Modus.
- **9. Level-Unlock Animation:** Aufspringendes Schloss `🔓` mit funkelndem Gold-Glow bei neu freigeschalteten Sektoren.
- **10. Todesursachen-Stempel:** Hochkontrastiger Militär-Warnstempel (`☠ STATUS: WAND-CRASH` vs. `☠ STATUS: DURCH JÄGER DESTABILISIERT`).
- **E2E Test-Gauntlet:** 26/26 Tests erfolgreich bestanden.

### ✅ Phase 0 [v1.10.2]: Touch-Editor Cancel & Reset Buttons, Session Rollback & 14px Dynamic Gap Scaling
- **Domäne 4 (Mobile UX & Touch Controls):**
  - **Vollwertiger `[ ✕ ABBRECHEN ]`-Button:** Verwirft alle im Editor vorgenommenen Änderungen und stellt die Ausgangskonfiguration (`initialConfig`) nahtlos wieder her.
  - **Vollwertiger `[ ↺ STANDARD ]`-Button:** Setzt sofort alle Positionen und Skalierungen auf Standard (100%) zurück und aktualisiert das Vorschau-Canvas.
  - **Kollisionsfreie Skalierung (125% & 150%):** Dynamischer Abstand `calc(14px * var(--touch-scale))` für Action-Buttons mit `transform-origin: bottom right` und Viewport-Edge-Clamping.
- **E2E Test-Gauntlet:** 25/25 Tests erfolgreich bestanden.

### ✅ Zyklus 9 [v1.10.1]: Collision-Free Touch Scaling (125%–150%), Dynamic Gaps & Viewport Clamping
- **Domäne 4 (Mobile UX & Touch Controls):**
  - **Dynamisches Gap-Scaling:** Abstände in `.touch-actions` und `.touch-actions-row` skalieren nun dynamisch via `calc(12px * var(--touch-scale, 1))`.
  - **Cluster-Transform & Transform-Origin:** `.touch-actions` wächst mit `transform-origin: bottom right` nach innen, D-Pad mit `bottom left` nach rechts – 0% Überlappung bei allen Skalierungen (100%, 125%, 150%).
  - **Echtzeit-Kollisionsvermeidung:** Im Drag & Drop Touch-Layout-Editor stoßen sich Bedienelemente bei Berührung ($< 12\text{px}$) automatisch sanft voneinander ab.
  - **Viewport-Edge-Clamping:** Bedienelemente halten bei jeder Skalierung stets mind. $12\text{px}$ Sicherheitsabstand zu Bildschirmrändern.
- **E2E Test-Gauntlet:** 25/25 Tests erfolgreich bestanden.

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
