/**
 * SONAR: The Echo Chamber
 * Mobile Touch Controls with Ergonomic D-Pad, Thumb-Sliding, Multi-Touch & State Isolation
 */

export class TouchControls {
  constructor(audioEngine, inputHandler) {
    this.audio = audioEngine;
    this.input = inputHandler;

    this.isTouchDevice = false;
    this.sneakToggled = false;
    this.touchOverlay = document.getElementById('touch-controls');
    this.isVisible = false;

    this.dpadContainer = null;
    this.dpadTouchId = null;
    this.currentDirection = null; // { dx, dy }

    this.init();
  }

  init() {
    this.isTouchDevice = ('ontouchstart' in window) || 
                         (navigator.maxTouchPoints > 0) || 
                         (window.innerWidth <= 1024) || 
                         (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    window.addEventListener('touchstart', () => {
      this.isTouchDevice = true;
    }, { once: true, passive: true });

    if (this.touchOverlay) {
      this.touchOverlay.style.display = 'none'; // Strictly invisible in MENU / modals
    }

    this.dpadContainer = document.getElementById('touch-dpad-container');
    this.bindDpadSliding();
    this.bindButtons();
  }

  setVisible(visible) {
    if (!this.touchOverlay) return;
    const isTouch = this.isTouchDevice || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    const shouldShow = visible && isTouch;

    if (this.isVisible !== shouldShow) {
      this.isVisible = shouldShow;
      this.touchOverlay.style.display = shouldShow ? 'flex' : 'none';

      if (shouldShow) {
        document.body.classList.add('has-touch-controls');
      } else {
        document.body.classList.remove('has-touch-controls');
        this.clearDpad();
        this.input.clearTouchDirection();
      }
    }
  }

  bindDpadSliding() {
    if (!this.dpadContainer) return;

    const upBtn = document.getElementById('touch-up');
    const downBtn = document.getElementById('touch-down');
    const leftBtn = document.getElementById('touch-left');
    const rightBtn = document.getElementById('touch-right');

    const updateDpadHighlight = (dir) => {
      if (upBtn) upBtn.classList.toggle('active', !!(dir && dir.dy === -1));
      if (downBtn) downBtn.classList.toggle('active', !!(dir && dir.dy === 1));
      if (leftBtn) leftBtn.classList.toggle('active', !!(dir && dir.dx === -1));
      if (rightBtn) rightBtn.classList.toggle('active', !!(dir && dir.dx === 1));
    };

    const processPoint = (clientX, clientY) => {
      const rect = this.dpadContainer.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dead zone at immediate center
      if (dist < 12) {
        if (this.currentDirection) {
          this.currentDirection = null;
          updateDpadHighlight(null);
          this.input.clearTouchDirection();
        }
        return;
      }

      let newDir = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
      } else {
        newDir = dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
      }

      if (!this.currentDirection || this.currentDirection.dx !== newDir.dx || this.currentDirection.dy !== newDir.dy) {
        this.currentDirection = newDir;
        updateDpadHighlight(newDir);
        this.input.setTouchDirection(newDir.dx, newDir.dy);
        if (this.audio) this.audio.ensureContext();
      }
    };

    // Touch Event Handlers on D-Pad Container with Thumb Sliding
    this.dpadContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.dpadTouchId === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        this.dpadTouchId = touch.identifier;
        processPoint(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    this.dpadContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.dpadTouchId !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.dpadTouchId) {
            processPoint(e.touches[i].clientX, e.touches[i].clientY);
            break;
          }
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e) => {
      if (this.dpadTouchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.dpadTouchId) {
            this.clearDpad();
            break;
          }
        }
      }
    };

    this.dpadContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.dpadContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Mouse Fallback for Desktop Simulation
    let isMouseDown = false;
    this.dpadContainer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isMouseDown = true;
      processPoint(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        processPoint(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.clearDpad();
      }
    });
  }

  clearDpad() {
    this.dpadTouchId = null;
    this.currentDirection = null;
    const upBtn = document.getElementById('touch-up');
    const downBtn = document.getElementById('touch-down');
    const leftBtn = document.getElementById('touch-left');
    const rightBtn = document.getElementById('touch-right');
    if (upBtn) upBtn.classList.remove('active');
    if (downBtn) downBtn.classList.remove('active');
    if (leftBtn) leftBtn.classList.remove('active');
    if (rightBtn) rightBtn.classList.remove('active');
    this.input.clearTouchDirection();
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
    const sneakBadge = document.getElementById('touch-sneak-badge');

    if (sneakBtn) {
      const toggleSneak = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.sneakToggled = !this.sneakToggled;
        if (this.sneakToggled) {
          sneakBtn.classList.add('sneak-on');
          if (sneakBadge) sneakBadge.innerText = 'EIN';
        } else {
          sneakBtn.classList.remove('sneak-on');
          if (sneakBadge) sneakBadge.innerText = 'AUS';
        }

        if (this.audio) this.audio.playUIBlip();
      };

      sneakBtn.addEventListener('click', toggleSneak);
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
    const pingLabel = document.getElementById('touch-ping-label');
    if (pingBtn) {
      const pingSec = player.getPingRemainingSeconds();
      if (pingSec > 0) {
        if (pingLabel) pingLabel.innerText = `PING ${pingSec}s`;
        pingBtn.style.opacity = '0.65';
        pingBtn.style.borderColor = '#ff4466';
        pingBtn.style.color = '#ff8899';
      } else {
        if (pingLabel) pingLabel.innerText = 'PING';
        pingBtn.style.opacity = '1.0';
        pingBtn.style.borderColor = 'var(--cyan-primary, #00F0FF)';
        pingBtn.style.color = 'var(--cyan-primary, #00F0FF)';
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
