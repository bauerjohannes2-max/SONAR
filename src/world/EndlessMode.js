/**
 * SONAR: The Echo Chamber
 * Endless Echo - Recursive Backtracker Maze Generator
 */

import { CONFIG } from '../config.js';
import { storageManager } from '../services/StorageManager.js';

export class EndlessMode {
  constructor() {
    this.currentFloor = 1;
    this.totalCrystalsCollected = 0;
    this.bestFloor = 1;
    this.bestCrystals = 0;

    this.loadHighscore();
  }

  loadHighscore() {
    const data = storageManager.getEndlessProgress();
    this.bestFloor = data.bestFloor || 1;
    this.bestCrystals = data.bestCrystals || 0;
  }

  saveHighscore() {
    if (this.currentFloor > this.bestFloor || this.totalCrystalsCollected > this.bestCrystals) {
      this.bestFloor = Math.max(this.bestFloor, this.currentFloor);
      this.bestCrystals = Math.max(this.bestCrystals, this.totalCrystalsCollected);

      storageManager.saveEndlessProgress(this.bestFloor, this.bestCrystals);
    }
  }

  reset() {
    this.currentFloor = 1;
    this.totalCrystalsCollected = 0;
  }

  advanceFloor(crystalsCollectedInFloor = 3) {
    this.totalCrystalsCollected += crystalsCollectedInFloor;
    this.currentFloor++;
    this.saveHighscore();
  }

