/**
 * SONAR: The Echo Chamber
 * Display & Fullscreen Manager with High-DPI Scaling & Screen Projection
 */

import { CONFIG } from '../config.js';

export class DisplayManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isFullscreen = false;
    this.dpr = 2;

    this.onFullscreenChange = this.onFullscreenChange.bind(this);
    this.setupResolution = this.setupResolution.bind(this);
    this.init();
  }

  init() {
    this.setupResolution();
    this.updateFullscreenIcon();

    window.addEventListener('resize', this.setupResolution);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange);

    // Bind header fullscreen button
    const fsBtn = document.getElementById('btn-header-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
      fsBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFullscreen();
      }, { passive: false });
    }

    // Hotkey F
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.toggleFullscreen();
        }
      }
    });
  }

  setupResolution() {
    if (!this.canvas) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;

    this.canvas.width = Math.round(CONFIG.CANVAS_WIDTH * dpr);
    this.canvas.height = Math.round(CONFIG.CANVAS_HEIGHT * dpr);

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    }
  }

  updateFullscreenIcon() {
    const fsBtn = document.getElementById('btn-header-fullscreen');
    if (!fsBtn) return;
    if (this.isFullscreen) {
      // Minimize / Restore window SVG icon
      fsBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;
      fsBtn.title = 'Fenstermodus (F)';
    } else {
      // Maximize / Fullscreen SVG icon
      fsBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
      fsBtn.title = 'Vollbildmodus (F)';
    }
  }

  enableCssFullscreen() {
    this.isCssFullscreen = true;
    this.isFullscreen = true;
    const wrapper = document.getElementById('game-wrapper');
    if (wrapper) wrapper.classList.add('css-fullscreen');
    window.scrollTo(0, 0);
    this.updateFullscreenIcon();
    this.setupResolution();
  }

  disableCssFullscreen() {
    this.isCssFullscreen = false;
    this.isFullscreen = false;
    const wrapper = document.getElementById('game-wrapper');
    if (wrapper) wrapper.classList.remove('css-fullscreen');
    this.updateFullscreenIcon();
    this.setupResolution();
  }

  onFullscreenChange() {
    const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isNative && !this.isCssFullscreen) {
      this.isFullscreen = false;
    } else if (isNative) {
      this.isFullscreen = true;
      this.isCssFullscreen = false;
      const wrapper = document.getElementById('game-wrapper');
      if (wrapper) wrapper.classList.remove('css-fullscreen');
    }
    this.updateFullscreenIcon();
    this.setupResolution();
  }

  requestSilentFullscreen() {
    if (this.isFullscreen) return;
    const doc = document;
    const elem = document.documentElement;
    const isNativeFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
    if (isNativeFullscreen) {
      this.isFullscreen = true;
      this.updateFullscreenIcon();
      return;
    }

    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => {
        this.isFullscreen = true;
        this.updateFullscreenIcon();
        this.setupResolution();
      }).catch(() => {
        this.enableCssFullscreen();
      });
    } else if (elem.webkitRequestFullscreen) {
      try {
        elem.webkitRequestFullscreen();
        this.isFullscreen = true;
        this.updateFullscreenIcon();
        this.setupResolution();
      } catch {
        this.enableCssFullscreen();
      }
    } else {
      this.enableCssFullscreen();
    }
  }

  toggleFullscreen() {
    const doc = document;
    const elem = document.documentElement;
    const isNativeFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (!this.isFullscreen && !isNativeFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => this.enableCssFullscreen());
      } else if (elem.webkitRequestFullscreen) {
        try {
          elem.webkitRequestFullscreen();
        } catch {
          this.enableCssFullscreen();
        }
      } else {
        // iOS Safari / iPhone Fallback: CSS Pseudo-Vollbild
        this.enableCssFullscreen();
      }
    } else {
      if (this.isCssFullscreen) {
        this.disableCssFullscreen();
      }
      if (isNativeFullscreen) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      }
      this.disableCssFullscreen();
    }
  }

  /**
   * Translates clientX/clientY to exact 800x576 virtual canvas coordinates.
   */
  screenToCanvas(clientX, clientY) {
    if (!this.canvas) return { x: clientX, y: clientY };

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return {
      x: Math.max(0, Math.min(CONFIG.CANVAS_WIDTH, x)),
      y: Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT, y))
    };
  }
}
