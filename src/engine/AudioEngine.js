const AUDIO_ASSETS = {
  sonar_ping: './assets/audio/sonar_ping.mp3',
  crystal_pickup: './assets/audio/crystal_pickup.mp3',
  death_explosion: './assets/audio/death_explosion.mp3',
  enemy_alert: './assets/audio/enemy_alert.mp3',
  portal_open: './assets/audio/portal_open.mp3',
  ambient_drone: './assets/audio/ambient_drone.mp3',
  ambient_main: './assets/audio/ambient_main.mp3',
  music_menu: './assets/audio/music_menu.mp3',
  music_gameplay: './assets/audio/music_gameplay.mp3',
  bg_music: './assets/audio/bg_music.mp3'
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.musicGain = null;

    this.droneOsc = null;
    this.droneNoise = null;
    this.droneFilter = null;
    this.droneSampleSource = null;
    this.musicSampleSource = null;
    this.isDronePlaying = false;
    this.isMusicPlaying = false;

    this.isInitialized = false;
    this.isMuted = false;
    this.masterVolume = 0.5;   // Balanced comfortable default
    this.sfxVolume = 0.22;     // Comfortable, warm sound effects (35% softer)
    this.ambientVolume = 0.30; // Deep-sea oceanic atmosphere
    this.musicVolume = 0.28;   // Sci-Fi cinematic soundtrack

    this.buffers = new Map();
    this.isLoadingAssets = false;

    // Dynamic Heartbeat & Adrenaline Layer
    this.heartbeatTimer = 0;
    this.heartbeatInterval = 1.0;
    this.currentThreatDistance = Infinity;
    this.isThreatChasing = false;

    // Stalker Electromagnetic Distortion
    this.stalkerDist = Infinity;
    this.staticTimer = 0;
  }

  /**
   * Initializes AudioContext upon first user gesture & preloads MP3 assets.
   */
  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();

      // Master Gain -> Destination (through Sneak Low-Pass Filter)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      this.sneakFilter = this.ctx.createBiquadFilter();
      this.sneakFilter.type = 'lowpass';
      this.sneakFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
      this.sneakFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      this.masterGain.connect(this.sneakFilter);
      this.sneakFilter.connect(this.ctx.destination);

      // SFX Gain -> Master Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambient Drone Gain -> Master Gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Background Music Gain -> Master Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.isInitialized = true;
      this.preloadAudioBuffers().then(() => {
        this.startBackgroundMusic();
      });
      this.startAmbientDrone();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  /**
   * Sets Muffled Audio state for sneaky underwater stealth.
   */
  setSneakMode(isSneaking) {
    if (!this.ensureContext() || !this.sneakFilter) return;
    const targetFreq = isSneaking ? 420 : 20000;
    this.sneakFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
  }

  /**
   * Preload all MP3/OGG sound files directly into memory for 0ms latency.
   */
  async preloadAudioBuffers() {
    if (!this.ctx) return;
    this.isLoadingAssets = true;

    const promises = Object.entries(AUDIO_ASSETS).map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(key, decoded);
        }
      } catch (err) {
        // Silently fallback to procedural synthesizer
        console.warn(`[AudioEngine] Asset '${key}' fallback to synth:`, err.message);
      }
    });

    await Promise.all(promises);
    this.isLoadingAssets = false;
  }

  /**
   * Plays a preloaded audio sample via AudioBufferSourceNode with 0ms latency.
   */
  playSample(key, customGain = null, loop = false, playbackRate = 1.0) {
    if (!this.ensureContext() || this.isMuted) return null;
    const buffer = this.buffers.get(key);
    if (!buffer) return null;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;
      if (playbackRate && playbackRate !== 1.0) {
        source.playbackRate.setValueAtTime(playbackRate, this.ctx.currentTime);
      }
      source.connect(customGain || this.sfxGain);
      source.start(0);
      return source;
    } catch (e) {
      console.warn(`[AudioEngine] playSample error on '${key}':`, e);
      return null;
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setAmbientVolume(val) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Ensure AudioContext is running before playing sound.
   */
  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx && this.ctx.state === 'running';
  }

  /**
   * Dual-Soundtrack System: Menu vs. In-Game Gameplay
   */
  playMenuMusic(fadeDuration = 1.0) {
    this.crossfadeMusic('music_menu', ['ambient_main', 'bg_music'], fadeDuration);
    this.currentMusicTrack = 'menu';
  }

  playGameplayMusic(fadeDuration = 1.0) {
    this.crossfadeMusic('music_gameplay', ['bg_music', 'ambient_main'], fadeDuration);
    this.currentMusicTrack = 'gameplay';
  }

  crossfadeMusic(preferredKey, fallbackKeys, fadeDuration = 1.0) {
    if (!this.ensureContext()) return;

    if (this.currentMusicTrackKey === preferredKey && this.isMusicPlaying) {
      return; // Already playing this track
    }

    const now = this.ctx.currentTime;
    const oldSource = this.musicSampleSource;

    // Fade out previous track smoothly
    if (oldSource && this.musicGain) {
      try {
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration * 0.5);
        setTimeout(() => {
          try { oldSource.stop(); } catch (e) {}
        }, fadeDuration * 500);
      } catch (e) {}
    }

    // Start new track with fade in
    let newSource = this.playSample(preferredKey, this.musicGain, true);
    let chosenKey = preferredKey;

    if (!newSource && fallbackKeys) {
      for (const fb of fallbackKeys) {
        newSource = this.playSample(fb, this.musicGain, true);
        if (newSource) {
          chosenKey = fb;
          break;
        }
      }
    }

    if (newSource && this.musicGain) {
      this.musicSampleSource = newSource;
      this.isMusicPlaying = true;
      this.currentMusicTrackKey = preferredKey;

      this.musicGain.gain.cancelScheduledValues(now + fadeDuration * 0.5);
      this.musicGain.gain.setValueAtTime(0.0001, now + fadeDuration * 0.5);
      this.musicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.musicVolume), now + fadeDuration);
    }
  }

  startBackgroundMusic(fadeInDuration = 1.5) {
    this.playMenuMusic(fadeInDuration);
  }

  stopBackgroundMusic() {
    if (this.musicSampleSource) {
      try { this.musicSampleSource.stop(); } catch (e) {}
      this.musicSampleSource = null;
    }
    this.isMusicPlaying = false;
    this.currentMusicTrack = null;
    this.currentMusicTrackKey = null;
  }

  /**
   * Generative / Sample-Based Dark Ambient Drone Generator
   */
  startAmbientDrone() {
    if (!this.ensureContext() || this.isDronePlaying) return;

    // Start background music as well
    this.startBackgroundMusic();

    // Try sample-based ambient drone first
    const sampleSrc = this.playSample('ambient_drone', this.ambientGain, true);
    if (sampleSrc) {
      this.droneSampleSource = sampleSrc;
      this.isDronePlaying = true;
      return;
    }

    try {
      const now = this.ctx.currentTime;

      // 1. Low sub sine drone (42Hz)
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(42, now);

      // 2. Slow LFO for subtle pitch & filter breathing
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, now); // Slow 8s cycle
      lfoGain.gain.setValueAtTime(4, now);
      lfo.connect(lfoGain);
      lfoGain.connect(this.droneOsc.frequency);
      lfo.start(now);

      // 3. Filtered Noise Texture
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.droneNoise = this.ctx.createBufferSource();
      this.droneNoise.buffer = noiseBuffer;
      this.droneNoise.loop = true;

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(140, now);
      this.droneFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);

      this.droneNoise.connect(this.droneFilter);
      this.droneFilter.connect(noiseGain);
      noiseGain.connect(this.ambientGain);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.2, now);
      this.droneOsc.connect(oscGain);
      oscGain.connect(this.ambientGain);

      this.droneNoise.start(now);
      this.droneOsc.start(now);
      this.isDronePlaying = true;
    } catch (e) {
      console.warn('Drone generator error:', e);
    }
  }

  stopAmbientDrone() {
    if (this.droneSampleSource) {
      try { this.droneSampleSource.stop(); } catch (e) {}
      this.droneSampleSource = null;
    }
    if (this.droneOsc) {
      try { this.droneOsc.stop(); } catch (e) {}
      this.droneOsc = null;
    }
    if (this.droneNoise) {
      try { this.droneNoise.stop(); } catch (e) {}
      this.droneNoise = null;
    }
    this.isDronePlaying = false;
  }

  startDrone() {
    this.startAmbientDrone();
  }

  stopDrone() {
    this.stopAmbientDrone();
  }

  /**
   * Haptic vibration trigger helper for mobile touch & gameplay events.
   */
  triggerHaptic(type = 'ping') {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (type === 'ping') {
          navigator.vibrate(15);
        } else if (type === 'pickup') {
          navigator.vibrate([30, 40, 30]);
        } else if (type === 'death' || type === 'collision') {
          navigator.vibrate(120);
        } else if (type === 'step') {
          navigator.vibrate(10);
        } else if (type === 'heartbeat') {
          navigator.vibrate([12, 40, 10]);
        }
      } catch (e) {}
    }
  }

  /**
   * Updates Dynamic Heartbeat Sub-Bass layer based on proximity to nearest predator
   */
  updateHeartbeat(minDist, isChasing, dt) {
    if (minDist > 220 || !this.ctx || this.isMuted) {
      this.currentThreatDistance = Infinity;
      this.isThreatChasing = false;
      return;
    }

    this.currentThreatDistance = minDist;
    this.isThreatChasing = isChasing;

    // Proximity factor: 0.0 (at 220px) to 1.0 (at <= 40px)
    const factor = Math.max(0, Math.min(1, (220 - minDist) / 180));
    
    // Interval: from 1.15s (52 BPM) down to 0.4s (150 BPM) or 0.32s when in active chase
    const baseInterval = isChasing ? 0.35 : (1.15 - factor * 0.7);
    this.heartbeatInterval = baseInterval;

    this.heartbeatTimer += dt;
    if (this.heartbeatTimer >= this.heartbeatInterval) {
      this.heartbeatTimer = 0;
      this.playHeartbeatThud(factor, isChasing);
    }
  }

  /**
   * Deep Sub-Bass Muffled Heartbeat Pulse (Lub-Dub)
   */
  playHeartbeatThud(intensity = 0.5, isChasing = false) {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(0.65, 0.22 + intensity * 0.4);

    // 1. Primary "Lub" Pulse (48 Hz -> 22 Hz sub-bass sine)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(48 + intensity * 14, now);
    osc1.frequency.exponentialRampToValueAtTime(22, now + 0.09);

    gain1.gain.setValueAtTime(vol * 0.85, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // 2. Secondary "Dub" Pulse (offset by 110ms)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const t2 = now + 0.11;
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(42 + intensity * 10, t2);
    osc2.frequency.exponentialRampToValueAtTime(20, t2 + 0.08);

    gain2.gain.setValueAtTime(vol * 0.55, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.08);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.09);

    // Mobile micro-haptic for immersion
    if (intensity > 0.35) {
      this.triggerHaptic('heartbeat');
    }
  }

  /**
   * Updates Stalker Electromagnetic Distortion audio layer based on proximity.
   */
  updateStalkerDistortion(minDist, dt) {
    if (minDist > 220 || !this.ctx || this.isMuted) {
      this.stalkerDist = Infinity;
      return;
    }

    this.stalkerDist = minDist;
    const factor = Math.max(0, Math.min(1, (220 - minDist) / 180));

    this.staticTimer = (this.staticTimer || 0) + dt;
    const interval = 0.25 - factor * 0.16; // 250ms down to 90ms
    if (this.staticTimer >= interval) {
      this.staticTimer = 0;
      if (Math.random() < 0.75 + factor * 0.25) {
        this.playStaticCrackle(factor);
      }
    }
  }

  /**
   * Generates procedural electromagnetic static crackle / hiss burst.
   */
  playStaticCrackle(intensity = 0.5) {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.max(256, Math.floor(this.ctx.sampleRate * 0.035));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800 + Math.random() * 1400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    const vol = Math.min(0.25, 0.04 + intensity * 0.14);
    gain.gain.setValueAtTime(vol, now);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  /**
   * Player Step: Sub-bass sine sweep (55 Hz -> 20 Hz, 80 ms decay)
   */
  playFootstep() {
    this.triggerHaptic('step');
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Sonar Ping: Plays high-definition sub-sea ping or procedural fallback
   */
  playSonarPing() {
    this.triggerHaptic('ping');
    if (!this.ensureContext() || this.isMuted) return;

    if (this.playSample('sonar_ping')) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain1 = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    osc1.frequency.exponentialRampToValueAtTime(660, now + 1.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    filter.Q.setValueAtTime(8.0, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.38, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.sfxGain);

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.8);

    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 1.45);
    subOsc.start(now);
    subOsc.stop(now + 0.85);
  }

  /**
   * Hunter Alert: Plays metallic growl sample or procedural shriek
   */
  playHunterAlert() {
    this.triggerHaptic('alarm');
    if (!this.ensureContext() || this.isMuted) return;

    if (this.playSample('enemy_alert')) return;

    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(130, now);
    carrier.frequency.linearRampToValueAtTime(260, now + 0.15);
    carrier.frequency.exponentialRampToValueAtTime(90, now + 0.45);

    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.type = 'square';
    mod.frequency.setValueAtTime(38, now);
    modGain.gain.setValueAtTime(80, now);

    mod.connect(carrier.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    mod.start(now);
    carrier.start(now);
    mod.stop(now + 0.5);
    carrier.stop(now + 0.5);
  }

  playHunterStep() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playCrystalPickup(crystalIndex = 0) {
    this.triggerHaptic('pickup');
    if (!this.ensureContext() || this.isMuted) return;

    // Melodic Pentatonic scale pitch multipliers: C, D, E, G, A, C5, D5
    const pentatonicRatios = [1.0, 1.122, 1.26, 1.498, 1.682, 2.0, 2.245];
    const pitch = pentatonicRatios[crystalIndex % pentatonicRatios.length] || 1.0;

    if (this.playSample('crystal_pickup', null, false, pitch)) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const tunedFreq = freq * pitch;
      const start = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tunedFreq, start);
      osc.frequency.exponentialRampToValueAtTime(tunedFreq * 1.05, start + 0.18);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Plays soft harmonic chime echo when sound wave brushes an uncollected crystal.
   */
  playCrystalResonance(pitchMod = 1.0) {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Harmonic bell chime: 1046.5Hz (C6) and overtone 1567.98Hz (G6)
    const baseFreq = 1046.5 * pitchMod;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.02, now + 0.22);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Subtle harmonic overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);

    osc2.start(now);
    osc2.stop(now + 0.22);
  }

  playDecoyThrow() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playDecoyBeep() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(800, now + 0.03);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playStalkerStun() {
    this.triggerHaptic('alarm');
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playResonatorTrigger() {
    this.triggerHaptic('alarm');
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(1760, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.7);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  playLighthousePulse() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playGateUnlock() {
    this.triggerHaptic('pickup');
    if (!this.ensureContext() || this.isMuted) return;

    if (this.playSample('portal_open')) return;

    const now = this.ctx.currentTime;

    const freqs = [110, 164.81, 220];
    freqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 0.8, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  playSectorClear() {
    this.triggerHaptic('pickup');
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];

    notes.forEach((f, idx) => {
      const start = now + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.55);
    });
  }

  playDeath() {
    this.triggerHaptic('death');
    if (!this.ensureContext() || this.isMuted) return;

    if (this.playSample('death_explosion')) return;

    const now = this.ctx.currentTime;

    // 1. Soft Atmospheric Pitch Drop (Sine/Triangle 300Hz -> 40Hz)
    const pitchOsc = this.ctx.createOscillator();
    const pitchGain = this.ctx.createGain();
    const lowPass = this.ctx.createBiquadFilter();

    pitchOsc.type = 'triangle';
    pitchOsc.frequency.setValueAtTime(300, now);
    pitchOsc.frequency.exponentialRampToValueAtTime(40, now + 0.85);

    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(450, now);
    lowPass.frequency.exponentialRampToValueAtTime(60, now + 0.9);

    pitchGain.gain.setValueAtTime(0.35, now);
    pitchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    pitchOsc.connect(lowPass);
    lowPass.connect(pitchGain);
    pitchGain.connect(this.sfxGain);

    pitchOsc.start(now);
    pitchOsc.stop(now + 0.95);

    // 2. Deep Cinematic Sub-Bass Wummern (Sine 55Hz -> 28Hz with 1.2s smooth decay)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 1.25);
  }

  playWallCrash() {
    this.triggerHaptic('collision');
    if (!this.ensureContext() || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Sharp Metallic Hull Impact Crack (Noise burst through bandpass filter)
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const metalFilter = this.ctx.createBiquadFilter();
      metalFilter.type = 'bandpass';
      metalFilter.frequency.setValueAtTime(1400, now);
      metalFilter.frequency.exponentialRampToValueAtTime(320, now + 0.18);
      metalFilter.Q.setValueAtTime(4.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noiseSource.connect(metalFilter);
      metalFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(now);
    } catch (e) {
      // Fallback if buffer creation not available
    }

    // 2. Underwater Metallic Bulkhead Clang (Triangle 260Hz -> 65Hz)
    const clangOsc = this.ctx.createOscillator();
    const clangGain = this.ctx.createGain();
    const clangFilter = this.ctx.createBiquadFilter();

    clangOsc.type = 'triangle';
    clangOsc.frequency.setValueAtTime(260, now);
    clangOsc.frequency.exponentialRampToValueAtTime(65, now + 0.35);

    clangFilter.type = 'lowpass';
    clangFilter.frequency.setValueAtTime(1200, now);
    clangFilter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    clangGain.gain.setValueAtTime(0.55, now);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    clangOsc.connect(clangFilter);
    clangFilter.connect(clangGain);
    clangGain.connect(this.sfxGain);

    clangOsc.start(now);
    clangOsc.stop(now + 0.45);

    // 3. Heavy Sub-Bass Kinetic Shockwave (Sine 150Hz -> 28Hz punch)
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();

    impactOsc.type = 'sine';
    impactOsc.frequency.setValueAtTime(150, now);
    impactOsc.frequency.exponentialRampToValueAtTime(28, now + 0.65);

    impactGain.gain.setValueAtTime(0.7, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    impactOsc.connect(impactGain);
    impactGain.connect(this.sfxGain);

    impactOsc.start(now);
    impactOsc.stop(now + 0.75);

    // 4. Low Sub-Bass Decompression Rumble Tail (Sine 45Hz -> 20Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(45, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.95);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 1.0);
  }

  playUIBlip() {
    this.triggerHaptic('step');
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.setValueAtTime(1400, now + 0.03);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playCardFlip() {
    this.triggerHaptic('step');
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }
}
