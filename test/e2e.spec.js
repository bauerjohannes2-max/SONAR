import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('SONAR v1.9.2 Tactical Gauntlet Loop E2E Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity (v1.9.2)', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.9.2');
    expect(data.build).toBe(20260817);
  });

  test('2. Sci-Fi Audio Assets Existence & Preloading in Web Audio API (7 MP3 Samples)', async ({ page }) => {
    const audioFiles = [
      'assets/audio/sonar_ping.mp3',
      'assets/audio/crystal_pickup.mp3',
      'assets/audio/death_explosion.mp3',
      'assets/audio/enemy_alert.mp3',
      'assets/audio/portal_open.mp3',
      'assets/audio/ambient_drone.mp3',
      'assets/audio/bg_music.mp3'
    ];

    for (const file of audioFiles) {
      expect(fs.existsSync(file)).toBeTruthy();
      const stat = fs.statSync(file);
      expect(stat.size).toBeGreaterThan(5000);
    }

    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const decodedCount = await page.evaluate(async () => {
      window.game.audioEngine.init();
      await window.game.audioEngine.preloadAudioBuffers();
      return window.game.audioEngine.buffers.size;
    });

    expect(decodedCount).toBe(7);
  });

  test('3. CC0 Sci-Fi Sprites Existence & SpriteManager Preloading (6 PNG Assets)', async ({ page }) => {
    const spriteFiles = [
      'assets/sprites/drone_sheet.png',
      'assets/sprites/hunter_sheet.png',
      'assets/sprites/stalker_sheet.png',
      'assets/sprites/core_crystal.png',
      'assets/sprites/tileset_walls.png',
      'assets/sprites/portal_exit.png'
    ];

    for (const file of spriteFiles) {
      expect(fs.existsSync(file)).toBeTruthy();
      const stat = fs.statSync(file);
      expect(stat.size).toBeGreaterThan(100);
    }

    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const loadedCount = await page.evaluate(async () => {
      return await window.game.spriteManager.loadAll();
    });

    expect(loadedCount).toBe(6);

    const isDroneReady = await page.evaluate(() => {
      const drone = window.game.spriteManager.get('drone');
      return drone && drone.naturalWidth > 0;
    });
    expect(isDroneReady).toBeTruthy();
  });

  test('4. Marine Snow Particles, Hydrodynamic Wakes & Post-Processing Pipeline', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const checkVisualSubsystems = await page.evaluate(() => {
      window.game.loadSector(0);
      const snowCount = window.game.particleEngine.marineSnow.length;
      const hasPostProcessing = !!window.game.renderer.postProcessing;
      const hasVignette = !!window.game.renderer.postProcessing.vignetteCanvas;
      return { snowCount, hasPostProcessing, hasVignette };
    });

    expect(checkVisualSubsystems.snowCount).toBeGreaterThanOrEqual(80);
    expect(checkVisualSubsystems.hasPostProcessing).toBeTruthy();
    expect(checkVisualSubsystems.hasVignette).toBeTruthy();
  });

  test('5. Accessible Terminology & Tutorial Guidance (Card 1-7)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.evaluate(() => {
      window.game.openTutorial();
    });

    await page.waitForTimeout(650);
    const isTutorial = await page.evaluate(() => window.game && window.game.gameState === 'TUTORIAL');
    expect(isTutorial).toBeTruthy();

    const cards = await page.evaluate(() => window.game.tutorialModal.cards);
    expect(cards.length).toBe(7);

    expect(cards[0].title).toContain('DU BIST DIE DROHNE ECHO');
    expect(cards[0].behavior).toContain('Touch-Steuerung');
    expect(cards[1].title).toContain('SCHALLWELLEN & WÄNDE');
    expect(cards[2].title).toContain('KRISTALLE EINSAMMELN');
    expect(cards[3].title).toContain('DER GRÜNE FLUCHTAUFZUG');
    expect(cards[4].title).toContain('ROTE MONSTER');
    expect(cards[5].title).toContain('LEISE SCHLEICHEN');
    expect(cards[6].title).toContain('KÖDER-WURF (E)');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const isMenu = await page.evaluate(() => window.game.gameState === 'MENU');
    expect(isMenu).toBeTruthy();
  });

  test('6. Sector 04+ Death -> NEUSTART Click Reliably Reloads Sector 04', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.evaluate(() => {
      window.game.loadSector(3);
    });

    const activeSectorBefore = await page.evaluate(() => window.game.currentSectorIndex);
    expect(activeSectorBefore).toBe(3);

    await page.evaluate(() => {
      window.game.onGameOver('WALL_CRASH');
    });

    const stateImmediately = await page.evaluate(() => window.game.gameState);
    expect(stateImmediately).toBe('DYING');

    await page.waitForTimeout(1600);
    const stateGameOver = await page.evaluate(() => window.game.gameState);
    expect(stateGameOver).toBe('GAME_OVER');

    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    const restartClickX = canvasBox.x + (400 / 800) * canvasBox.width;
    const restartClickY = canvasBox.y + (240 / 576) * canvasBox.height;

    await page.mouse.click(restartClickX, restartClickY);
    await page.waitForTimeout(150);

    const stateAfterRestart = await page.evaluate(() => window.game.gameState);
    expect(stateAfterRestart).toBe('PLAYING');

    const activeSectorAfter = await page.evaluate(() => window.game.currentSectorIndex);
    expect(activeSectorAfter).toBe(3);

    const isPlayerAlive = await page.evaluate(() => window.game.player.isAlive);
    expect(isPlayerAlive).toBeTruthy();
  });

  test('7. Escape Portal Activation: Beacon Wave, Wayfinder Arrow & HUD Alarm', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.loadSector(0);
      for (const c of window.game.crystals) {
        c.isCollected = true;
      }
      window.game.gate.unlock(window.game.audioEngine);
      window.game.waveSystem.createBeaconWave(window.game.gate.x, window.game.gate.y);
      const isGateOpen = window.game.gate.isOpen;
      const hasBeaconWave = window.game.waveSystem.waves.some(w => w.type === 'BEACON');
      return { isGateOpen, hasBeaconWave };
    });

    expect(result.isGateOpen).toBeTruthy();
    expect(result.hasBeaconWave).toBeTruthy();
  });

  test('8. Settings Modal: Background Music Slider & D-Pad/Swipe Toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.click('#btn-settings-gear');
    await expect(page.locator('#settings-modal')).toBeVisible();

    await expect(page.locator('#slider-master-volume')).toBeVisible();
    await expect(page.locator('#slider-music-volume')).toBeVisible();
    await expect(page.locator('#slider-sfx-volume')).toBeVisible();

    await expect(page.locator('#btn-ctrl-dpad')).toBeVisible();
    await expect(page.locator('#btn-ctrl-swipe')).toBeVisible();

    await page.click('#settings-modal', { position: { x: 10, y: 10 } });
    await expect(page.locator('#settings-modal')).not.toBeVisible();
  });

  test('9. Profile Modal: Accessible Terms & Input Feedback', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.evaluate(() => {
      window.game.profileModal.open();
    });

    await expect(page.locator('#pilot-profile-modal')).toBeVisible();
    const titleText = await page.locator('#pilot-profile-modal .modal-title').innerText();
    expect(titleText).toContain('SPIELER-PROFIL');
    expect(titleText).not.toContain('//');

    await page.keyboard.press('Escape');
    await expect(page.locator('#pilot-profile-modal')).not.toBeVisible();
  });

  test('10. Touch Layout Editor Individual Element Scaling ([ + ] / [ - ])', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.click('#btn-settings-gear');
    await page.click('#btn-open-touch-editor');
    await expect(page.locator('#touch-layout-editor')).toBeVisible();

    const scaleValMove = page.locator('#scale-val-movement');
    await expect(scaleValMove).toBeVisible();
    const initialText = await scaleValMove.innerText();
    expect(initialText).toBe('100%');

    await page.click('button[data-action="inc"][data-target="movement"]');
    const newText = await scaleValMove.innerText();
    expect(newText).toBe('110%');

    await page.click('#btn-editor-save');
    await expect(page.locator('#touch-layout-editor')).not.toBeVisible();

    const storedConfig = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sonar_touch_config'));
    });
    expect(storedConfig.elementScales.movement).toBe(1.1);
  });

  test('11. Dynamic Heartbeat & Predator Proximity Audio Layer (v1.7.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.audioEngine.init();
      // Test distant predator (no heartbeat)
      window.game.audioEngine.updateHeartbeat(300, false, 0.1);
      const distantThreat = window.game.audioEngine.currentThreatDistance;

      // Test close predator (< 220px)
      window.game.audioEngine.updateHeartbeat(100, true, 0.5);
      const closeThreat = window.game.audioEngine.currentThreatDistance;
      const isChasing = window.game.audioEngine.isThreatChasing;
      const interval = window.game.audioEngine.heartbeatInterval;

      return { distantThreat, closeThreat, isChasing, interval };
    });

    expect(result.distantThreat).toBe(Infinity);
    expect(result.closeThreat).toBe(100);
    expect(result.isChasing).toBeTruthy();
    expect(result.interval).toBeLessThanOrEqual(0.5);
  });

  test('12. Hydrodynamic Wake Trail & Acoustic Wall Reflection Sparks (v1.8.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.loadSector(0);
      const pe = window.game.particleEngine;
      pe.particles = [];

      // Test wake particle spawn (normal move vs sneak)
      pe.spawnWakeParticle(100, 100, 0, false);
      const countNormal = pe.particles.length;

      pe.spawnWakeParticle(100, 100, 0, true);
      const countSneak = pe.particles.length; // should remain unchanged (100% stealth suppression)

      // Test wall reflection sparks
      pe.spawnWallRefractionSparks(200, 200, '#00F0FF', 4);
      const countAfterWall = pe.particles.length;

      const hasWakeType = pe.particles.some(p => p.type === 'WAKE_TRAIL');
      const hasSparkType = pe.particles.some(p => p.type === 'SPARK');

      return { countNormal, countSneak, countAfterWall, hasWakeType, hasSparkType };
    });

    expect(result.countNormal).toBe(1);
    expect(result.countSneak).toBe(1); // Sneaking suppresses wake completely!
    expect(result.countAfterWall).toBe(5);
    expect(result.hasWakeType).toBeTruthy();
    expect(result.hasSparkType).toBeTruthy();
  });

  test('13. Strict Multi-User Pilot Profile Progress Isolation (v1.8.1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(async () => {
      const sm = window.game.storageManager;
      const ts = Date.now();
      const userA = 'PILOT_A_' + ts.toString().slice(-4);
      const userB = 'PILOT_B_' + ts.toString().slice(-4);

      // 1. Pilot A registers and achieves Level 5
      await sm.login(userA, '1234');
      const aInitial = sm.getCampaignProgress().unlockedSector;
      sm.saveCampaignProgress(4, { rank: 'S', time: 18.2 }); // Cleared sector 4 (unlocked 5)
      const aSector = sm.getCampaignProgress().unlockedSector;

      // 2. Pilot B registers
      await sm.login(userB, '5678');
      // When Pilot B first registers, he MUST start at 1, NOT at Pilot A's 5!
      const bInitial = sm.getCampaignProgress().unlockedSector;
      sm.saveCampaignProgress(2, { rank: 'A', time: 24.1 }); // Pilot B clears sector 2 (unlocked 3)
      const bSector = sm.getCampaignProgress().unlockedSector;
      const bMaxCleared = sm.getCampaignProgress().maxClearedSector;

      // 3. Log out to GAST
      sm.logout();
      const guestSector = sm.getCampaignProgress().unlockedSector;

      // 4. Log back into Pilot A
      await sm.login(userA, '1234');
      const aRestoredSector = sm.getCampaignProgress().unlockedSector;

      // 5. Log back into Pilot B
      await sm.login(userB, '5678');
      const bRestoredSector = sm.getCampaignProgress().unlockedSector;

      return { aInitial, aSector, bInitial, bSector, bMaxCleared, guestSector, aRestoredSector, bRestoredSector };
    });

    expect(result.aInitial).toBe(1);
    expect(result.aSector).toBe(5);
    expect(result.bInitial).toBe(1); // Pilot B must NOT inherit Level 5 from Pilot A!
    expect(result.bSector).toBe(3);
    expect(result.bMaxCleared).toBe(2);
    expect(result.guestSector).toBe(1);
    expect(result.aRestoredSector).toBe(5); // Pilot A keeps Level 5!
    expect(result.bRestoredSector).toBe(3); // Pilot B keeps Level 3!
  });

  test('14. Auto-Update Banner Disappearance when running Current Version (v1.9.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const bannerExists = await page.evaluate(async () => {
      await window.game.checkAutoUpdate();
      return !!document.getElementById('auto-update-banner');
    });

    expect(bannerExists).toBeFalsy();
  });

  test('15. 3-Star Tactical Precision Rating & S-Rank Calculation (v1.9.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.loadSector(0);
      const player = window.game.player;

      // Case 1: Apex Run (time <= 25s, pings <= 2) -> 3 Stars & S-Rank
      player.timeElapsed = 18.5;
      player.pingsUsed = 1;
      const apexStats = player.calculateRank();

      // Case 2: Good Run (time 35s, pings <= 2) -> 2 Stars & A-Rank
      player.timeElapsed = 35.0;
      player.pingsUsed = 2;
      const goodStats = player.calculateRank();

      // Case 3: Slow & Heavy Pings (time 55s, pings 8) -> 1 Star & B-Rank
      player.timeElapsed = 55.0;
      player.pingsUsed = 8;
      const normalStats = player.calculateRank();

      return { apexStats, goodStats, normalStats };
    });

    expect(result.apexStats.stars).toBe(3);
    expect(result.apexStats.rank).toBe('S');

    expect(result.goodStats.stars).toBe(2);
    expect(result.goodStats.rank).toBe('A');

    expect(result.normalStats.stars).toBe(1);
    expect(result.normalStats.rank).toBe('B');
  });

  test('16. Stalker Electromagnetic Distortion & Audio Crackle (v1.9.2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.audioEngine.init();
      // Test distant stalker (> 220px) -> no distortion
      window.game.audioEngine.updateStalkerDistortion(300, 0.1);
      const distantStalker = window.game.audioEngine.stalkerDist;

      // Test close stalker (< 220px) -> distortion active
      window.game.audioEngine.updateStalkerDistortion(80, 0.1);
      const closeStalker = window.game.audioEngine.stalkerDist;

      return { distantStalker, closeStalker };
    });

    expect(result.distantStalker).toBe(Infinity);
    expect(result.closeStalker).toBe(80);
  });

});
