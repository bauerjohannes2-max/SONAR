# SONAR Architecture Map
Stack: Vanilla ES Modules, Canvas 2D, Web Audio API, Zero Dependencies. Entry: `src/main.js`.
Grid: 25x18 (32px tiles). Screen: 800x576px.

## Module Index
- `src/config.js`: Constants, colors, speeds, audio settings, storage keys.
- `src/main.js`: Loop (RAF), State Machine (MENU, PLAYING, TUTORIAL, ENDLESS, etc.).
- `src/engine/AudioEngine.js`: Procedural synth (Drone, Ping, Steps, Alarms, UI sounds).
- `src/engine/WaveSystem.js`: Wavefront calculations, tile visibility & phosphor decay.
- `src/engine/CanvasRenderer.js`: Vector rendering, wall outlines, phosphor glow, UI overlays.
- `src/engine/InputHandler.js`: Unified Keyboard/Mouse inputs.
- `src/engine/TouchControls.js`: Virtual D-Pad & Action Buttons overlay.
- `src/engine/DisplayManager.js`: Fullscreen & dynamic coordinate projection.
- `src/engine/ParticleEngine.js`: Screen shake, sparks, chase vignette.
- `src/world/GridMap.js`: Tile collisions (1=wall) & BFS pathfinding.
- `src/world/levels.js`: 10 Handcrafted 25x18 sector maps.
- `src/world/EndlessMode.js`: Procedural braided DFS maze generator.
- `src/entities/Player.js`: Drone logic, sneak mode, decoy throw, ping cooldown.
- `src/entities/Hunter.js`: Red predator AI (PATROL, ALERT, CHASE, SEARCH).
- `src/entities/Stalker.js`: Purple silent predator (stunned by Sonar Ping).
- `src/entities/Resonator.js`: Yellow alarm beacon (triggers on wave contact).
- `src/entities/Decoy.js`: Acoustic flare entity (distracts hunters).
- `src/entities/Pickups.js`: Crystals & Airlock extraction gate.
- `src/ui/HUD.js`: Tactical top HUD & Rank cards.
- `src/ui/MenuSystem.js`: Terminal main menu & 10-Sector selection grid.
- `src/ui/Settings.js`: Settings modal & localStorage sync.
- `src/ui/TouchLayoutEditor.js`: Drag-and-drop touch layout repositioning & element scaling overlay.
- `src/ui/TutorialModal.js`: 7-Card procedural canvas tutorial with touch debounce.
- `src/ui/OnboardingModal.js`: First-time player welcome modal with tutorial briefing.
- `src/ui/StoryIntro.js`: 3-Line Terminal Boot Log ("Operation Zero-Light" Narrative Intro).
- `src/ui/ProfileModal.js`: Pilot Profile (Callsign + 4-digit PIN) authentication modal.
- `src/ui/LeaderboardModal.js`: Top 10 Global Firestore / fallback leaderboard overlay.
- `src/services/FirebaseService.js`: Zero-build Firestore ESM CDN integration & PIN hashing.
- `src/services/StorageManager.js`: Unified local progress and cloud sync manager.
- `src/services/LeaderboardService.js`: Global ranking query and offline fallback provider.
- `MARKETING_STRATEGY.md`: High-CTR video hook & viral launch strategy.

## Architecture Guardrails & Learned Invariants
1. **Data Integrity & Constructors**:
   - Every grid- or level-based class (e.g. `GridMap`) MUST accept level data arrays directly in its constructor (`new GridMap(map)`) and maintain getter/setter aliases (`this.grid` / `this.tiles`) to prevent silent 0-fallback bugs.
2. **Phosphor & Zero-Light Rendering Standard**:
   - In zero-light / sonar stealth scenes, solid objects (walls) must ALWAYS maintain a subtle permanent baseline contour (`rgba(0, 240, 255, 0.05)`, 1px stroke) in the dark (`vis <= 0.05`) so players retain spatial orientation.
   - Illuminated walls (`vis > 0.05`) render with `rgba(18, 26, 38, vis * 0.95)` fill, `#00F0FF` (1.5px) stroke, and `shadowBlur: 6 * vis`.
