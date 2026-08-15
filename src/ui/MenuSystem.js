/**
 * SONAR: The Echo Chamber
 * Sci-Fi Terminal Menu System (Campaign, Endless, Pilot Profile, Leaderboard & Settings)
 */

import { CONFIG } from '../config.js';
import { LEVELS } from '../world/levels.js';
import { storageManager } from '../services/StorageManager.js';
import { firebaseService } from '../services/FirebaseService.js';

export class MenuSystem {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.selectedIndex = 0;
    this.selectedSectorIndex = 0;
    this.unlockedSector = 1;
    this.sectorStats = {};

    this.options = [
      { id: 'SECTOR_SELECT', label: '[ KAMPAGNE (SEKTOREN 1 - 10) ]', desc: 'Wähle einen Sektor oder starte ab Sektor 1' },
      { id: 'ENDLESS', label: '[ ENDLESS ECHO ]', desc: 'Unendlicher prozeduraler Roguelike-Modus' },
      { id: 'PROFILE', label: '[ 👤 PILOTEN-PROFIL ]', desc: 'Login mit Callsign & PIN zur Cloud-Sicherung' },
      { id: 'LEADERBOARD', label: '[ 🏆 LEADERBOARD ]', desc: 'Globales Ranking der Top 10 Drohnen-Piloten' },
      { id: 'TUTORIAL', label: '[ [ ? ] TAKTIK-HANDBUCH ]', desc: 'Interaktives Handbuch & Feind-Datenbank' },
      { id: 'SETTINGS', label: '[ EINSTELLUNGEN ]', desc: 'Audio, CRT-Filter & Spielstand zurücksetzen' }
    ];

