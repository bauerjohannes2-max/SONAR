/**
 * SONAR: The Echo Chamber
 * Interactive 7-Card Procedural Image Tutorial & Tactical Manual Modal
 * Uses child-friendly 3-point structure: WAS IST DAS? / WIE REAGIERST DU? / PROFI-TIPP
 */

import { CONFIG } from '../config.js';

export class TutorialModal {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.currentCardIndex = 0;
    this.animTime = 0;
    this.lastCardTime = 0;
    this.isTransitioning = false;

    // Create offscreen miniature canvas (280x140) for procedural animations
    this.miniCanvas = document.createElement('canvas');
    this.miniCanvas.width = 280;
    this.miniCanvas.height = 140;
    this.miniCtx = this.miniCanvas.getContext('2d');

    this.cards = [
      // Card 1: Player Drone
      {
        id: 'principle',
        title: '01. DU BIST DIE DROHNE ECHO',
        whatIsIt: 'Der leuchtende Cyan-Pfeil ist deine kleine Aufklärungsdrohne ECHO in Station ABYSS.',
        howToReact: 'Steuere mit WASD / Pfeiltasten oder der Touch-Steuerung. Du bist blind und musst dich durch Schallwellen orientieren.',
        proTip: 'Fliege vorausschauend: Taste SPACE / [PING] sendet einen Sonar-Puls aus, um den Weg zu beleuchten.',
        role: 'Der leuchtende Cyan-Pfeil ist deine kleine Aufklärungsdrohne ECHO in Station ABYSS.',
        behavior: 'Steuere mit WASD / Pfeiltasten oder der Touch-Steuerung. Du bist blind und musst dich durch Schallwellen orientieren.',
        counter: 'Fliege vorausschauend: Taste SPACE / [PING] sendet einen Sonar-Puls aus, um den Weg zu beleuchten.',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          // Animated Drone with glowing core
          ctx.save();
          ctx.translate(70, 70);
          ctx.rotate(Math.sin(t * 2) * 0.2);

          ctx.fillStyle = '#031720';
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(16, 0);
          ctx.lineTo(-12, -12);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-12, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Pulsing Core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Text / badges
          const badges = [
            { label: 'WASD / TOUCH', desc: 'Fliegen' },
            { label: 'SPACE / [PING]', desc: 'Sonar senden' },
            { label: 'SHIFT / SCHLEICHEN', desc: 'Lautlos' },
            { label: 'E / [KÖDER]', desc: 'Ablenken' }
          ];

          badges.forEach((b, i) => {
            const y = 22 + i * 28;
            ctx.fillStyle = '#091520';
            ctx.fillRect(135, y - 10, 135, 22);
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(135, y - 10, 135, 22);

            ctx.font = '700 9.5px "Chakra Petch", "JetBrains Mono", monospace';
            ctx.fillStyle = '#00F0FF';
            ctx.textAlign = 'left';
            ctx.fillText(b.label, 140, y + 4);
          });
        }
      },