3. **Crisp Canvas Typography & Modern Glassmorphism**:
   - Canvas text: `shadowBlur` strictly <= 2px or disabled to prevent blurry monospace typography.
   - UI frames: `rgba(6, 12, 22, 0.78)` background with `backdrop-filter: blur(14px)` and 1px cyan glow border (`rgba(0, 240, 255, 0.35)`).
   - Scanline CRT overlays: opacity capped at <= 0.12.
   - Canvas CSS: always enforce `image-rendering: pixelated; image-rendering: crisp-edges;`.
4. **Token-Optimized Onboarding**:
   - At the start of a session, read ONLY `PROJECT_MAP.md` and target specifically modified files without blind workspace scans.
5. **Integrated Canvas UI & Touch State Isolation**:
   - All HUD & Quick-Actions (`[ ⛶ ]`, `[ ⚙ ]`) are contained inside `.canvas-container`.
   - Touch Controls bar `#touch-controls` is positioned cleanly *below* the canvas (`.touch-controls-bar`), active only during `PLAYING`/`ENDLESS` states, and strictly hidden (`display: none`) in `MENU`, `SECTOR_SELECT`, and modals.
   - Virtual Joystick & D-Pad with seamless sliding, quadrant angle resolution, multi-touch isolation and custom Drag & Drop layout editor.
6. **Stealth Mode & Zero Sound Waves**:
   - Sneak mode (Shift or Touch toggle) halves drone movement speed and completely suppresses footstep waves and sound events.
7. **PWA Offline Caching & Mobile Haptics**:
   - `sw.js` caches all game assets using Cache-First strategy with background revalidation for instant offline play.
   - Mobile haptic pulses are dispatched via `AudioEngine.triggerHaptic()` (Ping: 15ms, Crystal Pickup: [30, 40, 30], Collision/Death: 120ms).
8. **Unified In-Game Navigation & Frameless Edge-to-Edge Display**:
   - The settings gear `⚙` dynamically opens `PAUSE // SYSTEM-EINSTELLUNGEN` with `▶ WEITERSPIELEN` and `⎋ HAUPTMENÜ` in-game, and returns to `MENU` while stopping ambient sound.
   - Container styles enforce clean vertical layout (`#game-wrapper` with responsive scaling for canvas + bottom controls).
   - Instant silent fullscreen and Web Audio unlock on very first touch/click.

## Backlog / Erledigt
- [x] **Milestone 1: Storyline & Lore-Integration ("Operation Zero-Light")**: Drohne `ECHO-7`, Station `TETHYS-6`, `RESONANZ-DATENKERNE`, Raubdrohnen (`HUNTER`, `STALKER`), Missions-Untertitel für alle 10 Sektoren & 3-zeiliges Terminal-Bootlog.
- [x] **Milestone 1: Marketing-Strategie & High-CTR App-Icon**: `MARKETING_STRATEGY.md`, Icons `icon-192.png` & `icon-512.png`.
- [x] **Milestone 1: Modern Cyber-Glassmorphism UI & HUD-Polish**: In-Game HUD mit pulsierenden Datenkernen `◆ DATENKERNE`, Sonar-Frequenzbalken `PULSE READY`, wellen-reaktiver Echo-Staub im Spielfeld.
- [x] **Milestone 1: Instant-App Launch (Vollbild ohne Klick)**: Standalone PWA, randloses iOS Safari (`viewport-fit=cover`), geräuschloses Fullscreen-Triggering beim ersten Touch.
- [x] **Schleichen-Funktion (Sneak Mode) repariert**: Touch-Toggle & Shift synchronisiert, 50% Speed & 0 Schallwellen.
- [x] **Touch-Controls unterhalb der Map positioniert**: Spielfeld bleibt 100% frei von Fingern.
- [x] **D-Pad Präzision & Sliding**: Nahtlose Trefferzonen, kontinuierliches Daumen-Sliding & Multi-Touch-Schutz.
- [x] **Tutorial Textumbruch & Ghost-Click Fix**: Dynamisches `wrapText` und 350ms Timestamp-Lock gegen Ghost-Clicks.
- [x] **Game Over nach Wandcrash & 1.5s Death-Reveal**: Rote Schockwelle deckt fatale Wände/Feinde auf, bevor Game Over aktiv wird.
- [x] **Anpassbares Touch-Layout & Virtueller Joystick**: Drag & Drop Layout-Editor, D-Pad/Joystick-Umschaltung, Skalierung & Version-Checker.
- [x] **Leaderboard: Nur geschaffte Sektoren werten**: `maxClearedSector` statt `unlockedSector` (z.B. 0 / 10 vor Abschluss).
- [x] **Game-Over-Screen & Neustart-Bug behoben**: Exakte Klick-Hitboxen (y: 215..265) & sofortiger Neustart via R/Enter/Space/Klick.
- [x] **Automatischer Update-Check beim Start**: Revalidiert Service Worker & zeigt Banner bei neuer Version (v1.4.0).
- [x] **Tutorial-Karte 7 Köder-Rework**: Exakt 3 Blöcke Wurfweite, präziser Taktik-Text & Munitionsanzeige (HUD: 1/1).
- [x] **Milestone [v1.7.0]: Dynamic Heartbeat Audio & Mobile Touch UX**: Prozeduraler Muffled Sub-Bass Pulse (52–160 BPM) bei Feindnähe, Mobile-Haptik und vollständiges Touch-Scrolling für Modals.
- [x] **Milestone [v1.8.0]: Hydrodynamic Wake Trail & Acoustic Wall Sparks**: Partikelschweif bei Drohnenschub (100% Unterdrückung im Schleichgang) und Funkenreflexion beim Auftreffen von Schallwellen auf Wände.

