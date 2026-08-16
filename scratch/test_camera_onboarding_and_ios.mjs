import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(projectRoot, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 8096;
server.listen(PORT, async () => {
  console.log(`Test Server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({ headless: true });

  try {
    // ==========================================
    // TEST 1: First-Time Onboarding & Tutorial Debounce
    // ==========================================
    console.log('\n=== TEST 1: First-Time Launch Onboarding ===');
    const context1 = await browser.newContext({
      viewport: { width: 844, height: 390 }, // iPhone landscape
      isMobile: true,
      hasTouch: true,
    });
    const page1 = await context1.newPage();
    page1.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page1.on('pageerror', err => console.log('PAGE ERROR:', err));
    await page1.goto(`http://localhost:${PORT}`);
    await page1.waitForTimeout(600);

    // Verify Onboarding Modal is displayed
    const onboardingDisplay = await page1.evaluate(() => {
      const el = document.getElementById('modal-onboarding');
      return el ? window.getComputedStyle(el).display : 'none';
    });
    console.log('Onboarding Modal Display:', onboardingDisplay);
    if (onboardingDisplay !== 'flex') throw new Error('Onboarding Modal should be open on first launch');

    // Screenshot Onboarding
    await page1.screenshot({ path: path.join(__dirname, '..', 'onboarding_popup.png') });
    console.log('Saved Onboarding Popup Screenshot');

    // Tap "TUTORIAL STARTEN"
    await page1.click('#btn-onboarding-start');
    const immediateState = await page1.evaluate(() => window.game.gameState);
    console.log('Immediate state after click:', immediateState);
    await page1.waitForTimeout(600);

    const gameStateAfterStartTutorial = await page1.evaluate(() => window.game.gameState);
    console.log('Game state after starting tutorial from onboarding:', gameStateAfterStartTutorial);
    if (gameStateAfterStartTutorial !== 'TUTORIAL') throw new Error('Game should be in TUTORIAL state');

    // Test Tutorial Debounce (Simulate rapid double clicks on "NÄCHSTE")
    console.log('Testing iOS touch debounce on tutorial next card...');
    const initialCard = await page1.evaluate(() => window.game.tutorialModal.currentCardIndex);
    console.log('Initial Card Index (0-indexed):', initialCard); // Expected 0 (Karte 1)

    // Rapid double click at NEXT button coordinates (x: 600, y: 500 in virtual coordinates)
    await page1.evaluate(() => {
      window.game.tutorialModal.handleInput({
        getMovement: () => null,
        consumeEscape: () => false,
        consumeMouseClick: () => ({ x: 600, y: 500 })
      });
      // Immediate second click (within 10ms)
      window.game.tutorialModal.handleInput({
        getMovement: () => null,
        consumeEscape: () => false,
        consumeMouseClick: () => ({ x: 600, y: 500 })
      });
    });
    await page1.waitForTimeout(100);

    const cardAfterDebounceClick = await page1.evaluate(() => window.game.tutorialModal.currentCardIndex);
    console.log('Card Index after rapid double-click:', cardAfterDebounceClick); // Expected 1 (Karte 2), NOT 2!
    if (cardAfterDebounceClick !== 1) throw new Error(`Card skipped! Expected 1, got ${cardAfterDebounceClick}`);

    // Screenshot Tutorial Modal
    await page1.screenshot({ path: path.join(__dirname, '..', 'tutorial_centered_modal.png') });
    console.log('Saved Centered Tutorial Modal Screenshot');

    // Close tutorial
    await page1.evaluate(() => {
      window.game.gameState = 'MENU';
      window.game.menuSystem.triggerTutorialPulse(8000);
    });
    await page1.waitForTimeout(300);

    // Screenshot Menu with pulsing tutorial indicator
    await page1.screenshot({ path: path.join(__dirname, '..', 'menu_tutorial_pulse.png') });
    console.log('Saved Menu Tutorial Pulse Screenshot');

    // ==========================================
    // TEST 2: Centered Player Camera & Floating Touch Controls
    // ==========================================
    console.log('\n=== TEST 2: Centered Player Camera & Floating Controls ===');
    await page1.evaluate(() => {
      window.game.loadSector(0); // Load Sector 01
    });
    await page1.waitForTimeout(400);

    const isPlaying = await page1.evaluate(() => window.game.gameState);
    console.log('Game state in Sector 01:', isPlaying);

    const initialPlayerPos = await page1.evaluate(() => ({
      x: window.game.player.x,
      y: window.game.player.y,
      camX: window.game.renderer.camera.x,
      camY: window.game.renderer.camera.y
    }));
    console.log('Initial Player & Camera Position:', initialPlayerPos);

    // Check touch controls are floating (display: flex, pointer-events: none on wrapper, auto on buttons)
    const touchOverlayStyle = await page1.evaluate(() => {
      const overlay = document.getElementById('touch-controls');
      const dpad = document.getElementById('touch-dpad-container');
      const ping = document.getElementById('touch-ping');
      return {
        overlayDisplay: window.getComputedStyle(overlay).display,
        overlayPointerEvents: window.getComputedStyle(overlay).pointerEvents,
        dpadPointerEvents: window.getComputedStyle(dpad).pointerEvents,
        pingPointerEvents: window.getComputedStyle(ping).pointerEvents,
      };
    });
    console.log('Floating Touch Controls Computed Styles:', touchOverlayStyle);
    if (touchOverlayStyle.overlayDisplay !== 'flex') throw new Error('Touch controls should be visible in gameplay');
    if (touchOverlayStyle.dpadPointerEvents !== 'auto') throw new Error('D-Pad must accept touch input');

    // Move player multiple tiles
    await page1.evaluate(() => {
      window.game.inputHandler.setTouchDirection(1, 0); // Move Right
    });
    await page1.waitForTimeout(400);

    await page1.evaluate(() => {
      window.game.inputHandler.setTouchDirection(0, 1); // Move Down
    });
    await page1.waitForTimeout(400);

    await page1.evaluate(() => {
      window.game.inputHandler.clearTouchDirection();
    });
    await page1.waitForTimeout(200);

    const movedPlayerPos = await page1.evaluate(() => ({
      x: window.game.player.x,
      y: window.game.player.y,
      camX: window.game.renderer.camera.x,
      camY: window.game.renderer.camera.y,
      camDistance: Math.sqrt((window.game.player.x - window.game.renderer.camera.x)**2 + (window.game.player.y - window.game.renderer.camera.y)**2)
    }));
    console.log('Moved Player & Smooth Camera Position:', movedPlayerPos);
    if (movedPlayerPos.camDistance > 25) throw new Error('Camera failed to track player');

    // Test Sneak Mode & Visual Aura
    console.log('Testing Sneak Toggle...');
    await page1.tap('#touch-sneak');
    await page1.waitForTimeout(200);

    const isSneakingActive = await page1.evaluate(() => window.game.player.isSneaking);
    console.log('Player Sneaking State after tap:', isSneakingActive);
    if (!isSneakingActive) throw new Error('Player sneak mode should be active');

    // Screenshot In-Game Centered Camera & Floating Controls
    await page1.screenshot({ path: path.join(__dirname, '..', 'ingame_camera_centered.png') });
    console.log('Saved Ingame Camera Centered Screenshot');

    console.log('\n=== ALL ONBOARDING, CAMERA & TOUCH TESTS PASSED 100%! ===\n');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
