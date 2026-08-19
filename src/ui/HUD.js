/**
 * SONAR: The Echo Chamber
 * HUD & Tactical Overlay Manager (10-Sector Campaign & Mobile/PC Dual Edition)
 */

import { CONFIG } from '../config.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = CONFIG.CANVAS_WIDTH;
    this.height = CONFIG.CANVAS_HEIGHT;
  }

  /**
   * Main Gameplay Tactical HUD
   */
  /**
   * Main Gameplay Tactical HUD (Modern Cyber-Glassmorphism)
   */
  renderGameHUD(levelData, crystalsLeft, totalCrystals, pingCooldownRatio, player, isEndless = false, floor = 1, time = 0, stalkerDist = Infinity) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Top Cyber-Glassmorphism Header Banner
    ctx.fillStyle = 'rgba(6, 12, 22, 0.78)';
    ctx.fillRect(0, 0, this.width, 38);

    // Glowing 1px bottom border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(this.width, 38);
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    // 2. Element 1 (Left): Compact Sector Identifier
    const sectorTag = isEndless
      ? `ETAGE ${String(floor).padStart(2, '0')}`
      : (levelData ? `SEKTOR ${String(levelData.sectorNumber || 1).padStart(2, '0')}` : 'SEKTOR 01');
    ctx.textAlign = 'left';
    ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(sectorTag, 18, 19);

    // 3. Element 2 (Center): Core Objective / Crystal Count (Ultra-Clean, Zero Word Clutter)
    const pulseFactor = 0.75 + 0.25 * Math.sin((time || performance.now() * 0.001) * 6);
    const collected = totalCrystals - crystalsLeft;
    ctx.textAlign = 'center';

    if (crystalsLeft === 0) {
      // Escape ready: High visibility green
      ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#00FF88';
      ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
      ctx.shadowBlur = 10 * pulseFactor;
      ctx.fillText('FLUCHT BEREIT', this.width / 2, 19);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowBlur = 6 * pulseFactor;
      ctx.fillText(`◆ ${collected} / ${totalCrystals}`, this.width / 2, 19);
      ctx.shadowBlur = 0;
    }

    // 4. Element 3 (Right): Running Elapsed Timer (MM:SS.d)
    const elapsed = player && typeof player.timeElapsed === 'number' ? player.timeElapsed : (typeof time === 'number' ? time : 0);
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const tenths = Math.floor((elapsed % 1) * 10);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;

    // Position timer safely to the left of the 4 quick action icons on the far right
    const rightMargin = this.width - 150;
    ctx.textAlign = 'right';
    ctx.font = '700 12px "JetBrains Mono", "Chakra Petch", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(timeStr, rightMargin, 19);

    ctx.restore();
  }

  /**
   * Pause Menu Overlay
   */
  renderPauseMenu() {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(3, 7, 12, 0.92)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    ctx.font = '700 28px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.fillText('PAUSE • SYSTEM BEREIT', this.width / 2, 120);

    const buttons = [
      { text: 'WEITERSPIELEN', y: 200, color: CONFIG.COLORS.PLAYER },
      { text: 'LEVELAUSWAHL', y: 255, color: CONFIG.COLORS.CRYSTAL },
      { text: 'NEUSTART', y: 310, color: CONFIG.COLORS.TEXT_MAIN },
      { text: 'HAUPTMENÜ', y: 365, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }

  /**
   * Minimalist K.I.S.S. Game Over Screen
   */
  renderGameOver(time, sectorIndex, isEndless = false, floor = 1, deathCause = 'PREDATOR') {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(15, 2, 5, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    // 1. Title: SIGNAL VERLOREN
    ctx.font = '800 28px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.HUNTER;
    ctx.shadowColor = '#FF1E44';
    ctx.shadowBlur = 12;
    ctx.fillText('SIGNAL VERLOREN', this.width / 2, 125);
    ctx.shadowBlur = 0;

    // 2. Cause (1 clean short line: Wandkollision bzw. Feindkontakt)
    const causeText = deathCause === 'WALL_CRASH' ? 'Wandkollision' : 'Feindkontakt';
    ctx.font = '600 14px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff8899';
    ctx.fillText(causeText, this.width / 2, 172);

    // 3. Clean Text-Only Buttons (Zero Icons, Zero Shortcut Brackets)
    const buttons = [
      { text: 'NEUSTART', y: 240, color: CONFIG.COLORS.HUNTER },
      { text: 'LEVELAUSWAHL', y: 300, color: CONFIG.COLORS.CRYSTAL },
      { text: 'HAUPTMENÜ', y: 360, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(255, 42, 78, 0.1)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }

  /**
   * Sector Cleared Overlay with Rank Card
   */
  renderSectorCleared(time, currentSectorIndex, totalSectors, stats, isEndless = false, nextFloor = 2) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(2, 12, 8, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    ctx.font = '800 26px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
    const title = isEndless
      ? `ETAGE ${currentSectorIndex} BEREINIGT!`
      : `SEKTOR ${String(currentSectorIndex + 1).padStart(2, '0')} GESICHERT!`;
    ctx.fillText(title, this.width / 2, 70);

    // 3-Star Rating Display
    const stars = stats.stars || 1;
    const starIcons = (stars >= 3 ? '★ ★ ★' : (stars === 2 ? '★ ★ ☆' : '★ ☆ ☆'));

    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
    ctx.shadowBlur = 14;
    ctx.fillText(starIcons, this.width / 2, 115);
    ctx.shadowBlur = 0;

    // Performance Stats Box with Clear Criteria Breakdown
    const boxW = 460;
    const boxH = 120;
    const boxX = (this.width - boxW) / 2;
    const boxY = 145;

    ctx.fillStyle = '#061311';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = CONFIG.COLORS.CRYSTAL;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.font = '600 12px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    // Criteria 1: Evacuated
    ctx.fillStyle = '#00ff88';
    ctx.fillText('★ STERN 1: BERGUNG ERFOLGREICH (EVAKUIERT)  ✓', boxX + 20, boxY + 30);

    // Criteria 2: Speed (< 45s)
    const isSpeedy = stats.isSpeedy !== undefined ? stats.isSpeedy : stats.time <= 45;
    ctx.fillStyle = isSpeedy ? '#00ff88' : '#708898';
    ctx.fillText(`★ STERN 2: TEMPO-REKORD (${stats.time.toFixed(1)}s / ZIEL: ≤ 45s)  ${isSpeedy ? '✓' : '✗'}`, boxX + 20, boxY + 60);

    // Criteria 3: Stealth (<= 3 Pings)
    const isStealthy = stats.isStealthy !== undefined ? stats.isStealthy : stats.pingsUsed <= 3;
    ctx.fillStyle = isStealthy ? '#00ff88' : '#708898';
    ctx.fillText(`★ STERN 3: GHOST-MEISTERSCHAFT (${stats.pingsUsed} PINGS / MAX: 3)  ${isStealthy ? '✓' : '✗'}`, boxX + 20, boxY + 90);

    const nextActionLabel = isEndless
      ? 'NÄCHSTE ETAGE'
      : (currentSectorIndex + 1 < totalSectors
        ? 'NÄCHSTER SEKTOR'
        : 'KAMPAGNE BEENDET');

    const buttons = [
      { text: nextActionLabel, y: 325, color: CONFIG.COLORS.CRYSTAL },
      { text: 'LEVELAUSWAHL', y: 380, color: CONFIG.COLORS.PLAYER },
      { text: 'HAUPTMENÜ', y: 435, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 255, 170, 0.09)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }

  /**
   * Victory Screen for Campaign Finish
   */
  renderVictory(time) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(0, 8, 14, 0.95)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    ctx.font = '700 32px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.fillText('KAMPAGNE VOLLENDET', this.width / 2, 110);

    ctx.font = '600 13.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
    ctx.fillText('ALLE 10 SEKTOREN ERFOLGREICH BEREINIGT • APEX-STATUS ERREICHT', this.width / 2, 170);

    ctx.font = '500 12.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
    ctx.fillText('Sammle alle Sterne und werde zum ultimativen Piloten!', this.width / 2, 210);

    const buttons = [
      { text: 'LEVELAUSWAHL', y: 300, color: CONFIG.COLORS.CRYSTAL },
      { text: 'HAUPTMENÜ', y: 360, color: CONFIG.COLORS.PLAYER }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }
}
