/**
 * SONAR: The Echo Chamber
 * Input Handler with Mouse/Touch Coordinate Mapping & Sneak Integration
 */

import { CONFIG } from '../config.js';

export class InputHandler {
  constructor(canvas, displayManager) {
    this.canvas = canvas;
    this.displayManager = displayManager;

    this.keys = {};
    this.moveQueue = null;
    this.pingTriggered = false;
    this.decoyTriggered = false;
    this.actionTriggered = false;
    this.restartTriggered = false;
    this.menuTriggered = false;
    this.escapeTriggered = false;
    this.mouseClick = null;
    this.isShiftHeld = false;

    this.touchControls = null;

    this.setupListeners();
  }

  setTouchControls(touchControls) {
    this.touchControls = touchControls;
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isShiftHeld = true;
      }

      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        this.moveQueue = { dx: 0, dy: -1 };
        e.preventDefault();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.moveQueue = { dx: 0, dy: 1 };
        e.preventDefault();
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.moveQueue = { dx: -1, dy: 0 };
        e.preventDefault();
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.moveQueue = { dx: 1, dy: 0 };
        e.preventDefault();
      }

      if (e.code === 'Space') {
        this.pingTriggered = true;
        this.actionTriggered = true;
        e.preventDefault();
      } else if (e.code === 'Enter') {
        this.actionTriggered = true;
        e.preventDefault();
      } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
        this.decoyTriggered = true;
      } else if (e.code === 'KeyR') {
        this.restartTriggered = true;
      } else if (e.code === 'KeyM') {
        this.menuTriggered = true;
      } else if (e.code === 'Escape') {
        this.escapeTriggered = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isShiftHeld = false;
      }
    });

    // Mouse and Touch Click mapping via DisplayManager
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.displayManager) {
        this.mouseClick = this.displayManager.screenToCanvas(e.clientX, e.clientY);
      } else {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseClick = {
          x: (e.clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width),
          y: (e.clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height)
        };
      }
    });
  }

  isSneaking() {
    if (this.touchControls && this.touchControls.isSneakActive()) {
      return true;
    }
    return this.isShiftHeld;
  }

  getMovement() {
    const m = this.moveQueue;
    this.moveQueue = null;
    return m;
  }

  consumePing() {
    const p = this.pingTriggered;
    this.pingTriggered = false;
    return p;
  }

  consumeDecoy() {
    const d = this.decoyTriggered;
    this.decoyTriggered = false;
    return d;
  }

  consumeAction() {
    const a = this.actionTriggered;
    this.actionTriggered = false;
    return a;
  }

  consumeRestart() {
    const r = this.restartTriggered;
    this.restartTriggered = false;
    return r;
  }

  consumeMenu() {
    const m = this.menuTriggered;
    this.menuTriggered = false;
    return m;
  }

  consumeEscape() {
    const e = this.escapeTriggered;
    this.escapeTriggered = false;
    return e;
  }

  consumeMouseClick() {
    const c = this.mouseClick;
    this.mouseClick = null;
    return c;
  }
}
