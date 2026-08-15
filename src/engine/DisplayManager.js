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

  onFullscreenChange() {
    this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    this.updateFullscreenIcon();
    this.setupResolution();
  }

  toggleFullscreen() {
    if (!this.isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn('Fullscreen denied:', err));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
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
