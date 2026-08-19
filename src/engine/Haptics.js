/**
 * SONAR: The Echo Chamber
 * Dedicated Haptic Feedback Engine
 * Provides tactile vibration feedback for pings, enemy contact, threat proximity, and UI interactions.
 */

export class HapticEngine {
  constructor() {
    this.enabled = true;
    this.lastVibrateTime = 0;
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }

  /**
   * Generic vibration trigger with safe feature detection & error suppression
   */
  vibrate(pattern) {
    if (!this.enabled || !this.isSupported()) return false;
    try {
      return navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  }

  /**
   * Crisp tactical pulse on Sonar Ping
   */
  ping() {
    return this.vibrate(15);
  }

  /**
   * Intense tactile jolt on enemy contact or fatal crash
   */
  enemyContact() {
    return this.vibrate([80, 50, 120]);
  }

  /**
   * Shorter impact pulse for obstacle bumps
   */
  collision() {
    return this.vibrate([60, 40, 80]);
  }

  /**
   * Pulsing heartbeat vibration when predator is near (< 4 blocks)
   */
  danger() {
    const now = performance.now();
    if (now - this.lastVibrateTime < 400) return false;
    this.lastVibrateTime = now;
    return this.vibrate([20, 30, 20]);
  }

  /**
   * Positive double-pulse confirmation when collecting crystals
   */
  pickup() {
    return this.vibrate([30, 40, 30]);
  }

  /**
   * Subtle click feedback for UI button touches
   */
  button() {
    return this.vibrate(8);
  }

  /**
   * Rapid confirmation buzz when instant-restarting level
   */
  restart() {
    return this.vibrate([20, 30, 20]);
  }

  /**
   * Disables or enables haptic vibrations
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }
}

export const Haptics = new HapticEngine();
