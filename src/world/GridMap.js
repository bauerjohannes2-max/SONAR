/**
 * SONAR: The Echo Chamber
 * Grid Map & BFS Pathfinding Engine
 */

import { CONFIG } from '../config.js';

export class GridMap {
  constructor(levelGrid = null) {
    this.cols = CONFIG.GRID_COLS;
    this.rows = CONFIG.GRID_ROWS;
    this.tileSize = CONFIG.TILE_SIZE;
    this.tiles = [];
    if (levelGrid) {
      this.loadLevel(levelGrid);
    } else {
      this.initEmpty();
    }
  }

  get grid() {
    return this.tiles;
  }

  set grid(val) {
    this.tiles = val;
  }

  initEmpty() {
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      const row = new Array(this.cols).fill(CONFIG.TILES.FLOOR);
      this.tiles.push(row);
    }
  }

  loadMap(levelGrid) {
    this.loadLevel(levelGrid);
  }

  loadLevel(levelGrid) {
    this.initEmpty();
    if (!levelGrid) return;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (levelGrid[r] && levelGrid[r][c] !== undefined) {
          this.tiles[r][c] = levelGrid[r][c];
        }
      }
    }
  }

  isInBounds(gx, gy) {
    return gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows;
  }

  getTile(gx, gy) {
    if (!this.isInBounds(gx, gy)) return CONFIG.TILES.WALL;
    return this.tiles[gy][gx];
  }

  setTile(gx, gy, val) {
    if (this.isInBounds(gx, gy)) {
      this.tiles[gy][gx] = val;
    }
  }

  isWall(gx, gy) {
    if (!this.isInBounds(gx, gy)) return true;
    return this.tiles[gy][gx] === CONFIG.TILES.WALL;
  }

  /**
   * Checks if an entity can enter this tile.
   * Note: Closed gates or walls block movement.
   */
  isWalkable(gx, gy) {
    if (!this.isInBounds(gx, gy)) return false;
    const t = this.tiles[gy][gx];
    return t !== CONFIG.TILES.WALL;
  }

  worldToGrid(x, y) {
    return {
      gx: Math.floor(x / this.tileSize),
      gy: Math.floor(y / this.tileSize)
    };
  }

  gridToWorld(gx, gy) {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2
    };
  }

  /**
   * BFS Shortest Pathfinding for Enemy AI.
   * Returns an array of next steps: [{gx, gy}, ...]
   * @param {number} startGx 
   * @param {number} startGy 
   * @param {number} targetGx 
   * @param {number} targetGy 
   */
  findPath(startGx, startGy, targetGx, targetGy) {
    if (startGx === targetGx && startGy === targetGy) {
      return [];
    }

    // Clamp / validate target
    targetGx = Math.max(0, Math.min(this.cols - 1, targetGx));
    targetGy = Math.max(0, Math.min(this.rows - 1, targetGy));

    // If target itself is a wall, try nearest neighbor
    if (this.isWall(targetGx, targetGy)) {
      const neighbors = [
        { gx: targetGx + 1, gy: targetGy },
        { gx: targetGx - 1, gy: targetGy },
        { gx: targetGx, gy: targetGy + 1 },
        { gx: targetGx, gy: targetGy - 1 }
      ].filter(n => this.isWalkable(n.gx, n.gy));

      if (neighbors.length > 0) {
        targetGx = neighbors[0].gx;
        targetGy = neighbors[0].gy;
      } else {
        return [];
      }
    }

    const queue = [{ gx: startGx, gy: startGy }];
    const visited = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
    const parentMap = new Map(); // key: "gx,gy" => { gx, gy }

    visited[startGy][startGx] = true;
    let found = false;

    // 4-directional moves (Up, Down, Left, Right)
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.gx === targetGx && current.gy === targetGy) {
        found = true;
        break;
      }

      for (const d of dirs) {
        const nx = current.gx + d.dx;
        const ny = current.gy + d.dy;

        if (this.isInBounds(nx, ny) && !visited[ny][nx] && this.isWalkable(nx, ny)) {
          visited[ny][nx] = true;
          parentMap.set(`${nx},${ny}`, { gx: current.gx, gy: current.gy });
          queue.push({ gx: nx, gy: ny });
        }
      }
    }

    if (!found) {
      return [];
    }

    // Reconstruct path backwards
    const path = [];
    let curr = { gx: targetGx, gy: targetGy };

    while (!(curr.gx === startGx && curr.gy === startGy)) {
      path.unshift(curr);
      const parent = parentMap.get(`${curr.gx},${curr.gy}`);
      if (!parent) break;
      curr = parent;
    }

    return path;
  }
}
