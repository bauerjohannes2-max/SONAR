/**
 * SONAR: The Echo Chamber
 * Interactive 7-Card Procedural Image Tutorial & Tactical Manual Modal
 */

import { CONFIG } from '../config.js';

export class TutorialModal {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.currentCardIndex = 0;
    this.animTime = 0;

    // Create offscreen miniature canvas (280x140) for procedural animations
    this.miniCanvas = document.createElement('canvas');
    this.miniCanvas.width = 280;
    this.miniCanvas.height = 140;
    this.miniCtx = this.miniCanvas.getContext('2d');

    this.cards = [
      // Card 1: Principle & Wall Hazard
      {
        id: 'principle',
        title: '01. ZERO-LIGHT & MAUER-GEFAHR',
        category: 'GRUNDPRINZIP',
        role: 'Umgebungsphysik & Kollision',
        behavior: '100% Dunkelheit. Nur Schallwellen decken Wände auf. ACHTUNG: Blindes Laufen in Wände zerstört die Drohne sofort!',
        counter: 'Nutze Sonar-Pings [SPACE], merke dir das Labyrinth und steuere präzise.',
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

      // Card 2: Player Drone & Dual Controls
      {
        id: 'drone',
        title: '02. STEUERUNG (PC & TOUCH)',
        category: 'SPIELER-EINHEIT',
        role: 'Späh-Drohne (Wandkollision = Tod)',
        behavior: 'Schritte erzeugen 2.5-Tile Schallwelle. Sonar-Ping deckt Raum für 1.5s auf (3s Cooldown).',
        counter: 'PC: [WASD] / [SHIFT] / [SPACE] / [E] / [F Vollbild] // Mobile: On-Screen D-Pad & Buttons.',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          // Animated Drone
          ctx.save();
          ctx.translate(65, 70);
          ctx.rotate(Math.sin(t * 2) * 0.2);

          ctx.fillStyle = '#031720';
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-10, -10);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Pulsing Core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, 3 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Control Key Badges (Right side)
          const badges = [
            { label: 'WASD / D-PAD', desc: 'Schritt (Schall)' },
            { label: 'SHIFT / SNEAK', desc: 'Schleichen (0 Schall)' },
            { label: 'SPACE / PING', desc: 'Sonar-Ping (3s CD)' },
            { label: 'E / KÖDER', desc: 'Täuschkörper (1/1)' }
          ];

          badges.forEach((b, i) => {
            const y = 22 + i * 28;
            ctx.fillStyle = '#091520';
            ctx.fillRect(130, y - 10, 140, 22);
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(130, y - 10, 140, 22);

            ctx.font = 'bold 9px "Share Tech Mono", monospace';
            ctx.fillStyle = '#00F0FF';
            ctx.textAlign = 'left';
            ctx.fillText(b.label, 136, y + 4);
          });
        }
      },

      // Card 3: Objective
      {
        id: 'objective',
        title: '03. MISSION: KRISTALLE & SCHLEUSE',
        category: 'SEKTOR-ZIEL',
        role: 'Energiegewinnung & Extraktion',
        behavior: 'Schleuse bleibt gesperrt, bis alle Resonanz-Kristalle eingesammelt sind.',
        counter: 'Sammle 3-5 Kristalle, damit die Schleuse grün pulsiert, und flüchte hindurch.',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          // 3 Crystals
          for (let i = 0; i < 3; i++) {
            const cx = 50 + i * 45;
            const cy = 70 + Math.sin(t * 3 + i) * 6;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(t * 2 + i);

            ctx.fillStyle = '#00FF88';
            ctx.shadowColor = '#00FF88';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 9);
            ctx.lineTo(-6, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Green Extraction Airlock Gate (Right side)
          const gx = 210;
          const gy = 70;
          ctx.save();
          ctx.fillStyle = '#062014';
          ctx.fillRect(gx - 20, gy - 24, 40, 48);

          const glow = 10 + Math.sin(t * 5) * 6;
          ctx.strokeStyle = '#00FF88';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00FF88';
          ctx.shadowBlur = glow;
          ctx.strokeRect(gx - 20, gy - 24, 40, 48);

          // Arrow Chevron
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const bob = Math.sin(t * 4) * 4;
          ctx.moveTo(gx - 8, gy + 6 + bob);
          ctx.lineTo(gx, gy - 6 + bob);
          ctx.lineTo(gx + 8, gy + 6 + bob);
          ctx.stroke();
          ctx.restore();
        }
      },

