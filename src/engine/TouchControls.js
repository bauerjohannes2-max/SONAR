/**
 * SONAR: The Echo Chamber
 * Modern Mobile Touch Controls with Ergonomic D-Pad, Swipe Gestures & Custom Scaling
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
    this.dpadTouchId = null;
    this.swipeTouchId = null;
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.currentDirection = null; // { dx, dy }

    // Configuration
    this.config = this.getDefaultConfig();
    this.loadConfig();

    this.init();
  }

  getDefaultConfig() {
    return {
      controlType: 'DPAD', // 'DPAD' | 'SWIPE'
      scale: 1.0,          // global fallback
      elementScales: {
        movement: 1.0,
        sneak: 1.0,
        decoy: 1.0,
        ping: 1.0
      },
      positions: null      // null means default layout
    };
  }

  loadConfig() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.TOUCH_CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.controlType) {
          // Clean legacy JOYSTICK setting to DPAD
          this.config.controlType = parsed.controlType === 'JOYSTICK' ? 'DPAD' : parsed.controlType;
        }
        if (parsed.scale !== undefined) this.config.scale = parsed.scale;
        if (parsed.elementScales) this.config.elementScales = parsed.elementScales;
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
      if (this.config.controlType === 'JOYSTICK') this.config.controlType = 'DPAD';
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
      this.touchOverlay.style.display = 'none';
    }

    this.dpadContainer = document.getElementById('touch-dpad-container');

    this.bindDpadSliding();
    this.bindSwipeGestures();
    this.bindButtons();

    this.hide();
    this.applyScaleAndPositions();
  }

  updateControlVisibility() {
    if (!this.dpadContainer) return;
    this.dpadContainer.style.display = this.isVisible ? 'block' : 'none';
  }

  show() {
    this.isVisible = true;
    if (this.touchOverlay) {
      this.touchOverlay.style.display = 'block';
    }
    if (this.dpadContainer) {
      this.dpadContainer.style.display = 'block';
    }
    const actionsCluster = document.getElementById('touch-action-cluster') || document.querySelector('.touch-actions');
    if (actionsCluster) {
      actionsCluster.style.display = 'flex';
    }
  }

  hide() {
    this.isVisible = false;
    if (this.touchOverlay) {
      this.touchOverlay.style.display = 'none';
    }
    if (this.dpadContainer) {
      this.dpadContainer.style.display = 'none';
    }
    const actionsCluster = document.getElementById('touch-action-cluster') || document.querySelector('.touch-actions');
    if (actionsCluster) {
      actionsCluster.style.display = 'none';
    }
    this.clearDpad();
  }

  applyScaleAndPositions() {
    const defaultScale = this.config.scale || 1.0;
    const elemScales = this.config.elementScales || {};
    const moveScale = elemScales.movement !== undefined ? elemScales.movement : defaultScale;
    const sneakScale = elemScales.sneak !== undefined ? elemScales.sneak : defaultScale;
    const decoyScale = elemScales.decoy !== undefined ? elemScales.decoy : defaultScale;
    const pingScale = elemScales.ping !== undefined ? elemScales.ping : defaultScale;

    // Apply dynamic gap scaling CSS variable to overlay & document
    if (this.touchOverlay) {
      this.touchOverlay.style.setProperty('--touch-scale', defaultScale);
    }
    document.documentElement.style.setProperty('--touch-scale', defaultScale);

    const moveEl = this.dpadContainer;
    const actionsCluster = document.querySelector('.touch-actions');
    const sneakBtn = document.getElementById('btn-sneak') || document.getElementById('touch-sneak');
    const decoyBtn = document.getElementById('btn-bait') || document.getElementById('touch-decoy');
    const pingBtn = document.getElementById('btn-ping') || document.getElementById('touch-ping');

    const positions = this.config.positions;
    if (positions) {
      // Individual custom positions from TouchLayoutEditor
      if (moveEl && positions.movement) {
        moveEl.style.position = 'absolute';
        moveEl.style.left = `${positions.movement.x}px`;
        moveEl.style.top = `${positions.movement.y}px`;
        moveEl.style.right = 'auto';
        moveEl.style.bottom = 'auto';
        moveEl.style.transform = `scale(${moveScale})`;
        moveEl.style.transformOrigin = 'top left';
      }
      if (sneakBtn && positions.sneak) {
        sneakBtn.style.position = 'absolute';
        sneakBtn.style.left = `${positions.sneak.x}px`;
        sneakBtn.style.top = `${positions.sneak.y}px`;
        sneakBtn.style.transform = `scale(${sneakScale})`;
        sneakBtn.style.transformOrigin = 'top left';
      }
      if (decoyBtn && positions.decoy) {
        decoyBtn.style.position = 'absolute';
        decoyBtn.style.left = `${positions.decoy.x}px`;
        decoyBtn.style.top = `${positions.decoy.y}px`;
        decoyBtn.style.transform = `scale(${decoyScale})`;
        decoyBtn.style.transformOrigin = 'top left';
      }
      if (pingBtn && positions.ping) {
        pingBtn.style.position = 'absolute';
        pingBtn.style.left = `${positions.ping.x}px`;
        pingBtn.style.top = `${positions.ping.y}px`;
        pingBtn.style.transform = `scale(${pingScale})`;
        pingBtn.style.transformOrigin = 'top left';
      }
    } else {
      // Ergonomic cluster layout (zero-overlap guarantee)
      if (moveEl) {
        moveEl.style.position = '';
        moveEl.style.left = '';
        moveEl.style.top = '';
        moveEl.style.right = '';
        moveEl.style.bottom = '';
        moveEl.style.transform = `scale(${moveScale})`;
        moveEl.style.transformOrigin = 'bottom left';
      }

      if (actionsCluster) {
        actionsCluster.style.position = '';
        actionsCluster.style.left = '';
        actionsCluster.style.top = '';
        actionsCluster.style.right = '';
        actionsCluster.style.bottom = '';
        actionsCluster.style.transform = `scale(${defaultScale})`;
        actionsCluster.style.transformOrigin = 'bottom right';
      }

      // Reset individual button transforms if matching defaultScale or apply differential
      if (sneakBtn) {
        sneakBtn.style.position = '';
        sneakBtn.style.left = '';
        sneakBtn.style.top = '';
        sneakBtn.style.transform = (sneakScale !== defaultScale) ? `scale(${sneakScale / defaultScale})` : '';
        sneakBtn.style.transformOrigin = 'bottom right';
      }
      if (decoyBtn) {
        decoyBtn.style.position = '';
        decoyBtn.style.left = '';
        decoyBtn.style.top = '';
        decoyBtn.style.transform = (decoyScale !== defaultScale) ? `scale(${decoyScale / defaultScale})` : '';
        decoyBtn.style.transformOrigin = 'bottom right';
      }
      if (pingBtn) {
        pingBtn.style.position = '';
        pingBtn.style.left = '';
        pingBtn.style.top = '';
        pingBtn.style.transform = (pingScale !== defaultScale) ? `scale(${pingScale / defaultScale})` : '';
        pingBtn.style.transformOrigin = 'bottom right';
      }
    }

    this.clampWithinViewport();
  }

  clampWithinViewport() {
    const vpW = window.innerWidth || document.documentElement.clientWidth || 800;
    const vpH = window.innerHeight || document.documentElement.clientHeight || 600;
    const margin = 12;

    const moveEl = this.dpadContainer;
    const actionsEl = document.querySelector('.touch-actions');

    if (moveEl && moveEl.style.display !== 'none') {
      const rect = moveEl.getBoundingClientRect();
      if (rect.left < margin && rect.width > 0) {
        const offset = margin - rect.left;
        const curLeft = parseFloat(moveEl.style.left) || 16;
        moveEl.style.left = `${curLeft + offset}px`;
      }
      if (rect.bottom > vpH - margin && rect.height > 0) {
        const offset = rect.bottom - (vpH - margin);
        const curBottom = parseFloat(moveEl.style.bottom) || 16;
        moveEl.style.bottom = `${Math.max(margin, curBottom - offset)}px`;
      }
    }

    if (actionsEl && actionsEl.style.display !== 'none') {
      const rect = actionsEl.getBoundingClientRect();
      if (rect.right > vpW - margin && rect.width > 0) {
        const offset = rect.right - (vpW - margin);
        const curRight = parseFloat(actionsEl.style.right) || 16;
        actionsEl.style.right = `${Math.max(margin, curRight - offset)}px`;
      }
      if (rect.bottom > vpH - margin && rect.height > 0) {
        const offset = rect.bottom - (vpH - margin);
        const curBottom = parseFloat(actionsEl.style.bottom) || 16;
        actionsEl.style.bottom = `${Math.max(margin, curBottom - offset)}px`;
      }
    }
  }

  setControlType(type) {
    if (type === 'DPAD' || type === 'SWIPE') {
      this.config.controlType = type;
      this.updateControlVisibility();
      this.applyScaleAndPositions();
      this.saveConfig();
    }
  }

  setScale(scale) {
    const s = Math.max(0.6, Math.min(2.0, scale));
    this.config.scale = s;
    if (!this.config.elementScales) {
      this.config.elementScales = { movement: s, sneak: s, decoy: s, ping: s };
    } else {
      this.config.elementScales.movement = s;
      this.config.elementScales.sneak = s;
      this.config.elementScales.decoy = s;
      this.config.elementScales.ping = s;
    }
    this.applyScaleAndPositions();
    this.saveConfig();
  }

  setVisible(visible) {
    if (!this.touchOverlay) return;
    const shouldShow = !!visible;

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
        this.clearSwipe();
        this.input.clearTouchDirection();
      }
    }
  }

  /**
   * Bind sliding and tap input on the ergonomic D-Pad.
   */
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

      // Dead zone (center rest)
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
        this.triggerHaptic(8);
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

  /**
   * Bind intuitive full-screen swipe/drag gestures (Wisch-Steuerung).
   */
  bindSwipeGestures() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const onTouchStart = (e) => {
      if (this.config.controlType !== 'SWIPE' || !this.isVisible) return;
      if (this.swipeTouchId === null && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        // Only accept touches on left 65% of screen to avoid colliding with action buttons
        if (touch.clientX < window.innerWidth * 0.7) {
          this.swipeTouchId = touch.identifier;
          this.swipeStartX = touch.clientX;
          this.swipeStartY = touch.clientY;
          if (this.audio) this.audio.ensureContext();
        }
      }
    };

    const onTouchMove = (e) => {
      if (this.config.controlType !== 'SWIPE' || this.swipeTouchId === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === this.swipeTouchId) {
          const dx = touch.clientX - this.swipeStartX;
          const dy = touch.clientY - this.swipeStartY;
          const threshold = 18;

          if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            let newDir = null;
            if (Math.abs(dx) > Math.abs(dy)) {
              newDir = dx > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
            } else {
              newDir = dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
            }

            if (!this.currentDirection || this.currentDirection.dx !== newDir.dx || this.currentDirection.dy !== newDir.dy) {
              this.currentDirection = newDir;
              this.input.setTouchDirection(newDir.dx, newDir.dy);
            }
          }
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      if (this.swipeTouchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.swipeTouchId) {
            this.clearSwipe();
            break;
          }
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
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

  clearSwipe() {
    this.swipeTouchId = null;
    this.currentDirection = null;
    this.input.clearTouchDirection();
  }

  triggerHaptic(ms = 8) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
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
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        el.classList.remove('active');
        if (onUp) onUp();
      };

      el.addEventListener('touchstart', handleDown, { passive: false });
      el.addEventListener('touchend', handleUp, { passive: false });
      el.addEventListener('touchcancel', handleUp, { passive: false });

      el.addEventListener('mousedown', handleDown);
      el.addEventListener('mouseup', handleUp);
      el.addEventListener('mouseleave', handleUp);
    };

    // Action Buttons
    const bindAnyBtn = (idList, onDown, onUp) => {
      const ids = Array.isArray(idList) ? idList : [idList];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          bindBtn(id, onDown, onUp);
        }
      });
    };

    bindAnyBtn(['btn-ping', 'touch-ping'], () => {
      this.input.pingTriggered = true;
      this.input.actionTriggered = true;
      this.triggerHaptic(15);
    });

    bindAnyBtn(['btn-bait', 'touch-decoy'], () => {
      this.input.decoyTriggered = true;
      this.triggerHaptic(12);
    });

    // Sneak Toggle Button
    const sneakBtn = document.getElementById('btn-sneak') || document.getElementById('touch-sneak');
    const sneakBadge = document.getElementById('touch-sneak-badge');

    if (sneakBtn) {
      const toggleSneak = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.sneakToggled = !this.sneakToggled;
        this.triggerHaptic(8);
        if (this.sneakToggled) {
          sneakBtn.classList.add('sneak-on');
          if (sneakBadge) sneakBadge.innerText = 'EIN';
          this.input.sneakActive = true;
        } else {
          sneakBtn.classList.remove('sneak-on');
          if (sneakBadge) sneakBadge.innerText = 'AUS';
          this.input.sneakActive = false;
        }
        if (this.audio) this.audio.playUIBlip();
      };

      sneakBtn.addEventListener('click', toggleSneak);
      sneakBtn.addEventListener('touchstart', toggleSneak, { passive: false });
    }
  }

  updateDecoyCount(remaining) {
    const decoyBadge = document.getElementById('touch-decoy-count');
    const decoyBtn = document.getElementById('btn-bait') || document.getElementById('touch-decoy');
    if (decoyBadge) {
      decoyBadge.textContent = `${remaining}/1`;
    }
    if (decoyBtn) {
      decoyBtn.style.opacity = remaining > 0 ? '1' : '0.4';
    }
  }

  update(player) {
    if (!player) return;
    const pingBtn = document.getElementById('btn-ping') || document.getElementById('touch-ping');
    const pingLabel = document.getElementById('touch-ping-label');
    if (pingBtn && pingLabel) {
      const remainingSec = typeof player.getPingRemainingSeconds === 'function' ? player.getPingRemainingSeconds() : 0;
      if (remainingSec > 0) {
        pingBtn.style.opacity = '0.5';
        pingLabel.textContent = `PING (${remainingSec}s)`;
      } else {
        pingBtn.style.opacity = '1.0';
        pingLabel.textContent = 'PING';
      }
    }
  }

  isSneakActive() {
    return !!this.sneakToggled;
  }
}
