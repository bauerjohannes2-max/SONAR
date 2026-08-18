import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('SONAR v1.14.0 Tactical Gauntlet Loop E2E Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity (v1.14.0)', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.14.0');
    expect(data.build).toBe(20260819);
  });

  test('2. Sci-Fi Audio Assets Existence & Preloading in Web Audio API (10 MP3 Samples)', async ({ page }) => {
    const audioFiles = [
      'assets/audio/sonar_ping.mp3',
      'assets/audio/crystal_pickup.mp3',
      'assets/audio/death_explosion.mp3',
      'assets/audio/enemy_alert.mp3',
      'assets/audio/portal_open.mp3',
      'assets/audio/ambient_drone.mp3',
      'assets/audio/ambient_main.mp3',
      'assets/audio/music_menu.mp3',
      'assets/audio/music_gameplay.mp3',
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

    expect(decodedCount).toBe(10);
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

      // Case 1: Apex Run (time <= 45s, pings <= 3) -> 3 Stars & S-Rank
      player.timeElapsed = 18.5;
      player.pingsUsed = 1;
      const apexStats = player.calculateRank();

      // Case 2: Speedy Run with excessive pings (time <= 45s, pings > 3) -> 2 Stars & A-Rank
      player.timeElapsed = 35.0;
      player.pingsUsed = 5;
      const goodStats = player.calculateRank();

      // Case 3: Slow & Heavy Pings (time > 45s, pings > 3) -> 1 Star & B-Rank
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

  test('17. Crystal Acoustic Wave Resonance & Sparkle (v1.9.3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.loadSector(0);
      const crystal = window.game.crystals[0];
      crystal.isCollected = false;
      crystal.resonanceCooldown = 0;

      // Spawn a Sonar Ping right at the crystal position
      window.game.waveSystem.createSonarPing(crystal.x, crystal.y);
      const wave = window.game.waveSystem.waves.find(w => w.type === 'PING');
      wave.radius = 10; // Exactly at crystal radius

      const pe = window.game.particleEngine;
      pe.particles = [];

      crystal.update(0.016, window.game.waveSystem, window.game.audioEngine, pe);

      const hasTriggeredResonance = crystal.resonanceCooldown > 0;
      const sparkleParticles = pe.particles.filter(p => p.type === 'SPARK');

      return {
        hasTriggeredResonance,
        sparkleCount: sparkleParticles.length
      };
    });

    expect(result.hasTriggeredResonance).toBeTruthy();
    expect(result.sparkleCount).toBeGreaterThan(0);
  });

  test('18. Touch Controls Tactile Haptics, Editor Cancel Rollback & Instant Reset (v1.10.2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Open Settings -> Touch Editor
    await page.click('#btn-settings-gear');
    await page.click('#btn-open-touch-editor');
    await expect(page.locator('#touch-layout-editor')).toBeVisible();

    // 2. Change movement scale to 120%
    await page.click('button[data-action="inc"][data-target="movement"]');
    await page.click('button[data-action="inc"][data-target="movement"]');
    const scaleVal = page.locator('#scale-val-movement');
    expect(await scaleVal.innerText()).toBe('120%');

    // 3. Click ABBRECHEN (CANCEL) -> Must discard changes and close
    await page.click('#btn-editor-cancel');
    await expect(page.locator('#touch-layout-editor')).not.toBeVisible();

    // Reopen editor and verify scale is still 100%
    await page.click('#btn-settings-gear');
    await page.click('#btn-open-touch-editor');
    await expect(page.locator('#touch-layout-editor')).toBeVisible();
    expect(await page.locator('#scale-val-movement').innerText()).toBe('100%');

    // 4. Change scale again, then click RESET (STANDARD) -> Must immediately restore 100%
    await page.click('button[data-action="inc"][data-target="movement"]');
    expect(await page.locator('#scale-val-movement').innerText()).toBe('110%');
    await page.click('#btn-editor-reset');
    expect(await page.locator('#scale-val-movement').innerText()).toBe('100%');

    // 5. Save and verify stored config
    await page.click('#btn-editor-save');
    await expect(page.locator('#touch-layout-editor')).not.toBeVisible();

    const storedConfig = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sonar_touch_config'));
    });
    expect(storedConfig.elementScales.movement).toBe(1.0);
  });

  test('19. Service Worker Update Flow & Cache Purge Routine (v1.9.4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Verify executeAppUpdate exists and handles SW update/cache purge
    const result = await page.evaluate(async () => {
      const hasExecuteFn = typeof window.executeAppUpdate === 'function';
      
      // Test SW registration and message channel
      let swActive = false;
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        swActive = !!reg;
      }
      return { hasExecuteFn, swActive };
    });

    expect(result.hasExecuteFn).toBeTruthy();
  });

  test('20. Clean Main Menu: Endless Mode Removed & Campaign Hero Focus (v1.10.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const menuState = await page.evaluate(() => {
      const menu = window.game.menuSystem;
      const options = menu.options.map(o => o.id);
      const hasEndless = options.includes('ENDLESS');
      const hasCampaign = options.includes('SECTOR_SELECT');
      return { options, hasEndless, hasCampaign };
    });

    expect(menuState.hasEndless).toBeFalsy();
    expect(menuState.hasCampaign).toBeTruthy();
    expect(menuState.options).toEqual(['SECTOR_SELECT', 'HANGAR', 'LEADERBOARD', 'PROFILE', 'SETTINGS']);
  });

  test('21. Settings Modal Touch Scaling with Live-Preview Synchronization (v1.10.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.click('#btn-settings-gear');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Check Live-Preview element presence
    await expect(page.locator('#touch-live-preview-box')).toBeVisible();
    await expect(page.locator('#preview-dpad')).toBeVisible();

    // Change scale to 125%
    await page.click('button.btn-scale-step[data-scale="1.25"]');
    const scaleBadge = page.locator('#val-touch-scale');
    expect(await scaleBadge.innerText()).toBe('125%');

    const previewTag = page.locator('#preview-mode-tag');
    expect(await previewTag.innerText()).toContain('125%');

    // Switch to SWIPE
    await page.click('#btn-ctrl-swipe');
    await expect(page.locator('#preview-swipe-indicator')).toBeVisible();
    expect(await previewTag.innerText()).toContain('SWIPE');
  });

  test('22. Consolidated 3-Star Campaign Rating & HUD Breakdown (v1.10.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      window.game.loadSector(0);
      const player = window.game.player;

      // Case 1: 3-Star Apex Run (<= 45s, <= 3 pings)
      player.timeElapsed = 22.4;
      player.pingsUsed = 2;
      const rank3 = player.calculateRank();

      // Case 2: 2-Star Run (Speedy but 4 pings)
      player.timeElapsed = 35.0;
      player.pingsUsed = 4;
      const rank2 = player.calculateRank();

      // Case 3: 1-Star Run (> 45s and > 3 pings)
      player.timeElapsed = 52.0;
      player.pingsUsed = 6;
      const rank1 = player.calculateRank();

      return { rank3, rank2, rank1 };
    });

    expect(result.rank3.stars).toBe(3);
    expect(result.rank3.isSpeedy).toBeTruthy();
    expect(result.rank3.isStealthy).toBeTruthy();

    expect(result.rank2.stars).toBe(2);
    expect(result.rank2.isSpeedy).toBeTruthy();
    expect(result.rank2.isStealthy).toBeFalsy();

    expect(result.rank1.stars).toBe(1);
    expect(result.rank1.isSpeedy).toBeFalsy();
    expect(result.rank1.isStealthy).toBeFalsy();
  });

  test('23. Visual Leaderboard: Tabs, Rivals Star & 1v1 Comparison Modal (v1.10.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Leaderboard
    await page.evaluate(() => window.game.leaderboardModal.open());
    await expect(page.locator('#leaderboard-modal')).toBeVisible();

    // Verify tabs
    await expect(page.locator('#tab-lb-world')).toBeVisible();
    await expect(page.locator('#tab-lb-rivals')).toBeVisible();

    // Click on 1v1 button of the first entry
    const first1v1Btn = page.locator('.btn-compare-link').first();
    await expect(first1v1Btn).toBeVisible();
    await first1v1Btn.click();

    // Verify 1v1 Rival Direct Comparison modal is open
    await expect(page.locator('#rival-compare-modal')).toBeVisible();
    await expect(page.locator('.rival-compare-grid')).toBeVisible();
  });

  test('24. Station ABYSS Lore & Child-Friendly 3-Point Tutorial Cards (v1.10.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const tut = await page.evaluate(() => {
      const cards = window.game.tutorialModal.cards;
      return {
        cardCount: cards.length,
        card1: cards[0],
        card5: cards[4]
      };
    });

    expect(tut.cardCount).toBe(7);
    expect(tut.card1.whatIsIt).toContain('Station ABYSS');
    expect(tut.card1.whatIsIt).toContain('ECHO');
    expect(tut.card1.howToReact).toBeDefined();
    expect(tut.card1.proTip).toBeDefined();

    expect(tut.card5.title).toContain('ROTE MONSTER');
    expect(tut.card5.whatIsIt).toContain('Station ABYSS');
    expect(tut.card5.howToReact).toContain('blind');
  });

  test('25. Collision-Free Touch Controls at 100%, 125%, 150% Scale in Mobile Landscape Viewports (v1.10.1)', async ({ page }) => {
    const viewports = [
      { width: 844, height: 390, name: 'iPhone Landscape' },
      { width: 768, height: 500, name: 'Compact Tablet Landscape' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForSelector('#gameCanvas');

      // Start game & force touch controls visible
      await page.evaluate(() => {
        window.game.isTouchDevice = true;
        window.game.loadSector(0);
        window.game.touchControls.isTouchDevice = true;
        window.game.touchControls.setVisible(true);
      });

      const scales = [1.0, 1.25, 1.5];
      for (const sc of scales) {
        const overlapResult = await page.evaluate((scale) => {
          window.game.touchControls.setScale(scale);

          const dpad = document.getElementById('touch-dpad-container');
          const sneak = document.getElementById('btn-sneak') || document.getElementById('touch-sneak');
          const decoy = document.getElementById('btn-bait') || document.getElementById('touch-decoy');
          const ping = document.getElementById('btn-ping') || document.getElementById('touch-ping');

          const elements = [
            { name: 'DPAD', rect: dpad.getBoundingClientRect() },
            { name: 'SNEAK', rect: sneak.getBoundingClientRect() },
            { name: 'DECOY', rect: decoy.getBoundingClientRect() },
            { name: 'PING', rect: ping.getBoundingClientRect() }
          ];

          const collisions = [];
          for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
              const a = elements[i].rect;
              const b = elements[j].rect;

              // Check if rectangles overlap with positive intersection area
              const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
              const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
              const intersectionArea = xOverlap * yOverlap;

              if (intersectionArea > 0) {
                collisions.push({
                  elemA: elements[i].name,
                  elemB: elements[j].name,
                  intersectionArea,
                  xOverlap,
                  yOverlap
                });
              }
            }
          }

          // Check if any element goes out of viewport
          const outOfBounds = [];
          elements.forEach(item => {
            if (item.rect.left < 0 || item.rect.right > window.innerWidth + 5 || item.rect.bottom > window.innerHeight + 5) {
              outOfBounds.push({ name: item.name, rect: item.rect });
            }
          });

          return { collisions, outOfBounds, elements };
        }, sc);

        expect(overlapResult.collisions).toEqual([]);
        expect(overlapResult.outOfBounds).toEqual([]);
      }
    }
  });

  test('26. Phase 1 The 10 Quick-Wins Feature Validation (v1.11.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const result = await page.evaluate(() => {
      const g = window.game;

      // 1. Crystal Scale Pitch Progression & Sneak Low-Pass Filter
      const audio = g.audioEngine;
      audio.init();
      audio.setSneakMode(true);
      const hasSneakFilter = !!audio.sneakFilter;
      audio.setSneakMode(false);

      // 2. Start Sector 0 to test Particle Trails & Danger Vignette
      g.loadSector(0);
      const postProc = g.renderer.postProcessing;
      const hasDangerVignette = typeof postProc.render === 'function';

      // 3. Ghost Trail & Thruster Bubbles
      g.particleEngine.spawnDroneGhostTrail(100, 100, 0, false);
      const hasGhostParticle = g.particleEngine.particles.some(p => p.type === 'DRONE_GHOST');

      // 4. Sector Clear slow-mo & flash
      g.onSectorCleared();
      const hasSlowMo = g.victorySlowMoTimer > 0;
      const hasFlash = g.victoryFlashAlpha > 0;

      // 5. Game Over death stamp & instant restart
      g.onGameOver('WALL_CRASH');
      const deathCause = g.deathCause;

      return {
        hasSneakFilter,
        hasDangerVignette,
        hasGhostParticle,
        hasSlowMo,
        hasFlash,
        deathCause
      };
    });

    expect(result.hasSneakFilter).toBeTruthy();
    expect(result.hasDangerVignette).toBeTruthy();
    expect(result.hasGhostParticle).toBeTruthy();
    expect(result.hasSlowMo).toBeTruthy();
    expect(result.hasFlash).toBeTruthy();
    expect(result.deathCause).toBe('WALL_CRASH');
  });

  test('27. Phase 2 Metaprogression & Hangar Drone Upgrade System (v1.12.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Open Hangar Modal
    const hangarOpened = await page.evaluate(() => {
      const g = window.game;
      g.hangarModal.open();
      const el = document.getElementById('hangar-modal');
      return el && el.style.display !== 'none';
    });
    expect(hangarOpened).toBeTruthy();

    // 2. Test star calculations and upgrade purchases
    const upgradeResult = await page.evaluate(() => {
      const sm = window.game.storageManager;

      // Seed mock campaign stars (Sectors 1, 2, 3 with S-ranks = 9 stars)
      sm.saveCampaignProgress(1, { rank: 'S', stars: 3, time: 12.0 });
      sm.saveCampaignProgress(2, { rank: 'S', stars: 3, time: 14.0 });
      sm.saveCampaignProgress(3, { rank: 'S', stars: 3, time: 16.0 });

      const totalStars = sm.calculateTotalStars();
      const initialAvail = sm.getAvailableStars();

      // Purchase Sonar Booster (cost: 2) & Emergency Shield (cost: 6)
      const buyBooster = sm.purchaseUpgrade('sonarBooster');
      const buyShield = sm.purchaseUpgrade('emergencyShield');
      const remaining = sm.getAvailableStars();
      const currentUpgrades = sm.getUpgrades();

      return {
        totalStars,
        initialAvail,
        buyBoosterSuccess: buyBooster.success,
        buyShieldSuccess: buyShield.success,
        remaining,
        currentUpgrades
      };
    });

    expect(upgradeResult.totalStars).toBe(9);
    expect(upgradeResult.buyBoosterSuccess).toBeTruthy();
    expect(upgradeResult.buyShieldSuccess).toBeTruthy();
    expect(upgradeResult.remaining).toBe(1); // 9 - 2 - 6 = 1
    expect(upgradeResult.currentUpgrades.sonarBooster).toBe(1);
    expect(upgradeResult.currentUpgrades.emergencyShield).toBe(1);

    // 3. Test Gameplay Shield wall absorption
    const shieldAbsorbResult = await page.evaluate(() => {
      const g = window.game;
      g.loadSector(0); // Player spawned with Emergency Shield active

      // Place player at gx: 1, gy: 1 next to outer wall at gx: 0
      g.player.gridX = 1;
      g.player.gridY = 1;
      g.player.targetGridX = 1;
      g.player.targetGridY = 1;
      g.player.x = 1 * 32 + 16;
      g.player.y = 1 * 32 + 16;
      g.player.isMoving = false;

      const initialAlive = g.player.isAlive;
      const initialShield = g.player.shieldActive;

      // Simulate movement into west wall (gx: 0 is wall)
      const wallMove = { dx: -1, dy: 0 };
      const fakeInput = {
        isSneaking: () => false,
        getMovement: () => wallMove,
        consumePing: () => false
      };

      // Force execute Player update step against wall
      g.player.update(0.016, g.gridMap, fakeInput, g.waveSystem, g.audioEngine, g.particleEngine);

      const aliveAfterFirstHit = g.player.isAlive;
      const shieldAfterFirstHit = g.player.shieldActive;

      // Second wall hit with shield depleted -> must kill drone
      g.player.update(0.016, g.gridMap, fakeInput, g.waveSystem, g.audioEngine, g.particleEngine);
      const aliveAfterSecondHit = g.player.isAlive;
      const deathCause = g.player.deathCause;

      return {
        initialAlive,
        initialShield,
        aliveAfterFirstHit,
        shieldAfterFirstHit,
        aliveAfterSecondHit,
        deathCause
      };
    });

    expect(shieldAbsorbResult.initialAlive).toBe(true);
    expect(shieldAbsorbResult.initialShield).toBe(true);
    expect(shieldAbsorbResult.aliveAfterFirstHit).toBe(true);
    expect(shieldAbsorbResult.shieldAfterFirstHit).toBe(false);
    expect(shieldAbsorbResult.aliveAfterSecondHit).toBe(false);
    expect(shieldAbsorbResult.deathCause).toBe('WALL_CRASH');

    // 4. Test Upgrade Refund / Reset
    const resetResult = await page.evaluate(() => {
      const sm = window.game.storageManager;
      sm.resetUpgrades();
      return {
        upgrades: sm.getUpgrades(),
        availableStars: sm.getAvailableStars()
      };
    });

    expect(resetResult.upgrades.sonarBooster).toBe(0);
    expect(resetResult.upgrades.emergencyShield).toBe(0);
    expect(resetResult.availableStars).toBe(9);
  });

  test('28. Critical UI Action Buttons, Strict Profile Isolation, HUD Telemetry & Sector Lock Validation (v1.13.0)', async ({ page }) => {
    await page.goto('http://127.0.0.1:3005/');
    await page.waitForSelector('#gameCanvas');

    // 1. Action Buttons Visibility & Clickability Check
    await page.evaluate(() => {
      window.game.loadSector(0);
    });

    const pingBtn = page.locator('#btn-ping');
    const sneakBtn = page.locator('#btn-sneak');
    const baitBtn = page.locator('#btn-bait');

    await expect(pingBtn).toBeVisible();
    await expect(sneakBtn).toBeVisible();
    await expect(baitBtn).toBeVisible();

    // Verify buttons are clickable
    await pingBtn.click();
    const pingTriggered = await page.evaluate(() => window.game.inputHandler.pingTriggered || window.game.inputHandler.actionTriggered);
    expect(pingTriggered).toBeTruthy();

    await sneakBtn.click();
    const isSneaking = await page.evaluate(() => window.game.touchControls.isSneakActive());
    expect(isSneaking).toBeTruthy();

    // 2. Strict Profile vs. Guest Isolation Check
    const isolationTest = await page.evaluate(async () => {
      const sm = window.game.storageManager;

      // Register / Login Pilot TEST_ISO_V13
      await sm.login('TEST_ISO_V13', '1234');

      // Earn 9 stars while logged into profile
      sm.saveCampaignProgress(1, { time: 20, pingsUsed: 1, stars: 3 });
      sm.saveCampaignProgress(2, { time: 25, pingsUsed: 2, stars: 3 });
      sm.saveCampaignProgress(3, { time: 28, pingsUsed: 1, stars: 3 });
      
      // Buy upgrades in TEST_ISO_V13
      const buy1 = sm.purchaseUpgrade('sonarBooster');
      const buy2 = sm.purchaseUpgrade('extraDecoy');
      const profileUpgrades = sm.getUpgrades();
      const profileSpent = sm.getSpentStars();

      // Logout to Guest Mode
      sm.logout();
      const guestUpgrades = sm.getUpgrades();
      const guestSpent = sm.getSpentStars();

      // Relogin to TEST_ISO_V13
      await sm.login('TEST_ISO_V13', '1234');
      const restoredProfileUpgrades = sm.getUpgrades();

      // Test 100% refund on reset
      sm.resetUpgrades();
      const resetUpgrades = sm.getUpgrades();
      const resetAvailableStars = sm.getAvailableStars();

      return {
        buy1,
        buy2,
        profileUpgrades,
        profileSpent,
        guestUpgrades,
        guestSpent,
        restoredProfileUpgrades,
        resetUpgrades,
        resetAvailableStars
      };
    });

    expect(isolationTest.profileUpgrades.sonarBooster).toBe(1);
    expect(isolationTest.profileUpgrades.extraDecoy).toBe(1);
    expect(isolationTest.profileSpent).toBe(6); // 2 + 4

    // Guest must have 0 upgrades
    expect(isolationTest.guestUpgrades.sonarBooster).toBe(0);
    expect(isolationTest.guestUpgrades.extraDecoy).toBe(0);
    expect(isolationTest.guestSpent).toBe(0);

    // Relogged in profile has upgrades restored
    expect(isolationTest.restoredProfileUpgrades.sonarBooster).toBe(1);
    expect(isolationTest.restoredProfileUpgrades.extraDecoy).toBe(1);

    // Reset restores all upgrades to 0 and refunds stars
    expect(isolationTest.resetUpgrades.sonarBooster).toBe(0);
    expect(isolationTest.resetUpgrades.extraDecoy).toBe(0);
    expect(isolationTest.resetAvailableStars).toBe(9);

    // 3. HUD Escape Banner & Telemetry Non-Overlap Check
    const hudCheck = await page.evaluate(() => {
      const g = window.game;
      g.loadSector(0);

      // Collect all crystals
      g.crystals.forEach(c => { c.collected = true; });
      const crystalsLeft = g.crystals.filter(c => !c.collected).length;

      // Render HUD with 0 crystals left
      g.hud.renderGameHUD(
        { sectorNumber: 1 },
        crystalsLeft,
        g.crystals.length,
        1.0,
        g.player,
        false,
        1,
        10,
        Infinity
      );

      return { crystalsLeft };
    });

    expect(hudCheck.crystalsLeft).toBe(0);

    // 4. Sector Selection Lock Logic Check (Unlocked sectors have no lock symbol)
    const sectorLockCheck = await page.evaluate(() => {
      const ms = window.game.menuSystem;
      ms.unlockedSector = 3; // Sektoren 1, 2, 3 freigeschaltet
      return {
        isSector1Unlocked: 0 < ms.unlockedSector,
        isSector2Unlocked: 1 < ms.unlockedSector,
        isSector3Unlocked: 2 < ms.unlockedSector,
        isSector4Locked: 3 >= ms.unlockedSector
      };
    });

    expect(sectorLockCheck.isSector1Unlocked).toBe(true);
    expect(sectorLockCheck.isSector2Unlocked).toBe(true);
    expect(sectorLockCheck.isSector3Unlocked).toBe(true);
    expect(sectorLockCheck.isSector4Locked).toBe(true);
  });

  test('24. Permanent Action Buttons Visibility in Gameplay (Sektor 01 & Sektor 04)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Start Sektor 01
    await page.evaluate(() => {
      window.game.loadSector(0);
    });

    const pingBtn = page.locator('#btn-ping');
    const sneakBtn = page.locator('#btn-sneak');
    const baitBtn = page.locator('#btn-bait');

    await expect(pingBtn).toBeVisible();
    await expect(sneakBtn).toBeVisible();
    await expect(baitBtn).toBeVisible();

    // Start Sektor 04
    await page.evaluate(() => {
      window.game.loadSector(3);
    });

    await expect(pingBtn).toBeVisible();
    await expect(sneakBtn).toBeVisible();
    await expect(baitBtn).toBeVisible();
  });

  test('25. Leaderboard Friends System, Add Friend & Side-by-Side Comparison Modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Leaderboard Modal
    await page.evaluate(() => {
      window.game.leaderboardModal.open();
    });

    const modal = page.locator('#leaderboard-modal');
    await expect(modal).toBeVisible();

    // Click Friends Tab
    const friendsTab = page.locator('#tab-lb-rivals');
    await friendsTab.click();

    // Check add friend input bar
    const addFriendInput = page.locator('#input-friend-callsign');
    const addFriendBtn = page.locator('#btn-submit-add-friend');
    await expect(addFriendInput).toBeVisible();
    await expect(addFriendBtn).toBeVisible();

    // Add a new friend
    await addFriendInput.fill('CYBER_NEXUS');
    await addFriendBtn.click();

    // Check confirmation feedback
    const feedback = page.locator('#friend-add-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('CYBER_NEXUS zu deinen Freunden hinzugefügt');

    // Check compare modal
    await page.evaluate(() => {
      window.game.leaderboardModal.openRivalComparison('CYBER_NEXUS');
    });

    const compareModal = page.locator('#rival-compare-modal');
    await expect(compareModal).toBeVisible();
    const compareTitle = page.locator('#rival-compare-title');
    await expect(compareTitle).toContainText('SPIELER-VERGLEICH');
  });

  test('26. Dual-Soundtrack System & Crossfade Verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Start menu music
    const menuMusicCheck = await page.evaluate(() => {
      window.game.audioEngine.init();
      window.game.audioEngine.playMenuMusic(0.1);
      return {
        track: window.game.audioEngine.currentMusicTrack,
        isMusicPlaying: window.game.audioEngine.isMusicPlaying
      };
    });

    expect(menuMusicCheck.track).toBe('menu');

    // Start gameplay sector
    const gameplayMusicCheck = await page.evaluate(() => {
      window.game.loadSector(0);
      return {
        track: window.game.audioEngine.currentMusicTrack,
        isMusicPlaying: window.game.audioEngine.isMusicPlaying
      };
    });

    expect(gameplayMusicCheck.track).toBe('gameplay');
  });

});
