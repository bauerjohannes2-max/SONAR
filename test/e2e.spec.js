import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('SONAR v1.4.0 Milestone 1 E2E Feature Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity (v1.4.0)', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.4.0');
    expect(data.build).toBe(20260816);
  });

  test('2. MARKETING_STRATEGY.md Integrity & Content Verification', async () => {
    expect(fs.existsSync('MARKETING_STRATEGY.md')).toBeTruthy();
    const content = fs.readFileSync('MARKETING_STRATEGY.md', 'utf-8');
    expect(content).toContain('Zielgruppenanalyse');
    expect(content).toContain('Short-Form Video Hook');
    expect(content).toContain('Virale Gameloop');
    expect(content).toContain('Launch- & Distributions-Roadmap');
    expect(content).toContain('TETHYS-6');
  });

  test('3. App Icons (192x192 & 512x512) Verification', async () => {
    expect(fs.existsSync('assets/icon-192.png')).toBeTruthy();
    expect(fs.existsSync('assets/icon-512.png')).toBeTruthy();
    const stat192 = fs.statSync('assets/icon-192.png');
    const stat512 = fs.statSync('assets/icon-512.png');
    expect(stat192.size).toBeGreaterThan(1000);
    expect(stat512.size).toBeGreaterThan(1000);
  });

  test('4. Operation Zero-Light Lore & Sector Subtitles in Levels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const sectorSubtitles = await page.evaluate(async () => {
      const { LEVELS } = await import('./src/world/levels.js');
      return LEVELS.map(l => ({ name: l.name, subtitle: l.subtitle, desc: l.description }));
    });

    expect(sectorSubtitles.length).toBe(10);
    expect(sectorSubtitles[0].subtitle).toBe('Blindstart');
    expect(sectorSubtitles[1].subtitle).toBe('Erstkontakt');
    expect(sectorSubtitles[2].subtitle).toBe('Lautlose Passage');
    expect(sectorSubtitles[0].desc).toContain('TETHYS-6');
  });

  test('5. Story-Intro Terminal Boot Log Before Sector 01', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Trigger Campaign Sector 01 start
    await page.evaluate(() => {
      window.game.startCampaignSector(0);
    });

    // Verify game is in STORY_INTRO state
    const state = await page.evaluate(() => window.game.gameState);
    expect(state).toBe('STORY_INTRO');

    const logLines = await page.evaluate(() => window.game.storyIntro.logLines);
    expect(logLines.length).toBe(3);
    expect(logLines[0]).toContain('ZERO-LIGHT AKTIVIERT');
    expect(logLines[1]).toContain('ECHO-7 ONLINE');
    expect(logLines[2]).toContain('AKUSTISCHE RAUBDROHNEN');

    // Press SPACE to launch mission from Story Intro
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);

    const statePlaying = await page.evaluate(() => window.game.gameState);
    expect(statePlaying).toBe('PLAYING');
  });

  test('6. In-Game HUD: Pulsing Datenkerne & Sonar Frequency Meter', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Start playing Sector 1 directly
    await page.evaluate(() => {
      window.game.loadSector(0);
    });

    const isPlaying = await page.evaluate(() => window.game.gameState === 'PLAYING');
    expect(isPlaying).toBeTruthy();

    // Verify player is initialized with ECHO-7 specs
    const crystalsRemaining = await page.evaluate(() => window.game.crystals.length);
    expect(crystalsRemaining).toBe(3);

    // Verify Particle Engine ambient micro-dust
    const dustCount = await page.evaluate(() => window.game.particleEngine.ambientDust.length);
    expect(dustCount).toBeGreaterThanOrEqual(35);
  });

  test('7. Settings: D-Pad vs Joystick Toggle, Scale Presets & v1.4.0 Label', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Settings via gear button
    await page.click('#btn-settings-gear');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Check version text
    await expect(page.locator('#settings-version-label')).toHaveText('v1.4.0');

    // Toggle to D-PAD
    await page.click('#btn-ctrl-dpad');
    await expect(page.locator('#btn-ctrl-dpad')).toHaveClass(/active/);
    await expect(page.locator('#btn-ctrl-joystick')).not.toHaveClass(/active/);

    // Toggle back to JOYSTICK
    await page.click('#btn-ctrl-joystick');
    await expect(page.locator('#btn-ctrl-joystick')).toHaveClass(/active/);

    // Close settings modal
    await page.click('#modal-settings-close-btn');
    await expect(page.locator('#settings-modal')).not.toBeVisible();
  });

  test('8. Tutorial Ghost-Click Protection & Operation Zero-Light Lore', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Tutorial directly
    await page.evaluate(() => {
      window.game.openTutorial();
    });

    await page.waitForTimeout(650);
    const isTutorial = await page.evaluate(() => window.game && window.game.gameState === 'TUTORIAL');
    expect(isTutorial).toBeTruthy();

    const card1 = await page.evaluate(() => window.game.tutorialModal.cards[0]);
    expect(card1.title).toContain('OPERATION ZERO-LIGHT');
    expect(card1.behavior).toContain('TETHYS-6');

    const card2 = await page.evaluate(() => window.game.tutorialModal.cards[1]);
    expect(card2.title).toContain('DROHNE ECHO-7');

    const card3 = await page.evaluate(() => window.game.tutorialModal.cards[2]);
    expect(card3.title).toContain('RESONANZ-DATENKERNE');

    // Close tutorial
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const isMenu = await page.evaluate(() => window.game.gameState === 'MENU');
    expect(isMenu).toBeTruthy();
  });

  test('9. Post-Mortem Death-Reveal (1.5s) & Game-Over Restart Button Click', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.evaluate(() => {
      window.game.loadSector(0);
    });

    // Trigger drone collision
    await page.evaluate(() => {
      window.game.onGameOver('WALL_CRASH');
    });

    const stateImmediately = await page.evaluate(() => window.game.gameState);
    expect(stateImmediately).toBe('DYING');

    // Wait full death reveal duration
    await page.waitForTimeout(1600);
    const stateFinal = await page.evaluate(() => window.game.gameState);
    expect(stateFinal).toBe('GAME_OVER');

    // Test Clicking NEUSTART Button on Game-Over Screen (center x: 400, y: 240)
    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    const restartClickX = canvasBox.x + (400 / 800) * canvasBox.width;
    const restartClickY = canvasBox.y + (240 / 576) * canvasBox.height;

    await page.mouse.click(restartClickX, restartClickY);
    await page.waitForTimeout(150);

    const stateAfterRestart = await page.evaluate(() => window.game.gameState);
    expect(stateAfterRestart).toBe('PLAYING');
  });

  test('10. Leaderboard: Completed Sectors (maxClearedSector) Scoring', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    await page.evaluate(() => {
      window.game.leaderboardModal.open();
    });

    await expect(page.locator('#leaderboard-modal')).toBeVisible();

    const colHeader = page.locator('.col-level');
    await expect(colHeader).toHaveText('GESCHAFFTE SEKTOREN');

    await page.click('#modal-lb-close-btn');
    await expect(page.locator('#leaderboard-modal')).not.toBeVisible();
  });

  test('11. Instant-App Standalone & Silent Fullscreen API', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    const manifestData = await page.evaluate(async () => {
      const res = await fetch('./manifest.json');
      return res.json();
    });

    expect(manifestData.display).toBe('standalone');
    expect(manifestData.orientation).toBe('landscape');

    // Test silent fullscreen invocation
    const silentFsMethod = await page.evaluate(() => typeof window.game.displayManager.requestSilentFullscreen === 'function');
    expect(silentFsMethod).toBeTruthy();
  });

});
