/**
 * SONAR: The Echo Chamber
 * Interactive Touch Layout Customizer & Drag-and-Drop Visual Editor
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

    const isJoystick = this.currentConfig.controlType === 'JOYSTICK';
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
            Verschieben per Drag & Drop • Größe einzeln über [ - ] / [ + ] (70%–160%) anpassen • Speichern
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
        <div class="layout-editable-item" id="editor-elem-move" data-item="movement" style="transform: scale(${moveScale});">
          <div class="layout-element-label">
            <span>STEUERKREUZ</span>
            <div class="elem-scale-controls">
              <button class="btn-elem-scale" data-action="dec" data-target="movement">−</button>
              <span class="elem-scale-val" id="scale-val-movement">${Math.round(moveScale * 100)}%</span>
              <button class="btn-elem-scale" data-action="inc" data-target="movement">+</button>
            </div>
          </div>
          <div class="touch-dpad" style="pointer-events: none;">
            <div class="dpad-btn dpad-up">▲</div>
            <div class="dpad-btn dpad-down">▼</div>
            <div class="dpad-btn dpad-left">◀</div>
            <div class="dpad-btn dpad-right">▶</div>
            <div class="dpad-center"></div>
          </div>
        </div>

        <!-- Draggable Sneak Button -->
        <div class="layout-editable-item" id="editor-elem-sneak" data-item="sneak" style="transform: scale(${sneakScale});">
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
        <div class="layout-editable-item" id="editor-elem-decoy" data-item="decoy" style="transform: scale(${decoyScale});">
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
        <div class="layout-editable-item" id="editor-elem-ping" data-item="ping" style="transform: scale(${pingScale});">
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
        // Fallback default positions inside workspace
        const scale = this.currentConfig.scale || 1.0;
        if (key === 'movement') {
          el.style.left = `24px`;
          el.style.top = `${Math.max(20, wRect.height - 150 * scale - 20)}px`;
        } else if (key === 'sneak') {
          el.style.left = `${Math.max(20, wRect.width - 290 * scale)}px`;
          el.style.top = `${Math.max(20, wRect.height - 140 * scale)}px`;
        } else if (key === 'decoy') {
          el.style.left = `${Math.max(20, wRect.width - 150 * scale)}px`;
          el.style.top = `${Math.max(20, wRect.height - 140 * scale)}px`;
        } else if (key === 'ping') {
          el.style.left = `${Math.max(20, wRect.width - 240 * scale)}px`;
          el.style.top = `${Math.max(20, wRect.height - 75 * scale)}px`;
        }
      }
    });
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
        if (this.audio) this.audio.playUIBlip();
      };
      btn.addEventListener('click', handleElemScale);
      btn.addEventListener('touchstart', handleElemScale, { passive: false });
    });

    // Reset Button (Immediate reset of all positions and element scales to defaults)
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
      // Record final coordinates of each element
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

      // Clamp within workspace boundaries
      const targetW = (this.dragTarget.offsetWidth || 120) * scale;
      const targetH = (this.dragTarget.offsetHeight || 120) * scale;

      newX = Math.max(10, Math.min(wRect.width - targetW - 10, newX));
      newY = Math.max(10, Math.min(wRect.height - targetH - 10, newY));

      this.dragTarget.style.left = `${newX}px`;
      this.dragTarget.style.top = `${newY}px`;
    };

    const onPointerEnd = () => {
      if (this.dragTarget) {
        this.dragTarget.classList.remove('dragging');
        this.dragTarget = null;
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