  /**
   * Recursive Backtracker maze on odd coordinates.
   * Returns 25x18 grid: 1=wall, 0=floor.
   */
  generateMaze(cols, rows) {
    const map = [];
    for (let y = 0; y < rows; y++) {
      map.push(new Array(cols).fill(1));
    }

    // Carve cells at odd coordinates using iterative DFS
    const visited = new Set();
    const stack = [];
    const startX = 1;
    const startY = 1;

    map[startY][startX] = 0;
    visited.add(`${startX},${startY}`);
    stack.push({ x: startX, y: startY });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      // Check 4 directions, 2 steps away (odd grid)
      const dirs = [
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 }
      ];

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && !visited.has(`${nx},${ny}`)) {
          neighbors.push({ x: nx, y: ny, wx: current.x + d.dx / 2, wy: current.y + d.dy / 2 });
        }
      }

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        // Carve wall between current and chosen
        map[chosen.wy][chosen.wx] = 0;
        map[chosen.y][chosen.x] = 0;
        visited.add(`${chosen.x},${chosen.y}`);
        stack.push({ x: chosen.x, y: chosen.y });
      } else {
        stack.pop();
      }
    }

    return map;
  }

  /**
   * Remove 15% of dead-end walls to create loops/escape routes.
   */
  braidMaze(map, cols, rows) {
    const deadEnds = [];

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (map[y][x] !== 0) continue;

        // Count wall neighbors in cardinal directions
        let wallCount = 0;
        const wallDirs = [];
        const dirs = [
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 }
        ];

        for (const d of dirs) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1) {
            if (map[ny][nx] === 1) {
              wallCount++;
              wallDirs.push(d);
            }
          } else {
            wallCount++; // border counts as wall
          }
        }

        if (wallCount === 3 && wallDirs.length > 0) {
          deadEnds.push({ x, y, wallDirs });
        }
      }
    }

    // Remove 15% of dead-end walls
    this.shuffle(deadEnds);
    const removeCount = Math.ceil(deadEnds.length * 0.15);

    for (let i = 0; i < removeCount && i < deadEnds.length; i++) {
      const de = deadEnds[i];
      const wallDir = de.wallDirs[Math.floor(Math.random() * de.wallDirs.length)];
      const wx = de.x + wallDir.dx;
      const wy = de.y + wallDir.dy;
      if (wx > 0 && wx < cols - 1 && wy > 0 && wy < rows - 1) {
        map[wy][wx] = 0;
      }
    }
  }

  /**
   * BFS reachability check.
   */
  hasPath(map, sx, sy, tx, ty, cols, rows) {
    if (sx === tx && sy === ty) return true;
    const queue = [{ x: sx, y: sy }];
    const visited = new Set();
    visited.add(`${sx},${sy}`);

    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.x === tx && cur.y === ty) return true;

      const neighbors = [
        { x: cur.x + 1, y: cur.y },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x, y: cur.y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows && map[n.y][n.x] === 0) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }
    return false;
  }

  /**
   * Returns all connected floor tiles reachable from (sx, sy) via BFS.
   */
  getReachableFloorTiles(map, sx, sy, cols, rows) {
    const reachable = [];
    if (map[sy][sx] !== 0) return reachable;

    const queue = [{ gx: sx, gy: sy }];
    const visited = new Set();
    visited.add(`${sx},${sy}`);

    while (queue.length > 0) {
      const cur = queue.shift();
      reachable.push(cur);

      const neighbors = [
        { gx: cur.gx + 1, gy: cur.gy },
        { gx: cur.gx - 1, gy: cur.gy },
        { gx: cur.gx, gy: cur.gy + 1 },
        { gx: cur.gx, gy: cur.gy - 1 }
      ];

      for (const n of neighbors) {
        if (n.gx >= 0 && n.gx < cols && n.gy >= 0 && n.gy < rows && map[n.gy][n.gx] === 0) {
          const key = `${n.gx},${n.gy}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }
    return reachable;
  }

  /**
   * Carve L-shaped corridor as fallback connector.
   */
  carveCorridor(map, x1, y1, x2, y2, cols, rows) {
    let cx = x1;
    let cy = y1;
    while (cx !== x2) {
      if (cx > 0 && cx < cols - 1 && cy > 0 && cy < rows - 1) map[cy][cx] = 0;
      cx += cx < x2 ? 1 : -1;
    }
    while (cy !== y2) {
      if (cx > 0 && cx < cols - 1 && cy > 0 && cy < rows - 1) map[cy][cx] = 0;
      cy += cy < y2 ? 1 : -1;
    }
    if (cx > 0 && cx < cols - 1 && cy > 0 && cy < rows - 1) map[cy][cx] = 0;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /**
   * Generates a procedurally constructed, guaranteed solvable 25x18 maze for the given floor.
   */
  generateFloor(floor = this.currentFloor) {
    const cols = CONFIG.GRID_COLS;
    const rows = CONFIG.GRID_ROWS;

    const playerStart = { gx: 1, gy: rows - 2 };
    const gate = { gx: cols - 2, gy: 1 };

    let map = null;
    let crystals = [];
    let reachableTiles = [];
    let attempts = 0;
    const maxAttempts = 50;

    // Crystal count scales with floor (3 to 5)
    const crystalCount = Math.min(5, floor <= 2 ? 3 : (floor <= 4 ? 4 : 3 + Math.floor((floor - 1) / 3)));

    while (attempts < maxAttempts) {
      attempts++;

      // 1. Generate maze via recursive backtracker on odd coordinates
      map = this.generateMaze(cols, rows);

      // 2. Braid: remove 15% dead ends for circular loops and escape routes
      this.braidMaze(map, cols, rows);

      // 3. Clear 3x3 areas around start and gate
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sx = playerStart.gx + dx;
          const sy = playerStart.gy + dy;
          if (sx > 0 && sx < cols - 1 && sy > 0 && sy < rows - 1) map[sy][sx] = 0;

          const gx = gate.gx + dx;
          const gy = gate.gy + dy;
          if (gx > 0 && gx < cols - 1 && gy > 0 && gy < rows - 1) map[gy][gx] = 0;
        }
      }

      // Ensure start and gate are connected
      if (!this.hasPath(map, playerStart.gx, playerStart.gy, gate.gx, gate.gy, cols, rows)) {
        this.carveCorridor(map, playerStart.gx, playerStart.gy, gate.gx, gate.gy, cols, rows);
      }

      // 4. Find all floor tiles connected to playerStart via BFS
      reachableTiles = this.getReachableFloorTiles(map, playerStart.gx, playerStart.gy, cols, rows);

      // Gate must be reachable
      const gateKey = `${gate.gx},${gate.gy}`;
      const isGateReachable = reachableTiles.some(t => t.gx === gate.gx && t.gy === gate.gy);
      if (!isGateReachable) continue;

      // Filter candidate tiles for crystals: reachable, distance > 4 from start, distance > 3 from gate
      const crystalCandidates = reachableTiles.filter(t => {
        const distStart = Math.abs(t.gx - playerStart.gx) + Math.abs(t.gy - playerStart.gy);
        const distGate = Math.abs(t.gx - gate.gx) + Math.abs(t.gy - gate.gy);
        return distStart > 4 && distGate > 2;
      });

      if (crystalCandidates.length < crystalCount) continue;

      this.shuffle(crystalCandidates);

      // 5. Place crystals
      crystals = [];
      for (let i = 0; i < crystalCount; i++) {
        crystals.push({
          id: `ec_${floor}_${i}`,
          gx: crystalCandidates[i].gx,
          gy: crystalCandidates[i].gy
        });
      }

      // 6. Strict validation: every crystal and gate must be BFS-reachable
      let allCrystalsReachable = true;
      for (const c of crystals) {
        if (!this.hasPath(map, playerStart.gx, playerStart.gy, c.gx, c.gy, cols, rows)) {
          allCrystalsReachable = false;
          break;
        }
      }
      if (!allCrystalsReachable) continue;

      break; // Guaranteed solvable maze found!
    }

    // 7. Progressive enemy scaling with safe spawn distances (Manhattan dist >= 4)
    const hunters = [];
    const stalkers = [];
    const resonators = [];
    const lighthouses = [];

    const usedTileKeys = new Set();
    usedTileKeys.add(`${playerStart.gx},${playerStart.gy}`);
    usedTileKeys.add(`${gate.gx},${gate.gy}`);
    crystals.forEach(c => usedTileKeys.add(`${c.gx},${c.gy}`));

    // Enemy spawn candidates: reachable tiles with Manhattan distance >= 4 from start
    const enemyCandidates = reachableTiles.filter(t => {
      const distStart = Math.abs(t.gx - playerStart.gx) + Math.abs(t.gy - playerStart.gy);
      return distStart >= 4 && !usedTileKeys.has(`${t.gx},${t.gy}`);
    });
    this.shuffle(enemyCandidates);

    let candidateIdx = 0;

    // Hunters
    const hunterCount = Math.min(4, floor <= 2 ? 1 : (floor <= 4 ? 2 : 2 + Math.floor((floor - 4) / 2)));
    for (let h = 0; h < hunterCount && candidateIdx < enemyCandidates.length; h++) {
      const spawn = enemyCandidates[candidateIdx++];
      usedTileKeys.add(`${spawn.gx},${spawn.gy}`);

      // Find 3 nearby reachable floor waypoints around spawn
      const nearbyFloors = reachableTiles.filter(t => {
        const d = Math.abs(t.gx - spawn.gx) + Math.abs(t.gy - spawn.gy);
        return d > 0 && d <= 4;
      });
      this.shuffle(nearbyFloors);

      const wp = [{ gx: spawn.gx, gy: spawn.gy }];
      for (let w = 0; w < 3 && w < nearbyFloors.length; w++) {
        wp.push({ gx: nearbyFloors[w].gx, gy: nearbyFloors[w].gy });
      }

      hunters.push({
        id: `eh_${floor}_${h}`,
        startGx: spawn.gx,
        startGy: spawn.gy,
        waypoints: wp
      });
    }

    // Stalkers (Floor 3+)
    if (floor >= 3) {
      const stalkerCount = Math.min(2, 1 + Math.floor((floor - 3) / 4));
      for (let s = 0; s < stalkerCount && candidateIdx < enemyCandidates.length; s++) {
        const spawn = enemyCandidates[candidateIdx++];
        usedTileKeys.add(`${spawn.gx},${spawn.gy}`);
        stalkers.push({
          id: `es_${floor}_${s}`,
          startGx: spawn.gx,
          startGy: spawn.gy
        });
      }
    }

    // Resonators (Floor 5+)
    if (floor >= 5) {
      const resonatorCount = Math.min(3, 1 + Math.floor((floor - 5) / 2));
      for (let r = 0; r < resonatorCount && candidateIdx < enemyCandidates.length; r++) {
        const spawn = enemyCandidates[candidateIdx++];
        usedTileKeys.add(`${spawn.gx},${spawn.gy}`);
        resonators.push({
          id: `er_${floor}_${r}`,
          gx: spawn.gx,
          gy: spawn.gy
        });
      }
    }

    // Lighthouses (Every 3 floors starting floor 6)
    if (floor >= 6 && floor % 3 === 0 && candidateIdx < enemyCandidates.length) {
      const spawn = enemyCandidates[candidateIdx++];
      usedTileKeys.add(`${spawn.gx},${spawn.gy}`);
      lighthouses.push({
        id: `el_${floor}_1`,
        gx: spawn.gx,
        gy: spawn.gy
      });
    }

    return {
      sectorNumber: floor,
      name: `ENDLESS ECHO // ETAGE ${String(floor).padStart(2, '0')}`,
      description: `Etage ${floor} | Kristalle geborgen: ${this.totalCrystalsCollected} | Rekord: Etage ${this.bestFloor}`,
      playerStart,
      gate,
      crystals,
      resonators,
      lighthouses,
      stalkers,
      hunters,
      map
    };
  }
}
