/**
 * SONAR: The Echo Chamber
 * HUD & Tactical Overlay Manager (10-Sector, Endless Echo & Mobile/PC Dual Edition)
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
  renderGameHUD(levelData, crystalsLeft, totalCrystals, pingCooldownRatio, player, isEndless = false, floor = 1) {
    const ctx = this.ctx;
    ctx.save();

    // Top Status Header Banner
    ctx.fillStyle = 'rgba(3, 3, 5, 0.88)';
    ctx.fillRect(0, 0, this.width, 36);

    ctx.strokeStyle = '#122332';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(this.width, 36);
    ctx.stroke();

    ctx.textBaseline = 'middle';

    // Sector / Endless Floor Title
    ctx.font = 'bold 12px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = isEndless ? CONFIG.COLORS.RESONATOR : CONFIG.COLORS.PLAYER;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 2;
    ctx.fillText(isEndless ? `ENDLESS ECHO // ETAGE ${String(floor).padStart(2, '0')}` : levelData.name, 16, 18);

    // Crystals Collected Status
    ctx.textAlign = 'center';
    ctx.fillStyle = crystalsLeft === 0 ? CONFIG.COLORS.CRYSTAL : CONFIG.COLORS.TEXT_MAIN;
    ctx.shadowColor = crystalsLeft === 0 ? CONFIG.COLORS.CRYSTAL : 'transparent';
    ctx.shadowBlur = crystalsLeft === 0 ? 2 : 0;
    const crystalText = crystalsLeft === 0
      ? '★ SCHLEUSE GEÖFFNET! FLÜCHTE ZUR EXTRAKTION ★'
      : `◆ KRISTALLE: ${totalCrystals - crystalsLeft} / ${totalCrystals}`;
    ctx.fillText(crystalText, this.width / 2, 18);

    // Right Side: Ping Cooldown + Decoy Counter + Sneak State
    ctx.textAlign = 'right';

    // Sneak indicator
    if (player && player.isSneaking) {
      ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
      ctx.shadowColor = CONFIG.COLORS.CRYSTAL;
      ctx.shadowBlur = 2;
      ctx.fillText('[SCHLEICHEN]', this.width - 320, 18);
    }

    // Decoy counter
    if (player) {
      ctx.fillStyle = player.decoysRemaining > 0 ? CONFIG.COLORS.DECOY : CONFIG.COLORS.TEXT_DIM;
      ctx.shadowColor = player.decoysRemaining > 0 ? CONFIG.COLORS.DECOY : 'transparent';
      ctx.shadowBlur = player.decoysRemaining > 0 ? 2 : 0;
      ctx.fillText(`KÖDER [E]: ${player.decoysRemaining}/1`, this.width - 200, 18);
    }

    // Ping Cooldown Text & Bar
    const pingSec = player ? player.getPingRemainingSeconds() : 0;
    const barW = 70;
    const barH = 8;
    const barX = this.width - barW - 16;
    const barY = 14;

    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillStyle = pingSec > 0 ? '#ff8899' : CONFIG.COLORS.PLAYER;
    ctx.shadowColor = pingSec > 0 ? '#ff4466' : CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 2;
    ctx.fillText(pingSec > 0 ? `PING: ${pingSec}s` : 'PING: BEREIT', barX - 10, 18);

    ctx.fillStyle = '#061520';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = pingCooldownRatio >= 1.0 ? CONFIG.COLORS.PLAYER : '#006677';
    ctx.fillRect(barX, barY, barW * Math.min(1.0, pingCooldownRatio), barH);

    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.restore();
  }

  /**
   * Pause Menu Overlay
   */
  renderPauseMenu() {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(3, 3, 5, 0.92)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 28px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 2;
    ctx.fillText('PAUSE // SYSTEM BEREIT', this.width / 2, 120);

    const buttons = [
      { text: '▶ WEITERSPIELEN [ESC / SPACE]', y: 200, color: CONFIG.COLORS.PLAYER },
      { text: '➔ LEVEL-ÜBERSICHT [L]', y: 255, color: CONFIG.COLORS.CRYSTAL },
      { text: '↺ SEKTOR-NEUSTART [R]', y: 310, color: CONFIG.COLORS.TEXT_MAIN },
      { text: '⎋ HAUPTMENÜ [M]', y: 365, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(this.width / 2 - 180, b.y - 18, 360, 36);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 180, b.y - 18, 360, 36);

      ctx.font = 'bold 14px "Share Tech Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 1;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }

  /**
   * Game Over Screen
   */
  renderGameOver(time, sectorIndex, isEndless = false, floor = 1, deathCause = 'PREDATOR') {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(15, 2, 5, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 30px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.HUNTER;
    ctx.shadowColor = CONFIG.COLORS.HUNTER_GLOW;
    ctx.shadowBlur = 3;

    const title = deathCause === 'WALL_CRASH'
      ? 'DRONEN-KOLLISION // AN WAND ZERSCHELLT'
      : 'SIGNAL VERLOREN // ELIMINIERT';
    ctx.fillText(title, this.width / 2, 110);

    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.fillStyle = '#ff8899';
    ctx.shadowBlur = 0;
    const subText = deathCause === 'WALL_CRASH'
      ? 'Die Drohne hält Wandaufprallen nicht stand! Nutze Pings [SPACE] & bewege dich vorsichtig.'
      : (isEndless
        ? `Drohne auf Etage ${floor} zerstört // Raubtier-Kontakt`
        : `Drohne in Sektor 0${sectorIndex + 1} zerstört // Raubtier-Kontakt`);
    ctx.fillText(subText, this.width / 2, 160);

    const buttons = [
      { text: '↺ SEKTOR-NEUSTART [R / SPACE]', y: 240, color: CONFIG.COLORS.HUNTER },
      { text: '➔ LEVEL-ÜBERSICHT [L]', y: 300, color: CONFIG.COLORS.CRYSTAL },
      { text: '⎋ HAUPTMENÜ [M]', y: 360, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(255, 42, 78, 0.1)';
      ctx.fillRect(this.width / 2 - 180, b.y - 18, 360, 36);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 180, b.y - 18, 360, 36);

      ctx.font = 'bold 14px "Share Tech Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 1;
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

    ctx.font = 'bold 30px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
    ctx.shadowColor = CONFIG.COLORS.CRYSTAL_GLOW;
    ctx.shadowBlur = 18;
    const title = isEndless
      ? `ETAGE ${currentSectorIndex} BEREINIGT!`
      : `SEKTOR 0${currentSectorIndex + 1} GESICHERT!`;
    ctx.fillText(title, this.width / 2, 75);

    // Rank Badge
    const rank = stats.rank || 'A';
    ctx.font = 'bold 48px "Share Tech Mono", monospace';
    ctx.fillStyle = rank === 'S' ? '#FFE600' : (rank === 'A' ? CONFIG.COLORS.CRYSTAL : CONFIG.COLORS.PLAYER);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.fillText(`RANG [ ${rank} ]`, this.width / 2, 140);

    // Performance Stats Box
    const boxW = 400;
    const boxH = 110;
    const boxX = (this.width - boxW) / 2;
    const boxY = 180;

    ctx.fillStyle = '#061311';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = CONFIG.COLORS.CRYSTAL;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = CONFIG.COLORS.CRYSTAL_GLOW;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.shadowBlur = 0;

    ctx.fillText(`• EINSATZDAUER : ${stats.time.toFixed(1)} s`, boxX + 30, boxY + 30);
    ctx.fillText(`• SONAR-PINGS  : ${stats.pingsUsed}`, boxX + 30, boxY + 58);
    ctx.fillText(`• SCHRITTE     : ${stats.stepsTaken}`, boxX + 30, boxY + 86);

    const nextActionLabel = isEndless
      ? '▶ NÄCHSTE ETAGE [SPACE / ENTER]'
      : (currentSectorIndex + 1 < totalSectors
        ? '▶ NÄCHSTER SEKTOR [SPACE / ENTER]'
        : '★ KAMPAGNE BEENDET [SPACE] ★');

    const buttons = [
      { text: nextActionLabel, y: 325, color: CONFIG.COLORS.CRYSTAL },
      { text: '➔ LEVEL-ÜBERSICHT [L]', y: 380, color: CONFIG.COLORS.PLAYER },
      { text: '⎋ HAUPTMENÜ [M]', y: 435, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 255, 170, 0.09)';
      ctx.fillRect(this.width / 2 - 180, b.y - 18, 360, 36);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 180, b.y - 18, 360, 36);

      ctx.font = 'bold 14px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
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

    ctx.font = 'bold 34px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 24;
    ctx.fillText('KAMPAGNE VOLLENDET', this.width / 2, 110);

    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
    ctx.shadowBlur = 8;
    ctx.fillText('ALLE 10 SEKTOREN ERFOLGREICH BEREINIGT // APEX-STATUS ERREICHT', this.width / 2, 170);

    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
    ctx.shadowBlur = 0;
    ctx.fillText('Teste deine Fähigkeiten im unendlichen Roguelike "ENDLESS ECHO".', this.width / 2, 210);

    const buttons = [
      { text: '➔ LEVEL-ÜBERSICHT [L]', y: 300, color: CONFIG.COLORS.CRYSTAL },
      { text: '⎋ HAUPTMENÜ [M / SPACE]', y: 360, color: CONFIG.COLORS.PLAYER }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(this.width / 2 - 180, b.y - 18, 360, 36);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 180, b.y - 18, 360, 36);

      ctx.font = 'bold 14px "Share Tech Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }
}
