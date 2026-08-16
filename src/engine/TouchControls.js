/**
 * SONAR: The Echo Chamber
 * Mobile Touch Controls with Customizable Layout, Virtual Joystick, D-Pad, Multi-Touch & Scaling
 */

import { CONFIG } from '../config.js';

export class TouchControls {
  constructor(audioEngine, inputHandler) {
    this.audio = audioEngine;
    this.input = inputHandler;

    this.isTouchDevice = false;
    this.sneakToggled = false;
    this.touchOverlay = document.getElementById('touch-controls');
    this.isVisible = false;

    // Movement state
    this.dpadContainer = null;
    this.joystickContainer = null;
    this.dpadTouchId = null;
    this.joystickTouchId = null;
    this.currentDirection = null; // { dx, dy }

    // Configuration
    this.config = this.getDefaultConfig();
    this.loadConfig();

    this.init();
  }

  getDefaultConfig() {
    return {
      controlType: 'JOYSTICK', // 'JOYSTICK' | 'DPAD'
      scale: 1.0,              // 0.8 | 1.0 | 1.25 | 1.5
      positions: null          // null means default layout
    };
  }

  loadConfig() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.TOUCH_CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.controlType) this.config.controlType = parsed.controlType;
        if (parsed.scale !== undefined) this.config.scale = parsed.scale;
        if (parsed.positions) this.config.positions = parsed.positions;
      }
    } catch (e) {
      console.warn('Could not load touch config:', e);
    }
  }

  saveConfig() {
    try {
      localStorage.setItem(CONFIG.STORAGE.TOUCH_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save touch config:', e);
    }
  }

  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  applyConfig(newConfig) {
    if (newConfig) {
      this.config = JSON.parse(JSON.stringify(newConfig));
    }
    this.updateControlVisibility();
    this.applyScaleAndPositions();
    this.saveConfig();
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
    this.joystickContainer = document.getElementById('touch-joystick-container');

    this.bindDpadSliding();
    this.bindJoystick();
    this.bindButtons();

    this.updateControlVisibility();
    this.applyScaleAndPositions();
  }

  updateControlVisibility() {
    if (!this.dpadContainer || !this.joystickContainer) return;
    const isJoystick = this.config.controlType === 'JOYSTICK';
    this.dpadContainer.style.display = isJoystick ? 'none' : 'block';
    this.joystickContainer.style.display = isJoystick ? 'flex' : 'none';
  }

  applyScaleAndPositions() {
    const scale = this.config.scale || 1.0;
    const moveEl = this.config.controlType === 'JOYSTICK' ? this.joystickContainer : this.dpadContainer;
    const sneakBtn = document.getElementById('touch-sneak');
    const decoyBtn = document.getElementById('touch-decoy');
    const pingBtn = document.getElementById('touch-ping');

    if (this.config.positions) {
      if (this.touchOverlay) {
        this.touchOverlay.style.position = 'relative';
      }
      if (moveEl && this.config.positions.movement) {
        moveEl.style.transform = `scale(${scale})`;
      }
      if (sneakBtn && this.config.positions.sneak) {
        sneakBtn.style.transform = `scale(${scale})`;
      }
      if (decoyBtn && this.config.positions.decoy) {
        decoyBtn.style.transform = `scale(${scale})`;
      }
      if (pingBtn && this.config.positions.ping) {
        pingBtn.style.transform = `scale(${scale})`;
      }
    } else {
      // Default bottom bar scaling
      if (moveEl) moveEl.style.transform = `scale(${scale})`;
      if (sneakBtn) sneakBtn.style.transform = `scale(${scale})`;
      if (decoyBtn) decoyBtn.style.transform = `scale(${scale})`;
      if (pingBtn) pingBtn.style.transform = `scale(${scale})`;
    }
  }

  setControlType(type) {
    if (type === 'JOYSTICK' || type === 'DPAD') {
      this.config.controlType = type;
      this.updateControlVisibility();
      this.applyScaleAndPositions();
      this.saveConfig();
    }
  }

  setScale(scale) {
    this.config.scale = Math.max(0.6, Math.min(2.0, scale));
    this.applyScaleAndPositions();
    this.saveConfig();
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
        this.updateControlVisibility();
        this.applyScaleAndPositions();
      } else {
        document.body.classList.remove('has-touch-controls');
        this.clearDpad();
        this.clearJoystick();
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

      // Dead zone
      if (dist < 12 * (this.config.scale || 1.0)) {
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
      if (isMouseDown && this.config.controlType === 'DPAD') {
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

  bindJoystick() {
    if (!this.joystickContainer) return;

    const baseEl = this.joystickContainer.querySelector('.joystick-base');
    const knobEl = this.joystickContainer.querySelector('.joystick-knob');
    const indUp = this.joystickContainer.querySelector('.joystick-dir-up');
    const indDown = this.joystickContainer.querySelector('.joystick-dir-down');
    const indLeft = this.joystickContainer.querySelector('.joystick-dir-left');
    const indRight = this.joystickContainer.querySelector('.joystick-dir-right');

    const updateIndicators = (dir) => {
      if (indUp) indUp.classList.toggle('active', !!(dir && dir.dy === -1));
      if (indDown) indDown.classList.toggle('active', !!(dir && dir.dy === 1));
      if (indLeft) indLeft.classList.toggle('active', !!(dir && dir.dx === -1));
      if (indRight) indRight.classList.toggle('active', !!(dir && dir.dx === 1));
    };

    const processPoint = (clientX, clientY) => {
      if (!baseEl || !knobEl) return;
      const rect = baseEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const maxDist = 36 * (this.config.scale || 1.0);
      const angle = Math.atan2(dy, dx);

      // Clamp knob movement to base radius
      const clampedDist = Math.min(dist, maxDist);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      knobEl.style.transform = `translate(${knobX}px, ${knobY}px)`;
      knobEl.classList.add('active');

      // Dead zone check (10px)
      if (dist < 10 * (this.config.scale || 1.0)) {
        if (this.currentDirection) {
          this.currentDirection = null;
          updateIndicators(null);
          this.input.clearTouchDirection();
        }
        return;
      }

      // Convert angle to 4-way cardinal direction
      let newDir = null;
      if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
        newDir = { dx: 1, dy: 0 }; // Right
      } else if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) {
        newDir = { dx: 0, dy: 1 }; // Down
      } else if (angle >= (3 * Math.PI) / 4 || angle <= (-3 * Math.PI) / 4) {
        newDir = { dx: -1, dy: 0 }; // Left
      } else {
        newDir = { dx: 0, dy: -1 }; // Up
      }

      if (!this.currentDirection || this.currentDirection.dx !== newDir.dx || this.currentDirection.dy !== newDir.dy) {
        this.currentDirection = newDir;
        updateIndicators(newDir);
        this.input.setTouchDirection(newDir.dx, newDir.dy);
        if (this.audio) this.audio.ensureContext();
      }
    };

    // Touch Event Handlers
    this.joystickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.joystickTouchId === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        this.joystickTouchId = touch.identifier;
        processPoint(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    this.joystickContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.joystickTouchId !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.joystickTouchId) {
            processPoint(e.touches[i].clientX, e.touches[i].clientY);
            break;
          }
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e) => {
      if (this.joystickTouchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joystickTouchId) {
            this.clearJoystick();
            break;
          }
        }
      }
    };

    this.joystickContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.joystickContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Mouse Fallback for Desktop Simulation
    let isMouseDown = false;
    this.joystickContainer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isMouseDown = true;
      processPoint(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown && this.config.controlType === 'JOYSTICK') {
        processPoint(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.clearJoystick();
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

  clearJoystick() {
    this.joystickTouchId = null;
    this.currentDirection = null;
    if (this.joystickContainer) {
      const knobEl = this.joystickContainer.querySelector('.joystick-knob');
      if (knobEl) {
        knobEl.style.transform = 'translate(0px, 0px)';
        knobEl.classList.remove('active');
      }
      const indUp = this.joystickContainer.querySelector('.joystick-dir-up');
      const indDown = this.joystickContainer.querySelector('.joystick-dir-down');
      const indLeft = this.joystickContainer.querySelector('.joystick-dir-left');
      const indRight = this.joystickContainer.querySelector('.joystick-dir-right');
      if (indUp) indUp.classList.remove('active');
      if (indDown) indDown.classList.remove('active');
      if (indLeft) indLeft.classList.remove('active');
      if (indRight) indRight.classList.remove('active');
    }
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