      // Card 2: Waves & Walls
      {
        id: 'drone',
        title: '02. SCHALLWELLEN & WÄNDE',
        whatIsIt: 'Schallwellen breiten sich kreisförmig aus und lassen Wände kurz im Dunkeln aufleuchten.',
        howToReact: 'Drücke SPACE (oder [PING]), um Gänge sichtbar zu machen. Sieh genau hin, wo der Weg frei ist.',
        proTip: 'WICHTIG: Fliege niemals blind in eine Wand – deine Drohne zerbricht sonst sofort beim Aufprall!',
        role: 'Wände und Gänge kurz im Dunkeln aufleuchten lassen',
        behavior: 'Drücke SPACE (oder [PING]), um Gänge sichtbar zu machen. Sieh genau hin, wo der Weg frei ist.',
        counter: 'WICHTIG: Fliege niemals blind in eine Wand – deine Drohne zerbricht sonst sofort beim Aufprall!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          // Center source
          const waveRadius = (t * 70) % 150;
          const alpha = Math.max(0, 1 - waveRadius / 150);

          // Wall block
          const wallX = 180;
          const wallY = 45;
          const distToWall = Math.sqrt((wallX + 16 - 80) ** 2 + (wallY + 16 - 70) ** 2);
          const isHit = Math.abs(distToWall - waveRadius) < 18;
          const wallAlpha = isHit ? 1.0 : Math.max(0.05, alpha * 0.7);

          ctx.save();
          ctx.globalAlpha = wallAlpha;
          ctx.fillStyle = '#0a1722';
          ctx.fillRect(wallX, wallY, 36, 36);
          ctx.strokeStyle = '#FF3355';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#FF3355';
          ctx.shadowBlur = 10 * wallAlpha;
          ctx.strokeRect(wallX, wallY, 36, 36);
          ctx.restore();

          // Expanding wave ring
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(80, 70, waveRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Center drone
          ctx.fillStyle = '#00F0FF';
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(80, 70, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      },

      // Card 3: Crystals
      {
        id: 'objective',
        title: '03. KRISTALLE EINSAMMELN',
        whatIsIt: 'Grün leuchtende Resonanz-Kristalle, die in jedem Sektor versteckt sind.',
        howToReact: 'Finde und sammle alle Kristalle ein, um die Energie für das Rettungsportal freizuschalten.',
        proTip: 'Wenn Schallwellen einen Kristall streifen, erzeugt er ein helles Klingeln und funkelnde Glitzerpartikel!',
        role: 'Grün leuchtende Resonanz-Kristalle bergen',
        behavior: 'Finde und sammle alle Kristalle ein, um die Energie für das Rettungsportal freizuschalten.',
        counter: 'Wenn Schallwellen einen Kristall streifen, erzeugt er ein helles Klingeln und funkelnde Glitzerpartikel!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          for (let i = 0; i < 3; i++) {
            const cx = 70 + i * 70;
            const cy = 70 + Math.sin(t * 3 + i) * 6;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(t * 2 + i);

            ctx.fillStyle = '#00FF88';
            ctx.shadowColor = '#00FF88';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 12);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      },

      // Card 4: Escape Portal
      {
        id: 'portal',
        title: '04. DER GRÜNE FLUCHTAUFZUG',
        whatIsIt: 'Das Rettungs-Portal zur Evakuierung und zum erfolgreichen Abschluss des Sektors.',
        howToReact: 'Sobald alle Kristalle geborgen sind, öffnet sich der Aufzug. Fliege hinein, um den Sektor zu sichern!',
        proTip: 'Folge den pulsierenden grünen Signal-Wellen und dem Richtungspfeil am Bildschirmrand zum Ausgang.',
        role: 'Das Rettungs-Portal zur Evakuierung',
        behavior: 'Sobald alle Kristalle geborgen sind, öffnet sich der Aufzug. Fliege hinein, um den Sektor zu sichern!',
        counter: 'Folge den pulsierenden grünen Signal-Wellen und dem Richtungspfeil am Bildschirmrand zum Ausgang.',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          const gx = 140;
          const gy = 70;
          ctx.save();
          ctx.fillStyle = '#062014';
          ctx.fillRect(gx - 26, gy - 30, 52, 60);

          const glow = 12 + Math.sin(t * 5) * 8;
          ctx.strokeStyle = '#00FF88';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00FF88';
          ctx.shadowBlur = glow;
          ctx.strokeRect(gx - 26, gy - 30, 52, 60);

          // Arrow Chevron
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const bob = Math.sin(t * 4) * 4;
          ctx.moveTo(gx - 10, gy + 8 + bob);
          ctx.lineTo(gx, gy - 8 + bob);
          ctx.lineTo(gx + 10, gy + 8 + bob);
          ctx.stroke();

          // Beacon Waves
          const bR = (t * 50) % 90;
          ctx.strokeStyle = 'rgba(0, 255, 136, ' + Math.max(0, 1 - bR / 90) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gx, gy, bR + 20, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      },

      // Card 5: Red Monsters (Hunters)
      {
        id: 'hunter',
        title: '05. ROTE MONSTER (JÄGER)',
        whatIsIt: 'Gefährliche blinde Raubdrohnen, die durch die dunklen Gänge der Station ABYSS patrouillieren.',
        howToReact: 'Sie sind blind, aber hören jeden Ping! Wenn sie rot blinken und jagen, halte Abstand und bleib ruhig.',
        proTip: 'Schleiche leise an ihnen vorbei oder wirf mit Taste E einen Köder, um sie wegzulocken!',
        role: 'Gefährliche blinde Raubdrohnen in Station ABYSS',
        behavior: 'Sie sind blind, aber hören jeden Ping! Wenn sie rot blinken und jagen, halte Abstand und bleib ruhig.',
        counter: 'Schleiche leise an ihnen vorbei oder wirf mit Taste E einen Köder, um sie wegzulocken!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          const soundX = 60;
          const soundY = 70;
          const r = (t * 60) % 100;
          ctx.strokeStyle = 'rgba(0, 240, 255, ' + Math.max(0, 1 - r / 100) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(soundX, soundY, r, 0, Math.PI * 2);
          ctx.stroke();

          const hunterProgress = (t * 0.6) % 1.0;
          const hx = 220 - hunterProgress * 130;
          const hy = 70;

          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(Math.PI);

          ctx.fillStyle = '#1e050a';
          ctx.strokeStyle = '#FF1E44';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#FF1E44';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-10, -10);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(3, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.font = '700 16px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#FF1E44';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#FF1E44';
          ctx.shadowBlur = 10;
          ctx.fillText('!', hx, hy - 20);
        }
      },

