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

  onFullscreenChange() {
    this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const fsBtn = document.getElementById('btn-header-fullscreen');
    if (fsBtn) {
      fsBtn.innerText = this.isFullscreen ? '🗗' : '⛶';
      fsBtn.title = this.isFullscreen ? 'Fenstermodus (F)' : 'Vollbildmodus (F)';
    }
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
