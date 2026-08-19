/**
 * SONAR: The Echo Chamber
 * Sci-Fi Terminal Menu System (Modern Hero Layout, Campaign Focus, Glassmorphism Pilot Bar)
 */

import { CONFIG } from '../config.js';
import { LEVELS } from '../world/levels.js';
import { storageManager } from '../services/StorageManager.js';

export class MenuSystem {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.selectedIndex = 0; // 0: Campaign, 1: Leaderboard, 2: Profile, 3: Settings
    this.selectedSectorIndex = 0;
    this.unlockedSector = 1;
    this.maxClearedSector = 0;
    this.sectorStats = {};

    this.options = [
      // 0. Hero Campaign Element
      {
        id: 'SECTOR_SELECT',
        title: 'KAMPAGNE • SEKTOREN 01–10',
        description: 'Taktische Stealth-Bergung in 10 handgebauten Labyrinthen',
        tag: '10 SEKTOREN',
        desc: 'Station ABYSS: Berge Datenkerne aus 10 taktischen Sektoren'
      },
      // 1. Hangar Tile
      {
        id: 'HANGAR',
        title: 'HANGAR',
        subtitle: 'Drohnen-Upgrades',
        icon: '▲',
        desc: 'Taktische Drohnen-Upgrades mit Kampagnen-Sternen'
      },
      // 2. Leaderboard Tile
      {
        id: 'LEADERBOARD',
        title: 'BESTENLISTE',
        subtitle: 'Ränge & Rivalen',
        icon: '◆',
        desc: 'Weltweite Top-Piloten & Freunde-Direktvergleich'
      },
      // 3. Profile Tile
      {
        id: 'PROFILE',
        title: 'PROFIL',
        subtitle: 'Callsign & Cloud',
        icon: '◈',
        desc: 'Callsign & PIN zur Cloud-Sicherung'
      }
    ];

