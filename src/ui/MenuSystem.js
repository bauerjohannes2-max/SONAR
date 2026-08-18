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
        title: 'KAMPAGNE (SEKTOREN 01–10)',
        subtitle: 'Operation Zero-Light • Station ABYSS',
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
      },
      // 4. Settings Tile
      {
        id: 'SETTINGS',
        title: 'OPTIONEN',
        subtitle: 'Audio & Touch',
        icon: '⛭',
        desc: 'Soundtrack, Touch-Skalierung & Steuerung'
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
        // LEFT: Navigate within sub-tiles (1 -> 4 wrap)
        if (this.selectedIndex >= 1 && this.selectedIndex <= 4) {
          this.selectedIndex = this.selectedIndex === 1 ? 4 : this.selectedIndex - 1;
          if (this.audio) this.audio.playUIBlip();
        }
      } else if (move.dx > 0) {
        // RIGHT: Navigate within sub-tiles (4 -> 1 wrap)
        if (this.selectedIndex >= 1 && this.selectedIndex <= 4) {
          this.selectedIndex = this.selectedIndex === 4 ? 1 : this.selectedIndex + 1;
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
      // 0. Pilot Status Badge Click: x 120..680, y 96..142
      if (click.x >= 120 && click.x <= 680 && click.y >= 96 && click.y <= 142) {
        this.selectedIndex = 3;
        if (this.audio) this.audio.playUIBlip();
        return 'PROFILE';
      }

      // 1. Hero Campaign Card: x 120..680, y 160..270
      if (click.x >= 120 && click.x <= 680 && click.y >= 160 && click.y <= 270) {
        this.selectedIndex = 0;
        if (this.audio) this.audio.playUIBlip();
        return 'SECTOR_SELECT';
      }

      // 2. Sub-Tiles Row (y: 295..405)
      if (click.y >= 295 && click.y <= 405) {
        // Tile 1: Hangar (x: 120..247)
        if (click.x >= 120 && click.x <= 247) {
          this.selectedIndex = 1;
          if (this.audio) this.audio.playUIBlip();
          return 'HANGAR';
        }
        // Tile 2: Leaderboard (x: 264..391)
        if (click.x >= 264 && click.x <= 391) {
          this.selectedIndex = 2;
          if (this.audio) this.audio.playUIBlip();
          return 'LEADERBOARD';
        }
        // Tile 3: Profile (x: 408..535)
        if (click.x >= 408 && click.x <= 535) {
          this.selectedIndex = 3;
          if (this.audio) this.audio.playUIBlip();
          return 'PROFILE';
        }
        // Tile 4: Settings (x: 552..680)
        if (click.x >= 552 && click.x <= 680) {
          this.selectedIndex = 4;
          if (this.audio) this.audio.playUIBlip();
          return 'SETTINGS';
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

      // Back Button: x: 310..490, y: 475..515
      if (click.x >= 310 && click.x <= 490 && click.y >= 475 && click.y <= 515) {
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

    // 2. Animated Ambient Radar Ring
    const radarRadius = Math.max(0, (time * 55) % 480);
    const radarAlpha = Math.max(0, 1 - radarRadius / 480) * 0.18;
    ctx.beginPath();
    ctx.arc(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, Math.max(0, radarRadius), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 240, 255, ${radarAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Floating Phosphor Dust
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = CONFIG.CANVAS_WIDTH;
      if (p.x > CONFIG.CANVAS_WIDTH) p.x = 0;
      if (p.y < 0) p.y = CONFIG.CANVAS_HEIGHT;
      if (p.y > CONFIG.CANVAS_HEIGHT) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha * 0.35})`;
      ctx.fill();
    }

    // 4. Game Logo Banner with Subtle Scanline & Glowing Subtitle
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sci-Fi Header SONAR
    ctx.font = '800 40px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 16;
    ctx.fillText('S O N A R', CONFIG.CANVAS_WIDTH / 2, 44);
    ctx.shadowBlur = 0;

    // Glowing Subtitle
    ctx.font = '600 11.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.fillText('THE ECHO CHAMBER • ZERO-LIGHT STEALTH', CONFIG.CANVAS_WIDTH / 2, 72);

    // 5. Sleek Glassmorphism Pilot Bar (Top)
    const barW = 560;
    const barH = 40;
    const barX = CONFIG.CANVAS_WIDTH / 2 - barW / 2;
    const barY = 96;

    ctx.fillStyle = isGuest ? 'rgba(255, 200, 0, 0.04)' : 'rgba(0, 255, 136, 0.05)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = isGuest ? 'rgba(255, 200, 0, 0.22)' : 'rgba(0, 255, 136, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    if (isGuest) {
      ctx.font = '600 11.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#f0c040';
      ctx.fillText('PILOT: GAST (LOKAL)  •  [ CLOUD-SYNC AKTIVIEREN ]', CONFIG.CANVAS_WIDTH / 2, barY + barH / 2);
    } else {
      const maxCleared = this.maxClearedSector !== undefined ? this.maxClearedSector : (this.unlockedSector > 1 ? this.unlockedSector - 1 : 0);
      ctx.font = '600 11.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ffaa';
      ctx.fillText(`PILOT: ${pilot.callsign.toUpperCase()}  •  CLOUD-SYNC AKTIV  •  ${maxCleared} / 10 SEKTOREN`, CONFIG.CANVAS_WIDTH / 2, barY + barH / 2);
    }

    // 6. Large Hero Element: Campaign (Option 0)
    const heroX = barX;
    const heroY = 160;
    const heroW = barW;
    const heroH = 106;
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

    // Hero Title
    ctx.textAlign = 'left';
    ctx.font = '800 21px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('KAMPAGNE (SEKTOREN 01–10)', heroX + 26, heroY + 36);

    // Hero Subtitle
    ctx.font = '600 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('Operation Zero-Light • Station ABYSS', heroX + 26, heroY + 68);

    // Right Action Badge
    ctx.textAlign = 'right';
    ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('[ STARTEN ▶ ]', heroX + heroW - 24, heroY + heroH / 2);
    ctx.restore();

    // 7. Sub-Tiles Row: 4 Even Tiles (Hangar, Leaderboard, Profile, Settings)
    const tileY = 295;
    const tileH = 106;
    const tileW = 127;
    const tileGap = 17;

    const subOptions = [
      { idx: 1, opt: this.options[1] },
      { idx: 2, opt: this.options[2] },
      { idx: 3, opt: this.options[3] },
      { idx: 4, opt: this.options[4] }
    ];

    for (let i = 0; i < subOptions.length; i++) {
      const { idx, opt } = subOptions[i];
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

        ctx.textAlign = 'center';
        ctx.font = '22px sans-serif';
        ctx.fillText(opt.icon, x + tileW / 2, tileY + 32);

        ctx.font = '700 12.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(opt.title, x + tileW / 2, tileY + 65);

        ctx.font = '500 9.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(opt.subtitle, x + tileW / 2, tileY + 86);
      } else {
        ctx.fillStyle = 'rgba(5, 14, 22, 0.75)';
        ctx.fillRect(x, tileY, tileW, tileH);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, tileY, tileW, tileH);

        ctx.textAlign = 'center';
        ctx.font = '20px sans-serif';
        ctx.fillText(opt.icon, x + tileW / 2, tileY + 32);

        ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(opt.title, x + tileW / 2, tileY + 65);

        ctx.font = '500 9.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#5c788a';
        ctx.fillText(opt.subtitle, x + tileW / 2, tileY + 86);
      }
      ctx.restore();
    }

    // 8. Clean Minimal Footer Status
    ctx.textAlign = 'center';
    ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#425866';
    ctx.fillText(`SONAR TACTICAL OS • v${CONFIG.VERSION} • SYSTEM BEREIT`, CONFIG.CANVAS_WIDTH / 2, 532);

    ctx.restore();
  }

  renderSectorSelect(ctx) {
    const totalSectors = LEVELS.length; // 10

    ctx.save();
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    // Calculate total earned stars across sectors
    let totalStars = 0;
    for (let i = 1; i <= totalSectors; i++) {
      const st = this.sectorStats[i];
      if (st) {
        totalStars += st.stars || (st.rank === 'S' ? 3 : (st.rank === 'A' ? 2 : 1));
      }
    }

    // Header
    ctx.font = '700 24px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('SEKTOR-AUSWAHL • 10 SEKTOREN', CONFIG.CANVAS_WIDTH / 2, 46);

    ctx.font = '700 12.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`GESAMTERFOLG: ${totalStars} / 30 ★ • FREIGESCHALTET: 0${Math.min(10, this.unlockedSector)}`, CONFIG.CANVAS_WIDTH / 2, 76);

    // 2x5 Grid of Sector Cards
    const startX = 70;
    const startY = 110;
    const cardW = 120;
    const cardH = 130;
    const gapX = 18;
    const gapY = 20;

    for (let i = 0; i < totalSectors; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      const isUnlocked = i < this.unlockedSector;
      const isSelected = i === this.selectedSectorIndex;
      const stats = this.sectorStats[i + 1];

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
      const lvl = LEVELS[i];
      ctx.textAlign = 'center';

      if (isUnlocked) {
        ctx.font = '700 14.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#00f0ff';
        ctx.fillText(`SEKTOR ${numStr}`, x + cardW / 2, y + 22);

        if (lvl && lvl.subtitle) {
          ctx.font = '600 9.5px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = isSelected ? '#a0f0ff' : '#00c8d8';
          ctx.fillText(lvl.subtitle, x + cardW / 2, y + 38);
        }

        if (stats) {
          const starsEarned = stats.stars || (stats.rank === 'S' ? 3 : (stats.rank === 'A' ? 2 : 1));
          const starStr = starsEarned >= 3 ? '★ ★ ★' : (starsEarned === 2 ? '★ ★ ☆' : '★ ☆ ☆');

          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FFD700';
          ctx.fillText(starStr, x + cardW / 2, y + 64);

          ctx.font = '600 11px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#00ff88';
          ctx.fillText('GESICHERT', x + cardW / 2, y + 86);

          ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#607b8b';
          ctx.fillText(`${stats.time.toFixed(1)}s`, x + cardW / 2, y + 106);
        } else {
          // Newly Unlocked Sector (Clean status badge without any lock icon)
          ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#FFD700';
          ctx.fillText('BEREIT', x + cardW / 2, y + 66);

          ctx.font = '500 10px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#00ffaa';
          ctx.fillText('FREIGESCHALTET', x + cardW / 2, y + 86);

          ctx.font = '500 9.5px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#607b8b';
          ctx.fillText('3 DATENKERNE', x + cardW / 2, y + 106);
        }
      } else {
        ctx.font = '700 15px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#4a5760';
        ctx.fillText(`SEKTOR ${numStr}`, x + cardW / 2, y + 30);

        if (lvl && lvl.subtitle) {
          ctx.font = '500 9px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#3a4750';
          ctx.fillText(lvl.subtitle, x + cardW / 2, y + 48);
        }

        ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#883344';
        ctx.fillText('GESPERRT', x + cardW / 2, y + 78);
      }
      ctx.restore();
    }

    // Back Button
    ctx.fillStyle = '#0a1722';
    ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 90, 480, 180, 36);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - 90, 480, 180, 36);

    ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('← ZURÜCK (ESC)', CONFIG.CANVAS_WIDTH / 2, 498);

    ctx.restore();
  }
}
