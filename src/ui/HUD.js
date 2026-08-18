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

    // 2. Top Left: Missionsziel with Pulsing Datenkern Symbol
    const pulseFactor = 0.75 + 0.25 * Math.sin((time || performance.now() * 0.001) * 6);
    const collected = totalCrystals - crystalsLeft;

    ctx.textAlign = 'left';
    ctx.font = '700 12.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = crystalsLeft === 0 ? '#00FF88' : `rgba(0, 255, 136, ${pulseFactor})`;
    ctx.fillText('◆', 14, 19);

    ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = crystalsLeft === 0 ? '#00FF88' : '#e0f8ff';
    const sectorTag = isEndless ? `ETAGE ${String(floor).padStart(2, '0')}` : (levelData ? `SEKTOR 0${levelData.sectorNumber || 1}` : 'MISSION');
    ctx.fillText(`${sectorTag} • DATENKERNE: ${collected} / ${totalCrystals}`, 28, 19);

    // 3. Center Info: Dedicated Non-Overlapping Banner Slot vs Telemetry Bar
    ctx.textAlign = 'center';

    if (crystalsLeft === 0) {
      // Dedicated High-Visibility Escape Banner (replaces telemetry without overlapping)
      ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#00FF88';
      ctx.shadowColor = 'rgba(0, 255, 136, 0.7)';
      ctx.shadowBlur = 10 * pulseFactor;
      ctx.fillText('FLUCHTAUFZUG OFFEN • ZUR EVAKUIERUNGS-ZONE FLIEGEN', this.width / 2 - 20, 19);
      ctx.shadowBlur = 0;
    } else {
      // Modern Cyber-Telemetry Bar
      const sectorNum = levelData ? (levelData.sectorNumber || 1) : 1;
      const depth = isEndless ? (3000 + floor * 350) : (3800 + sectorNum * 200);
      const depthFormatted = depth.toLocaleString('de-DE');
      const pressure = Math.round(depth / 10);
      const statusText = (player && player.isSneaking) ? 'STEALTH' : 'NORMAL';

      const maxDecoys = (player && player.maxDecoys) ? player.maxDecoys : 1;
      const decoys = player ? player.decoysRemaining : 0;
      const shield = (player && player.hasShield) ? (player.shieldActive ? ' | SCHILD: AKTIV' : ' | SCHILD: OFF') : '';

      ctx.font = '600 11px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#8da8b8';
      ctx.fillText(`TIEFE: ${depthFormatted}m | DRUCK: ${pressure} BAR | STATUS: ${statusText} | KÖDER: ${decoys}/${maxDecoys}${shield}`, this.width / 2 - 20, 19);
    }

    // 4. Top Right: Animated Sonar-Frequenzbalken & Pulse Ready with Stalker Distortion
    const pingSec = player ? player.getPingRemainingSeconds() : 0;
    const isReady = pingCooldownRatio >= 1.0;
    const barW = 60;
    const barH = 8;
    let barX = this.width - 150 - barW; // Leaves 150px safe margin for HTML quick-action buttons
    let barY = 15;

    // Calculate Stalker Electromagnetic Distortion Factor (0.0 to 1.0)
    const isDistorted = stalkerDist < 220;
    const distortionFactor = isDistorted ? Math.max(0, Math.min(1, (220 - stalkerDist) / 180)) : 0;

    let jitterX = 0;
    let jitterY = 0;
    if (distortionFactor > 0) {
      jitterX = (Math.random() - 0.5) * 7 * distortionFactor;
      jitterY = (Math.random() - 0.5) * 3 * distortionFactor;
    }

    ctx.textAlign = 'right';
    ctx.font = '700 11px "Chakra Petch", "JetBrains Mono", monospace';

    // Label Rendering (with glitch chromatic text offset when distorted)
    let labelText = isReady ? 'PULSE READY' : `PING: ${pingSec}s`;
    if (distortionFactor > 0.6 && Math.random() < 0.3) {
      labelText = 'STÖRUNG';
    }

    if (distortionFactor > 0) {
      // Chromatic text aberration (Magenta / Cyan split)
      ctx.fillStyle = `rgba(255, 0, 180, ${0.7 * distortionFactor})`;
      ctx.fillText(labelText, barX - 8 + jitterX + 2, 19 + jitterY);
      ctx.fillStyle = `rgba(0, 240, 255, ${0.7 * distortionFactor})`;
      ctx.fillText(labelText, barX - 8 + jitterX - 2, 19 + jitterY);
    }

    if (isReady) {
      ctx.fillStyle = distortionFactor > 0 ? '#ff88ff' : `rgba(0, 240, 255, ${pulseFactor})`;
      ctx.fillText(labelText, barX - 8 + jitterX, 19 + jitterY);
    } else {
      ctx.fillStyle = '#ff7788';
      ctx.fillText(labelText, barX - 8 + jitterX, 19 + jitterY);
    }

    // VHS Scanline Glitch Chromatic Bars
    if (distortionFactor > 0) {
      // Magenta Ghost Bar
      ctx.fillStyle = `rgba(255, 0, 160, ${0.45 * distortionFactor})`;
      ctx.fillRect(barX + jitterX - 2, barY + jitterY - 1, barW * Math.min(1.0, pingCooldownRatio), barH);

      // Cyan Ghost Bar
      ctx.fillStyle = `rgba(0, 240, 255, ${0.45 * distortionFactor})`;
      ctx.fillRect(barX + jitterX + 2, barY + jitterY + 1, barW * Math.min(1.0, pingCooldownRatio), barH);
    }

    // Frequency Meter Background
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.fillRect(barX + jitterX, barY + jitterY, barW, barH);

    // Frequency Meter Fill
    ctx.fillStyle = distortionFactor > 0.4 ? '#ff00ff' : (isReady ? '#00FF88' : '#00F0FF');
    ctx.fillRect(barX + jitterX, barY + jitterY, barW * Math.min(1.0, pingCooldownRatio), barH);

    // Frequency Meter Border
    ctx.strokeStyle = distortionFactor > 0.3 ? '#ff00bb' : 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + jitterX, barY + jitterY, barW, barH);

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
      { text: '▶ WEITERSPIELEN (ESC / SPACE)', y: 200, color: CONFIG.COLORS.PLAYER },
      { text: '➔ LEVEL-ÜBERSICHT (L)', y: 255, color: CONFIG.COLORS.CRYSTAL },
      { text: '↺ SEKTOR-NEUSTART (R)', y: 310, color: CONFIG.COLORS.TEXT_MAIN },
      { text: '⎋ HAUPTMENÜ (M)', y: 365, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 13.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = b.color;
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
    ctx.shadowBlur = 0;

    // 10. Todesursachen-Stempel (Distressed Military Warning Stamp)
    ctx.save();
    ctx.translate(this.width / 2, 58);
    ctx.rotate(-0.04);

    const stampText = deathCause === 'WALL_CRASH'
      ? 'STATUS: WAND-KOLLISION'
      : 'STATUS: DURCH JÄGER DESTABILISIERT';

    ctx.font = '800 12.5px "Share Tech Mono", "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(stampText).width;

    ctx.fillStyle = 'rgba(255, 30, 68, 0.18)';
    ctx.fillRect(-textWidth / 2 - 14, -14, textWidth + 28, 28);

    ctx.strokeStyle = '#FF1E44';
    ctx.lineWidth = 2;
    ctx.strokeRect(-textWidth / 2 - 14, -14, textWidth + 28, 28);

    ctx.shadowColor = '#FF1E44';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FF5577';
    ctx.fillText(stampText, 0, 1);
    ctx.restore();

    ctx.font = '700 26px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.HUNTER;

    const title = deathCause === 'WALL_CRASH'
      ? 'DROHNEN-KOLLISION • AN WAND ZERSCHELLT'
      : 'SIGNAL VERLOREN • ELIMINIERT';
    ctx.fillText(title, this.width / 2, 114);

    ctx.font = '500 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff8899';
    const subText = deathCause === 'WALL_CRASH'
      ? 'Die Drohne hält Wandaufprallen nicht stand! Nutze Pings (SPACE) & bewege dich vorsichtig.'
      : (isEndless
        ? `Drohne auf Etage ${floor} zerstört • Feindkontakt`
        : `Drohne in Sektor 0${sectorIndex + 1} zerstört • Feindkontakt`);
    ctx.fillText(subText, this.width / 2, 162);

    const buttons = [
      { text: '↺ SEKTOR-NEUSTART (R / SPACE)', y: 240, color: CONFIG.COLORS.HUNTER },
      { text: '➔ LEVEL-ÜBERSICHT (L)', y: 300, color: CONFIG.COLORS.CRYSTAL },
      { text: '⎋ HAUPTMENÜ (M)', y: 360, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(255, 42, 78, 0.1)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 13.5px "Chakra Petch", "JetBrains Mono", monospace';
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
      : `SEKTOR 0${currentSectorIndex + 1} GESICHERT!`;
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
      ? '▶ NÄCHSTE ETAGE (SPACE / ENTER)'
      : (currentSectorIndex + 1 < totalSectors
        ? '▶ NÄCHSTER SEKTOR (SPACE / ENTER)'
        : '★ KAMPAGNE BEENDET (SPACE) ★');

    const buttons = [
      { text: nextActionLabel, y: 325, color: CONFIG.COLORS.CRYSTAL },
      { text: '➔ LEVEL-ÜBERSICHT (L)', y: 380, color: CONFIG.COLORS.PLAYER },
      { text: '⎋ HAUPTMENÜ (M)', y: 435, color: CONFIG.COLORS.TEXT_DIM }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 255, 170, 0.09)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 13.5px "Chakra Petch", "JetBrains Mono", monospace';
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
      { text: '➔ LEVEL-ÜBERSICHT (L)', y: 300, color: CONFIG.COLORS.CRYSTAL },
      { text: '⎋ HAUPTMENÜ (M / SPACE)', y: 360, color: CONFIG.COLORS.PLAYER }
    ];

    buttons.forEach((b) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(this.width / 2 - 190, b.y - 22, 380, 44);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.width / 2 - 190, b.y - 22, 380, 44);

      ctx.font = '700 13.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, this.width / 2, b.y);
    });

    ctx.restore();
  }
}
