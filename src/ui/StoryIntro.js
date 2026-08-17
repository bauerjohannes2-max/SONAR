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

    this.logLines = [
      '>> PROTOKOLL: ZERO-LIGHT AKTIVIERT // STATION ABYSS TIEFSEESTATION HAVARIERT',
      '>> EINHEIT: ECHO-7 ONLINE // PRIMÄRZIEL: RESONANZ-DATENKERNE BERGEN',
      '>> WARNUNG: AKUSTISCHE RAUBDROHNEN DETEKTIERT // EMISSIONEN MINIMIEREN'
    ];
  }

  start(onComplete = null) {
    this.isActive = true;
    this.startTime = performance.now();
    this.lastCharCount = 0;
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

    if (inputHandler.consumeAction()) {
      this.complete();
      return 'COMPLETE';
    }

    const click = inputHandler.consumeMouseClick();
    if (click) {
      // Hitbox for Start Mission / Skip or any screen tap after 200ms
      const elapsed = performance.now() - this.startTime;
      if (elapsed > 150) {
        this.complete();
        return 'COMPLETE';
      }
    }

    return null;
  }

  render(ctx, time) {
    if (!this.isActive) return;

    const elapsedMs = performance.now() - this.startTime;
    // Typewriter speed: ~40 characters per second
    const totalChars = Math.floor(elapsedMs * 0.045);

    ctx.save();

    // 1. Deep zero-light background overlay
    ctx.fillStyle = 'rgba(3, 6, 10, 0.95)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Glassmorphism Terminal Window Frame
    const boxW = 680;
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
    ctx.fillText('TERMINAL LOG // STATION ABYSS RECOVERY PROTOCOL', boxX + 16, boxY + 18);

    ctx.font = '700 12px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'right';
    ctx.fillText('STATUS: LIVE FEED ★', boxX + boxW - 16, boxY + 18);

    // 3. Render 3-Line Terminal Logs with Typewriter Effect
    let charsRemaining = totalChars;
    const startLogY = boxY + 68;
    const lineSpacing = 38;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < this.logLines.length; i++) {
      const fullLine = this.logLines[i];
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
        ctx.font = '600 12.5px "Chakra Petch", "JetBrains Mono", monospace';
        if (i === 0) {
          ctx.fillStyle = '#00f0ff';
        } else if (i === 1) {
          ctx.fillStyle = '#00ff88';
        } else {
          ctx.fillStyle = '#ff3355';
        }

        ctx.fillText(visibleText, boxX + 24, lineY);

        // Blinking terminal cursor on active line
        if (visibleText.length < fullLine.length || (i === this.logLines.length - 1 && Math.floor(time * 4) % 2 === 0)) {
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
    ctx.fillStyle = `rgba(0, 240, 255, ${0.12 * pulse})`;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.7 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 8 * pulse;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 12.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('▶ MISSION STARTEN (SPACE / KLICK)', btnX + btnW / 2, btnY + btnH / 2);

    // Skip Hint
    ctx.font = '500 10.5px "Chakra Petch", "JetBrains Mono", monospace';
    ctx.fillStyle = '#557788';
    ctx.fillText('[ ESC: ÜBERSPRINGEN ]', boxX + boxW / 2, boxY + boxH - 10);

    ctx.restore();
  }
}