      // Card 4: Hunter
      {
        id: 'hunter',
        title: '04. HUNTER // DER BLINDE JÄGER',
        category: 'FEIND-TYP (SIGNAL-ROT)',
        role: 'Aggressiver Spitzenprädator',
        behavior: 'Blind. Hört Schritte & Pings und sprintet via kürzestem Pfad (BFS) zur Quelle.',
        counter: 'Schleiche mit [SHIFT] an ihm vorbei oder lenke ihn mit Schall-Ködern [E] ab!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          // Pulsing Sound origin on left
          const soundX = 60;
          const soundY = 70;
          const r = (t * 60) % 100;
          ctx.strokeStyle = 'rgba(0, 240, 255, ' + Math.max(0, 1 - r / 100) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(soundX, soundY, r, 0, Math.PI * 2);
          ctx.stroke();

          // Hunter sprinting to sound origin
          const hunterProgress = (t * 0.6) % 1.0;
          const hx = 220 - hunterProgress * 130;
          const hy = 70;

          ctx.save();
          ctx.translate(hx, hy);
          ctx.rotate(Math.PI); // Facing left

          ctx.fillStyle = '#1e050a';
          ctx.strokeStyle = '#FF1E44';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#FF1E44';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(12, 0);
          ctx.lineTo(-9, -9);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-9, 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Alert Eye & Exclamation
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(3, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // Exclamation icon
          ctx.font = 'bold 16px "Share Tech Mono", monospace';
          ctx.fillStyle = '#FF1E44';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#FF1E44';
          ctx.shadowBlur = 10;
          ctx.fillText('!', hx, hy - 20);
        }
      },

