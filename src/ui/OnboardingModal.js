/**
 * SONAR: The Echo Chamber
 * First-Time Onboarding & Welcome Briefing Modal
 */

export class OnboardingModal {
  constructor(audioEngine, onStartTutorial, onSkip) {
    this.audio = audioEngine;
    this.onStartTutorial = onStartTutorial;
    this.onSkip = onSkip;
    this.isOpen = false;
    this.modalEl = null;

    this.initDOM();
  }

  initDOM() {
    const container = document.createElement('div');
    container.id = 'modal-onboarding';
    container.className = 'terminal-modal-backdrop';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="terminal-modal-box onboarding-modal-box">
        <div class="modal-header">
          <div class="modal-title">
            <span>📡</span>
            <span>OPERATION ZERO-LIGHT // BRIEFING</span>
          </div>
        </div>

        <div class="modal-body onboarding-modal-body">
          <div class="onboarding-banner-icon">🛸</div>
          <h2 class="onboarding-headline">OPERATION ZERO-LIGHT</h2>
          <p class="onboarding-text">
            Tiefseestation <strong>TETHYS-6</strong> havariert. Als Aufklärungsdrohne <strong>ECHO-7</strong> musst du Resonanz-Datenkerne bergen.
            Im ewigen Nichts existiert Sicht nur durch Schall – doch Raubdrohnen hören dich!
            Lerne Steuerung, Sonar-Pings und Taktiken im <strong>2-Minuten-Tutorial</strong>.
          </p>

          <div class="onboarding-actions">
            <button id="btn-onboarding-start" class="modal-btn modal-btn-primary onboarding-btn">
              📖 TUTORIAL STARTEN
            </button>
            <button id="btn-onboarding-skip" class="modal-btn modal-btn-secondary onboarding-btn">
              ✕ ÜBERSPRINGEN
            </button>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(container);
    this.modalEl = container;

    const startBtn = container.querySelector('#btn-onboarding-start');
    const skipBtn = container.querySelector('#btn-onboarding-skip');

    const handleStart = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      this.close();
      localStorage.setItem('sonar_first_launch', 'true');
      if (this.audio && typeof this.audio.playUIBlip === 'function') this.audio.playUIBlip();
      if (typeof this.onStartTutorial === 'function') {
        this.onStartTutorial();
      }
    };

    const handleSkip = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      this.close();
      localStorage.setItem('sonar_first_launch', 'true');
      if (this.audio && typeof this.audio.playUIBlip === 'function') this.audio.playUIBlip();
      if (typeof this.onSkip === 'function') {
        this.onSkip();
      }
    };

    if (startBtn) {
      startBtn.addEventListener('click', handleStart);
      startBtn.addEventListener('touchstart', handleStart, { passive: false });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', handleSkip);
      skipBtn.addEventListener('touchstart', handleSkip, { passive: false });
    }
  }

  checkAndOpen() {
    const hasLaunched = localStorage.getItem('sonar_first_launch');
    if (!hasLaunched) {
      this.open();
      return true;
    }
    return false;
  }

  open() {
    this.isOpen = true;
    if (this.modalEl) {
      this.modalEl.style.display = 'flex';
    }
    if (this.audio && typeof this.audio.playUIBlip === 'function') this.audio.playUIBlip();
  }

  close() {
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }
}
