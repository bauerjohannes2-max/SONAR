import { test, expect } from '@playwright/test';

test.describe('SONAR v1.3.0 E2E Feature Validation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => {
      localStorage.setItem('sonar_first_launch', 'true');
    });
  });

  test('1. Version Endpoint & JSON Integrity', async ({ request }) => {
    const response = await request.get('/version.json');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.version).toBe('1.3.0');
    expect(data.build).toBe(20260816);
  });

  test('2. Settings: D-Pad vs Joystick Toggle & Scale Presets', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Settings via gear button
    await page.click('#btn-settings-gear');
    await expect(page.locator('#settings-modal')).toBeVisible();

    // Check version text
    await expect(page.locator('#settings-version-label')).toHaveText('v1.3.0');

    // Toggle to D-PAD
    await page.click('#btn-ctrl-dpad');
    await expect(page.locator('#btn-ctrl-dpad')).toHaveClass(/active/);
    await expect(page.locator('#btn-ctrl-joystick')).not.toHaveClass(/active/);

    // Toggle back to JOYSTICK
    await page.click('#btn-ctrl-joystick');
    await expect(page.locator('#btn-ctrl-joystick')).toHaveClass(/active/);

    // Test Scale Button (125%)
    const btn125 = page.locator('.btn-scale-step[data-scale="1.25"]');
    await btn125.click();
    await expect(btn125).toHaveClass(/active/);
    await expect(page.locator('#val-touch-scale')).toHaveText('125%');

    // Test Update Check Button
    await page.click('#btn-check-updates');
    await page.waitForTimeout(400);
    const updateMsg = page.locator('#update-status-msg');
    await expect(updateMsg).toContainText('v1.3.0');

    // Close settings modal
    await page.click('#modal-settings-close-btn');
    await expect(page.locator('#settings-modal')).not.toBeVisible();
  });

  test('3. Interactive Touch Layout Customizer: Drag, Drop & Persistence', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Settings -> Touch Layout Editor
    await page.click('#btn-settings-gear');
    await page.click('#btn-open-touch-editor');

    // Verify Editor Overlay is open
    const editor = page.locator('#touch-layout-editor');
    await expect(editor).toBeVisible();

    // Drag Movement item
    const moveItem = page.locator('#editor-elem-move');
    await expect(moveItem).toBeVisible();

    const boxBefore = await moveItem.boundingBox();
    expect(boxBefore).not.toBeNull();

    // Perform drag & drop
    await page.mouse.move(boxBefore.x + 20, boxBefore.y + 20);
    await page.mouse.down();
    await page.mouse.move(boxBefore.x + 80, boxBefore.y - 60, { steps: 5 });
    await page.mouse.up();

    // Save and Exit Editor
    await page.click('#btn-editor-save');
    await expect(editor).not.toBeVisible();

    // Verify localStorage has persisted custom layout
    const savedConfigRaw = await page.evaluate(() => localStorage.getItem('sonar_touch_config'));
    expect(savedConfigRaw).not.toBeNull();
    const savedConfig = JSON.parse(savedConfigRaw);
    expect(savedConfig.positions).toBeDefined();
    expect(savedConfig.positions.movement).toBeDefined();
    expect(savedConfig.positions.movement.x).toBeGreaterThan(0);
  });

  test('4. Tutorial Ghost-Click Protection: 350ms Debounce', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Open Tutorial directly
    await page.evaluate(() => {
      window.game.openTutorial();
    });

    // Wait for tutorial opening transition guard (600ms) to clear
    await page.waitForTimeout(650);

    // Check that game is in TUTORIAL state
    const isTutorial = await page.evaluate(() => window.game && window.game.gameState === 'TUTORIAL');
    expect(isTutorial).toBeTruthy();

    const initialCard = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    expect(initialCard).toBe(0);

    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    expect(canvasBox).not.toBeNull();
    const clickX = canvasBox.x + (580 / 800) * canvasBox.width;
    const clickY = canvasBox.y + (495 / 576) * canvasBox.height;

    // Simulate rapid multi-click on Next Button (x: 580, y: 495)
    await page.mouse.click(clickX, clickY);
    await page.mouse.click(clickX, clickY);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(100);

    // Due to 350ms debounce lock, it should advance exactly 1 card to index 1
    const cardAfterRapidClicks = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    expect(cardAfterRapidClicks).toBe(1);

    // Further rapid direct calls to nextCard within 350ms window must be blocked
    await page.evaluate(() => {
      window.game.tutorialModal.nextCard();
      window.game.tutorialModal.nextCard();
      window.game.tutorialModal.nextCard();
    });
    const cardStillOne = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    expect(cardStillOne).toBe(1);

    // Wait past debounce time (400ms)
    await page.waitForTimeout(400);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(100);
    const cardAfterDebounce = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    expect(cardAfterDebounce).toBe(2);

    // Close tutorial
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const isMenu = await page.evaluate(() => window.game.gameState === 'MENU');
    expect(isMenu).toBeTruthy();
  });

  test('5. Post-Mortem Death-Reveal: 1.5s Delay Before Game-Over', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Start Campaign Sector 01
    await page.keyboard.press('Enter'); // Campaign select
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter'); // Start Sector 1

    await page.waitForTimeout(200);
    const isPlaying = await page.evaluate(() => window.game && window.game.gameState === 'PLAYING');
    expect(isPlaying).toBeTruthy();

    // Trigger drone collision
    await page.evaluate(() => {
      window.game.onGameOver('WALL_CRASH');
    });

    // Check state immediately switches to DYING
    const stateImmediately = await page.evaluate(() => window.game.gameState);
    expect(stateImmediately).toBe('DYING');

    const deathTimer = await page.evaluate(() => window.game.deathTimer);
    expect(deathTimer).toBeGreaterThan(0.5);

    // Wait 700ms - still in DYING phase (death reveal active)
    await page.waitForTimeout(700);
    const stateMidway = await page.evaluate(() => window.game.gameState);
    expect(stateMidway).toBe('DYING');

    // Wait remaining duration to complete 1.5s
    await page.waitForTimeout(1000);
    const stateFinal = await page.evaluate(() => window.game.gameState);
    expect(stateFinal).toBe('GAME_OVER');
  });

  test('6. Virtual Analog Joystick Interaction & Movement Dispatch', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gameCanvas');

    // Start sector
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Ensure Joystick is visible in game
    await page.evaluate(() => {
      window.game.touchControls.isTouchDevice = true;
      window.game.touchControls.setControlType('JOYSTICK');
      window.game.touchControls.setVisible(true);
    });

    const joystickContainer = page.locator('#touch-joystick-container');
    await expect(joystickContainer).toBeVisible();

    const baseBox = await page.locator('#joystick-base').boundingBox();
    expect(baseBox).not.toBeNull();

    const cx = baseBox.x + baseBox.width / 2;
    const cy = baseBox.y + baseBox.height / 2;

    // Drag joystick knob to the right
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 35, cy, { steps: 3 });

    // Verify touch direction set to { dx: 1, dy: 0 }
    const dir = await page.evaluate(() => window.game.inputHandler.touchHeldDirection);
    expect(dir).not.toBeNull();
    expect(dir.dx).toBe(1);
    expect(dir.dy).toBe(0);

    // Release joystick
    await page.mouse.up();
    await page.waitForTimeout(50);
    const dirAfterRelease = await page.evaluate(() => window.game.inputHandler.touchHeldDirection);
    expect(dirAfterRelease).toBeNull();
  });

});