    // Background particle array
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    this.loadProgress();
  }

  loadProgress() {
    const prog = storageManager.getCampaignProgress();
    this.unlockedSector = prog.unlockedSector || 1;
    this.sectorStats = prog.sectorStats || {};
  }

  resetAllProgress() {
    storageManager.resetAll();
    this.unlockedSector = 1;
    this.sectorStats = {};
  }

  saveProgress(sectorCleared, stats) {
    const updated = storageManager.saveCampaignProgress(sectorCleared, stats);
    this.unlockedSector = updated.unlockedSector;
    this.sectorStats = updated.sectorStats;
  }

  updateProfileLabel() {
    const pilot = storageManager.getCurrentPilot();
    const isGuest = storageManager.isGuest();
    const profOpt = this.options.find(o => o.id === 'PROFILE');
    if (profOpt) {
      profOpt.label = isGuest
        ? '[ 👤 PILOTEN-PROFIL (GAST) ]'
        : `[ 👤 PILOT: ${pilot.callsign} ]`;
    }
  }

  handleMenuInput(inputHandler) {
    this.updateProfileLabel();

    const move = inputHandler.getMovement();
    if (move) {
      if (move.dy < 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        if (this.audio) this.audio.playUIBlip();
      } else if (move.dy > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        if (this.audio) this.audio.playUIBlip();
      }
    }

    if (inputHandler.consumeAction()) {
      if (this.audio) this.audio.playUIBlip();
      return this.options[this.selectedIndex].id;
    }

    // Direct mouse click handling
    const click = inputHandler.consumeMouseClick();
    if (click) {
      const optYStart = 168;
      const optH = 43;
      const btnW = 380;
      for (let i = 0; i < this.options.length; i++) {
        const y = optYStart + i * optH;
        if (
          click.x >= CONFIG.CANVAS_WIDTH / 2 - btnW / 2 &&
          click.x <= CONFIG.CANVAS_WIDTH / 2 + btnW / 2 &&
          click.y >= y - 16 &&
          click.y <= y + 18
        ) {
          this.selectedIndex = i;
          if (this.audio) this.audio.playUIBlip();
          return this.options[i].id;
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
      const startY = 140;
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
      if (click.x >= 320 && click.x <= 480 && click.y >= 480 && click.y <= 520) {
        return { action: 'BACK' };
      }
    }

    return null;
  }

  renderMenu(ctx, time, endlessMode) {
    this.updateProfileLabel();
    const pilot = storageManager.getCurrentPilot();
    const isGuest = storageManager.isGuest();

    ctx.save();

    // 1. Terminal Background
    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Animated Ambient Radar Ring
    const radarRadius = Math.max(0, (time * 65) % 450);
    const radarAlpha = Math.max(0, 1 - radarRadius / 450) * 0.22;
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

    ctx.font = '900 42px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 0;
    ctx.fillText('S O N A R', CONFIG.CANVAS_WIDTH / 2, 60);

    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
    ctx.shadowBlur = 0;
    ctx.fillText('// ZERO-LIGHT SURVIVAL', CONFIG.CANVAS_WIDTH / 2, 95);

    // Pilot Status Bar Subhead
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    if (!isGuest) {
      ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
      ctx.fillText(`👤 PILOT: ${pilot.callsign} [CLOUD AKTIV]  •  SEKTOR 0${this.unlockedSector}`, CONFIG.CANVAS_WIDTH / 2, 122);
    } else {
      ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
      ctx.fillText('👤 STATUS: GAST-MODUS (LOKAL)  •  FORTSCHRITT: SEKTOR 0' + this.unlockedSector, CONFIG.CANVAS_WIDTH / 2, 122);
    }

    // Endless Mode Record Badge
    if (endlessMode && endlessMode.bestFloor > 1) {
      ctx.font = 'bold 10px "Share Tech Mono", monospace';
      ctx.fillStyle = CONFIG.COLORS.RESONATOR;
      ctx.fillText(`🏆 ENDLESS: ETAGE ${endlessMode.bestFloor} (${endlessMode.bestCrystals} KRISTALLE)`, CONFIG.CANVAS_WIDTH / 2, 142);
    }

    // 5. Menu Options - Clean vertical uniform cards
    const optYStart = 168;
    const optH = 43;
    const btnW = 380;

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const isSelected = i === this.selectedIndex;
      const y = optYStart + i * optH;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
        ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - btnW / 2, y - 15, btnW, 32);

        ctx.strokeStyle = CONFIG.COLORS.PLAYER;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - btnW / 2, y - 15, btnW, 32);

        ctx.font = 'bold 14px "Share Tech Mono", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(opt.label, CONFIG.CANVAS_WIDTH / 2, y + 1);
      } else {
        const isSpecial = opt.id === 'PROFILE' || opt.id === 'LEADERBOARD';
        const isTutorial = opt.id === 'TUTORIAL';
        const pulseAlpha = isTutorial ? 0.04 + Math.sin(time * 3) * 0.03 : 0.03;

        ctx.fillStyle = `rgba(0, 240, 255, ${pulseAlpha})`;
        ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - btnW / 2, y - 15, btnW, 32);

        ctx.strokeStyle = isSpecial
          ? 'rgba(0, 240, 255, 0.25)'
          : (isTutorial ? 'rgba(255, 230, 0, 0.35)' : 'rgba(0, 240, 255, 0.12)');
        ctx.lineWidth = 1;
        ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - btnW / 2, y - 15, btnW, 32);

        ctx.font = '13px "Share Tech Mono", monospace';
        ctx.fillStyle = isTutorial
          ? CONFIG.COLORS.RESONATOR
          : (isSpecial ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.TEXT_DIM);
        ctx.shadowBlur = 0;
        ctx.fillText(opt.label, CONFIG.CANVAS_WIDTH / 2, y + 1);
      }
      ctx.restore();
    }

    // 6. Selected Option Description
    const currentOpt = this.options[this.selectedIndex];
    if (currentOpt) {
      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.fillStyle = CONFIG.COLORS.CRYSTAL;
      ctx.shadowBlur = 0;
      ctx.fillText(`// ${currentOpt.desc}`, CONFIG.CANVAS_WIDTH / 2, 442);
    }

    // 7. Minimal Footer Instructions
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
    ctx.shadowBlur = 0;
    ctx.fillText('[W/S/▲/▼] AUSWAHL  •  [SPACE / ENTER] START  •  [F] VOLLBILD', CONFIG.CANVAS_WIDTH / 2, 515);

    ctx.restore();
  }

  renderSectorSelect(ctx) {
    const totalSectors = LEVELS.length; // 10

    ctx.save();
    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 24px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 0;
    ctx.fillText('SEKTOR-AUSWAHL // 10 SECTORS', CONFIG.CANVAS_WIDTH / 2, 55);

    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
    ctx.shadowBlur = 0;
    ctx.fillText(`FREIGESCHALTET: SEKTOR 01 BIS 0${Math.min(10, this.unlockedSector)}`, CONFIG.CANVAS_WIDTH / 2, 88);

    // 2x5 Grid of Sector Cards
    const startX = 70;
    const startY = 125;
    const cardW = 120;
    const cardH = 120;
    const gapX = 18;
    const gapY = 24;

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
        ctx.strokeStyle = isUnlocked ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.HUNTER;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = isUnlocked ? '#06131c' : '#0a080d';
        ctx.strokeStyle = isUnlocked ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeRect(x, y, cardW, cardH);

      // Card Content
      const numStr = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
      ctx.textAlign = 'center';

      if (isUnlocked) {
        ctx.font = 'bold 18px "Share Tech Mono", monospace';
        ctx.fillStyle = isSelected ? '#FFFFFF' : CONFIG.COLORS.PLAYER;
        ctx.shadowBlur = 0;
        ctx.fillText(`SEKTOR ${numStr}`, x + cardW / 2, y + 28);

        if (stats) {
          ctx.font = 'bold 14px "Share Tech Mono", monospace';
          ctx.fillStyle = stats.rank === 'S' ? '#FFE600' : CONFIG.COLORS.CRYSTAL;
          ctx.fillText(`RANG [ ${stats.rank} ]`, x + cardW / 2, y + 58);

          ctx.font = '10px "Share Tech Mono", monospace';
          ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
          ctx.fillText(`${stats.time.toFixed(1)}s`, x + cardW / 2, y + 84);
        } else {
          ctx.font = '11px "Share Tech Mono", monospace';
          ctx.fillStyle = CONFIG.COLORS.TEXT_DIM;
          ctx.fillText('OFFEN', x + cardW / 2, y + 68);
        }
      } else {
        ctx.font = 'bold 17px "Share Tech Mono", monospace';
        ctx.fillStyle = '#4a5760';
        ctx.shadowBlur = 0;
        ctx.fillText(`SEKTOR ${numStr}`, x + cardW / 2, y + 32);

        ctx.font = '20px "Share Tech Mono", monospace';
        ctx.fillStyle = '#ff4455';
        ctx.fillText('🔒', x + cardW / 2, y + 68);

        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillStyle = '#663344';
        ctx.fillText('GESPERRT', x + cardW / 2, y + 96);
      }
      ctx.restore();
    }

    // Back Button
    ctx.fillStyle = '#0a1722';
    ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 80, 480, 160, 36);
    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - 80, 480, 160, 36);

    ctx.font = 'bold 14px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 0;
    ctx.fillText('<< ZURÜCK [ESC]', CONFIG.CANVAS_WIDTH / 2, 498);

    ctx.restore();
  }
}