      // Card 6: Sneak Mode
      {
        id: 'sneak',
        title: '06. LEISE SCHLEICHEN',
        whatIsIt: 'Der Schleich-Modus für lautlose Fortbewegung (Taste SHIFT oder Button [SCHLEICHEN]).',
        howToReact: 'Schalte Schleichen ein, wenn Feinde in der Nähe sind. Deine Drohne bewegt sich langsamer, aber 100% leise.',
        proTip: 'Beim Schleichen erzeugst du 0 Schallwellen. Monster schlafen einfach weiter!',
        role: 'Lautlose Fortbewegung im Schleich-Modus',
        behavior: 'Schalte Schleichen ein, wenn Feinde in der Nähe sind. Deine Drohne bewegt sich langsamer, aber 100% leise.',
        counter: 'Beim Schleichen erzeugst du 0 Schallwellen. Monster schlafen einfach weiter!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          const sx = 80 + (t * 20) % 120;
          const sy = 70;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.fillStyle = '#031720';
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 6;

          ctx.beginPath();
          ctx.moveTo(12, 0);
          ctx.lineTo(-8, -8);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#00FF88';
          ctx.textAlign = 'center';
          ctx.fillText('🤫 0 SCHALLWELLEN • LAUTLOS', 140, 30);

          ctx.font = '600 11px "Chakra Petch", "JetBrains Mono", monospace';
          ctx.fillStyle = '#9cb8c8';
          ctx.fillText('Monster schlafen weiter', 140, 115);
        }
      },

      // Card 7: Decoy Flare
      {
        id: 'decoy',
        title: '07. KÖDER-WURF (E)',
        whatIsIt: 'Ein akustischer Ablenkungs-Wurfkörper (HUD-Anzeige: 1/1 Köder pro Sektor).',
        howToReact: 'Drücke Taste E (oder [KÖDER]), um die Bake 3 Felder weit nach vorne zu schleudern.',
        proTip: 'Der Köder piept laut und zieht alle Jäger magisch an. Nutze die Chance und sprinte zum Ausgang!',
        role: 'Akustischer Ablenkungs-Wurfkörper',
        behavior: 'Drücke Taste E (oder [KÖDER]), um die Bake 3 Felder weit nach vorne zu schleudern.',
        counter: 'Der Köder piept laut und zieht alle Jäger magisch an. Nutze die Chance und sprinte zum Ausgang!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          const dx = 170;
          const dy = 70;

          const wR = (t * 60) % 90;
          ctx.strokeStyle = '#FFAA00';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#FFAA00';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(dx, dy, wR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(t * 4);
          ctx.fillStyle = '#FFAA00';
          ctx.shadowColor = '#FFAA00';
          ctx.shadowBlur = 15;
          ctx.fillRect(-6, -6, 12, 12);
          ctx.restore();

          const hx = 250 - ((t * 40) % 70);
          ctx.save();
          ctx.translate(hx, dy);
          ctx.rotate(Math.PI);
          ctx.fillStyle = '#FF1E44';
          ctx.shadowColor = '#FF1E44';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    ];
  }

  reset() {
    this.currentCardIndex = 0;
    this.openedAt = Date.now();
    this.lastCardChangeTime = performance.now();
    this.isTransitioning = false;
  }

  handleInput(inputHandler) {
    const now = performance.now();
    if (this.openedAt && Date.now() - this.openedAt < 400) {
      inputHandler.consumeMouseClick();
      return null;
    }

    const move = inputHandler.getMovement();
    if (move) {
      if (move.dx < 0 || move.dy < 0) {
        this.prevCard();
      } else if (move.dx > 0 || move.dy > 0) {
        this.nextCard();
      }
    }

    if (inputHandler.consumeEscape()) {
      return 'CLOSE';
    }

    const click = inputHandler.consumeMouseClick();
    if (click) {
      if (click.x >= 100 && click.x <= 270 && click.y >= 460 && click.y <= 535) {
        this.prevCard();
      } else if (click.x >= 530 && click.x <= 700 && click.y >= 460 && click.y <= 535) {
        this.nextCard();
      } else if (click.x >= 280 && click.x <= 520 && click.y >= 460 && click.y <= 535) {
        if (now - this.lastCardChangeTime >= 350) {
          this.lastCardChangeTime = now;
          return 'CLOSE';
        }
      } else if (click.x >= 620 && click.x <= 710 && click.y >= 30 && click.y <= 90) {
        if (now - this.lastCardChangeTime >= 350) {
          this.lastCardChangeTime = now;
          return 'CLOSE';
        }
      }
    }

    return null;
  }

  prevCard(e = null) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const now = performance.now();
    if (now - this.lastCardTime < 350) return;
    this.lastCardTime = now;

    this.currentCardIndex = (this.currentCardIndex - 1 + this.cards.length) % this.cards.length;
    if (this.audio) this.audio.playCardFlip();
  }

  nextCard(e = null) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const now = performance.now();
    if (now - this.lastCardTime < 350) return;
    this.lastCardTime = now;

    this.currentCardIndex = (this.currentCardIndex + 1) % this.cards.length;
    if (this.audio) this.audio.playCardFlip();
  }

  render(ctx, time) {
    this.animTime = time;
    const card = this.cards[this.currentCardIndex];

    ctx.save();

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(3, 3, 5, 0.95)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Modal Frame Box
    const boxW = 600;
    const boxH = 480;
    const boxX = (CONFIG.CANVAS_WIDTH - boxW) / 2;
    const boxY = 40;

    ctx.fillStyle = '#060a0f';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 12;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Modal Header
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 0;
    ctx.fillText(`TUTORIAL • ANLEITUNG (${this.currentCardIndex + 1} / ${this.cards.length})`, boxX + 20, boxY + 25);

    // Close [X] Button in Top-Right
    ctx.textAlign = 'right';
    ctx.font = '700 18px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.HUNTER;
    ctx.fillText('✕', boxX + boxW - 20, boxY + 25);

    // Render Procedural Animated Canvas (Upper Half)
    card.renderVisual(this.miniCtx, time);
    ctx.drawImage(this.miniCanvas, boxX + (boxW - 280) / 2, boxY + 48);

    // Card Title
    ctx.textAlign = 'center';
    ctx.font = '700 14px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.shadowBlur = 0;
    ctx.fillText(card.title, CONFIG.CANVAS_WIDTH / 2, boxY + 205);

    // Tactical Table Box (Lower Half)
    const tblX = boxX + 24;
    const tblY = boxY + 222;
    const tblW = boxW - 48;
    const tblH = 205;

    ctx.fillStyle = '#04080c';
    ctx.fillRect(tblX, tblY, tblW, tblH);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tblX, tblY, tblW, tblH);

    const rows = [
      { label: 'WAS IST DAS?', val: card.whatIsIt, color: CONFIG.COLORS.PLAYER },
      { label: 'WIE REAGIERST DU?', val: card.howToReact, color: '#FFFFFF' },
      { label: 'PROFI-TIPP', val: card.proTip, color: CONFIG.COLORS.CRYSTAL }
    ];

    let currentY = tblY + 16;
    rows.forEach((r) => {
      ctx.textAlign = 'left';
      ctx.font = '700 11px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = r.color;
      ctx.shadowBlur = 0;
      ctx.fillText(`• ${r.label}`, tblX + 16, currentY);

      ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
      ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
      ctx.shadowBlur = 0;
      currentY = this.wrapText(ctx, r.val, tblX + 16, currentY + 15, tblW - 32, 14);
      currentY += 6;
    });

    // Navigation Buttons at Bottom (34px high)
    const btnY = boxY + boxH - 22;

    // VORHERIGE
    ctx.fillStyle = '#091520';
    ctx.fillRect(boxX + 24, btnY - 17, 120, 34);
    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 24, btnY - 17, 120, 34);
    ctx.textAlign = 'center';
    ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.fillText('← VORHERIGE', boxX + 84, btnY);

    // SCHLIESSEN / ZURÜCK ZUM MENÜ
    ctx.fillStyle = '#18070b';
    ctx.fillRect(boxX + (boxW - 170) / 2, btnY - 17, 170, 34);
    ctx.strokeStyle = CONFIG.COLORS.HUNTER;
    ctx.strokeRect(boxX + (boxW - 170) / 2, btnY - 17, 170, 34);
    ctx.fillStyle = CONFIG.COLORS.HUNTER;
    ctx.fillText('ZURÜCK ZUM MENÜ', boxX + boxW / 2, btnY);

    // NÄCHSTE
    ctx.fillStyle = '#091520';
    ctx.fillRect(boxX + boxW - 144, btnY - 17, 120, 34);
    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.strokeRect(boxX + boxW - 144, btnY - 17, 120, 34);
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.fillText('NÄCHSTE →', boxX + boxW - 84, btnY);

    ctx.restore();
  }

  wrapText(ctx, text, x, startY, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let y = startY;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line.length > 0 ? ' ' : '') + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
  }
}
