# SONAR: Architecture & Context Index (Single Source of Truth)

> **Stack:** HTML5 Canvas 2D, Vanilla ES6+ JavaScript, Web Audio API, PWA ServiceWorker, Firebase Firestore.  
> **Directive:** Agenten lesen bei Chat-Start **ausschließlich** diese Datei (`PROJECT_MAP.md`) und `version.json`. Kein autonomes Durchforsten des gesamten Dateibaums ohne konkreten Anlass!

---

## 🗺️ Kompakte Datei-Matrix

| Pfad / Modul | Hauptverantwortung & Kernfunktionen |
| :--- | :--- |
| `src/main.js` | Game-Loop (`loop`, `update`, `render`), State-Machine (`MENU`, `PLAYING`, `DYING`, `SECTOR_CLEARED`, `GAME_OVER`), Auto-Update-Banner. |
| `src/config.js` | Alle Konstanten, Physik-Parameter, Hitboxen, Geschwindigkeiten, Cooldowns, Farben & Versionierung. |
| `src/engine/CanvasRenderer.js` | Rendering: Grid-Map, Wände, Drohne, Kristalle, Jäger, Lichtkegel & Sonar-Wellen. |
| `src/engine/WaveSystem.js` | Akustische Schallwellen-Ausbreitung (Normal/Sneak/Decoy), Tile-Reveals & Reflexionsfunken. |
| `src/engine/ParticleEngine.js` | Marine Snow, Hydrodynamic Wake-Trails, Crash-Funken & Screen-Shake. |
| `src/engine/AudioEngine.js` | Web Audio Buffers, Soundeffekte (Ping, Pickups, Crash, Ambient) & dynamischer Feind-Herzschlag. |
| `src/engine/Haptics.js` | Taktile Vibrationen (navigator.vibrate) für Pings, Feindkontakt, Herzschlag & Neustarts. |
| `src/engine/SpriteManager.js` | Preloading und Caching von CC0 Pixel-Art Sprites (Drohne, Hunter, Stalker, Kristalle). |
| `src/engine/InputHandler.js` | Tastatur-Steuerung (WASD/Pfeile/Space/R), Klick-Events, Doppel-Tap & Touch-Abstraktion. |
| `src/engine/TouchControls.js` | Mobile D-Pad, Aktions-Buttons (Ping, Sneak, Decoy, Menu) & Safe-Area Multi-Touch-Handling. |
| `src/engine/Particles.js` | Re-Export & Utility-Schnittstelle für Hydrodynamische Partikel & Bläschen. |
| `src/engine/DisplayManager.js` | Responsive Canvas-Skalierung, Aspect-Ratio & Safe-Area-Management. |
| `src/entities/Player.js` | Drohnen-Status (ECHO-7), Bewegung, Kollisionen, Schleichen, 3-Sterne-Rangberechnung. |
| `src/entities/Hunter.js` | Patrouillen- & Jagdlogik der Raubdrohnen (PATROL, ALERT, CHASE, SEARCH). |
| `src/entities/Stalker.js` | Lautlose Schatten-Drohne (Ambush-Verhalten, Wellen-Auslöschung). |
| `src/entities/Pickups.js` | Datenkerne/Kristalle, Köder (Decoys), Resonatoren & Leuchtbojen. |
| `src/world/levels.js` | 10 Kampagnen-Sektoren mit Grid-Maps, Kristall-Positionen & Hunter-Patrouillen. |
| `src/world/EndlessMode.js` | Prozedurale Roguelike-Generierung von unendlichen Labyrinth-Etagen. |
| `src/ui/HUD.js` | In-Game Overlay: Sonar-Frequenz, Dekompression, Kompass, Sector Cleared & Game Over Screens. |
| `src/ui/MenuSystem.js` | Hauptmenü, 10-Sektor-Auswahl mit Medaillen-Übersicht (`★ X / 30`) & Endless-Start. |
| `src/ui/Settings.js` | Einstellungs-Modal (Audio, D-Pad/Swipe, Touch-Positionen, Cache-Bust-Update). |
| `src/ui/ProfileModal.js` | Pilot-Login & Registrierung (Callsign + 4-stellige PIN) mit getrennten Daten-Slots. |
| `src/ui/LeaderboardModal.js` | Globale Firestore-Bestenliste für Kampagne & Endless-Modus. |
| `src/ui/TutorialModal.js` | 7 interaktive Onboarding-Karten mit taktischen Schritt-für-Schritt-Anweisungen. |
| `src/ui/TouchLayoutEditor.js` | Freier Drag & Drop Layout-Editor mit individueller Element-Skalierung ([ + ] / [ - ]). |
| `src/services/StorageManager.js` | Strikt isolierte Profile (`sonar_pilot_${CALLSIGN}`), Gast-Modus & LocalStorage-Sync. |
| `src/services/FirebaseService.js` | Firebase Firestore Anbindung für Profile & weltweite Highscores (mit Offline-Fallback). |
| `sw.js` | ServiceWorker für Offline-Fähigkeit, Cache-First Asset-Delivery & Update-Purging. |

---

## ⚙️ Verbindliche SemVer- & Release-Regel

1. **Versions-Upgrade bei JEDEM Release/Zyklus:**
   - **PATCH (`1.9.x`):** Bugfixes, UI-Polish, Refactoring, Optimierungen.
   - **MINOR (`1.x.0`):** Neue Features, Gameplay-Mechaniken, Audio-Systeme.
   - **MAJOR (`x.0.0`):** Fundamentales Architektur-Rework.
2. **6-Punkte Synchronisation:** `version.json`, `package.json`, `src/config.js`, `sw.js`, `index.html`, `test/e2e.spec.js`.
3. **Automatisierte Validierung:** Vor jedem Git-Push MÜSSEN alle Playwright-Tests (`npm test`) 100% grün sein.