      // Card 5: Shadow Stalker
      {
        id: 'stalker',
        title: '05. SHADOW STALKER // LAUTLOSER JÄGER',
        category: 'FEIND-TYP (SCHATTEN-LILA)',
        role: 'Lautloser Infiltrator',
        behavior: 'Schleicht im Dunkeln geräuschlos direkt auf deine Position zu.',
        counter: 'FEIND-SCHWÄCHE: Löse einen Sonar-Ping [SPACE] aus -> Erstarrt 2.5s im Licht!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          // Cycle between stalking and frozen by sonar
          const isStunned = Math.floor(t) % 2 === 1;
          const sx = 140;
          const sy = 70;

          if (isStunned) {
            // Sonar wave flash
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00F0FF';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(sx, sy, 40, 0, Math.PI * 2);
            ctx.stroke();

            // Frozen Stalker Crystal
            ctx.save();
            ctx.translate(sx, sy);
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#9D00FF';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#9D00FF';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 11px "Share Tech Mono", monospace';
            ctx.fillStyle = '#00F0FF';
            ctx.textAlign = 'center';
            ctx.fillText('BLINDED // STUNNED 2.5s', 0, -22);
            ctx.restore();
          } else {
            // Slinking in dark
            ctx.save();
            ctx.translate(sx, sy);
            ctx.fillStyle = '#100518';
            ctx.strokeStyle = '#9D00FF';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#9D00FF';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-9, -9);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-9, 9);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#9D00FF';
            ctx.beginPath();
            ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      },

      // Card 6: Resonator
      {
        id: 'resonator',
        title: '06. RESONATOR // DER ALARM-KNOTEN',
        category: 'HAZARD-TYP (WARN-GELB)',
        role: 'Akustischer Alarmposten',
        behavior: 'Trifft ihn eine Sonar-Welle, sendet er eine kreischende Schockwelle aus.',
        counter: 'Schockwelle weckt alle Hunter auf! Vermeide Pings in Resonator-Nähe.',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          const rx = 140;
          const ry = 70;

          // Expanding Yellow Alarm Shockwave
          const waveR = (t * 80) % 130;
          ctx.strokeStyle = '#FFE600';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FFE600';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(rx, ry, waveR, 0, Math.PI * 2);
          ctx.stroke();

          // Resonator Node
          ctx.save();
          ctx.translate(rx, ry);
          const sz = 12;
          ctx.fillStyle = '#FFE600';
          ctx.shadowColor = '#FFE600';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(-sz, -sz * 0.4);
          ctx.lineTo(-sz * 0.4, -sz);
          ctx.lineTo(sz * 0.4, -sz);
          ctx.lineTo(sz, -sz * 0.4);
          ctx.lineTo(sz, sz * 0.4);
          ctx.lineTo(sz * 0.4, sz);
          ctx.lineTo(-sz * 0.4, sz);
          ctx.lineTo(-sz, sz * 0.4);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      },

      // Card 7: Decoy Flare
      {
        id: 'decoy',
        title: '07. SCHALL-KÖDER // DECOY FLARE',
        category: 'TAKTIK-AUSRÜSTUNG [E / F]',
        role: 'Ablenkungs-Wurfkörper (1x pro Sektor)',
        behavior: 'Fliegt 4 Kacheln vor und sendet 3 Sekunden lang laute Klick-Impulse aus.',
        counter: 'Wirf den Köder mit [E], um Hunter von Engpässen wegzulocken!',
        renderVisual: (ctx, t) => {
          ctx.fillStyle = '#030305';
          ctx.fillRect(0, 0, 280, 140);

          const dx = 170;
          const dy = 70;

          // Expanding Decoy Waves
          const wR = (t * 60) % 90;
          ctx.strokeStyle = '#FFAA00';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#FFAA00';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(dx, dy, wR, 0, Math.PI * 2);
          ctx.stroke();

          // Decoy Flare rotating beacon
          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(t * 6);
          ctx.fillStyle = '#FFAA00';
          ctx.fillRect(-6, -6, 12, 12);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-6, -6, 12, 12);
          ctx.restore();

          // Hunter running toward Decoy (Right side)
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

  handleInput(inputHandler) {
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
      // Check modal navigation buttons:
      // Prev: x: 140..250, y: 490..525
      // Next: x: 550..660, y: 490..525
      // Close: x: 330..470, y: 490..525 or Top-Right X (x: 640..680, y: 45..85)
      if (click.x >= 130 && click.x <= 250 && click.y >= 485 && click.y <= 525) {
        this.prevCard();
      } else if (click.x >= 550 && click.x <= 670 && click.y >= 485 && click.y <= 525) {
        this.nextCard();
      } else if (click.x >= 320 && click.x <= 480 && click.y >= 485 && click.y <= 525) {
        return 'CLOSE';
      } else if (click.x >= 635 && click.x <= 685 && click.y >= 40 && click.y <= 85) {
        return 'CLOSE';
      }
    }

    return null;
  }

  prevCard() {
    this.currentCardIndex = (this.currentCardIndex - 1 + this.cards.length) % this.cards.length;
    if (this.audio) this.audio.playCardFlip();
  }

  nextCard() {
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
    ctx.font = 'bold 15px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 8;
    ctx.fillText(`TAKTIK-HANDBUCH // [ KARTE ${this.currentCardIndex + 1} / ${this.cards.length} ]`, boxX + 20, boxY + 25);

    // Close [X] Button in Top-Right
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.HUNTER;
    ctx.fillText('[ X ]', boxX + boxW - 20, boxY + 25);

    // Render Procedural Animated Canvas (Upper Half)
    card.renderVisual(this.miniCtx, time);
    ctx.drawImage(this.miniCanvas, boxX + (boxW - 280) / 2, boxY + 50);

    // Card Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 6;
    ctx.fillText(card.title, CONFIG.CANVAS_WIDTH / 2, boxY + 215);

    // Tactical Table Box (Lower Half)
    const tblX = boxX + 24;
    const tblY = boxY + 235;
    const tblW = boxW - 48;
    const tblH = 185;

    ctx.fillStyle = '#04080c';
    ctx.fillRect(tblX, tblY, tblW, tblH);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tblX, tblY, tblW, tblH);

    const rows = [
      { label: 'ROLLE', val: card.role, color: CONFIG.COLORS.PLAYER },
      { label: 'VERHALTEN', val: card.behavior, color: CONFIG.COLORS.TEXT_MAIN },
      { label: 'GEGENMASSNAHME', val: card.counter, color: CONFIG.COLORS.CRYSTAL }
    ];

    rows.forEach((r, i) => {
      const ry = tblY + 28 + i * 55;
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
      ctx.fillStyle = r.color;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 4;
      ctx.fillText(`• ${r.label}:`, tblX + 16, ry);

      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
      ctx.shadowBlur = 0;
      ctx.fillText(r.val, tblX + 16, ry + 20);
    });

    // Navigation Buttons at Bottom
    const btnY = boxY + boxH - 30;

    // [ < VORHERIGE ]
    ctx.fillStyle = '#091520';
    ctx.fillRect(boxX + 24, btnY - 14, 110, 28);
    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 24, btnY - 14, 110, 28);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.fillText('< VORHERIGE', boxX + 79, btnY);

    // [ SCHLIESSEN ]
    ctx.fillStyle = '#18070b';
    ctx.fillRect(boxX + (boxW - 130) / 2, btnY - 14, 130, 28);
    ctx.strokeStyle = CONFIG.COLORS.HUNTER;
    ctx.strokeRect(boxX + (boxW - 130) / 2, btnY - 14, 130, 28);
    ctx.fillStyle = CONFIG.COLORS.HUNTER;
    ctx.fillText('X SCHLIESSEN', boxX + boxW / 2, btnY);

    // [ NÄCHSTE > ]
    ctx.fillStyle = '#091520';
    ctx.fillRect(boxX + boxW - 134, btnY - 14, 110, 28);
    ctx.strokeStyle = CONFIG.COLORS.PLAYER;
    ctx.strokeRect(boxX + boxW - 134, btnY - 14, 110, 28);
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.fillText('NÄCHSTE >', boxX + boxW - 79, btnY);

    ctx.restore();
  }
}
