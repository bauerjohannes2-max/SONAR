import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('SONAR v1.8.0 Hydrodynamic Wake & Particle Physics E2E Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity (v1.8.0)', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.8.0');
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

});
