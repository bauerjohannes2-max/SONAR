/**
 * SONAR: The Echo Chamber
 * Main Game Loop, State Machine & Subsystem Orchestrator (Firebase & Cloud Sync Edition)
 */

import { CONFIG } from './config.js';
import { GridMap } from './world/GridMap.js';
import { LEVELS } from './world/levels.js';
import { EndlessMode } from './world/EndlessMode.js';
import { Player } from './entities/Player.js';
import { Hunter } from './entities/Hunter.js';
import { Stalker as ShadowStalker } from './entities/Stalker.js';
import { Crystal, Gate } from './entities/Pickups.js';
import { Resonator } from './entities/Resonator.js';
import { Lighthouse } from './entities/Lighthouse.js';
import { WaveSystem } from './engine/WaveSystem.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { CanvasRenderer } from './engine/CanvasRenderer.js';
import { InputHandler } from './engine/InputHandler.js';
import { ParticleEngine } from './engine/ParticleEngine.js';
import { TouchControls } from './engine/TouchControls.js';
import { DisplayManager } from './engine/DisplayManager.js';
import { HUD } from './ui/HUD.js';
import { MenuSystem } from './ui/MenuSystem.js';
import { Settings as SettingsModal } from './ui/Settings.js';
import { TutorialModal } from './ui/TutorialModal.js';
import { OnboardingModal } from './ui/OnboardingModal.js';
import { StoryIntro } from './ui/StoryIntro.js';
import { ProfileModal } from './ui/ProfileModal.js';
import { LeaderboardModal } from './ui/LeaderboardModal.js';
import { TouchLayoutEditor } from './ui/TouchLayoutEditor.js';
import { storageManager } from './services/StorageManager.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    // Subsystems
    this.audioEngine = new AudioEngine();
    this.particleEngine = new ParticleEngine(this.canvas);
    this.inputHandler = new InputHandler(this.canvas);
    this.waveSystem = new WaveSystem();
    this.renderer = new CanvasRenderer(this.canvas);
    this.touchControls = new TouchControls(this.audioEngine, this.inputHandler);
    this.inputHandler.setTouchControls(this.touchControls);
    this.displayManager = new DisplayManager(this.canvas);
    this.inputHandler.displayManager = this.displayManager;
    this.touchLayoutEditor = new TouchLayoutEditor(this.touchControls, this.audioEngine);

    // UI Modules
    this.hud = new HUD(this.canvas);
    this.menuSystem = new MenuSystem(this.audioEngine);
    this.storyIntro = new StoryIntro(this.audioEngine, () => {
      this.loadSector(0);
    });
    this.settingsModal = new SettingsModal(
      this.audioEngine,
      this.particleEngine,
      () => {
        this.menuSystem.resetAllProgress();
        this.endlessMode.reset();
      },
      () => {
        // onExitToMenu: Abort game, stop drone audio, return to menu
        if (this.audioEngine) this.audioEngine.stopAmbientDrone();
        this.isEndlessActive = false;
        this.gameState = CONFIG.STATES.MENU;
      },
      () => {
        // onResumeGame: Resume playing if paused
        if (this.gameState === CONFIG.STATES.PAUSED) {
          this.gameState = CONFIG.STATES.PLAYING;
        }
      },
      this.touchControls,
      () => {
        if (this.touchLayoutEditor) this.touchLayoutEditor.open();
      }
    );
    this.tutorialModal = new TutorialModal(this.audioEngine);
    this.onboardingModal = new OnboardingModal(
      this.audioEngine,
      () => {
        this.openTutorial();
      },
      () => {
        this.menuSystem.triggerTutorialPulse(8000);
      }
    );
    this.profileModal = new ProfileModal(this.audioEngine, (pilot) => this.onProfileChanged(pilot));
    this.leaderboardModal = new LeaderboardModal(this.audioEngine);

    // Game Modes
    this.endlessMode = new EndlessMode();
    this.isEndlessActive = false;

    // State
    this.gameState = CONFIG.STATES.MENU;
    this.previousState = CONFIG.STATES.MENU;
    this.currentSectorIndex = 0;
    this.totalSectors = LEVELS.length; // 10
    this.deathCause = null;
    this.deathTimer = 0;

    // Entities & World
    this.gridMap = null;
    this.player = null;
    this.gate = null;
    this.crystals = [];
    this.hunters = [];
    this.stalkers = [];
    this.resonators = [];
    this.lighthouses = [];
    this.decoys = [];

    // Loop
    this.lastTime = 0;
    this.gameTime = 0;
    this.sectorClearStats = null;

    this.initHeaderButtons();
  }

  initHeaderButtons() {
    const gearBtn = document.getElementById('btn-settings-gear');
    if (gearBtn) {
      const openSettings = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.audioEngine) this.audioEngine.playUIBlip();
        const isGameplay = this.gameState === CONFIG.STATES.PLAYING || this.gameState === CONFIG.STATES.PAUSED || this.gameState === CONFIG.STATES.ENDLESS;
        if (isGameplay && this.gameState === CONFIG.STATES.PLAYING) {
          this.gameState = CONFIG.STATES.PAUSED;
        }
        this.settingsModal.toggle(isGameplay);
      };
      gearBtn.addEventListener('click', openSettings);
      gearBtn.addEventListener('touchstart', openSettings, { passive: false });
    }
  }

  onProfileChanged(pilot) {
    if (this.menuSystem) {
      this.menuSystem.loadProgress();
      this.menuSystem.updateProfileLabel();
    }
    if (this.endlessMode) {
      this.endlessMode.loadHighscore();
    }
  }

  openTutorial() {
    if (this.inputHandler) {
      this.inputHandler.resetInputState();
      this.inputHandler.ignoreClicksFor(600);
    }
    if (this.tutorialModal) {
      this.tutorialModal.reset();
    }
    if (this.gameState !== CONFIG.STATES.TUTORIAL) {
      this.previousState = this.gameState;
      this.gameState = CONFIG.STATES.TUTORIAL;
    }
  }

  async checkAutoUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      }

      const res = await fetch(`./version.json?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data && data.version && (data.version !== CONFIG.VERSION || (data.build && data.build > CONFIG.BUILD))) {
        this.showUpdateBanner(data.version);
      }
    } catch (err) {
      console.warn('[AutoUpdate] Update check skipped (offline mode):', err);
    }
  }

  showUpdateBanner(newVersion) {
    let banner = document.getElementById('auto-update-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'auto-update-banner';
      banner.className = 'auto-update-banner';
      const wrapper = document.getElementById('game-wrapper') || document.body;
      wrapper.prepend(banner);
    }

    banner.innerHTML = `
      <div class="update-banner-content">
        <span class="update-banner-icon">🚀</span>
        <span class="update-banner-text">UPDATE VERFÜGBAR (v${newVersion}) — Neue Features bereit!</span>
        <button id="btn-banner-update-now" class="btn-banner-update">
          [ JETZT AKTUALISIEREN ]
        </button>
      </div>
    `;

    const updateBtn = banner.querySelector('#btn-banner-update-now');
    if (updateBtn) {
      const handleUpdate = (e) => {
        if (e) e.preventDefault();
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((k) => caches.delete(k));
            window.location.reload(true);
          });
        } else {
          window.location.reload(true);
        }
      };
      updateBtn.addEventListener('click', handleUpdate);
      updateBtn.addEventListener('touchstart', handleUpdate, { passive: false });
    }
  }

  start() {
    this.lastTime = performance.now();
    this.checkAutoUpdate();
    if (this.onboardingModal) {
      setTimeout(() => {
        this.onboardingModal.checkAndOpen();
      }, 250);
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  startCampaignSector(index) {
    if (index === 0) {
      this.storyIntro.start(() => {
        this.loadSector(0);
      });
      this.gameState = CONFIG.STATES.STORY_INTRO;
    } else {
      this.loadSector(index);
    }
  }

  loadSector(index) {
    this.isEndlessActive = false;
    this.currentSectorIndex = Math.max(0, Math.min(index, this.totalSectors - 1));
    const lvl = LEVELS[this.currentSectorIndex];

    this.gridMap = new GridMap(lvl.map);
    this.player = new Player(lvl.playerStart.gx, lvl.playerStart.gy);
    this.gate = new Gate(lvl.gate.gx, lvl.gate.gy);
    this.deathCause = null;

    this.crystals = lvl.crystals.map(c => new Crystal(c.id, c.gx, c.gy));
    this.player.totalCrystals = this.crystals.length;

    this.resonators = (lvl.resonators || []).map(r => new Resonator(r.id, r.gx, r.gy));
    this.lighthouses = (lvl.lighthouses || []).map(l => new Lighthouse(l.id, l.gx, l.gy));

    this.hunters = (lvl.hunters || []).map(h => new Hunter(h.id, h.startGx, h.startGy, h.waypoints));
    this.stalkers = (lvl.stalkers || []).map(s => new ShadowStalker(s.id, s.startGx, s.startGy));
    this.decoys = [];

    this.player.onSoundEmitted = (event) => this.broadcastSound(event);

    this.waveSystem.clear();
    this.particleEngine.clear();
    this.touchControls.updateDecoyCount(this.player.decoysRemaining);
    if (this.renderer) {
      this.renderer.camera = { x: this.player.x, y: this.player.y };
    }

    this.audioEngine.startDrone();
    this.gameState = CONFIG.STATES.PLAYING;
  }

  loadEndlessFloor(floor = 1) {
    this.isEndlessActive = true;
    this.endlessMode.currentFloor = floor;
    const lvl = this.endlessMode.generateFloor(floor);

    this.gridMap = new GridMap(lvl.map);
    this.player = new Player(lvl.playerStart.gx, lvl.playerStart.gy);
    this.gate = new Gate(lvl.gate.gx, lvl.gate.gy);
    this.deathCause = null;

    this.crystals = lvl.crystals.map(c => new Crystal(c.id, c.gx, c.gy));
    this.player.totalCrystals = this.crystals.length;

    this.resonators = (lvl.resonators || []).map(r => new Resonator(r.id, r.gx, r.gy));
    this.lighthouses = (lvl.lighthouses || []).map(l => new Lighthouse(l.id, l.gx, l.gy));

    this.hunters = (lvl.hunters || []).map(h => new Hunter(h.id, h.startGx, h.startGy, h.waypoints));
    this.stalkers = (lvl.stalkers || []).map(s => new ShadowStalker(s.id, s.startGx, s.startGy));
    this.decoys = [];

    this.player.onSoundEmitted = (event) => this.broadcastSound(event);

    this.waveSystem.clear();
    this.particleEngine.clear();
    this.touchControls.updateDecoyCount(this.player.decoysRemaining);
    if (this.renderer) {
      this.renderer.camera = { x: this.player.x, y: this.player.y };
    }

    this.audioEngine.startDrone();
    this.gameState = CONFIG.STATES.PLAYING;
  }

  broadcastSound(event) {
    for (let i = 0; i < this.hunters.length; i++) {
      this.hunters[i].hearSound(event, this.gridMap, this.audioEngine, this.particleEngine);
    }
  }

  update(dt) {
    this.gameTime += dt;

    if (this.inputHandler && typeof this.inputHandler.consumeSettings === 'function' && this.inputHandler.consumeSettings()) {
      const isGameplay = this.gameState === CONFIG.STATES.PLAYING || this.gameState === CONFIG.STATES.PAUSED || this.gameState === CONFIG.STATES.ENDLESS;
      if (isGameplay && this.gameState === CONFIG.STATES.PLAYING) {
        this.gameState = CONFIG.STATES.PAUSED;
      }
      if (this.settingsModal) this.settingsModal.toggle(isGameplay);
    }

    switch (this.gameState) {
      case CONFIG.STATES.MENU: {
        const choice = this.menuSystem.handleMenuInput(this.inputHandler);
        if (choice === 'SECTOR_SELECT') {
          this.gameState = CONFIG.STATES.SECTOR_SELECT;
        } else if (choice === 'ENDLESS') {
          this.endlessMode.reset();
          this.loadEndlessFloor(1);
        } else if (choice === 'PROFILE') {
          this.profileModal.open();
        } else if (choice === 'LEADERBOARD') {
          this.leaderboardModal.open();
        } else if (choice === 'TUTORIAL') {
          this.openTutorial();
        }
        break;
      }

      case CONFIG.STATES.STORY_INTRO: {
        const res = this.storyIntro.handleInput(this.inputHandler);
        if (res === 'COMPLETE') {
          this.loadSector(0);
        }
        break;
      }

      case CONFIG.STATES.SECTOR_SELECT: {
        const res = this.menuSystem.handleSectorSelectInput(this.inputHandler);
        if (res) {
          if (res.action === 'START_SECTOR') {
            this.startCampaignSector(res.sectorIndex);
          } else if (res.action === 'BACK') {
            this.gameState = CONFIG.STATES.MENU;
          }
        }
        break;
      }

      case CONFIG.STATES.TUTORIAL: {
        const res = this.tutorialModal.handleInput(this.inputHandler);
        if (res === 'CLOSE') {
          this.gameState = this.previousState || CONFIG.STATES.MENU;
          if (this.menuSystem) {
            this.menuSystem.triggerTutorialPulse(8000);
          }
        }
        break;
      }

      case CONFIG.STATES.SETTINGS: {
        const res = this.settingsModal.handleInput(this.inputHandler);
        if (res === 'BACK' || res === 'CLOSE') {
          this.gameState = this.previousState || CONFIG.STATES.MENU;
        } else if (res === 'LEVEL_SELECT') {
          this.gameState = CONFIG.STATES.SECTOR_SELECT;
        } else if (res === 'MAIN_MENU') {
          this.gameState = CONFIG.STATES.MENU;
        } else if (res === 'RESET_SAVE') {
          this.menuSystem.resetAllProgress();
          this.endlessMode.reset();
          if (this.audioEngine) this.audioEngine.playWallCrash();
          this.gameState = CONFIG.STATES.MENU;
        }
        break;
      }

      case CONFIG.STATES.PAUSED: {
        if (this.inputHandler.consumeEscape() || this.inputHandler.consumeAction()) {
          this.gameState = CONFIG.STATES.PLAYING;
        } else if (this.inputHandler.consumeRestart()) {
          if (this.isEndlessActive) this.loadEndlessFloor(this.endlessMode.currentFloor);
          else this.loadSector(this.currentSectorIndex);
        } else if (this.inputHandler.consumeMenu()) {
          this.gameState = CONFIG.STATES.MENU;
        } else {
          // Check mouse/touch clicks on Pause Menu buttons (w: 380, center x: 400)
          const click = this.inputHandler.consumeMouseClick();
          if (click && click.x >= CONFIG.CANVAS_WIDTH / 2 - 200 && click.x <= CONFIG.CANVAS_WIDTH / 2 + 200) {
            if (click.y >= 175 && click.y <= 225) {
              this.gameState = CONFIG.STATES.PLAYING;
            } else if (click.y >= 230 && click.y <= 280) {
              this.gameState = CONFIG.STATES.SECTOR_SELECT;
            } else if (click.y >= 285 && click.y <= 335) {
              if (this.isEndlessActive) this.loadEndlessFloor(this.endlessMode.currentFloor);
              else this.loadSector(this.currentSectorIndex);
            } else if (click.y >= 340 && click.y <= 390) {
              this.gameState = CONFIG.STATES.MENU;
            }
          }
        }
        break;
      }

      case CONFIG.STATES.PLAYING: {
        this.updatePlaying(dt);
        break;
      }

      case CONFIG.STATES.DYING: {
        this.deathTimer -= dt;
        this.waveSystem.update(dt, this.gridMap);
        this.particleEngine.update(dt);
        for (let i = 0; i < this.hunters.length; i++) {
          this.hunters[i].update(dt, this.gridMap, this.player, this.waveSystem, this.audioEngine, this.particleEngine);
        }
        for (let i = 0; i < this.stalkers.length; i++) {
          this.stalkers[i].update(dt, this.gridMap, this.player, this.waveSystem, this.audioEngine, this.particleEngine);
        }
        if (this.deathTimer <= 0) {
          if (this.isEndlessActive) {
            this.endlessMode.saveHighscore();
            storageManager.saveEndlessProgress(this.endlessMode.bestFloor, this.endlessMode.bestCrystals);
          }
          if (this.inputHandler) {
            this.inputHandler.resetInputState();
          }
          this.gameState = CONFIG.STATES.GAME_OVER;
        }
        break;
      }

      case CONFIG.STATES.SECTOR_CLEARED: {
        if (this.inputHandler.consumeAction()) {
          if (this.isEndlessActive) {
            this.endlessMode.advanceFloor(this.crystals.length);
            this.loadEndlessFloor(this.endlessMode.currentFloor);
          } else {
            if (this.currentSectorIndex + 1 < this.totalSectors) {
              this.loadSector(this.currentSectorIndex + 1);
            } else {
              this.gameState = CONFIG.STATES.VICTORY;
            }
          }
        } else if (this.inputHandler.consumeLevelSelect()) {
          this.gameState = CONFIG.STATES.SECTOR_SELECT;
        } else if (this.inputHandler.consumeMenu() || this.inputHandler.consumeEscape()) {
          this.gameState = CONFIG.STATES.MENU;
        } else {
          // Check mouse / touch clicks on Clear buttons (w: 380, center x: 400)
          const click = this.inputHandler.consumeMouseClick();
          if (click && click.x >= CONFIG.CANVAS_WIDTH / 2 - 200 && click.x <= CONFIG.CANVAS_WIDTH / 2 + 200) {
            if (click.y >= 300 && click.y <= 350) {
              if (this.isEndlessActive) {
                this.endlessMode.advanceFloor(this.crystals.length);
                this.loadEndlessFloor(this.endlessMode.currentFloor);
              } else {
                if (this.currentSectorIndex + 1 < this.totalSectors) {
                  this.loadSector(this.currentSectorIndex + 1);
                } else {
                  this.gameState = CONFIG.STATES.VICTORY;
                }
              }
            } else if (click.y >= 355 && click.y <= 405) {
              this.gameState = CONFIG.STATES.SECTOR_SELECT;
            } else if (click.y >= 410 && click.y <= 460) {
              this.gameState = CONFIG.STATES.MENU;
            }
          }
        }
        break;
      }

      case CONFIG.STATES.DYING: {
        this.deathTimer -= dt;
        this.waveSystem.update(dt, this.gridMap);
        this.particleEngine.update(dt);
        if (this.deathTimer <= 0) {
          if (this.isEndlessActive) {
            this.endlessMode.saveHighscore();
            storageManager.saveEndlessProgress(this.endlessMode.bestFloor, this.endlessMode.bestCrystals);
          }
          if (this.inputHandler) {
            this.inputHandler.resetInputState();
            this.inputHandler.ignoreClicksUntil = 0;
          }
          this.gameState = CONFIG.STATES.GAME_OVER;
        }
        break;
      }

      case CONFIG.STATES.GAME_OVER: {
        if (this.inputHandler.consumeRestart() || this.inputHandler.consumeAction()) {
          if (this.isEndlessActive) {
            this.endlessMode.reset();
            this.loadEndlessFloor(1);
          } else {
            this.loadSector(this.currentSectorIndex);
          }
        } else if (this.inputHandler.consumeLevelSelect()) {
          this.gameState = CONFIG.STATES.SECTOR_SELECT;
        } else if (this.inputHandler.consumeMenu() || this.inputHandler.consumeEscape()) {
          this.gameState = CONFIG.STATES.MENU;
        } else {
          const click = this.inputHandler.consumeMouseClick();
          if (click && click.x >= CONFIG.CANVAS_WIDTH / 2 - 200 && click.x <= CONFIG.CANVAS_WIDTH / 2 + 200) {
            if (click.y >= 215 && click.y <= 265) {
              // ↺ SEKTOR-NEUSTART
              if (this.isEndlessActive) {
                this.endlessMode.reset();
                this.loadEndlessFloor(1);
              } else {
                this.loadSector(this.currentSectorIndex);
              }
            } else if (click.y >= 275 && click.y <= 325) {
              // ➔ LEVEL-ÜBERSICHT
              this.gameState = CONFIG.STATES.SECTOR_SELECT;
            } else if (click.y >= 335 && click.y <= 385) {
              // ⎋ HAUPTMENÜ
              this.gameState = CONFIG.STATES.MENU;
            }
          }
        }
        break;
      }

      case CONFIG.STATES.VICTORY: {
        if (this.inputHandler.consumeAction() || this.inputHandler.consumeMenu() || this.inputHandler.consumeEscape()) {
          this.gameState = CONFIG.STATES.MENU;
        } else if (this.inputHandler.consumeLevelSelect()) {
          this.gameState = CONFIG.STATES.SECTOR_SELECT;
        } else {
          const click = this.inputHandler.consumeMouseClick();
          if (click && click.x >= CONFIG.CANVAS_WIDTH / 2 - 200 && click.x <= CONFIG.CANVAS_WIDTH / 2 + 200) {
            if (click.y >= 275 && click.y <= 325) {
              this.gameState = CONFIG.STATES.SECTOR_SELECT;
            } else if (click.y >= 335 && click.y <= 385) {
              this.gameState = CONFIG.STATES.MENU;
            }
          }
        }
        break;
      }
    }
  }

  updatePlaying(dt) {
    if (this.inputHandler.consumeEscape()) {
      this.gameState = CONFIG.STATES.PAUSED;
      return;
    }

    if (this.inputHandler.consumeRestart()) {
      if (this.isEndlessActive) this.loadEndlessFloor(this.endlessMode.currentFloor);
      else this.loadSector(this.currentSectorIndex);
      return;
    }

    // 1. Decoy Flare Trigger [E / F / Touch]
    if (this.inputHandler.consumeDecoy()) {
      const decoy = this.player.throwDecoy(this.gridMap);
      if (decoy) {
        this.audioEngine.playDecoyThrow();
        decoy.onDecoyPulse = (event) => this.broadcastSound(event);
        this.decoys.push(decoy);
        this.touchControls.updateDecoyCount(this.player.decoysRemaining);
      }
    }

    // 2. Update Player
    this.player.update(
      dt,
      this.gridMap,
      this.inputHandler,
      this.waveSystem,
      this.audioEngine,
      this.particleEngine
    );

    // Keep mobile on-screen buttons in sync
    this.touchControls.update(this.player);

    // Check if player died (e.g. from wall collision)
    if (!this.player.isAlive) {
      this.onGameOver(this.player.deathCause || 'WALL_CRASH');
      return;
    }

    // 3. Update Decoys
    for (let i = this.decoys.length - 1; i >= 0; i--) {
      this.decoys[i].update(dt, this.waveSystem, this.audioEngine);
      if (this.decoys[i].isExpired) {
        this.decoys.splice(i, 1);
      }
    }

    // 4. Update Crystals & Pickup
    let remainingCrystals = 0;
    for (let i = 0; i < this.crystals.length; i++) {
      const c = this.crystals[i];
      if (!c.collected) {
        remainingCrystals++;
        if (c.checkPickup(this.player.gridX, this.player.gridY)) {
          this.audioEngine.playCrystalPickup();
          this.particleEngine.spawnSparks(c.x, c.y, CONFIG.COLORS.CRYSTAL, 16);
          this.particleEngine.addShake(3, 150);
        }
      }
    }

    // 5. Update Gate
    const allCrystalsCollected = remainingCrystals === 0;
    if (allCrystalsCollected && !this.gate.isOpen) {
      this.gate.unlock(this.audioEngine);
      this.particleEngine.spawnSparks(this.gate.x, this.gate.y, CONFIG.COLORS.GATE_OPEN, 24);
      this.particleEngine.addShake(6, 300);
    }

    // 6. Check Gate Extraction
    if (this.gate.isOpen && this.player.gridX === this.gate.gridX && this.player.gridY === this.gate.gridY) {
      this.onSectorCleared();
      return;
    }

    // 7. Update Resonators & Lighthouses
    for (let i = 0; i < this.resonators.length; i++) {
      this.resonators[i].update(dt, this.waveSystem, this.audioEngine, this.particleEngine);
    }
    for (let i = 0; i < this.lighthouses.length; i++) {
      this.lighthouses[i].update(dt, this.waveSystem, this.audioEngine);
    }

    // 8. Update Shadow Stalkers (Strict BFS Shortest Path)
    for (let i = 0; i < this.stalkers.length; i++) {
      this.stalkers[i].update(
        dt,
        this.gridMap,
        this.player,
        this.waveSystem,
        this.audioEngine,
        this.particleEngine
      );

      // Check Lethal Contact
      const dx = this.player.x - this.stalkers[i].x;
      const dy = this.player.y - this.stalkers[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < CONFIG.STALKER.COLLISION_DISTANCE) {
        this.onGameOver('PREDATOR');
        return;
      }
    }

    // 9. Update Hunters
    for (let i = 0; i < this.hunters.length; i++) {
      this.hunters[i].update(
        dt,
        this.gridMap,
        this.player,
        this.waveSystem,
        this.audioEngine,
        this.particleEngine
      );

      // Check Lethal Contact
      const dx = this.player.x - this.hunters[i].x;
      const dy = this.player.y - this.hunters[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < CONFIG.HUNTER.COLLISION_DISTANCE) {
        this.onGameOver('PREDATOR');
        return;
      }
    }

    // 10. Update Waves & Particles (particles react to active sound waves)
    this.waveSystem.update(dt, this.gridMap);
    this.particleEngine.update(dt, this.waveSystem);
  }

  onSectorCleared() {
    this.audioEngine.playSectorClear();
    this.sectorClearStats = this.player.calculateRank();

    if (!this.isEndlessActive) {
      this.menuSystem.saveProgress(this.currentSectorIndex + 1, this.sectorClearStats);
    }

    if (this.inputHandler) {
      this.inputHandler.resetInputState();
    }
    this.gameState = CONFIG.STATES.SECTOR_CLEARED;
  }

  onGameOver(cause = 'PREDATOR') {
    if (this.gameState === CONFIG.STATES.DYING || this.gameState === CONFIG.STATES.GAME_OVER) return;

    this.deathCause = cause || 'PREDATOR';
    this.deathTimer = 1.5; // 1500ms post-mortem reveal phase

    if (this.player) {
      this.player.isAlive = false;
    }

    if (cause === 'WALL_CRASH') {
      this.audioEngine.playWallCrash();
    } else {
      this.audioEngine.playDeath();
    }
    const posX = this.player ? this.player.x : CONFIG.CANVAS_WIDTH / 2;
    const posY = this.player ? this.player.y : CONFIG.CANVAS_HEIGHT / 2;

    this.particleEngine.spawnSparks(posX, posY, CONFIG.COLORS.HUNTER, 45);
    this.particleEngine.addShake(14, 600);
    this.waveSystem.createDeathShockwave(posX, posY);

    this.deathTimer = 1.5;
    this.gameState = CONFIG.STATES.DYING;
  }

  render() {
    const ctx = this.ctx;
    const time = this.gameTime;

    switch (this.gameState) {
      case CONFIG.STATES.MENU:
        this.menuSystem.renderMenu(ctx, time, this.endlessMode);
        break;

      case CONFIG.STATES.STORY_INTRO:
        this.storyIntro.render(ctx, time);
        break;

      case CONFIG.STATES.SECTOR_SELECT:
        this.menuSystem.renderSectorSelect(ctx);
        break;

      case CONFIG.STATES.TUTORIAL:
        this.tutorialModal.render(ctx, time);
        break;

      case CONFIG.STATES.PLAYING:
      case CONFIG.STATES.PAUSED:
      case CONFIG.STATES.DYING: {
        const isChased = this.hunters.some(h => h.state === 'CHASING');
        this.renderer.render(
          ctx,
          this.gridMap,
          this.waveSystem,
          this.player,
          this.hunters,
          this.stalkers,
          this.resonators,
          this.lighthouses,
          this.decoys,
          this.crystals,
          this.gate,
          this.particleEngine,
          time,
          isChased
        );

        if (this.gameState === CONFIG.STATES.DYING) {
          // Post-Mortem Death-Reveal Tactical Warning Overlay
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '700 18px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#FF1E44';
          ctx.shadowColor = '#FF1E44';
          ctx.shadowBlur = 12;
          const msg = this.deathCause === 'WALL_CRASH' ? '⚠ KOLLISION // DROHNE ZERSTÖRT' : '⚠ PRÄDATOR-KONTAKT // SIGNALVERLUST';
          ctx.fillText(msg, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);
          ctx.restore();
          break;
        }

        const currentLvl = this.isEndlessActive
          ? { name: `ENDLESS ECHO // ETAGE ${this.endlessMode.currentFloor}`, sectorNumber: this.endlessMode.currentFloor }
          : LEVELS[this.currentSectorIndex];

        const crystalsLeft = this.crystals.filter(c => !c.collected).length;
        const pingRatio = this.player.getPingCooldownRatio();

        this.hud.renderGameHUD(
          currentLvl,
          crystalsLeft,
          this.crystals.length,
          pingRatio,
          this.player,
          this.isEndlessActive,
          this.endlessMode.currentFloor,
          time
        );

        if (this.gameState === CONFIG.STATES.PAUSED) {
          this.hud.renderPauseMenu();
        }
        break;
      }

      case CONFIG.STATES.SECTOR_CLEARED:
        this.hud.renderSectorCleared(
          time,
          this.currentSectorIndex,
          this.totalSectors,
          this.sectorClearStats,
          this.isEndlessActive,
          this.endlessMode.currentFloor + 1
        );
        break;

      case CONFIG.STATES.GAME_OVER:
        this.hud.renderGameOver(
          time,
          this.currentSectorIndex,
          this.isEndlessActive,
          this.endlessMode.currentFloor,
          this.deathCause
        );
        break;

      case CONFIG.STATES.VICTORY:
        this.hud.renderVictory(time);
        break;
    }
  }

  syncDOMState() {
    // Only show touch controls during active gameplay when no modal or editor is open
    const isPlaying = (this.gameState === CONFIG.STATES.PLAYING || this.gameState === CONFIG.STATES.ENDLESS) &&
                      !this.settingsModal.isOpen &&
                      !this.profileModal.isOpen &&
                      !this.leaderboardModal.isOpen &&
                      (!this.onboardingModal || !this.onboardingModal.isOpen) &&
                      !(this.touchLayoutEditor && this.touchLayoutEditor.isOpen);

    if (this.touchControls) {
      this.touchControls.setVisible(isPlaying);
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.syncDOMState();
    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Register PWA Service Worker for offline support
function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[SW] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] ServiceWorker registration failed:', err);
        });
    });
  }
}

// Start Game Instance with Instant Silent Fullscreen & Audio Unlock on first interaction
function initGame() {
  if (!window.game) {
    const game = new Game();
    window.game = game;
    game.start();
    registerServiceWorker();

    const handleFirstInteraction = () => {
      if (game.displayManager && !game.displayManager.isFullscreen) {
        game.displayManager.requestSilentFullscreen();
      }
      if (game.audioEngine && game.audioEngine.ctx && game.audioEngine.ctx.state === 'suspended') {
        game.audioEngine.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
