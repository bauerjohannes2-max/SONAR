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

const PORT = 8095;
server.listen(PORT, async () => {
  console.log(`Test Server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 }, // iPhone Landscape
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForTimeout(600);

    // Close onboarding if open
    await page.evaluate(() => {
      if (window.game && window.game.onboardingModal && window.game.onboardingModal.isOpen) {
        window.game.onboardingModal.close();
        localStorage.setItem('sonar_first_launch', 'true');
      }
    });
    await page.waitForTimeout(200);

    // ========================================================
    // TEST 1: Tutorial Touch Debounce & Card-by-Card Switching
    // ========================================================
    console.log('\n=== TEST 1: Tutorial Touch Hard Debounce ===');
    await page.evaluate(() => {
      window.game.openTutorial();
    });
    await page.waitForTimeout(450); // Wait for grace period

    let cardIdx = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    console.log('Initial Tutorial Card Index:', cardIdx);
    if (cardIdx !== 0) throw new Error('Initial card should be 0');

    // Rapid double click (100ms apart)
    console.log('Executing rapid double-click on NEXT...');
    await page.evaluate(() => {
      window.game.tutorialModal.handleInput({
        getMovement: () => null,
        consumeEscape: () => false,
        consumeMouseClick: () => ({ x: 600, y: 500 }) // NEXT button
      });
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      window.game.tutorialModal.handleInput({
        getMovement: () => null,
        consumeEscape: () => false,
        consumeMouseClick: () => ({ x: 600, y: 500 }) // NEXT button again
      });
    });
    await page.waitForTimeout(100);

    cardIdx = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    console.log('Card Index after rapid clicks (must be 1):', cardIdx);
    if (cardIdx !== 1) throw new Error(`Expected card index 1, but got ${cardIdx} (double firing detected!)`);

    // Valid next click after 380ms
    await page.waitForTimeout(380);
    await page.evaluate(() => {
      window.game.tutorialModal.handleInput({
        getMovement: () => null,
        consumeEscape: () => false,
        consumeMouseClick: () => ({ x: 600, y: 500 })
      });
    });
    await page.waitForTimeout(100);
    cardIdx = await page.evaluate(() => window.game.tutorialModal.currentCardIndex);
    console.log('Card Index after second valid click (must be 2):', cardIdx);
    if (cardIdx !== 2) throw new Error(`Expected card index 2, but got ${cardIdx}`);

    // Close tutorial
    await page.evaluate(() => {
      window.game.gameState = 'MENU';
    });
    await page.waitForTimeout(200);

    // ========================================================
    // TEST 2: Post-Mortem Death-Reveal (1.5s Delay & Death Wave)
    // ========================================================
    console.log('\n=== TEST 2: Post-Mortem Death-Reveal ===');
    await page.evaluate(() => {
      window.game.loadSector(0);
    });
    await page.waitForTimeout(300);

    // Trigger wall crash death
    console.log('Triggering wall crash death...');
    await page.evaluate(() => {
      window.game.player.move(0, -1, window.game.gridMap, window.game.audioEngine, window.game.particleEngine);
    });

    const deathState = await page.evaluate(() => ({
      state: window.game.gameState,
      deathTimer: window.game.deathTimer,
      deathCause: window.game.deathCause,
      hasDeathWave: window.game.waveSystem.waves.some(w => w.type === 'DEATH')
    }));
    console.log('Immediate Post-Mortem State:', deathState);
    if (deathState.state !== 'DYING') throw new Error('Game state must be DYING immediately upon crash');
    if (!deathState.hasDeathWave) throw new Error('WaveSystem must emit a DEATH shockwave');
    if (deathState.deathTimer < 1.0) throw new Error('Death timer must start at 1.5s');

    // Wait 700ms (halfway through dying animation)
    await page.waitForTimeout(700);
    const midDeathState = await page.evaluate(() => ({
      state: window.game.gameState,
      deathTimer: window.game.deathTimer
    }));
    console.log('Mid-Death State (at ~700ms):', midDeathState);
    if (midDeathState.state !== 'DYING') throw new Error('Game state must STILL be DYING at 700ms');

    // Wait another 900ms (total > 1.5s)
    await page.waitForTimeout(900);
    const finalDeathState = await page.evaluate(() => ({
      state: window.game.gameState
    }));
    console.log('Final State after 1.5s expiry:', finalDeathState);
    if (finalDeathState.state !== 'GAME_OVER') throw new Error('Game state must transition to GAME_OVER after 1.5s');

    // ========================================================
    // TEST 3: Versioning & Live Update Checker
    // ========================================================
    console.log('\n=== TEST 3: Versioning & Live Update Checker ===');
    const versionConfig = await page.evaluate(() => window.game.CONFIG ? window.game.CONFIG.VERSION : '1.2.1');
    console.log('Config Version:', versionConfig);

    // Open Settings Modal
    await page.evaluate(() => {
      window.game.settingsModal.open(false);
    });
    await page.waitForTimeout(300);

    const updateBtnExists = await page.evaluate(() => !!document.getElementById('btn-check-updates'));
    console.log('Update Check Button Exists in Settings:', updateBtnExists);
    if (!updateBtnExists) throw new Error('Update Check Button #btn-check-updates not found in Settings modal');

    // Trigger update check
    console.log('Clicking Update Check Button...');
    await page.click('#btn-check-updates');
    await page.waitForTimeout(600);

    const updateStatusText = await page.evaluate(() => {
      const el = document.getElementById('update-status-msg');
      return el ? el.textContent : '';
    });
    console.log('Update Status Result:', updateStatusText);
    if (!updateStatusText.includes('VERSION IST AKTUELL')) {
      throw new Error(`Expected current version confirmation, got: ${updateStatusText}`);
    }

    console.log('\n=== ALL 3 TESTS (DEBOUNCE, DEATH-REVEAL, VERSION CHECKER) PASSED 100%! ===\n');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
