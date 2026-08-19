/**
 * SONAR: The Echo Chamber
 * Global Configuration & Constants (10-Sector Campaign Edition)
 */

export const CONFIG = {
  // Grid & Display
  GRID_COLS: 25,
  GRID_ROWS: 18,
  TILE_SIZE: 32,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 576,

  // Tile Definitions
  TILES: {
    FLOOR: 0,
    WALL: 1,
    CRYSTAL: 2,
    GATE: 3,
    RESONATOR: 4,
    LIGHTHOUSE: 5
  },

  // Color Palette (Phosphor Vector Theme)
  COLORS: {
    BG: '#030305',
    BG_GRID: 'rgba(0, 240, 255, 0.03)',
    WALL: '#FFFFFF',
    WALL_GLOW: 'rgba(0, 240, 255, 0.5)',
    PLAYER: '#00F0FF',
    PLAYER_TRAIL: 'rgba(0, 240, 255, 0.25)',
    HUNTER: '#FF1E44',
    HUNTER_GLOW: 'rgba(255, 30, 68, 0.6)',
    STALKER: '#9D00FF',
    STALKER_GLOW: 'rgba(157, 0, 255, 0.7)',
    CRYSTAL: '#00FF88',
    CRYSTAL_GLOW: 'rgba(0, 255, 136, 0.7)',
    RESONATOR: '#FFE600',
    RESONATOR_GLOW: 'rgba(255, 230, 0, 0.7)',
    LIGHTHOUSE: '#00E5FF',
    DECOY: '#FFAA00',
    DECOY_GLOW: 'rgba(255, 170, 0, 0.8)',
    GATE_LOCKED: '#3a4b59',
    GATE_OPEN: '#00FF88',
    WAVE_STEP: 'rgba(0, 240, 255, 0.75)',
    WAVE_PING: 'rgba(0, 240, 255, 0.95)',
    WAVE_RESONATOR: 'rgba(255, 230, 0, 0.95)',
    WAVE_LIGHTHOUSE: 'rgba(0, 229, 255, 0.85)',
    WAVE_DECOY: 'rgba(255, 170, 0, 0.9)',
    TEXT_MAIN: '#E0F8FF',
    TEXT_DIM: '#607B8B',
    VIGNETTE_CHASE: 'rgba(255, 30, 68, 0.28)'
  },

  // Player Mechanics
  PLAYER: {
    STEP_DURATION: 120,          // ms for normal walk
    SNEAK_STEP_DURATION: 240,    // ms for sneak walk (Shift / Touch toggle)
    PING_COOLDOWN: 3000,         // ms cooldown between Sonar Pings
    STEP_WAVE_RADIUS: 80,        // px (approx 2.5 tiles)
    STEP_WAVE_SPEED: 7,          // px per frame
    STEP_WAVE_DECAY: 0.045,      // alpha decay per frame
    PING_WAVE_RADIUS: 1200,      // screen-wide reach
    PING_WAVE_SPEED: 18,         // fast sweep
    PING_WAVE_DECAY: 0.012,      // slow fade (~1.5 seconds)
    HITBOX_RADIUS: 10,           // px radius for collision
    DECOYS_PER_SECTOR: 1         // 1 decoy flare per sector
  },

  // Decoy Flare
  DECOY: {
    THROW_DISTANCE: 3,           // Max tiles thrown (exakt 3 Blöcke)
    DURATION: 3000,              // Total active ms
    PULSE_INTERVAL: 400,         // ms between acoustic beeps
    PULSE_RADIUS: 300,           // px wave radius
    PULSE_SPEED: 12,
    PULSE_DECAY: 0.04
  },

  // Hunter (Red Predator)
  HUNTER: {
    PATROL_STEP_DURATION: 600,   // ms per tile when sneaking
    CHASE_STEP_DURATION: 180,    // ms per tile when sprinting
    SEARCH_DURATION: 2000,       // ms spent investigating noise location
    HEARING_RADIUS_TILES: 3.5,   // Tiles (approx 112 px) for footsteps
    COLLISION_DISTANCE: 22       // px for lethal contact
  },

  // Shadow Stalker (Purple Silent Predator)
  STALKER: {
    STEP_DURATION: 450,          // ms per tile
    STUN_DURATION: 2500,         // ms frozen when hit by Sonar Ping
    COLLISION_DISTANCE: 20
  },

  // Resonator (Yellow Alarm Node)
  RESONATOR: {
    CHARGE_TIME: 220,            // ms delay before shockwave
    SHOCKWAVE_RADIUS: 1200,      // Global reach
    SHOCKWAVE_SPEED: 16,
    SHOCKWAVE_DECAY: 0.015,
    HEARING_MULTIPLIER: 2.0      // Doubles hunter detection during wave
  },

  // Lighthouse (Blue Ambient Beacon)
  LIGHTHOUSE: {
    PULSE_INTERVAL: 4000,        // ms between ambient pulses
    PULSE_RADIUS: 240,           // px reach
    PULSE_SPEED: 6,
    PULSE_DECAY: 0.03
  },

  // Visibility & Phosphor Engine
  PHOSPHOR: {
    BASE_DECAY_RATE: 0.94,       // Exponential decay per frame for illuminated tiles
    MIN_VISIBLE_ALPHA: 0.02,     // Floor threshold before tile becomes pitch black
    WAVE_RING_THICKNESS: 14      // px width of illuminated wavefront
  },

  // Worldbuilding & Lore: Operation Zero-Light
  LORE: {
    OPERATION: 'OPERATION ZERO-LIGHT',
    DRONE_MODEL: 'ECHO-7',
    STATION: 'STATION ABYSS',
    PROTOCOL: 'ZERO-LIGHT PROTOCOL',
    OBJECTIVE_ITEM: 'RESONANZ-DATENKERNE',
    ENEMIES: {
      HUNTER: 'Akustische Raubdrohne (HUNTER)',
      STALKER: 'Schatten-Raubdrohne (STALKER)'
    }
  },

  // Version & Build
  VERSION: '1.19.0',
  BUILD: '20260831',

  // Game States
  STATES: {
    MENU: 'MENU',
    SECTOR_SELECT: 'SECTOR_SELECT',
    STORY_INTRO: 'STORY_INTRO',
    SETTINGS: 'SETTINGS',
    DATABASE: 'DATABASE',
    TUTORIAL: 'TUTORIAL',
    ENDLESS: 'ENDLESS',
    PAUSED: 'PAUSED',
    PLAYING: 'PLAYING',
    DYING: 'DYING',
    SECTOR_CLEARED: 'SECTOR_CLEARED',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY',
    PROFILE: 'PROFILE',
    LEADERBOARD: 'LEADERBOARD'
  },

  // Storage Keys
  STORAGE: {
    SETTINGS: 'sonar_settings_v1',
    PROGRESS: 'sonar_progress_v1',
    ENDLESS: 'sonar_endless_v1',
    PILOT_SESSION: 'sonar_pilot_session_v1',
    LOCAL_LEADERBOARD: 'sonar_local_leaderboard_v1',
    TOUCH_CONFIG: 'sonar_touch_config'
  }
};

/**
 * Firebase Firestore Configuration (ES-Module CDN)
 * Replace placeholder values with your Firebase Web App credentials.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAoQ8YHM3J7gOyUTVFZ31BONgcMfkJwFIU",
  authDomain: "sonar-game-beta.firebaseapp.com",
  projectId: "sonar-game-beta",
  storageBucket: "sonar-game-beta.firebasestorage.app",
  messagingSenderId: "874036258796",
  appId: "1:874036258796:web:f0b1da5bf8d6371b00c2c9",
  measurementId: "G-SQZ88L9HGH"
};


