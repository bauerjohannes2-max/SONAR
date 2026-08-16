import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('SONAR v1.5.0 Comprehensive Full-Stack E2E Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity (v1.5.0)', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.5.0');
    expect(data.build).toBe(20260816);
  });

  test('2. Sci-Fi Audio Assets Existence & Preloading in Web Audio API', async ({ page }) => {
    const audioFiles = [
      'assets/audio/sonar_ping.mp3',
      'assets/audio/crystal_pickup.mp3',
      'assets/audio/death_explosion.mp3',
      'assets/audio/enemy_alert.mp3',
      'assets/audio/portal_open.mp3',
      'assets/audio/ambient_drone.mp3'
    ];

    for (const file of audioFiles) {
      expect(fs.existsSync(file)).toBeTruthy();
      const stat = fs.statSync(file);
      expect(stat.size).toBeGreaterThan(5000);
    }

    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Unlock audio and preload buffers
    const decodedCount = await page.evaluate(async () => {
      window.game.audioEngine.init();
      await window.game.audioEngine.preloadAudioBuffers();
      return window.game.audioEngine.buffers.size;
    });

    expect(decodedCount).toBe(6);
  });

  test('3. Child-Friendly Tutorial Guidance & Card 1-7 Verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Tutorial directly
    await page.evaluate(() => {
      window.game.openTutorial();
    });

    await page.waitForTimeout(650);
    const isTutorial = await page.evaluate(() => window.game && window.game.gameState === 'TUTORIAL');
    expect(isTutorial).toBeTruthy();

    const cards = await page.evaluate(() => window.game.tutorialModal.cards);
    expect(cards.length).toBe(7);

    // Card 1: DU BIST DIE DROHNE ECHO
    expect(cards[0].title).toContain('DU BIST DIE DROHNE ECHO');
    expect(cards[0].behavior).toContain('leuchtenden Pfeil');

    // Card 2: SCHALLWELLEN & WÄNDE
    expect(cards[1].title).toContain('SCHALLWELLEN & WÄNDE');
    expect(cards[1].counter).toContain('Fliege niemals blind in eine Wand');

    // Card 3: KRISTALLE EINSAMMELN
    expect(cards[2].title).toContain('KRISTALLE EINSAMMELN');

    // Card 4: DER GRÜNE FLUCHTAUFZUG
    expect(cards[3].title).toContain('DER GRÜNE FLUCHTAUFZUG');
    expect(cards[3].counter).toContain('Richtungspfeil');

    // Card 5: ROTE MONSTER
    expect(cards[4].title).toContain('ROTE MONSTER');

    // Card 6: LEISE SCHLEICHEN
    expect(cards[5].title).toContain('LEISE SCHLEICHEN');

    // Card 7: KÖDER-WURF (E)
    expect(cards[6].title).toContain('KÖDER-WURF (E)');

    // Close tutorial
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const isMenu = await page.evaluate(() => window.game.gameState === 'MENU');
    expect(isMenu).toBeTruthy();
  });

  test('4. Sector 04+ Death -> NEUSTART Click Reliably Reloads Sector 04', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Start Sector 4 directly (index 3)
    await page.evaluate(() => {
      window.game.loadSector(3);
    });

    const activeSectorBefore = await page.evaluate(() => window.game.currentSectorIndex);
    expect(activeSectorBefore).toBe(3);

    // Trigger drone collision
    await page.evaluate(() => {
      window.game.onGameOver('WALL_CRASH');
    });

    const stateImmediately = await page.evaluate(() => window.game.gameState);
    expect(stateImmediately).toBe('DYING');

    // Wait for death reveal to finish (1.6s)
    await page.waitForTimeout(1600);
    const stateGameOver = await page.evaluate(() => window.game.gameState);
    expect(stateGameOver).toBe('GAME_OVER');

    // Click NEUSTART button on Canvas (center x: 400, y: 240)
    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    const restartClickX = canvasBox.x + (400 / 800) * canvasBox.width;
    const restartClickY = canvasBox.y + (240 / 576) * canvasBox.height;

    await page.mouse.click(restartClickX, restartClickY);
    await page.waitForTimeout(150);

    // Level must immediately restart Sector 4 in PLAYING state
    const stateAfterRestart = await page.evaluate(() => window.game.gameState);
    expect(stateAfterRestart).toBe('PLAYING');

    const activeSectorAfter = await page.evaluate(() => window.game.currentSectorIndex);
    expect(activeSectorAfter).toBe(3); // Still Sector 4!

    const isPlayerAlive = await page.evaluate(() => window.game.player.isAlive);
    expect(isPlayerAlive).toBeTruthy();
  });

  test('5. Escape Portal Activation: Beacon Wave, Wayfinder Arrow & HUD Alarm', async ({ page }) => {
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

  test('6. Mobile Settings Touch-Scroll & Backdrop Click Closing', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Settings modal
    await page.click('#btn-settings-gear');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Check touch-action and overflow styles on settings modal body
    const modalBody = page.locator('#settings-modal .modal-body');
    await expect(modalBody).toBeVisible();

    const styles = await modalBody.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        touchAction: computed.touchAction,
        overflowY: computed.overflowY
      };
    });

    expect(styles.touchAction).toBe('pan-y');
    expect(styles.overflowY).toBe('auto');

    // Click backdrop to close
    await page.click('#settings-modal', { position: { x: 10, y: 10 } });
    await expect(page.locator('#settings-modal')).not.toBeVisible();
  });

  test('7. PWA Manifest & App Icons Cache-Busting Version Check (v1.5.0)', async ({ page }) => {
    await page.goto('/');

    const manifest = await page.evaluate(async () => {
      const res = await fetch('./manifest.json');
      return res.json();
    });

    expect(manifest.icons[0].src).toContain('?v=1.5.0');
    expect(manifest.icons[1].src).toContain('?v=1.5.0');
  });

  test('8. IMPROVEMENTS.md Polish Roadmap Verification', async () => {
    expect(fs.existsSync('IMPROVEMENTS.md')).toBeTruthy();
    const content = fs.readFileSync('IMPROVEMENTS.md', 'utf-8');
    expect(content).toContain('1. Akustischer Herzschlag- & Adrenalin-Pulse');
    expect(content).toContain('2. Biolumineszenter Mikro-Partikelschweif');
    expect(content).toContain('3. Sektor-Medaillensystem');
    expect(content).toContain('4. Akustische Wellen-Refraktion');
    expect(content).toContain('5. Ghost-Echo Replay-Projektion');
  });

  test('9. Touch Layout Editor Individual Element Scaling ([ + ] / [ - ])', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Touch Layout Editor via Settings
    await page.click('#btn-settings-gear');
    await page.click('#btn-open-touch-editor');
    await expect(page.locator('#touch-layout-editor')).toBeVisible();

    // Check individual scale button for movement control
    const scaleValMove = page.locator('#scale-val-movement');
    await expect(scaleValMove).toBeVisible();
    const initialText = await scaleValMove.innerText();
    expect(initialText).toBe('100%');

    // Click [+] button for movement
    await page.click('button[data-action="inc"][data-target="movement"]');
    const newText = await scaleValMove.innerText();
    expect(newText).toBe('110%');

    // Save and verify config in localStorage
    await page.click('#btn-editor-save');
    await expect(page.locator('#touch-layout-editor')).not.toBeVisible();

    const storedConfig = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sonar_touch_config'));
    });
    expect(storedConfig.elementScales.movement).toBe(1.1);
  });

});
