/**
 * SONAR: The Echo Chamber
 * Mobile Touch Controls with Ergonomic D-Pad, Multi-Touch, Hold-to-Move & State Isolation
 */

export class TouchControls {
  constructor(audioEngine, inputHandler) {
    this.audio = audioEngine;
    this.input = inputHandler;

    this.isTouchDevice = false;
    this.sneakToggled = false;
    this.touchOverlay = document.getElementById('touch-controls');
    this.isVisible = false;

    this.init();
  }

  init() {
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;

    if (this.touchOverlay) {
      this.touchOverlay.style.display = 'none'; // Strictly invisible in MENU / modals
    }

    this.bindButtons();
  }

  setVisible(visible) {
    if (!this.touchOverlay) return;
    const shouldShow = visible && this.isTouchDevice;
    if (this.isVisible !== shouldShow) {
      this.isVisible = shouldShow;
      this.touchOverlay.style.display = shouldShow ? 'block' : 'none';
      if (!shouldShow) {
        this.input.clearTouchDirection();
      }
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
    };

    // 4-Way D-Pad Movement with Hold-to-Move
    bindBtn(
      'touch-up',
      () => this.input.setTouchDirection(0, -1),
      () => this.input.clearTouchDirection(0, -1)
    );
    bindBtn(
      'touch-down',
      () => this.input.setTouchDirection(0, 1),
      () => this.input.clearTouchDirection(0, 1)
    );
    bindBtn(
      'touch-left',
      () => this.input.setTouchDirection(-1, 0),
      () => this.input.clearTouchDirection(-1, 0)
    );
    bindBtn(
      'touch-right',
      () => this.input.setTouchDirection(1, 0),
      () => this.input.clearTouchDirection(1, 0)
    );

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
