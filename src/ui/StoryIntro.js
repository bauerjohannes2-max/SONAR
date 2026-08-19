/**
 * SONAR: The Echo Chamber
 * Sci-Fi Terminal Boot Log Modal ("Operation Zero-Light" Narrative Intro)
 */

import { CONFIG } from '../config.js';

export class StoryIntro {
  constructor(audioEngine, onComplete) {
    this.audio = audioEngine;
    this.onComplete = onComplete;
    this.isActive = false;
    this.startTime = 0;
    this.lastCharCount = 0;
    this.isTextFullyRevealed = false;

    this.logLines = [
      'In der verlassenen Tiefseestation ist der Strom ausgefallen.',
      'Du steuerst die Aufklärungsdrohne ECHO.',
      '',
      '• Sende Sonar-Pings aus, um Wände im Dunkeln aufzudecken.',
      '• Sammle alle Datenkerne ein, um den Fluchtaufzug zu öffnen.',
      '• Vorsicht: Jede Wandberührung zerstört die Drohne sofort.'
    ];
  }

  start(onComplete = null) {
    this.isActive = true;
    this.startTime = performance.now();
    this.lastCharCount = 0;
    this.isTextFullyRevealed = false;
    if (onComplete) this.onComplete = onComplete;
    if (this.audio && typeof this.audio.playUIBlip === 'function') {
      this.audio.playUIBlip();
    }
  }

  complete() {
    this.isActive = false;
    if (typeof this.onComplete === 'function') {
      this.onComplete();
    }
  }

  handleInput(inputHandler) {
    if (!this.isActive) return null;

    if (inputHandler.consumeEscape()) {
      this.complete();
      return 'COMPLETE';
    }

    const actionPressed = inputHandler.consumeAction();
    const click = inputHandler.consumeMouseClick();

    const boxW = 700;
    const boxH = 340;
    const boxX = (CONFIG.CANVAS_WIDTH - boxW) / 2;
    const boxY = (CONFIG.CANVAS_HEIGHT - boxH) / 2;
    const btnY = boxY + boxH - 58;
    const btnW = 260;
    const btnH = 38;
    const btnX = boxX + (boxW - btnW) / 2;

    if (actionPressed) {
      if (!this.isTextFullyRevealed) {
        // First press: reveal all text instantly
        this.isTextFullyRevealed = true;
        if (this.audio && typeof this.audio.playUIBlip === 'function') {
          this.audio.playUIBlip();
        }
      } else {
        // Second press: start mission
        this.complete();
        return 'COMPLETE';
      }
    }

    if (click) {
      if (!this.isTextFullyRevealed) {
        // First click anywhere: finish text instantly
        this.isTextFullyRevealed = true;
        if (this.audio && typeof this.audio.playUIBlip === 'function') {
          this.audio.playUIBlip();
        }
      } else {
        // Text is already fully revealed: ONLY start mission if clicking the button!
        const hitButton = click.x >= btnX - 10 && click.x <= btnX + btnW + 10 &&
                          click.y >= btnY - 8 && click.y <= btnY + btnH + 8;
        if (hitButton) {
          this.complete();
          return 'COMPLETE';
        }
        // Clicking outside the button when text is finished does nothing
      }
    }

    return null;
  }

  render(ctx, time) {
    if (!this.isActive) return;

    const totalLength = this.logLines.reduce((sum, line) => sum + (line ? line.length : 0), 0);
    const elapsedMs = performance.now() - this.startTime;
    // Typewriter speed: ~45 characters per second
    const charCount = Math.floor(elapsedMs * 0.045);
    if (charCount >= totalLength) {
      this.isTextFullyRevealed = true;
    }
    const totalChars = this.isTextFullyRevealed ? totalLength : charCount;

    ctx.save();

    // 1. Deep zero-light background overlay
    ctx.fillStyle = 'rgba(3, 6, 10, 0.95)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Glassmorphism Terminal Window Frame
    const boxW = 700;
    const boxH = 340;
    const boxX = (CONFIG.CANVAS_WIDTH - boxW) / 2;
    const boxY = (CONFIG.CANVAS_HEIGHT - boxH) / 2;

    // Glass Background Fill
    ctx.fillStyle = 'rgba(6, 12, 22, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Cyan Glow Border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 14;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.shadowBlur = 0;

    // Header Bar
    ctx.fillStyle = '#0a1622';
    ctx.fillRect(boxX, boxY, boxW, 36);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + 36);
    ctx.lineTo(boxX + boxW, boxY + 36);
    ctx.stroke();

    ctx.font = '700 13px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SEKTOR 01: STATION ABYSS', boxX + 16, boxY + 18);

    ctx.font = '700 11.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'right';
    ctx.fillText('STATUS: BEREIT', boxX + boxW - 16, boxY + 18);

    // 3. Render Terminal Logs with Typewriter Effect (Clean Elegant Monochrome & Cyan Accents)
    let charsRemaining = totalChars;
    const startLogY = boxY + 52;
    const lineSpacing = 28;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < this.logLines.length; i++) {
      const fullLine = this.logLines[i];
      if (!fullLine) continue; // blank line spacer

      const lineY = startLogY + i * lineSpacing;

      let visibleText = '';
      if (charsRemaining >= fullLine.length) {
        visibleText = fullLine;
        charsRemaining -= fullLine.length;
      } else if (charsRemaining > 0) {
        visibleText = fullLine.substring(0, charsRemaining);
        charsRemaining = 0;
      }

      if (visibleText.length > 0) {
        ctx.font = '500 12.5px "Chakra Petch", "JetBrains Mono", monospace';

        if (fullLine.startsWith('•')) {
          ctx.fillStyle = '#e2f4ff';
          ctx.fillText(visibleText, boxX + 24, lineY);
        } else {
          ctx.fillStyle = '#c8e2f0';
          ctx.fillText(visibleText, boxX + 24, lineY);
        }

        // Blinking terminal cursor on active line if not finished
        if (!this.isTextFullyRevealed && (visibleText.length < fullLine.length || (i === this.logLines.length - 1 && Math.floor(time * 4) % 2 === 0))) {
          const textW = ctx.measureText(visibleText).width;
          ctx.fillStyle = '#00f0ff';
          ctx.fillText('█', boxX + 24 + textW + 2, lineY);
        }
      }
    }

    // 4. Action Buttons (Launch Mission & Skip)
    const btnY = boxY + boxH - 58;
    const btnW = 260;
    const btnH = 38;
    const btnX = boxX + (boxW - btnW) / 2;

    // Pulse factor
    const pulse = 0.8 + 0.2 * Math.sin(time * 5);

    // Primary Start Button
    ctx.fillStyle = this.isTextFullyRevealed ? `rgba(0, 240, 255, ${0.18 * pulse})` : 'rgba(0, 240, 255, 0.08)';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = `rgba(0, 240, 255, ${this.isTextFullyRevealed ? 0.85 * pulse : 0.4})`;
    ctx.lineWidth = this.isTextFullyRevealed ? 2 : 1.5;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = this.isTextFullyRevealed ? 10 * pulse : 4;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 12.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = this.isTextFullyRevealed ? '#ffffff' : '#a0d8ef';
    const btnLabel = this.isTextFullyRevealed ? 'MISSION STARTEN' : 'TEXT BESCHLEUNIGEN';
    ctx.fillText(btnLabel, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  }
}

