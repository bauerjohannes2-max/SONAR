# WORKSPACE SCOPE: AUDIO & SOUNDTRACKS (Agent 2)

## 📌 Zuständigkeit & Branch
- **Branch:** `feature/audio-dual-engine`
- **Workspace Pfad:** `../sonar-audio`

---

## 🎯 Zuständige Dateien (Strikte Domain-Isolation)
- `src/audio/*`
- `assets/audio/*`
- `src/engine/AudioEngine.js`

---

## 📋 Aufgaben & Verantwortlichkeiten
1. **Dual-Soundtrack Routing:**
   - Menü-Soundtrack (`assets/audio/music_menu.mp3`): Ruhige, atmosphärische Tiefsee-Klangflächen.
   - Gameplay-Soundtrack (`assets/audio/music_gameplay.mp3`): Dynamischer Puls-Track für Stealth-Spannung.
2. **Web Audio Crossfade:** 800ms paralleler GainNode-Crossfade zwischen Menü und Gameplay.
3. **Chime-Tonleiter:** Aufsteigende Halbtöne / Pentatonik (C-D-E-G-A) bei Datenkern-Bergung.
4. **Hull Impact SFX:** Mehrschichtige Crash-Synthese mit Sub-Bass-Punch.

---

## 🧪 Validierungs-Befehl
```bash
node ./node_modules/@playwright/test/cli.js test
```
