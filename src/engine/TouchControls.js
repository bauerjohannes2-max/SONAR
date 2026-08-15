/**
 * SONAR: The Echo Chamber
 * Mobile Touch Controls with Ergonomic D-Pad, Multi-Touch & Haptic Feedback
 */

export class TouchControls {
  constructor(audioEngine, inputHandler) {
    this.audio = audioEngine;
    this.input = inputHandler;

    this.isTouchDevice = false;
    this.sneakToggled = false;
    this.touchOverlay = document.getElementById('touch-controls');

    this.init();
  }

  init() {
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (this.isTouchDevice && this.touchOverlay) {
      this.touchOverlay.style.display = 'block';
      this.bindButtons();
    }
  }

  bindButtons() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;

      const handleDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        if (this.audio) this.audio.ensureContext();
        if (onDown) onDown();
      };

      const handleUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
        if (onUp) onUp();
      };

      el.addEventListener('touchstart', handleDown, { passive: false });
      el.addEventListener('touchend', handleUp, { passive: false });
      el.addEventListener('touchcancel', handleUp, { passive: false });
      el.addEventListener('mousedown', handleDown);
      el.addEventListener('mouseup', handleUp);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.audio) this.audio.ensureContext();
        if (onDown) onDown();
      });
    };

    // 4-Way D-Pad Movement
    bindBtn('touch-up', () => { this.input.moveQueue = { dx: 0, dy: -1 }; });
    bindBtn('touch-down', () => { this.input.moveQueue = { dx: 0, dy: 1 }; });
    bindBtn('touch-left', () => { this.input.moveQueue = { dx: -1, dy: 0 }; });
    bindBtn('touch-right', () => { this.input.moveQueue = { dx: 1, dy: 0 }; });

    // Action Buttons
    bindBtn('touch-ping', () => {
      this.input.pingTriggered = true;
      this.input.actionTriggered = true;
    });

    bindBtn('touch-decoy', () => {
      this.input.decoyTriggered = true;
    });

    // Sneak Toggle Button
    const sneakBtn = document.getElementById('touch-sneak');
    if (sneakBtn) {
      const toggleSneak = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.sneakToggled = !this.sneakToggled;
        if (this.sneakToggled) {
          sneakBtn.classList.add('sneak-on');
        } else {
          sneakBtn.classList.remove('sneak-on');
        }
        if (this.audio) this.audio.playUIBlip();
      };

      sneakBtn.addEventListener('touchstart', toggleSneak, { passive: false });
      sneakBtn.addEventListener('mousedown', toggleSneak);
    }
  }

  isSneakActive() {
    return this.sneakToggled;
  }

  update(player) {
    if (!player) return;

    // 1. Update Ping Cooldown Text & Style
    const pingBtn = document.getElementById('touch-ping');
    if (pingBtn) {
      const pingSec = player.getPingRemainingSeconds();
      if (pingSec > 0) {
        pingBtn.innerText = `PING ${pingSec}s`;
        pingBtn.style.opacity = '0.6';
        pingBtn.style.borderColor = '#ff4466';
      } else {
        pingBtn.innerText = 'PING';
        pingBtn.style.opacity = '1.0';
        pingBtn.style.borderColor = 'var(--player-color, #00F0FF)';
      }
    }

    // 2. Update Decoy Count
    this.updateDecoyCount(player.decoysRemaining);
  }

  updateDecoyCount(remaining) {
    const el = document.getElementById('touch-decoy-count');
    if (el) {
      el.innerText = `${remaining}/1`;
    }
  }
}
