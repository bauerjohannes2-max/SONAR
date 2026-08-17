/**
 * SONAR: The Echo Chamber
 * Interactive Touch Layout Customizer & Drag-and-Drop Visual Editor
 * Features Dynamic Gap Separation, Real-Time Collision Avoidance & Screen Edge Clamping
 */

import { CONFIG } from '../config.js';

export class TouchLayoutEditor {
  constructor(touchControls, audioEngine = null) {
    this.touchControls = touchControls;
    this.audio = audioEngine;
    this.isOpen = false;
    this.overlayEl = null;

    this.currentConfig = this.touchControls.getConfig();
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
  }

  open() {
    this.isOpen = true;
    this.currentConfig = this.touchControls.getConfig();
    this.renderDOM();
    if (this.audio) this.audio.playUIBlip();
  }

  close() {
    this.isOpen = false;
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
    if (this.audio) this.audio.playUIBlip();
  }

  renderDOM() {
    if (this.overlayEl) this.overlayEl.remove();

    const overlay = document.createElement('div');
    overlay.id = 'touch-layout-editor';

    const globalScale = this.currentConfig.scale || 1.0;
    if (!this.currentConfig.elementScales) {
      this.currentConfig.elementScales = { movement: globalScale, sneak: globalScale, decoy: globalScale, ping: globalScale };
    }
    const elemScales = this.currentConfig.elementScales;
    const moveScale = elemScales.movement || globalScale;
    const sneakScale = elemScales.sneak || globalScale;
    const decoyScale = elemScales.decoy || globalScale;
    const pingScale = elemScales.ping || globalScale;

    overlay.innerHTML = `
      <div class="layout-editor-toolbar">
        <div class="layout-editor-title">
          <div class="layout-editor-title-main">
            <span>🛠️</span> TOUCH-LAYOUT ANPASSEN
          </div>
          <div class="layout-editor-title-hint">
            Verschieben per Drag & Drop • Größe einzeln über [ - ] / [ + ] (70%–160%) anpassen • Automatische Kollisionsvermeidung
          </div>
        </div>

        <div class="layout-editor-actions">
          <div class="btn-segment-group" style="margin: 0;">
            <button class="btn-segment scale-btn ${globalScale === 0.8 ? 'active' : ''}" data-scale="0.8">80%</button>
            <button class="btn-segment scale-btn ${globalScale === 1.0 ? 'active' : ''}" data-scale="1.0">100%</button>
            <button class="btn-segment scale-btn ${globalScale === 1.25 ? 'active' : ''}" data-scale="1.25">125%</button>
            <button class="btn-segment scale-btn ${globalScale === 1.5 ? 'active' : ''}" data-scale="1.5">150%</button>
          </div>
          <button id="btn-editor-reset" class="layout-editor-btn btn-reset">↺ STANDARD</button>
          <button id="btn-editor-save" class="layout-editor-btn btn-save">✓ SPEICHERN & BEENDEN</button>
        </div>
      </div>

      <div class="layout-editor-canvas-bounds" id="editor-workspace">
        <!-- Draggable Movement Control -->
        <div class="layout-editable-item" id="editor-elem-move" data-item="movement" style="transform: scale(${moveScale}); transform-origin: bottom left;">
          <div class="layout-element-label">
            <span>STEUERKREUZ</span>
            <div class="elem-scale-controls">
              <button class="btn-elem-scale" data-action="dec" data-target="movement">−</button>
              <span class="elem-scale-val" id="scale-val-movement">${Math.round(moveScale * 100)}%</span>
              <button class="btn-elem-scale" data-action="inc" data-target="movement">+</button>
            </div>
          </div>
          <div class="touch-dpad" style="pointer-events: none; position: static;">
            <div class="dpad-btn dpad-up">▲</div>
            <div class="dpad-btn dpad-down">▼</div>
            <div class="dpad-btn dpad-left">◀</div>
            <div class="dpad-btn dpad-right">▶</div>
            <div class="dpad-center"></div>
          </div>
        </div>

        <!-- Draggable Sneak Button -->
        <div class="layout-editable-item" id="editor-elem-sneak" data-item="sneak" style="transform: scale(${sneakScale}); transform-origin: bottom right;">
          <div class="layout-element-label">
            <span>SCHLEICHEN</span>
            <div class="elem-scale-controls">
              <button class="btn-elem-scale" data-action="dec" data-target="sneak">−</button>
              <span class="elem-scale-val" id="scale-val-sneak">${Math.round(sneakScale * 100)}%</span>
              <button class="btn-elem-scale" data-action="inc" data-target="sneak">+</button>
            </div>
          </div>
          <button class="touch-btn touch-btn-sneak" style="pointer-events: none;">
            <span class="sneak-icon">🤫</span>
            <span class="sneak-label">SCHLEICHEN</span>
            <span class="sneak-badge">AUS</span>
          </button>
        </div>

        <!-- Draggable Decoy Button -->
        <div class="layout-editable-item" id="editor-elem-decoy" data-item="decoy" style="transform: scale(${decoyScale}); transform-origin: bottom right;">
          <div class="layout-element-label">
            <span>KÖDER</span>
            <div class="elem-scale-controls">
              <button class="btn-elem-scale" data-action="dec" data-target="decoy">−</button>
              <span class="elem-scale-val" id="scale-val-decoy">${Math.round(decoyScale * 100)}%</span>
              <button class="btn-elem-scale" data-action="inc" data-target="decoy">+</button>
            </div>
          </div>
          <button class="touch-btn touch-btn-decoy" style="pointer-events: none;">
            <span class="decoy-label">💣 KÖDER</span>
            <span class="decoy-count">1/1</span>
          </button>
        </div>

        <!-- Draggable Ping Button -->
        <div class="layout-editable-item" id="editor-elem-ping" data-item="ping" style="transform: scale(${pingScale}); transform-origin: bottom right;">
          <div class="layout-element-label">
            <span>PING</span>
            <div class="elem-scale-controls">
              <button class="btn-elem-scale" data-action="dec" data-target="ping">−</button>
              <span class="elem-scale-val" id="scale-val-ping">${Math.round(pingScale * 100)}%</span>
              <button class="btn-elem-scale" data-action="inc" data-target="ping">+</button>
            </div>
          </div>
          <button class="touch-btn touch-btn-ping" style="pointer-events: none;">
            <span class="ping-icon">📡</span>
            <span class="ping-label">PING</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    this.positionElements();
    this.bindEditorEvents();
  }

  positionElements() {
    const workspace = this.overlayEl.querySelector('#editor-workspace');
    if (!workspace) return;
    const wRect = workspace.getBoundingClientRect();

    const items = ['movement', 'sneak', 'decoy', 'ping'];
    items.forEach((key) => {
      const el = this.overlayEl.querySelector(`[data-item="${key}"]`);
      if (!el) return;

      const pos = this.currentConfig.positions && this.currentConfig.positions[key];
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
      } else {
        // Safe default positions inside workspace with generous gap separation
        const scale = (this.currentConfig.elementScales && this.currentConfig.elementScales[key]) || this.currentConfig.scale || 1.0;
        if (key === 'movement') {
          el.style.left = `24px`;
          el.style.top = `${Math.max(20, wRect.height - 160 * scale - 24)}px`;
        } else if (key === 'sneak') {
          el.style.left = `${Math.max(20, wRect.width - 320 * scale - 24)}px`;
          el.style.top = `${Math.max(20, wRect.height - 160 * scale - 24)}px`;
        } else if (key === 'decoy') {
          el.style.left = `${Math.max(20, wRect.width - 150 * scale - 24)}px`;
          el.style.top = `${Math.max(20, wRect.height - 160 * scale - 24)}px`;
        } else if (key === 'ping') {
          el.style.left = `${Math.max(20, wRect.width - 240 * scale - 24)}px`;
          el.style.top = `${Math.max(20, wRect.height - 80 * scale - 24)}px`;
        }
      }
    });

    this.resolveAllCollisionsAndClamp();
  }

  resolveAllCollisionsAndClamp() {
    const workspace = this.overlayEl ? this.overlayEl.querySelector('#editor-workspace') : null;
    if (!workspace) return;
    const wRect = workspace.getBoundingClientRect();
    const margin = 12;
    const topMargin = 20;
    const items = ['movement', 'sneak', 'decoy', 'ping'];
    const elements = items.map((key) => ({
      key,
      el: this.overlayEl.querySelector(`[data-item="${key}"]`)
    })).filter((item) => item.el !== null);

    // 1. Screen-Edge Clamping
    elements.forEach(({ el }) => {
      const rect = el.getBoundingClientRect();
      let curX = parseFloat(el.style.left) || 0;
      let curY = parseFloat(el.style.top) || 0;

      const w = rect.width || 120;
      const h = rect.height || 60;

      curX = Math.max(margin, Math.min(wRect.width - w - margin, curX));
      curY = Math.max(topMargin, Math.min(wRect.height - h - margin, curY));

      el.style.left = `${curX}px`;
      el.style.top = `${curY}px`;
    });

    // 2. Collision avoidance passes
    const minDistance = 12;
    for (let pass = 0; pass < 4; pass++) {
      let collided = false;
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const elA = elements[i].el;
          const elB = elements[j].el;
          const rectA = elA.getBoundingClientRect();
          const rectB = elB.getBoundingClientRect();

          const overlapX = (rectA.right + minDistance > rectB.left) && (rectA.left < rectB.right + minDistance);
          const overlapY = (rectA.bottom + minDistance > rectB.top) && (rectA.top < rectB.bottom + minDistance);

          if (overlapX && overlapY) {
            collided = true;
            const penX1 = (rectA.right + minDistance) - rectB.left;
            const penX2 = (rectB.right + minDistance) - rectA.left;
            const penY1 = (rectA.bottom + minDistance) - rectB.top;
            const penY2 = (rectB.bottom + minDistance) - rectA.top;

            const minPenX = Math.min(penX1, penX2);
            const minPenY = Math.min(penY1, penY2);

            let curAX = parseFloat(elA.style.left) || 0;
            let curAY = parseFloat(elA.style.top) || 0;
            let curBX = parseFloat(elB.style.left) || 0;
            let curBY = parseFloat(elB.style.top) || 0;

            if (minPenX < minPenY) {
              const shift = (minPenX / 2) + 2;
              if (rectA.left < rectB.left) {
                curAX = Math.max(margin, curAX - shift);
                curBX = Math.min(wRect.width - (rectB.width || 120) - margin, curBX + shift);
              } else {
                curAX = Math.min(wRect.width - (rectA.width || 120) - margin, curAX + shift);
                curBX = Math.max(margin, curBX - shift);
              }
            } else {
              const shift = (minPenY / 2) + 2;
              if (rectA.top < rectB.top) {
                curAY = Math.max(topMargin, curAY - shift);
                curBY = Math.min(wRect.height - (rectB.height || 60) - margin, curBY + shift);
              } else {
                curAY = Math.min(wRect.height - (rectA.height || 60) - margin, curAY + shift);
                curBY = Math.max(topMargin, curBY - shift);
              }
            }

            elA.style.left = `${curAX}px`;
            elA.style.top = `${curAY}px`;
            elB.style.left = `${curBX}px`;
            elB.style.top = `${curBY}px`;
          }
        }
      }
      if (!collided) break;
    }
  }

  bindEditorEvents() {
    const workspace = this.overlayEl.querySelector('#editor-workspace');
    const resetBtn = this.overlayEl.querySelector('#btn-editor-reset');
    const saveBtn = this.overlayEl.querySelector('#btn-editor-save');
    const scaleBtns = this.overlayEl.querySelectorAll('.scale-btn');

    // Global Scale buttons
    scaleBtns.forEach((btn) => {
      const handleScale = (e) => {
        if (e) e.preventDefault();
        const sc = parseFloat(btn.dataset.scale);
        this.currentConfig.scale = sc;
        if (!this.currentConfig.elementScales) this.currentConfig.elementScales = {};
        ['movement', 'sneak', 'decoy', 'ping'].forEach((k) => {
          this.currentConfig.elementScales[k] = sc;
          const valBadge = this.overlayEl.querySelector(`#scale-val-${k}`);
          if (valBadge) valBadge.textContent = `${Math.round(sc * 100)}%`;
        });

        scaleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const editables = this.overlayEl.querySelectorAll('.layout-editable-item');
        editables.forEach((el) => {
          el.style.transform = `scale(${sc})`;
        });

        this.resolveAllCollisionsAndClamp();
        if (this.audio) this.audio.playUIBlip();
      };
      btn.addEventListener('click', handleScale);
      btn.addEventListener('touchstart', handleScale, { passive: false });
    });

    // Individual Element Scale [ - ] and [ + ] buttons (70% - 160%)
    const elemScaleBtns = this.overlayEl.querySelectorAll('.btn-elem-scale');
    elemScaleBtns.forEach((btn) => {
      const handleElemScale = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const action = btn.dataset.action;
        const target = btn.dataset.target;
        if (!this.currentConfig.elementScales) {
          this.currentConfig.elementScales = {};
        }
        let cur = this.currentConfig.elementScales[target] || this.currentConfig.scale || 1.0;
        if (action === 'inc') {
          cur = Math.min(1.6, Math.round((cur + 0.1) * 10) / 10);
        } else if (action === 'dec') {
          cur = Math.max(0.7, Math.round((cur - 0.1) * 10) / 10);
        }
        this.currentConfig.elementScales[target] = cur;

        const targetEl = this.overlayEl.querySelector(`[data-item="${target}"]`);
        if (targetEl) {
          targetEl.style.transform = `scale(${cur})`;
        }
        const valBadge = this.overlayEl.querySelector(`#scale-val-${target}`);
        if (valBadge) {
          valBadge.textContent = `${Math.round(cur * 100)}%`;
        }
        this.resolveAllCollisionsAndClamp();
        if (this.audio) this.audio.playUIBlip();
      };
      btn.addEventListener('click', handleElemScale);
      btn.addEventListener('touchstart', handleElemScale, { passive: false });
    });

    // Reset Button
    const handleReset = (e) => {
      if (e) e.preventDefault();
      this.currentConfig = this.touchControls.getDefaultConfig();
      this.touchControls.applyConfig(this.currentConfig);
      this.renderDOM();
      if (this.touchControls && typeof this.touchControls.triggerHaptic === 'function') {
        this.touchControls.triggerHaptic(15);
      }
      if (this.audio) this.audio.playUIBlip();
    };
    if (resetBtn) {
      resetBtn.addEventListener('click', handleReset);
      resetBtn.addEventListener('touchstart', handleReset, { passive: false });
    }

    // Save Button
    const handleSave = (e) => {
      if (e) e.preventDefault();
      if (!this.currentConfig.positions) this.currentConfig.positions = {};
      const items = ['movement', 'sneak', 'decoy', 'ping'];
      items.forEach((key) => {
        const el = this.overlayEl.querySelector(`[data-item="${key}"]`);
        if (el) {
          this.currentConfig.positions[key] = {
            x: parseFloat(el.style.left) || 0,
            y: parseFloat(el.style.top) || 0
          };
        }
      });

      this.touchControls.applyConfig(this.currentConfig);
      this.touchControls.saveConfig();
      this.close();
    };
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSave);
      saveBtn.addEventListener('touchstart', handleSave, { passive: false });
    }

    // Drag & Drop Pointer Events on Editable Items
    const editables = this.overlayEl.querySelectorAll('.layout-editable-item');
    editables.forEach((el) => {
      const onPointerStart = (clientX, clientY) => {
        this.dragTarget = el;
        el.classList.add('dragging');
        const rect = el.getBoundingClientRect();
        this.dragOffset = {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onPointerStart(e.clientX, e.clientY);
      });

      el.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          e.preventDefault();
          onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });
    });

    const onPointerMove = (clientX, clientY) => {
      if (!this.dragTarget || !workspace) return;
      const wRect = workspace.getBoundingClientRect();
      const scale = this.currentConfig.scale || 1.0;

      let newX = clientX - wRect.left - this.dragOffset.x;
      let newY = clientY - wRect.top - this.dragOffset.y;

      const targetW = (this.dragTarget.offsetWidth || 120) * scale;
      const targetH = (this.dragTarget.offsetHeight || 120) * scale;

      newX = Math.max(12, Math.min(wRect.width - targetW - 12, newX));
      newY = Math.max(20, Math.min(wRect.height - targetH - 12, newY));

      this.dragTarget.style.left = `${newX}px`;
      this.dragTarget.style.top = `${newY}px`;
    };

    const onPointerEnd = () => {
      if (this.dragTarget) {
        this.dragTarget.classList.remove('dragging');
        this.dragTarget = null;
        this.resolveAllCollisionsAndClamp();
      }
    };

    window.addEventListener('mousemove', (e) => {
      if (this.dragTarget) onPointerMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', onPointerEnd);

    window.addEventListener('touchmove', (e) => {
      if (this.dragTarget && e.touches.length > 0) {
        e.preventDefault();
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
    window.addEventListener('touchend', onPointerEnd);
    window.addEventListener('touchcancel', onPointerEnd);
  }
}
