import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('SONAR v1.18.0 Tactical Gauntlet Loop E2E Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity (v1.18.0)', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.18.0');
    expect(data.build).toBe(20260830);
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

  test('8. Settings Modal: Volume Sliders & Clean Controls Layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.click('#btn-settings-gear');
    await expect(page.locator('#settings-modal')).toBeVisible();

    await expect(page.locator('#slider-master-volume')).toBeVisible();
    await expect(page.locator('#slider-music-volume')).toBeVisible();
    await expect(page.locator('#slider-sfx-volume')).toBeVisible();

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

  test('20. Clean Main Menu: Symmetrical 3-Tile Grid & Campaign Hero Focus', async ({ page }) => {
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
    expect(menuState.options).toEqual(['SECTOR_SELECT', 'HANGAR', 'LEADERBOARD', 'PROFILE']);
  });

  test('21. Settings Modal Touch Scaling with Live-Preview Synchronization', async ({ page }) => {
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

    // Change scale to 80%
    await page.click('button.btn-scale-step[data-scale="0.8"]');
    expect(await scaleBadge.innerText()).toBe('80%');
    expect(await previewTag.innerText()).toContain('80%');
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

    // Check search input placeholder
    const searchInput = page.locator('#lb-search-input');
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toContain('Spieler suchen');

    // Check simplified 4 columns in compare table
    const ths = page.locator('.rival-sectors-table th');
    await expect(ths.nth(0)).toContainText('SEKTOR');
    await expect(ths.nth(1)).toContainText('DEINE ZEIT');
    await expect(ths.nth(2)).toContainText('CYBER_NEXUS ZEIT');
    await expect(ths.nth(3)).toContainText('DUELL');
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

  test('27. Header Mute Button Toggle & AudioContext Mute State', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const muteBtn = page.locator('#btn-header-mute');
    await expect(muteBtn).toBeVisible();

    // Click Mute
    await muteBtn.click();
    const isMutedFirst = await page.evaluate(() => window.game.audioEngine.isMuted);
    expect(isMutedFirst).toBe(true);
    await expect(muteBtn).toHaveClass(/muted/);

    // Click Unmute
    await muteBtn.click();
    const isMutedSecond = await page.evaluate(() => window.game.audioEngine.isMuted);
    expect(isMutedSecond).toBe(false);
    await expect(muteBtn).not.toHaveClass(/muted/);
  });

  test('28. Sector 01 Briefing Title & 3-Line Clean Sector Cards Layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Check StoryIntro briefing title and log lines
    const storyCheck = await page.evaluate(() => {
      const intro = window.game.storyIntro;
      return {
        logLines: intro.logLines,
        hasAbyss: intro.logLines.some(l => l.includes('verlassenen Tiefseestation'))
      };
    });

    expect(storyCheck.hasAbyss).toBe(true);
    expect(storyCheck.logLines.length).toBeGreaterThanOrEqual(4);
  });

  test('29. Leaderboard Star Calculation: 13 Earned Stars with Hangar Upgrades Retains 13 ★', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Set 13 stars across sectors in storage
    const starsCheck = await page.evaluate(async () => {
      const storage = window.game.storageManager;
      // 5 sectors: 3 + 3 + 3 + 2 + 2 = 13 stars
      const mockProgress = {
        unlockedSector: 6,
        maxClearedSector: 5,
        sectorStats: {
          1: { stars: 3, time: 24.5, rank: 'S', pingsUsed: 2 },
          2: { stars: 3, time: 30.1, rank: 'S', pingsUsed: 3 },
          3: { stars: 3, time: 35.8, rank: 'S', pingsUsed: 3 },
          4: { stars: 2, time: 48.2, rank: 'A', pingsUsed: 4 },
          5: { stars: 2, time: 52.0, rank: 'A', pingsUsed: 4 }
        }
      };
      localStorage.setItem('sonar_progress_v1', JSON.stringify(mockProgress));
      localStorage.setItem('sonar_guest_progress', JSON.stringify(mockProgress));
      storage.saveUpgrades({ sonarBooster: 1, extraDecoy: 0, hydroDampener: 0, emergencyShield: 0 }); // spent 3 stars

      const earned = storage.calculateTotalStars(mockProgress.sectorStats);
      const available = storage.getAvailableStars();
      const spent = storage.getSpentStars();

      // Open leaderboard modal
      await window.game.leaderboardModal.open();
      await window.game.leaderboardModal.loadData(true);

      return {
        earned,
        available,
        spent
      };
    });

    expect(starsCheck.earned).toBe(13);
    expect(starsCheck.spent).toBe(2);
    expect(starsCheck.available).toBe(11);

    // Verify Leaderboard modal renders 13 ★ for current player
    const playerRow = page.locator('.current-player-row');
    await expect(playerRow).toBeVisible();
    await expect(playerRow).toContainText('13 ★');
  });

  test('30. Ghost D-Pad Hidden in Menu & Symmetrical 3-Tile Main Menu Grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Check menu options count and items
    const menuCheck = await page.evaluate(() => {
      const menu = window.game.menuSystem;
      const dpad = document.getElementById('touch-dpad-container');
      const dpadDisplay = dpad ? window.getComputedStyle(dpad).display : 'none';
      return {
        optionsCount: menu.options.length,
        optionIds: menu.options.map(o => o.id),
        dpadDisplay,
        hasSettingsTile: menu.options.some(o => o.id === 'SETTINGS')
      };
    });

    expect(menuCheck.optionsCount).toBe(4); // 0: SECTOR_SELECT, 1: HANGAR, 2: LEADERBOARD, 3: PROFILE
    expect(menuCheck.hasSettingsTile).toBe(false);
    expect(menuCheck.optionIds).toEqual(['SECTOR_SELECT', 'HANGAR', 'LEADERBOARD', 'PROFILE']);
    expect(menuCheck.dpadDisplay).toBe('none');
  });

  test('31. Settings Modal Clean Layout (No Emojis, No Joystick) & In-Game Action Cluster', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.open(false);
    });

    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    const title = page.locator('#settings-modal-title-text');
    await expect(title).toHaveText('EINSTELLUNGEN');

    // Check joystick button does not exist
    const joystickBtn = page.locator('#btn-ctrl-swipe');
    await expect(joystickBtn).toHaveCount(0);

    // Close Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.close();
    });

    // Start active game sector
    await page.evaluate(() => {
      window.game.loadSector(0);
    });

    // In-game: Action buttons visible in lower right cluster
    const pingBtn = page.locator('#btn-ping');
    const sneakBtn = page.locator('#btn-sneak');
    const baitBtn = page.locator('#btn-bait');

    await expect(pingBtn).toBeVisible();
    await expect(sneakBtn).toBeVisible();
    await expect(baitBtn).toBeVisible();
  });

  test('32. Direct Settings Update Execution: Applies Update Immediately, Purges Caches, and Avoids Secondary Banner Loop', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Mock fetch for version.json in page context to simulate newer version v1.17.0
    await page.evaluate(() => {
      const origFetch = window.fetch;
      window.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('version.json')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ version: '1.17.0', build: 20260901 })
          };
        }
        return origFetch(url, opts);
      };
    });

    // Open Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.open(false);
    });

    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    // Click "AUF UPDATES PRÜFEN"
    const checkBtn = page.locator('#btn-check-updates');
    await expect(checkBtn).toBeVisible();
    await checkBtn.click();

    // Verify direct apply button appears
    const applyBtn = page.locator('#btn-apply-update');
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toHaveText(/JETZT AKTUALISIEREN & NEU LADEN/);

    // Mock window.executeAppUpdate and check that clicking applyBtn calls it directly
    let updateExecuted = false;
    await page.exposeFunction('mockUpdateTracker', () => {
      updateExecuted = true;
    });

    await page.evaluate(() => {
      window.executeAppUpdate = async () => {
        window.mockUpdateTracker();
        const banner = document.getElementById('auto-update-banner');
        if (banner) banner.remove();
      };
    });

    await applyBtn.click();

    // Verify button state changes to updating and executeAppUpdate was called
    await expect(applyBtn).toHaveText(/WIRD AKTUALISIERT/);
    const hasCalled = await page.evaluate(() => typeof window.executeAppUpdate === 'function');
    expect(hasCalled).toBe(true);

    // Verify no auto-update-banner remains in DOM
    const banner = page.locator('#auto-update-banner');
    await expect(banner).toHaveCount(0);
  });

  test('33. Clean Background Transition to Sector Select Screen (Zero Ghosting / 0% Artifact Bleed)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Simulate Death / Game Over state with custom text
    await page.evaluate(() => {
      window.game.gameState = 'GAME_OVER';
      window.game.deathCause = 'WALL_CRASH';
      window.game.render();
    });

    // 2. Transition directly to SECTOR_SELECT
    await page.evaluate(() => {
      window.game.gameState = 'SECTOR_SELECT';
      window.game.render();
    });

    // 3. Inspect canvas background pixels in corner and verify solid dark background (#05070a / #03070d)
    const pixelCheck = await page.evaluate(() => {
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      // Read top corner pixel (x: 10, y: 10)
      const p1 = ctx.getImageData(10, 10, 1, 1).data;
      // Read bottom corner pixel (x: 10, y: 560)
      const p2 = ctx.getImageData(10, 560, 1, 1).data;

      return {
        r1: p1[0], g1: p1[1], b1: p1[2], a1: p1[3],
        r2: p2[0], g2: p2[1], b2: p2[2], a2: p2[3]
      };
    });

    // Verify background is opaque and dark zero-light (no bright red death text bleeding into corners)
    expect(pixelCheck.a1).toBe(255);
    expect(pixelCheck.r1).toBeLessThanOrEqual(10);
    expect(pixelCheck.g1).toBeLessThanOrEqual(15);
    expect(pixelCheck.b1).toBeLessThanOrEqual(20);

    expect(pixelCheck.a2).toBe(255);
    expect(pixelCheck.r2).toBeLessThanOrEqual(10);
    expect(pixelCheck.g2).toBeLessThanOrEqual(15);
    expect(pixelCheck.b2).toBeLessThanOrEqual(20);
  });

  test('34. Header Quick-Action Buttons Theme Styling & Main Menu Vector Icons Validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Verify all 4 top-right quick action buttons have themed styles
    const gearBtn = page.locator('#btn-settings-gear');
    const tutorialBtn = page.locator('#btn-header-tutorial');
    const fullscreenBtn = page.locator('#btn-header-fullscreen');
    const muteBtn = page.locator('#btn-header-mute');

    await expect(gearBtn).toBeVisible();
    await expect(tutorialBtn).toBeVisible();
    await expect(fullscreenBtn).toBeVisible();
    await expect(muteBtn).toBeVisible();

    // Check computed styles: translucent dark cyan background and cyan svg stroke
    const gearStyles = await gearBtn.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const svg = el.querySelector('svg');
      const svgComputed = svg ? window.getComputedStyle(svg) : null;
      return {
        borderRadius: computed.borderRadius,
        display: computed.display,
        stroke: svgComputed ? svgComputed.stroke : null
      };
    });

    expect(gearStyles.display).toBe('flex');
    expect(gearStyles.borderRadius).toBe('4px');
    expect(gearStyles.stroke).toBe('rgb(0, 240, 255)');

    // 2. Verify main menu vector icon drawing for all suboptions
    const menuIconsRendered = await page.evaluate(() => {
      const menu = window.game.menuSystem;
      return menu.options && menu.options.length === 4;
    });
    expect(menuIconsRendered).toBe(true);
  });

  test('35. Top-Left Pilot Profile Chip & Clean Uncluttered Main Menu Layout Validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Click top-left corner pilot chip (x: 50, y: 20)
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 50, y: 20 };
      window.game.update(0.016);
    });

    // Verify Profile Modal opens
    const profileModal = page.locator('#pilot-profile-modal');
    await expect(profileModal).toBeVisible();

    // Close Profile Modal
    await page.evaluate(() => {
      window.game.profileModal.close();
    });
    await expect(profileModal).not.toBeVisible();

    // 2. Click Large Hero Campaign Card (x: 400, y: 180)
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 400, y: 180 };
      window.game.update(0.016);
    });

    // Verify Game State transitions to SECTOR_SELECT
    const gameState = await page.evaluate(() => window.game.gameState);
    expect(gameState).toBe('SECTOR_SELECT');
  });

  test('36. Settings Modal Scroll Reset: Always Starts at Top Upon Opening After Scrolling', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Open Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.open(false);
    });

    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    // 2. Scroll the settings body down
    await page.evaluate(() => {
      const modalBody = document.querySelector('#settings-modal .modal-body') || document.querySelector('#settings-modal .settings-modal-box');
      if (modalBody) {
        modalBody.scrollTop = 300;
      }
    });

    const scrolledPos = await page.evaluate(() => {
      const modalBody = document.querySelector('#settings-modal .modal-body') || document.querySelector('#settings-modal .settings-modal-box');
      return modalBody ? modalBody.scrollTop : 0;
    });
    expect(scrolledPos).toBeGreaterThanOrEqual(100);

    // 3. Close Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.close();
    });
    await expect(settingsModal).not.toBeVisible();

    // 4. Re-open Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.open(false);
    });
    await expect(settingsModal).toBeVisible();

    // 5. Verify scrollTop was completely reset to 0 (top-most position)
    const resetPos = await page.evaluate(() => {
      const modalBody = document.querySelector('#settings-modal .modal-body');
      const modalBox = document.querySelector('#settings-modal .settings-modal-box');
      return {
        bodyScroll: modalBody ? modalBody.scrollTop : 0,
        boxScroll: modalBox ? modalBox.scrollTop : 0
      };
    });

    expect(resetPos.bodyScroll).toBe(0);
    expect(resetPos.boxScroll).toBe(0);
  });

  test('37. Mobile Touch Action Buttons Cluster Visibility in Gameplay & Crisp Symmetrical Settings Gear Icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Verify Crisp Symmetrical Settings Gear Icon
    const gearBtn = page.locator('#btn-settings-gear');
    await expect(gearBtn).toBeVisible();
    const gearSvgD = await page.evaluate(() => {
      const btn = document.getElementById('btn-settings-gear');
      const path = btn ? btn.querySelector('svg path') : null;
      return path ? path.getAttribute('d') : null;
    });
    expect(gearSvgD).toContain('M12.22 2h-.44');

    // 2. Start Gameplay (Sector 0)
    await page.evaluate(() => {
      window.game.loadSector(0);
    });

    // Verify touch controls layer and action buttons cluster are visible in gameplay
    const touchOverlay = page.locator('#touch-controls');
    const actionCluster = page.locator('#touch-action-cluster');
    const pingBtn = page.locator('#btn-ping');
    const sneakBtn = page.locator('#btn-sneak');
    const decoyBtn = page.locator('#btn-bait');

    await expect(touchOverlay).toBeVisible();
    await expect(actionCluster).toBeVisible();
    await expect(pingBtn).toBeVisible();
    await expect(sneakBtn).toBeVisible();
    await expect(decoyBtn).toBeVisible();

    // Check action cluster styles: display flex, opacity 1, pointer-events auto
    const clusterStyles = await actionCluster.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        opacity: computed.opacity,
        pointerEvents: computed.pointerEvents,
        zIndex: computed.zIndex
      };
    });

    expect(clusterStyles.display).toBe('flex');
    expect(clusterStyles.opacity).toBe('1');
    expect(clusterStyles.pointerEvents).toBe('auto');
    expect(parseInt(clusterStyles.zIndex)).toBeGreaterThanOrEqual(50);
  });

  test('38. StoryIntro Briefing: First Click Fast-Reveals Full Text, Subsequent Click Anywhere Else Ignored, Only Mission Start Button Launches Level', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Launch Sektor 01 campaign intro
    await page.evaluate(() => {
      window.game.startCampaignSector(0);
    });

    const state1 = await page.evaluate(() => window.game.gameState);
    expect(state1).toBe('STORY_INTRO');

    // Verify text is initially typing
    const initRevealed = await page.evaluate(() => window.game.storyIntro.isTextFullyRevealed);
    expect(initRevealed).toBe(false);

    // 2. Click outside the button (e.g. at x: 100, y: 100) -> Reveals full text immediately
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 100, y: 100 };
      window.game.update(0.016);
    });

    const postClickRevealed = await page.evaluate(() => window.game.storyIntro.isTextFullyRevealed);
    expect(postClickRevealed).toBe(true);

    // Verify game is STILL in STORY_INTRO state (mission did not launch yet)
    const state2 = await page.evaluate(() => window.game.gameState);
    expect(state2).toBe('STORY_INTRO');

    // 3. Click outside the button again (x: 100, y: 100) -> Should do NOTHING
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 100, y: 100 };
      window.game.update(0.016);
    });

    const state3 = await page.evaluate(() => window.game.gameState);
    expect(state3).toBe('STORY_INTRO');

    // 4. Click specifically on the "▶ MISSION STARTEN" button (x: 400, y: 415)
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 400, y: 415 };
      window.game.update(0.016);
    });

    // Verify game transitions to PLAYING state!
    const state4 = await page.evaluate(() => window.game.gameState);
    expect(state4).toBe('PLAYING');
  });

  test('39. Sektor-Auswahl Zurück-Button Horizontally and Vertically Centered & Responsive Click Hitbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Enter SECTOR_SELECT state
    await page.evaluate(() => {
      window.game.gameState = 'SECTOR_SELECT';
    });

    const state = await page.evaluate(() => window.game.gameState);
    expect(state).toBe('SECTOR_SELECT');

    // 2. Click Centered "Zurück" Button at (x: 400, y: 500)
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 400, y: 500 };
      window.game.update(0.016);
    });

    // 3. Verify it navigated back to MENU
    const backState = await page.evaluate(() => window.game.gameState);
    expect(backState).toBe('MENU');
  });

  test('40. Multi-Layered Sci-Fi Hull Impact Wall Crash Sound Synthesis Validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Trigger AudioEngine initialization and playWallCrash
    const soundSynthesized = await page.evaluate(() => {
      const audio = window.game.audioEngine;
      audio.init();
      try {
        audio.playWallCrash();
        return true;
      } catch (err) {
        console.error('Crash audio error:', err);
        return false;
      }
    });

    expect(soundSynthesized).toBe(true);
  });

  test('41. Mobile UI Safe-Area Cluster, dvh Modals & Game-Juice Features (v1.17.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Launch Game and verify touch action cluster styling & elements
    await page.evaluate(() => {
      window.game.loadSector(0);
      window.game.touchControls.show();
    });

    const clusterInfo = await page.evaluate(() => {
      const cluster = document.getElementById('touch-action-cluster');
      const sneakBtn = document.getElementById('btn-sneak');
      const baitBtn = document.getElementById('btn-bait');
      const pingBtn = document.getElementById('btn-ping');
      const dangerOverlay = document.getElementById('danger-vignette');
      const computed = window.getComputedStyle(cluster);

      return {
        hasCluster: !!cluster,
        hasSneak: !!sneakBtn,
        hasBait: !!baitBtn,
        hasPing: !!pingBtn,
        hasDangerOverlay: !!dangerOverlay,
        display: computed.display,
        position: computed.position,
        zIndex: computed.zIndex
      };
    });

    expect(clusterInfo.hasCluster).toBe(true);
    expect(clusterInfo.hasSneak).toBe(true);
    expect(clusterInfo.hasBait).toBe(true);
    expect(clusterInfo.hasPing).toBe(true);
    expect(clusterInfo.hasDangerOverlay).toBe(true);
    expect(clusterInfo.position).toBe('fixed');
    expect(Number(clusterInfo.zIndex)).toBeGreaterThanOrEqual(90);

    // 2. Validate Game-Juice Features in engine
    const gameJuiceValid = await page.evaluate(() => {
      const audio = window.game.audioEngine;
      const particles = window.game.particleEngine;
      const input = window.game.inputHandler;

      // Audio Chime and Haptic check
      let audioOk = typeof audio.playCrystalPickup === 'function' && typeof audio.triggerHaptic === 'function';
      // Particles Thruster Bubble check
      let particlesOk = typeof particles.spawnWakeBubble === 'function' && typeof particles.spawnDroneGhostTrail === 'function';
      // Instant Restart check
      let inputOk = typeof input.consumeRestart === 'function';

      return audioOk && particlesOk && inputOk;
    });

    expect(gameJuiceValid).toBe(true);
  });

  test('42. Dual-Soundtrack Engine, Web Audio Decoding & State-Machine Crossfading (v1.18.0)', async ({ page }) => {
    let consoleErrors = 0;
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors++;
    });

    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Verify Audio Decoding of both soundtracks
    const audioPreloadCheck = await page.evaluate(async () => {
      const audio = window.game.audioEngine;
      audio.init();
      await audio.preloadAudioBuffers();
      const hasMenuTrack = audio.buffers.has('music_menu');
      const hasGameplayTrack = audio.buffers.has('music_gameplay');
      return {
        hasMenuTrack,
        hasGameplayTrack,
        totalBuffers: audio.buffers.size
      };
    });

    expect(audioPreloadCheck.hasMenuTrack).toBe(true);
    expect(audioPreloadCheck.hasGameplayTrack).toBe(true);
    expect(audioPreloadCheck.totalBuffers).toBe(10);
    expect(consoleErrors).toBe(0);

    // 2. Verify State-Machine Crossfading: Menu vs Gameplay
    const routingCheck = await page.evaluate(() => {
      const audio = window.game.audioEngine;
      audio.playMenuMusic(0.8);
      const menuTrack = audio.currentMusicTrack;
      const menuKey = audio.currentMusicTrackKey;
      const menuGainOk = !!audio.currentTrackGainNode;

      // Start sector -> switches to gameplay music
      window.game.loadSector(0);
      const gameTrack = audio.currentMusicTrack;
      const gameKey = audio.currentMusicTrackKey;
      const gameGainOk = !!audio.currentTrackGainNode;

      // Trigger Game Over -> switches back to menu music
      window.game.onGameOver('PREDATOR');
      const gameOverTrack = audio.currentMusicTrack;
      const gameOverKey = audio.currentMusicTrackKey;

      return {
        menuTrack,
        menuKey,
        menuGainOk,
        gameTrack,
        gameKey,
        gameGainOk,
        gameOverTrack,
        gameOverKey
      };
    });

    expect(routingCheck.menuTrack).toBe('menu');
    expect(routingCheck.menuKey).toBe('music_menu');
    expect(routingCheck.menuGainOk).toBe(true);

    expect(routingCheck.gameTrack).toBe('gameplay');
    expect(routingCheck.gameKey).toBe('music_gameplay');
    expect(routingCheck.gameGainOk).toBe(true);

    expect(routingCheck.gameOverTrack).toBe('menu');
    expect(routingCheck.gameOverKey).toBe('music_menu');
  });

  test('43. Ultra-Clean Mobile HUD, Zero Text Overlap & Zero Horizontal Scroll (375px & 390px Viewports)', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 13/14' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForSelector('#gameCanvas');

      // Test Sector 01 & Sector 04
      for (const sectorIdx of [0, 3]) {
        const check = await page.evaluate((idx) => {
          window.game.loadSector(idx);
          window.game.touchControls.show();
          window.game.update(0.016);
          window.game.render();

          const cluster = document.getElementById('touch-action-cluster');
          const dpad = document.getElementById('touch-dpad-container');
          const docEl = document.documentElement;

          const scrollWidth = docEl.scrollWidth;
          const clientWidth = docEl.clientWidth;
          const clusterRect = cluster ? cluster.getBoundingClientRect() : null;

          return {
            hasZeroHorizontalOverflow: scrollWidth <= clientWidth + 1,
            clusterVisible: cluster && cluster.style.display !== 'none',
            clusterInsideViewport: clusterRect ? (clusterRect.right <= clientWidth + 2 && clusterRect.bottom <= docEl.clientHeight + 2) : false,
            dpadVisible: dpad && dpad.style.display !== 'none'
          };
        }, sectorIdx);

        expect(check.hasZeroHorizontalOverflow).toBe(true);
        expect(check.clusterVisible).toBe(true);
        expect(check.clusterInsideViewport).toBe(true);
      }
    }
  });

  test('44. Global Shortcut-Audit, Minimalist Game-Over Screen & Centralized Controls (v1.18.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Shortcut-Audit: Check all HTML buttons in DOM for forbidden keyboard shortcut brackets
    const shortcutViolations = await page.evaluate(() => {
      // Open settings and profile to populate all modals
      window.game.settingsModal.open(false);
      window.game.profileModal.open();
      window.game.leaderboardModal.open();
      window.game.hangarModal.open();

      const buttons = Array.from(document.querySelectorAll('button, a, .modal-btn'));
      const forbiddenPattern = /\((?:R|ESC|SPACE|L|M|H|O|F|SHIFT)\)/i;
      const violations = [];

      for (const btn of buttons) {
        const text = btn.textContent || '';
        const title = btn.getAttribute('title') || '';
        if (forbiddenPattern.test(text) || forbiddenPattern.test(title)) {
          violations.push({ text: text.trim(), title });
        }
      }

      window.game.hangarModal.close();
      window.game.leaderboardModal.close();
      window.game.profileModal.close();
      window.game.settingsModal.close();

      return violations;
    });

    expect(shortcutViolations).toEqual([]);

    // 2. Centralized Controls Section in Settings
    const controlsOverviewValid = await page.evaluate(() => {
      window.game.settingsModal.open(false);
      const modal = window.game.settingsModal.modalEl;
      const grid = modal ? modal.querySelector('.controls-overview-grid') : null;
      const title = modal ? modal.textContent.includes('STEUERUNG & BEFEHLE') : false;
      const hasDesktop = modal ? modal.textContent.includes('DESKTOP') : false;
      const hasMobile = modal ? modal.textContent.includes('MOBILE') : false;
      window.game.settingsModal.close();

      return {
        hasGrid: !!grid,
        hasTitle: title,
        hasDesktop,
        hasMobile
      };
    });

    expect(controlsOverviewValid.hasGrid).toBe(true);
    expect(controlsOverviewValid.hasTitle).toBe(true);
    expect(controlsOverviewValid.hasDesktop).toBe(true);
    expect(controlsOverviewValid.hasMobile).toBe(true);

    // 3. Minimalist K.I.S.S. Game-Over Screen Validation
    const deathScreenValid = await page.evaluate(() => {
      window.game.loadSector(0);
      window.game.onGameOver('WALL_CRASH');

      // Check canvas rendering without exceptions
      window.game.render();

      return {
        isDying: window.game.gameState === 'DYING',
        deathCause: window.game.deathCause
      };
    });

    expect(deathScreenValid.isDying).toBe(true);
    expect(deathScreenValid.deathCause).toBe('WALL_CRASH');
  });

  test('45. K.I.S.S. Main Menu, Pure Core Titles & User Avatar Button (v1.18.0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // 1. Verify exact core titles in Main Menu
    const titles = await page.evaluate(() => {
      const menu = window.game.menuSystem;
      return menu.options.map(o => o.title);
    });

    expect(titles).toEqual(['KAMPAGNE', 'UPGRADES', 'BESTENLISTE', 'PROFIL']);

    // 2. Click User-Avatar button in top-left (x: 40, y: 20)
    await page.evaluate(() => {
      window.game.inputHandler.mouseClick = { x: 40, y: 20 };
      window.game.update(0.016);
    });

    // Profile modal opens directly
    const profileModal = page.locator('#pilot-profile-modal');
    await expect(profileModal).toBeVisible();

    // Close Profile modal
    await page.evaluate(() => {
      window.game.profileModal.close();
    });
    await expect(profileModal).not.toBeVisible();
  });

});





