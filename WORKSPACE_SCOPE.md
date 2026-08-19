# MULTI-WORKSPACE SCOPE & DOMAIN ARCHITECTURE

This project uses a multi-worktree architecture with strict domain isolation across 4 workspaces:

## 1. UI & Responsive Layouts (`../sonar-ui` / `feature/ui-layout-cleanup`)
- **Files:** `src/ui/HUD.js`, `src/ui/MenuSystem.js`, `src/ui/LevelSelectModal.js`, `styles/main.css`, `index.html`
- **Scope:** Galaxy Z Fold HUD layout, K.I.S.S. main menu, streamlined death screen, button shortcut audit.

## 2. Audio & Soundtracks (`../sonar-audio` / `feature/audio-dual-engine`)
- **Files:** `src/audio/*`, `assets/audio/*`, `src/engine/AudioEngine.js`, `src/entities/Pickups.js`
- **Scope:** Dual-soundtrack engine, Web Audio decoding, 800ms GainNode crossfade, pentatonic chime scale.

## 3. Gameplay, Game-Juice & Haptics (`../sonar-gameplay` / `feature/gameplay-juice`)
- **Files:** `src/engine/TouchControls.js`, `src/engine/Haptics.js`, `src/engine/Particles.js`, `src/engine/Drone.js`, `src/engine/ParticleEngine.js`, `src/engine/PostProcessing.js`
- **Scope:** Mobile safe-area touch clusters, bubble thruster particles, tactile vibration, danger-vignette shader, instant restart.

## 4. Progression, Cloud & Leaderboard (`../sonar-progression` / `feature/progression-storage`)
- **Files:** `src/services/*`, `src/engine/Progression.js`, `src/config/levels.js`, `src/ui/LeaderboardModal.js`, `src/ui/ProfileModal.js`, `src/ui/HangarModal.js`
- **Scope:** Total star rating vs. upgrade currency separation, Firestore cloud sync, multi-user pilot isolation.