    // Background floating phosphor dust
    this.particles = [];
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    this.tutorialPulseUntil = 0;
    this.loadProgress();
  }

  triggerTutorialPulse(durationMs = 8000) {
    this.tutorialPulseUntil = Date.now() + durationMs;
  }

  loadProgress() {
    const prog = storageManager.getCampaignProgress();
    this.unlockedSector = prog.unlockedSector || 1;
    this.maxClearedSector = prog.maxClearedSector || 0;
    this.sectorStats = prog.sectorStats || {};
  }

  resetAllProgress() {
    storageManager.resetAll();
    this.unlockedSector = 1;
    this.maxClearedSector = 0;
    this.sectorStats = {};
  }

  saveProgress(sectorCleared, stats) {
    const updated = storageManager.saveCampaignProgress(sectorCleared, stats);
    this.unlockedSector = updated.unlockedSector;
    this.maxClearedSector = updated.maxClearedSector;
    this.sectorStats = updated.sectorStats;
  }

  updateProfileLabel() {
    // Keeps state synchronized
  }

  handleMenuInput(inputHandler) {
    const move = inputHandler.getMovement();
    if (move) {
      if (move.dy < 0) {
        // UP: From sub-tiles to Hero Campaign
        if (this.selectedIndex !== 0) {
          this.selectedIndex = 0;
          if (this.audio) this.audio.playUIBlip();
        }
      } else if (move.dy > 0) {
        // DOWN: From Hero Campaign to sub-tiles
        if (this.selectedIndex === 0) {
          this.selectedIndex = 1;
          if (this.audio) this.audio.playUIBlip();
        }
      }

      if (move.dx < 0) {
        // LEFT: Navigate within 3 sub-tiles (1 -> 3 wrap)
        if (this.selectedIndex >= 1 && this.selectedIndex <= 3) {
          this.selectedIndex = this.selectedIndex === 1 ? 3 : this.selectedIndex - 1;
          if (this.audio) this.audio.playUIBlip();
        }
      } else if (move.dx > 0) {
        // RIGHT: Navigate within 3 sub-tiles (3 -> 1 wrap)
        if (this.selectedIndex >= 1 && this.selectedIndex <= 3) {
          this.selectedIndex = this.selectedIndex === 3 ? 1 : this.selectedIndex + 1;
          if (this.audio) this.audio.playUIBlip();
        }
      }
    }

    if (inputHandler.consumeAction()) {
      if (this.audio) this.audio.playUIBlip();
      return this.options[this.selectedIndex].id;
    }

    // Direct mouse / touch click handling
    const click = inputHandler.consumeMouseClick();
    if (click) {
      // 0. Top-Left Pilot Profile Chip: x 8..230, y 6..44
      if (click.x >= 8 && click.x <= 230 && click.y >= 6 && click.y <= 44) {
        this.selectedIndex = 3;
        if (this.audio) this.audio.playUIBlip();
        return 'PROFILE';
      }

      // 1. Hero Campaign Card: x 120..680, y 115..255
      if (click.x >= 120 && click.x <= 680 && click.y >= 115 && click.y <= 255) {
        this.selectedIndex = 0;
        if (this.audio) this.audio.playUIBlip();
        return 'SECTOR_SELECT';
      }

      // 2. Sub-Tiles Row (y: 265..415) - Symmetrical 3-Tile Grid (w: 176, gap: 16)
      if (click.y >= 265 && click.y <= 415) {
        // Tile 1: Hangar (x: 120..296)
        if (click.x >= 120 && click.x <= 296) {
          this.selectedIndex = 1;
          if (this.audio) this.audio.playUIBlip();
          return 'HANGAR';
        }
        // Tile 2: Leaderboard (x: 312..488)
        if (click.x >= 312 && click.x <= 488) {
          this.selectedIndex = 2;
          if (this.audio) this.audio.playUIBlip();
          return 'LEADERBOARD';
        }
        // Tile 3: Profile (x: 504..680)
        if (click.x >= 504 && click.x <= 680) {
          this.selectedIndex = 3;
          if (this.audio) this.audio.playUIBlip();
          return 'PROFILE';
        }
      }
    }

    return null;
  }

  handleSectorSelectInput(inputHandler) {
    const totalSectors = LEVELS.length; // 10
    const move = inputHandler.getMovement();
    if (move) {
      let newIdx = this.selectedSectorIndex;
      if (move.dx > 0) newIdx++;
      if (move.dx < 0) newIdx--;
      if (move.dy > 0) newIdx += 5; // 2 rows of 5
      if (move.dy < 0) newIdx -= 5;

      if (newIdx >= 0 && newIdx < totalSectors) {
        this.selectedSectorIndex = newIdx;
        if (this.audio) this.audio.playUIBlip();
      }
    }

    if (inputHandler.consumeEscape()) {
      return { action: 'BACK' };
    }

    if (inputHandler.consumeAction()) {
      if (this.selectedSectorIndex < this.unlockedSector) {
        if (this.audio) this.audio.playUIBlip();
        return { action: 'START_SECTOR', sectorIndex: this.selectedSectorIndex };
      }
    }

    const click = inputHandler.consumeMouseClick();
    if (click) {
      const startX = 70;
      const startY = 120;
      const cardW = 120;
      const cardH = 125;
      const gapX = 18;
      const gapY = 22;

      for (let i = 0; i < totalSectors; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        if (click.x >= x && click.x <= x + cardW && click.y >= y && click.y <= y + cardH) {
          this.selectedSectorIndex = i;
          if (i < this.unlockedSector) {
            if (this.audio) this.audio.playUIBlip();
            return { action: 'START_SECTOR', sectorIndex: i };
          }
        }
      }

      // Back Button: x: 290..510, y: 475..525
      if (click.x >= 290 && click.x <= 510 && click.y >= 475 && click.y <= 525) {
        if (this.audio) this.audio.playUIBlip();
        return { action: 'BACK' };
      }
    }

    return null;
  }

  renderMenu(ctx, time) {
    const pilot = storageManager.getCurrentPilot();
    const isGuest = storageManager.isGuest();

    ctx.save();

    // 1. Deep Zero-Light Background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Calm Ambient Sci-Fi Starfield & Phosphor Dust
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = CONFIG.CANVAS_WIDTH;
      if (p.x > CONFIG.CANVAS_WIDTH) p.x = 0;
      if (p.y < 0) p.y = CONFIG.CANVAS_HEIGHT;
      if (p.y > CONFIG.CANVAS_HEIGHT) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha * 0.28})`;
      ctx.fill();
    }

    // 3. Top-Left Pilot Profile Chip (Industry Best Practice Standard)
    const chipX = 10;
    const chipY = 8;
    const chipW = 200;
    const chipH = 34;

    ctx.save();
    ctx.fillStyle = isGuest ? 'rgba(255, 200, 0, 0.08)' : 'rgba(0, 255, 136, 0.08)';
    ctx.fillRect(chipX, chipY, chipW, chipH);
    ctx.strokeStyle = isGuest ? 'rgba(255, 200, 0, 0.35)' : 'rgba(0, 255, 136, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(chipX, chipY, chipW, chipH);

    // Online / Sync status indicator dot
    const dotX = chipX + 14;
    const dotY = chipY + chipH / 2;
    const dotColor = isGuest ? '#f0c040' : '#00ffaa';
    ctx.fillStyle = dotColor;
    ctx.shadowColor = dotColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pilot Callsign & Status
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    const pilotName = isGuest ? 'PILOT: GAST' : `PILOT: ${pilot.callsign.toUpperCase()}`;
    ctx.fillText(pilotName, chipX + 26, chipY + 11);

    ctx.font = '600 9.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = dotColor;
    const pilotSub = isGuest ? 'LOKAL • [ ANMELDEN ]' : 'CLOUD-SYNC AKTIV';
    ctx.fillText(pilotSub, chipX + 26, chipY + 24);
    ctx.restore();

    // 4. Game Logo Banner with Subtle Scanline & Glowing Subtitle
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sci-Fi Header SONAR
    ctx.font = '800 42px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 16;
    ctx.fillText('S O N A R', CONFIG.CANVAS_WIDTH / 2, 46);
    ctx.shadowBlur = 0;

    // Glowing Subtitle
    ctx.font = '600 11.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.fillText('THE ECHO CHAMBER • ZERO-LIGHT STEALTH', CONFIG.CANVAS_WIDTH / 2, 76);

    // 5. Large Hero Element: Campaign (Option 0)
    const barW = 560;
    const barX = CONFIG.CANVAS_WIDTH / 2 - barW / 2;
    const heroX = barX;
    const heroY = 118;
    const heroW = barW;
    const heroH = 126;
    const isHeroSelected = this.selectedIndex === 0;

    ctx.save();
    const heroPulse = 0.7 + 0.3 * Math.sin(time * 4);
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = isHeroSelected ? (18 * heroPulse) : (8 * heroPulse);

    ctx.fillStyle = isHeroSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0, 240, 255, 0.06)';
    ctx.fillRect(heroX, heroY, heroW, heroH);

    ctx.strokeStyle = isHeroSelected ? '#00f0ff' : 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = isHeroSelected ? 2 : 1.2;
    ctx.strokeRect(heroX, heroY, heroW, heroH);

    // Left cyan accent pillar
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(heroX, heroY, 6, heroH);

    // Glowing Sonar Radar Waves Icon
    const iconX = heroX + 44;
    const iconY = heroY + heroH / 2;
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = isHeroSelected ? 12 : 6;
    ctx.beginPath();
    ctx.arc(iconX, iconY, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(iconX, iconY, 8.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hero Title
    ctx.textAlign = 'left';
    ctx.font = '800 21px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('KAMPAGNE • SEKTOREN 01–10', heroX + 78, heroY + 44);

    // Hero Subtitle
    ctx.font = '600 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('Operation Zero-Light • Station ABYSS', heroX + 78, heroY + 78);

    // Right Action Badge
    ctx.textAlign = 'right';
    ctx.font = '700 13.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('STARTEN', heroX + heroW - 24, heroY + heroH / 2);
    ctx.restore();

    // 6. Sub-Tiles Row: 3 Symmetrical Tiles (Hangar, Leaderboard, Profile)
    const tileY = 270;
    const tileH = 132;
    const tileW = 176;
    const tileGap = 16;

    const maxCleared = this.maxClearedSector !== undefined ? this.maxClearedSector : (this.unlockedSector > 1 ? this.unlockedSector - 1 : 0);
    const profileSub = isGuest ? 'Gast (Lokal)' : `${pilot.callsign.toUpperCase()} • ${maxCleared}/10`;

    const subOptions = [
      { idx: 1, opt: this.options[1], id: 'HANGAR', sub: 'Drohnen-Upgrades' },
      { idx: 2, opt: this.options[2], id: 'LEADERBOARD', sub: 'Ränge & Rivalen' },
      { idx: 3, opt: this.options[3], id: 'PROFILE', sub: profileSub }
    ];

    for (let i = 0; i < subOptions.length; i++) {
      const { idx, opt, id, sub } = subOptions[i];
      const x = barX + i * (tileW + tileGap);
      const isSelected = this.selectedIndex === idx;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.fillRect(x, tileY, tileW, tileH);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, tileY, tileW, tileH);
      } else {
        ctx.fillStyle = 'rgba(5, 14, 22, 0.75)';
        ctx.fillRect(x, tileY, tileW, tileH);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, tileY, tileW, tileH);
      }

      // Draw Glowing Sci-Fi Vector Icon
      this.drawMenuTileIcon(ctx, id, x + tileW / 2, tileY + 34, isSelected);

      // Title & Subtitle
      ctx.textAlign = 'center';
      ctx.font = isSelected ? '700 14px "Chakra Petch", "JetBrains Mono", monospace' : '700 13px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = isSelected ? '#ffffff' : '#00f0ff';
      ctx.fillText(opt.title, x + tileW / 2, tileY + 76);

      ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = isSelected ? '#00f0ff' : '#5c788a';
      ctx.fillText(sub, x + tileW / 2, tileY + 100);
      ctx.restore();
    }

    // 7. Clean Minimal Footer Status
    ctx.textAlign = 'center';
    ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#425866';
    ctx.fillText(`SONAR TACTICAL OS • v${CONFIG.VERSION} • SYSTEM BEREIT`, CONFIG.CANVAS_WIDTH / 2, 532);

    ctx.restore();
  }

  drawMenuTileIcon(ctx, type, cx, cy, isSelected) {
    ctx.save();
    ctx.strokeStyle = isSelected ? '#ffffff' : '#00f0ff';
    ctx.fillStyle = isSelected ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = isSelected ? 1.8 : 1.4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = isSelected ? 10 : 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'HANGAR') {
      // Lucide-style Sci-Fi Drone Craft / Hangar Vessel
      ctx.beginPath();
      // Main stealth drone fuselage
      ctx.moveTo(cx, cy - 9);          // Top nose
      ctx.lineTo(cx + 8, cy + 4);      // Right wingtip
      ctx.lineTo(cx + 3.5, cy + 5.5);  // Right thruster step
      ctx.lineTo(cx, cy + 2.5);        // Center rear notch
      ctx.lineTo(cx - 3.5, cy + 5.5);  // Left thruster step
      ctx.lineTo(cx - 8, cy + 4);      // Left wingtip
      ctx.closePath();
      ctx.stroke();

      // Glowing Cockpit Core
      ctx.beginPath();
      ctx.arc(cx, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Dual Propulsion Thruster Vectors
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 6); ctx.lineTo(cx - 4, cy + 9);
      ctx.moveTo(cx + 4, cy + 6); ctx.lineTo(cx + 4, cy + 9);
      ctx.stroke();
    } else if (type === 'LEADERBOARD') {
      // Lucide-style Trophy Cup
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 8);
      ctx.lineTo(cx + 7, cy - 8);
      ctx.lineTo(cx + 5.5, cy);
      ctx.quadraticCurveTo(cx, cy + 4.5, cx - 5.5, cy);
      ctx.closePath();
      ctx.stroke();

      // Dual Handles
      ctx.beginPath();
      ctx.arc(cx - 6.5, cy - 4, 3, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 6.5, cy - 4, 3, -0.5 * Math.PI, 0.5 * Math.PI);
      ctx.stroke();

      // Stem & Pedestal
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx, cy + 7);
      ctx.moveTo(cx - 6, cy + 7.5);
      ctx.lineTo(cx + 6, cy + 7.5);
      ctx.stroke();
    } else if (type === 'PROFILE') {
      // Standard Lucide-style User / Pilot Identity
      // Head
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 4.5, 0, Math.PI * 2);
      ctx.stroke();

      // Torso / Shoulders Arc
      ctx.beginPath();
      ctx.arc(cx, cy + 12, 10.5, 1.25 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();

      // Pilot Badge Core
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Sector Select Screen (10-Sector Campaign Grid)
   */
  renderSectorSelect(ctx) {
    const totalSectors = LEVELS.length; // 10
    const totalStars = storageManager.calculateTotalStars();

    ctx.save();

    // 1. Deep Zero-Light Background (Guarantees zero ghost bleed from Main Menu or Game Over)
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Calm Ambient Starfield Particles
    if (this.particles) {
      for (let p of this.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha * 0.22})`;
        ctx.fill();
      }
    }

    ctx.textAlign = 'center';

    // Header
    ctx.font = '700 24px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('SEKTOR-AUSWAHL • 10 SEKTOREN', CONFIG.CANVAS_WIDTH / 2, 46);

    ctx.font = '700 12.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`GESAMTERFOLG: ${totalStars} / 30 ★ • FREIGESCHALTET: 0${Math.min(10, this.unlockedSector)}`, CONFIG.CANVAS_WIDTH / 2, 76);

    // 2x5 Grid of Sector Cards (Clean Layout with Level Names)
    const startX = 70;
    const startY = 108;
    const cardW = 120;
    const cardH = 136;
    const gapX = 18;
    const gapY = 16;

    for (let i = 0; i < totalSectors; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const isUnlocked = i < this.unlockedSector;
      const isSelected = i === this.selectedSectorIndex;
      const stats = this.sectorStats[i + 1];
      const levelSubtitle = (LEVELS[i] && LEVELS[i].subtitle) ? LEVELS[i].subtitle : '';

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = isUnlocked ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 30, 68, 0.1)';
        ctx.strokeStyle = isUnlocked ? '#00f0ff' : '#ff1e44';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = isUnlocked ? '#06131c' : '#0a080d';
        ctx.strokeStyle = isUnlocked ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
      }

      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeRect(x, y, cardW, cardH);

      const numStr = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
      ctx.textAlign = 'center';

      if (isUnlocked) {
        // Line 1: SEKTOR XX (Bold)
        ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#00f0ff';
        ctx.fillText(`SEKTOR ${numStr}`, x + cardW / 2, y + 28);

        // Subtitle: Level Name
        ctx.font = '500 10px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = isSelected ? '#00f0ff' : '#8da8b8';
        ctx.fillText(levelSubtitle, x + cardW / 2, y + 46);

        if (stats) {
          // Line 2: ★ ★ ★ (Gold)
          const starsEarned = stats.stars || (stats.rank === 'S' ? 3 : (stats.rank === 'A' ? 2 : 1));
          const starStr = starsEarned >= 3 ? '★ ★ ★' : (starsEarned === 2 ? '★ ★ ☆' : '★ ☆ ☆');

          ctx.font = '700 14px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FFD700';
          ctx.fillText(starStr, x + cardW / 2, y + 78);

          // Line 3: 36.0s (Green / Cyan)
          ctx.font = '600 12px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#00ff88';
          ctx.fillText(`${stats.time.toFixed(1)}s`, x + cardW / 2, y + 108);
        } else {
          // Line 2: ☆ ☆ ☆ (Dim / Outline)
          ctx.font = '700 14px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
          ctx.fillText('☆ ☆ ☆', x + cardW / 2, y + 78);

          // Line 3: BEREIT (Gold / Cyan)
          ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#FFD700';
          ctx.fillText('BEREIT', x + cardW / 2, y + 108);
        }
      } else {
        // Line 1: SEKTOR XX (Dim)
        ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#4a5760';
        ctx.fillText(`SEKTOR ${numStr}`, x + cardW / 2, y + 28);

        // Subtitle: Level Name (Dim)
        ctx.font = '500 10px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#3a4750';
        ctx.fillText(levelSubtitle, x + cardW / 2, y + 46);

        // Line 2: ☆ ☆ ☆ (Locked / Dim)
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#3a4750';
        ctx.fillText('☆ ☆ ☆', x + cardW / 2, y + 78);

        // Line 3: GESPERRT (Red)
        ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#883344';
        ctx.fillText('GESPERRT', x + cardW / 2, y + 108);
      }
      ctx.restore();
    }

    // Back Button (Centered with exact textBaseline and textAlign)
    const backBtnW = 200;
    const backBtnH = 40;
    const backBtnX = (CONFIG.CANVAS_WIDTH - backBtnW) / 2;
    const backBtnY = 480;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 23, 34, 0.85)';
    ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 6;
    ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('ZURÜCK', CONFIG.CANVAS_WIDTH / 2, backBtnY + backBtnH / 2);
    ctx.restore();

    ctx.restore();
  }
}
