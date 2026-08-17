/**
 * SONAR: The Echo Chamber
 * Sci-Fi Terminal Menu System (Clean 2-Tier Hierarchy, High-Clarity Typography, No Brackets)
 */

import { CONFIG } from '../config.js';
import { LEVELS } from '../world/levels.js';
import { storageManager } from '../services/StorageManager.js';

export class MenuSystem {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.selectedIndex = 0; // 0: Campaign, 1: Endless, 2: Profile, 3: Leaderboard, 4: Tutorial
    this.selectedSectorIndex = 0;
    this.unlockedSector = 1;
    this.sectorStats = {};

    this.options = [
      // Primary Tier (Large Prominent Cards)
      {
        id: 'SECTOR_SELECT',
        title: 'KAMPAGNE',
        subtitle: 'Operation Zero-Light • Sektoren 01 – 10',
        tag: '10 SEKTOREN',
        desc: 'TETHYS-6: Berge Resonanz-Datenkerne aus 10 taktischen Sektoren'
      },
      {
        id: 'ENDLESS',
        title: 'ENDLESS ECHO',
        subtitle: 'Prozeduraler Überlebensmodus',
        tag: 'ROGUELIKE',
        desc: 'Endless Echo: Prozedural generiertes Überlebens-Labyrinth'
      },
      // Secondary Tier (3 Compact Action Buttons)
      {
        id: 'PROFILE',
        title: 'SPIELER-PROFIL',
        subtitle: '',
        tag: '',
        desc: 'Spieler: Name & PIN zur Cloud-Sicherung'
      },
      {
        id: 'LEADERBOARD',
        title: 'BESTENLISTE',
        subtitle: '',
        tag: '',
        desc: 'Bestenliste: Weltweite Top-Ranglisten der besten Läufe'
      },
      {
        id: 'TUTORIAL',
        title: 'TUTORIAL',
        subtitle: '',
        tag: '',
        desc: 'Missions-Briefing & Steuerungshandbuch'
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
    // Keep profile label dynamic if needed
  }

  handleMenuInput(inputHandler) {
    const move = inputHandler.getMovement();
    if (move) {
      // 2-Tier Navigation Logic
      if (move.dy < 0) {
        // UP
        if (this.selectedIndex === 0) {
          this.selectedIndex = 2; // Wrap to profile
        } else if (this.selectedIndex === 1) {
          this.selectedIndex = 0; // Go to campaign
        } else {
          this.selectedIndex = 1; // From secondary to endless
        }
        if (this.audio) this.audio.playUIBlip();
      } else if (move.dy > 0) {
        // DOWN
        if (this.selectedIndex === 0) {
          this.selectedIndex = 1; // Go to endless
        } else if (this.selectedIndex === 1) {
          this.selectedIndex = 2; // Go to secondary
        } else {
          this.selectedIndex = 0; // Wrap to campaign
        }
        if (this.audio) this.audio.playUIBlip();
      }

      if (move.dx < 0) {
        // LEFT
        if (this.selectedIndex >= 2 && this.selectedIndex <= 4) {
          this.selectedIndex = this.selectedIndex === 2 ? 4 : this.selectedIndex - 1;
          if (this.audio) this.audio.playUIBlip();
        }
      } else if (move.dx > 0) {
        // RIGHT
        if (this.selectedIndex >= 2 && this.selectedIndex <= 4) {
          this.selectedIndex = this.selectedIndex === 4 ? 2 : this.selectedIndex + 1;
          if (this.audio) this.audio.playUIBlip();
        }
      }
    }

    if (inputHandler.consumeAction()) {
      if (this.audio) this.audio.playUIBlip();
      return this.options[this.selectedIndex].id;
    }

    // Direct mouse click handling
    const click = inputHandler.consumeMouseClick();
    if (click) {
      // 0. Pilot Status Badge Click (Cloud-Save / Profile)
      if (click.x >= 120 && click.x <= 680 && click.y >= 88 && click.y <= 138) {
        this.selectedIndex = 2;
        if (this.audio) this.audio.playUIBlip();
        return 'PROFILE';
      }

      // 1. Primary Card 0 (Campaign): x 148..652, y 148..216
      if (click.x >= 148 && click.x <= 652 && click.y >= 148 && click.y <= 216) {
        this.selectedIndex = 0;
        if (this.audio) this.audio.playUIBlip();
        return this.options[0].id;
      }

      // 2. Primary Card 1 (Endless): x 148..652, y 226..294
      if (click.x >= 148 && click.x <= 652 && click.y >= 226 && click.y <= 294) {
        this.selectedIndex = 1;
        if (this.audio) this.audio.playUIBlip();
        return this.options[1].id;
      }

      // 3. Secondary 3 Buttons (Row): y 308..348
      if (click.y >= 308 && click.y <= 348) {
        const secDefs = [
          { idx: 2, minX: 148, maxX: 306 }, // Profile
          { idx: 3, minX: 321, maxX: 479 }, // Leaderboard
          { idx: 4, minX: 494, maxX: 652 }  // Tutorial
        ];

        for (let sec of secDefs) {
          if (click.x >= sec.minX && click.x <= sec.maxX) {
            this.selectedIndex = sec.idx;
            if (this.audio) this.audio.playUIBlip();
            return this.options[sec.idx].id;
          }
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
      // Check 2x5 grid buttons
      const startX = 70;
      const startY = 135;
      const cardW = 120;
      const cardH = 120;
      const gapX = 18;
      const gapY = 24;

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

      // Back Button
      if (click.x >= 310 && click.x <= 490 && click.y >= 475 && click.y <= 515) {
        return { action: 'BACK' };
      }
    }

    return null;
  }

  renderMenu(ctx, time, endlessMode) {
    const pilot = storageManager.getCurrentPilot();
    const isGuest = storageManager.isGuest();

    ctx.save();

    // 1. Deep Zero-Light Background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Animated Ambient Radar Ring
    const radarRadius = Math.max(0, (time * 60) % 460);
    const radarAlpha = Math.max(0, 1 - radarRadius / 460) * 0.20;
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

    // 4. Game Title Banner (Sharp Vector Monospace)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    // Main Title
    ctx.font = '700 36px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('S O N A R', CONFIG.CANVAS_WIDTH / 2, 46);

    // Subtitle & Version
    ctx.font = '600 10.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#607b8b';
    ctx.fillText(`ZERO-LIGHT SURVIVAL • v${CONFIG.VERSION}`, CONFIG.CANVAS_WIDTH / 2, 70);

    // Player Status Banner Box (Clear Cloud-Save & Guest Notice)
    const badgeW = 520;
    const badgeH = 44;
    const badgeX = CONFIG.CANVAS_WIDTH / 2 - badgeW / 2;
    const badgeY = 88;

    ctx.fillStyle = isGuest ? 'rgba(255, 230, 0, 0.03)' : 'rgba(0, 255, 136, 0.04)';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = isGuest ? 'rgba(255, 230, 0, 0.25)' : 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    if (isGuest) {
      // Line 1: Guest Notice
      ctx.font = '600 10.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#f0c040';
      ctx.fillText('SPIELER: GAST (NUR LOKAL) • FORTSCHRITT IM BROWSER GESPEICHERT', CONFIG.CANVAS_WIDTH / 2, badgeY + 14);

      // Line 2: Pulsing Cloud-Save Button Badge
      const pulse = 0.75 + 0.25 * Math.sin(time * 5);
      ctx.font = '700 11px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
      ctx.fillText('[ ☁ CLOUD-SPEICHERUNG AKTIVIEREN ]', CONFIG.CANVAS_WIDTH / 2, badgeY + 31);
    } else {
      // Logged In Status
      ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`SPIELER: ${pilot.callsign.toUpperCase()} • CLOUD-SYNC AKTIV ★`, CONFIG.CANVAS_WIDTH / 2, badgeY + 14);

      const maxCleared = this.maxClearedSector !== undefined ? this.maxClearedSector : (this.unlockedSector > 1 ? this.unlockedSector - 1 : 0);
      let detailText = maxCleared === 0
        ? `SEKTOR 01 BEREIT (0 / 10 GESCHAFFT)`
        : `FORTSCHRITT: ${maxCleared} / 10 SEKTOREN GESCHAFFT`;
      if (endlessMode && endlessMode.bestFloor > 1) {
        detailText += `  •  ENDLESS BEST: ETAGE ${endlessMode.bestFloor}`;
      }
      ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = '#80b0c8';
      ctx.fillText(detailText, CONFIG.CANVAS_WIDTH / 2, badgeY + 31);
    }

    // 5. Primary Tier: 2 Large Prominent Cards
    const primDefs = [
      { idx: 0, y: 148, h: 68 },
      { idx: 1, y: 226, h: 68 }
    ];
    const cardW = 504;
    const cardX = CONFIG.CANVAS_WIDTH / 2 - cardW / 2;

    for (let item of primDefs) {
      const opt = this.options[item.idx];
      const isSelected = this.selectedIndex === item.idx;

      ctx.save();

      // Living Cyan Focus Glow on Campaign (Item 0)
      if (item.idx === 0) {
        const pulse = 0.7 + 0.3 * Math.sin(time * 4);
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = isSelected ? (14 * pulse) : (6 * pulse);
      }

      if (isSelected) {
        // Active Primary Card
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.fillRect(cardX, item.y, cardW, item.h);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cardX, item.y, cardW, item.h);

        // Left accent bar
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(cardX, item.y, 4, item.h);

        // Title
        ctx.textAlign = 'left';
        ctx.font = '700 18px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(opt.title, cardX + 22, item.y + 24);

        // Subtitle
        ctx.font = '500 12px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(opt.subtitle, cardX + 22, item.y + 48);

        // Right Tag
        ctx.textAlign = 'right';
        ctx.font = '700 11px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(opt.tag, cardX + cardW - 20, item.y + 34);
      } else {
        // Inactive Primary Card
        ctx.fillStyle = item.idx === 0 ? 'rgba(0, 240, 255, 0.04)' : 'rgba(5, 14, 22, 0.75)';
        ctx.fillRect(cardX, item.y, cardW, item.h);

        ctx.strokeStyle = item.idx === 0 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, item.y, cardW, item.h);

        // Title
        ctx.textAlign = 'left';
        ctx.font = '700 17px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(opt.title, cardX + 20, item.y + 24);

        // Subtitle
        ctx.font = '500 12px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#607b8b';
        ctx.fillText(opt.subtitle, cardX + 20, item.y + 48);

        // Right Tag
        ctx.textAlign = 'right';
        ctx.font = '600 11px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#456070';
        ctx.fillText(opt.tag, cardX + cardW - 20, item.y + 34);
      }
      ctx.restore();
    }

    // 6. Secondary Tier: 3 Compact Action Buttons
    const secY = 308;
    const secH = 40;
    const secBtnW = 158;
    const secGap = 15;
    const secStartX = cardX;

    const isTutorialPulsing = this.tutorialPulseUntil && Date.now() < this.tutorialPulseUntil;

    const secIndices = [2, 3, 4];
    for (let i = 0; i < secIndices.length; i++) {
      const idx = secIndices[i];
      const opt = this.options[idx];
      const isSelected = this.selectedIndex === idx;
      const x = secStartX + i * (secBtnW + secGap);
      const isPulsingThis = (idx === 4 && isTutorialPulsing);

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.fillRect(x, secY, secBtnW, secH);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, secY, secBtnW, secH);

        ctx.textAlign = 'center';
        ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(idx === 4 ? '📖 TUTORIAL' : opt.title, x + secBtnW / 2, secY + secH / 2);
      } else if (isPulsingThis) {
        // Prominent Tutorial Attention Indicator
        const pulse = 0.5 + 0.5 * Math.sin(time * 6);
        ctx.fillStyle = `rgba(0, 240, 255, ${0.12 + 0.15 * pulse})`;
        ctx.fillRect(x, secY, secBtnW, secH);

        ctx.strokeStyle = `rgba(0, 240, 255, ${0.6 + 0.4 * pulse})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10 * pulse;
        ctx.strokeRect(x, secY, secBtnW, secH);

        ctx.textAlign = 'center';
        ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('📖 TUTORIAL', x + secBtnW / 2, secY + secH / 2);

        // Attention Hint Badge
        ctx.shadowBlur = 0;
        ctx.font = '700 9px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = `rgba(0, 255, 170, ${0.8 + 0.2 * pulse})`;
        ctx.fillText('[ HIER JEDERZEIT ABRUFBAR ]', x + secBtnW / 2, secY - 8);
      } else {
        ctx.fillStyle = 'rgba(5, 14, 22, 0.7)';
        ctx.fillRect(x, secY, secBtnW, secH);

        ctx.strokeStyle = idx === 4 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, secY, secBtnW, secH);

        ctx.textAlign = 'center';
        ctx.font = '600 11px "Chakra Petch", "JetBrains Mono", monospace';
        ctx.fillStyle = idx === 4 ? '#00f0ff' : '#7895a5';
        ctx.fillText(idx === 4 ? '📖 TUTORIAL' : opt.title, x + secBtnW / 2, secY + secH / 2);
      }
      ctx.restore();
    }

    // 7. Clean Minimal Footer Navigation Hints & Version
    ctx.textAlign = 'center';
    ctx.font = '500 11px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#556e7d';
    ctx.fillText('W / S / Pfeiltasten: Navigieren  •  Enter: Bestätigen  •  F: Vollbild', CONFIG.CANVAS_WIDTH / 2, 532);

    ctx.textAlign = 'right';
    ctx.font = '600 10.5px "JetBrains Mono", "Share Tech Mono", monospace';
    ctx.fillStyle = '#3a5465';
    ctx.fillText(`v${CONFIG.VERSION || '1.2.1'}`, CONFIG.CANVAS_WIDTH - 20, 560);

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

    // Header
    ctx.font = '700 24px "Chakra Petch", "JetBrains Mono", monospace';
    // Calculate total earned stars
    let totalStars = 0;
    for (let i = 1; i <= totalSectors; i++) {
      const st = this.sectorStats[i];
      if (st) {
        totalStars += st.stars || (st.rank === 'S' ? 3 : (st.rank === 'A' ? 2 : 1));
      }
    }

    ctx.font = '700 24px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('SEKTOR-AUSWAHL • 10 SEKTOREN', CONFIG.CANVAS_WIDTH / 2, 48);

    ctx.font = '600 12px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`★ ${totalStars} / 30 STERNE GESAMMELT • FREIGESCHALTET: 0${Math.min(10, this.unlockedSector)}`, CONFIG.CANVAS_WIDTH / 2, 78);

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
          ctx.fillText(starStr, x + cardW / 2, y + 60);

          ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = stats.rank === 'S' ? '#FFE600' : '#00ff88';
          ctx.fillText(`RANG ${stats.rank}`, x + cardW / 2, y + 82);

          ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#607b8b';
          ctx.fillText(`${stats.time.toFixed(1)}s`, x + cardW / 2, y + 104);
        } else {
          ctx.font = '600 11px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#00ff88';
          ctx.fillText('BEREIT', x + cardW / 2, y + 66);

          ctx.font = '500 9.5px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#607b8b';
          ctx.fillText('3 DATENKERNE', x + cardW / 2, y + 90);
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
