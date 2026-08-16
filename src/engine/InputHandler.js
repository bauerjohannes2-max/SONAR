/**
 * SONAR: The Echo Chamber
 * Input Handler with Mouse/Touch Coordinate Mapping, Sneak & Smooth Hold-to-Move
 */

import { CONFIG } from '../config.js';

export class InputHandler {
  constructor(canvas, displayManager) {
    this.canvas = canvas;
    this.displayManager = displayManager;

    this.keys = {};
    this.moveQueue = null;
    this.heldDirection = null; // { dx, dy, downTime }
    this.touchHeldDirection = null; // { dx, dy, downTime }

    this.pingTriggered = false;
    this.decoyTriggered = false;
    this.actionTriggered = false;
    this.restartTriggered = false;
    this.menuTriggered = false;
    this.settingsTriggered = false;
    this.levelSelectTriggered = false;
    this.mouseClick = null;
    this.isShiftHeld = false;
    this.ignoreClicksUntil = 0;
    this.lastTouchTime = 0;

    this.touchControls = null;

    this.setupListeners();
  }

  resetInputState() {
    this.keys = {};
    this.moveQueue = null;
    this.heldDirection = null;
    this.touchHeldDirection = null;
    this.pingTriggered = false;
    this.decoyTriggered = false;
    this.actionTriggered = false;
    this.restartTriggered = false;
    this.menuTriggered = false;
    this.levelSelectTriggered = false;
    this.settingsTriggered = false;
    this.escapeTriggered = false;
    this.mouseClick = null;
    this.isShiftHeld = false;
    this.lastTouchTime = 0;
  }

  ignoreClicksFor(ms = 350) {
    this.ignoreClicksUntil = Date.now() + ms;
    this.mouseClick = null;
  }

  setTouchControls(touchControls) {
    this.touchControls = touchControls;
  }

  setTouchDirection(dx, dy) {
    this.touchHeldDirection = { dx, dy, downTime: performance.now() };
    this.moveQueue = { dx, dy };
  }

  clearTouchDirection(dx = null, dy = null) {
    if (dx === null && dy === null) {
      this.touchHeldDirection = null;
    } else if (this.touchHeldDirection && this.touchHeldDirection.dx === dx && this.touchHeldDirection.dy === dy) {
      this.touchHeldDirection = null;
    }
  }

  getActiveKeyDirection() {
    if (this.keys['ArrowUp'] || this.keys['KeyW']) return { dx: 0, dy: -1 };
    if (this.keys['ArrowDown'] || this.keys['KeyS']) return { dx: 0, dy: 1 };
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) return { dx: -1, dy: 0 };
    if (this.keys['ArrowRight'] || this.keys['KeyD']) return { dx: 1, dy: 0 };
    return null;
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // 1. Strict Input Isolation: Do not trigger game/menu shortcuts when typing in inputs
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      this.keys[e.code] = true;

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isShiftHeld = true;
      }

      let dir = null;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        dir = { dx: 0, dy: -1 };
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        dir = { dx: 0, dy: 1 };
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        dir = { dx: -1, dy: 0 };
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        dir = { dx: 1, dy: 0 };
      }

      if (dir) {
        e.preventDefault();
        if (!this.heldDirection || this.heldDirection.dx !== dir.dx || this.heldDirection.dy !== dir.dy) {
          this.heldDirection = { dx: dir.dx, dy: dir.dy, downTime: performance.now() };
          this.moveQueue = { dx: dir.dx, dy: dir.dy };
        }
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
      } else if (e.code === 'KeyL') {
        this.levelSelectTriggered = true;
      } else if (e.code === 'KeyO') {
        this.settingsTriggered = true;
      } else if (e.code === 'Escape') {
        this.escapeTriggered = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isShiftHeld = false;
      }

      const activeDir = this.getActiveKeyDirection();
      if (activeDir) {
        this.heldDirection = { dx: activeDir.dx, dy: activeDir.dy, downTime: performance.now() };
      } else {
        this.heldDirection = null;
      }
    });

    // Mouse and Touch Click mapping via DisplayManager
    const handlePointerDown = (clientX, clientY) => {
      if (this.ignoreClicksUntil && Date.now() < this.ignoreClicksUntil) {
        return;
      }
      if (this.displayManager) {
        this.mouseClick = this.displayManager.screenToCanvas(clientX, clientY);
      } else {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseClick = {
          x: (clientX - rect.left) * (CONFIG.CANVAS_WIDTH / rect.width),
          y: (clientY - rect.top) * (CONFIG.CANVAS_HEIGHT / rect.height)
        };
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      // Ignore synthetic mousedown fired after a touch event
      if (Date.now() - this.lastTouchTime < 600) return;
      handlePointerDown(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      this.lastTouchTime = Date.now();
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        handlePointerDown(t.clientX, t.clientY);
      }
    }, { passive: true });

    // Allow mobile touch scrolling inside settings modal and overlays without preventDefault interruption
    window.addEventListener('touchmove', (e) => {
      if (e.target && e.target.closest && e.target.closest('.settings-modal, .terminal-modal-backdrop, .modal-card, #settings-container, #settings-modal, .terminal-modal-box, .modal-body, .lb-table-wrapper')) {
        return; // Allow native kinetic scrolling
      }
    }, { passive: true });
  }

  isSneaking() {
    if (this.touchControls && this.touchControls.isSneakActive()) {
      return true;
    }
    return this.isShiftHeld;
  }

  getMovement() {
    if (this.moveQueue) {
      const m = this.moveQueue;
      this.moveQueue = null;
      return m;
    }

    // Hold-to-Move: continuous fluid movement after initial 120ms delay
    const held = this.touchHeldDirection || this.heldDirection;
    if (held) {
      const now = performance.now();
      if (now - held.downTime >= 120) {
        return { dx: held.dx, dy: held.dy };
      }
    }

    return null;
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

  consumeLevelSelect() {
    const l = this.levelSelectTriggered;
    this.levelSelectTriggered = false;
    return l;
  }

  consumeEscape() {
    const e = this.escapeTriggered;
    this.escapeTriggered = false;
    return e;
  }

  consumeSettings() {
    const s = this.settingsTriggered;
    this.settingsTriggered = false;
    return s;
  }

  consumeMouseClick() {
    const c = this.mouseClick;
    this.mouseClick = null;
    return c;
  }
}