## WORKFLOW & VERSIONING RULES (Binding SemVer Standard)
- **Eiserne Direktive:** Kein Commit und kein Zyklus ohne sinnvolle, dynamische Versionserhöhung nach Semantic Versioning (**SemVer**):
  - **PATCH-Bump (`1.4.x` → `1.4.y`):** Bei Bugfixes, UI-Polish, CSS-Tweaks, Textanpassungen oder isolierten Touch-Korrekturen.
  - **MINOR-Bump (`1.x.0` → `1.(x+1).0`):** Bei neuen Features (z. B. neues Audio-System, Gauntlet-Modus, Customizer, Tileset-Shader).
  - **MAJOR-Bump (`x.0.0` → `(x+1).0.0`):** Bei vollständigem Rework oder Versionssprüngen.
- **Konsistente 6-Punkte-Synchronisation bei JEDEM Zyklus:**
  1. `version.json`: `{"version": "X.Y.Z", "build": YYYYMMDD_HHMM}`
  2. `package.json`: `"version": "X.Y.Z"`
  3. `src/config.js`: `VERSION: 'X.Y.Z'`, `BUILD: 'YYYYMMDD_HHMM'`
  4. `sw.js`: Cache-Name aktualisieren (`sonar-cache-vX.Y.Z`) und alte Caches im `activate`-Event aufräumen.
  5. `index.html` & `manifest.json`: Asset-Query-Strings anpassen (`?v=X.Y.Z`).
  6. Im In-Game-Menü (unten rechts & Subtitle) und in den Einstellungen die neue Version live anzeigen.
- **5-Stufen Pareto-Gauntlet Workflow:**
  - **Stufe A:** 80/20-Prüfung (High Impact, fertige/leichte Lösung, keine Regression).
  - **Stufe B:** Lean Implementation (`src/engine/`, `src/ui/`, `src/audio/`, `src/world/`, `src/entities/`).
  - **Stufe C:** Playwright E2E Test-Gauntlet (`node ./node_modules/@playwright/test/cli.js test`).
  - **Stufe D:** SemVer Version-Upgrade, `IMPROVEMENTS.md` Checkpoint, Git Commit & Push to GitHub.
  - **Stufe E:** Autonomer Übergang zum nächsten Zyklus.

## 🚀 Deployment & GitHub Sync Workflow
- Repository: https://github.com/bauerjohannes2-max/SONAR.git
- Branch: main
- Live-URL (GitHub Pages): https://bauerjohannes2-max.github.io/SONAR/
- Credential Helper: Windows Credential Manager (credential.helper = manager)
- Standard-Workflow für zukünftige Agenten-Updates:
  1. Änderungen lokal testen & verifizieren via E2E Test-Suite.
  2. `git add .`
  3. `git commit -m "Gauntlet Cycle [vX.Y.Z]: <Aussagekräftige Nachricht>"`
  4. `git push origin main` (oder `npm run push`)
- Live-Aktualisierung: GitHub Pages baut das Projekt nach jedem Push innerhalb von 30–60 Sekunden automatisch neu.






