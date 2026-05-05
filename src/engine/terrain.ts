import { CHUNK_X, CHUNK_Y, CHUNK_Z, SEA_LEVEL } from '../config/constants';
import { BLOCK } from './blocks';
import type { BlockId } from './blocks';
import { Chunk } from './chunk';
import { Noise, hash2 } from './noise';

export const BIOME = {
  PLAINS: 0,
  DESERT: 1,
  MOUNTAINS: 2,
  FOREST: 3,
} as const;
export type BiomeId = number;

const noiseCache = new Map<number, { height: Noise; biome: Noise; tree: Noise; cave: Noise }>();
const getNoises = (seed: number) => {
  let n = noiseCache.get(seed);
  if (!n) {
    n = {
      height: new Noise(seed),
      biome: new Noise(seed ^ 0x9e3779b1),
      tree: new Noise(seed ^ 0x6a09e667),
      cave: new Noise(seed ^ 0xbb67ae85),
    };
    noiseCache.set(seed, n);
  }
  return n;
};

export function biomeAt(seed: number, wx: number, wz: number): BiomeId {
  const n = getNoises(seed);
  const b = n.biome.fbm2(wx * 0.0035, wz * 0.0035, 3, 2, 0.5);
  const m = n.biome.fbm2((wx + 9999) * 0.005, (wz + 9999) * 0.005, 3, 2, 0.5);
  if (b < -0.25) return BIOME.DESERT;
  if (b > 0.35) return BIOME.MOUNTAINS;
  if (m > 0.15) return BIOME.FOREST;
  return BIOME.PLAINS;
}

function heightAt(seed: number, wx: number, wz: number, biome: BiomeId): number {
  const n = getNoises(seed);
  const base = n.height.fbm2(wx * 0.012, wz * 0.012, 4, 2, 0.5); // -1..1
  const detail = n.height.fbm2(wx * 0.06, wz * 0.06, 2, 2, 0.5);
  let h: number;
  switch (biome) {
    case BIOME.MOUNTAINS:
      h = SEA_LEVEL + 6 + base * 18 + detail * 4;
      break;
    case BIOME.DESERT:
      h = SEA_LEVEL + 1 + base * 4 + detail * 1;
      break;
    case BIOME.FOREST:
      h = SEA_LEVEL + 3 + base * 6 + detail * 2;
      break;
    default:
      h = SEA_LEVEL + 2 + base * 5 + detail * 1.5;
      break;
  }
  return Math.max(2, Math.min(CHUNK_Y - 8, Math.floor(h)));
}

function topBlock(biome: BiomeId): BlockId {
  if (biome === BIOME.DESERT) return BLOCK.SAND;
  return BLOCK.GRASS;
}
function subBlock(biome: BiomeId): BlockId {
  if (biome === BIOME.DESERT) return BLOCK.SAND;
  return BLOCK.DIRT;
}

function plantTree(c: Chunk, lx: number, ly: number, lz: number) {
  const trunkH = 4 + Math.floor(hash2(c.cx * 16 + lx, c.cz * 16 + lz, 1234) * 3);
  for (let i = 0; i < trunkH; i++) {
    if (ly + i < CHUNK_Y) c.set(lx, ly + i, lz, BLOCK.LOG);
  }
  const leafBase = ly + trunkH - 1;
  for (let dy = -1; dy <= 2; dy++) {
    const r = dy <= 0 ? 2 : (dy === 1 ? 1 : 1);
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx === 0 && dz === 0 && dy <= 0) continue;
        const nx = lx + dx, ny = leafBase + dy, nz = lz + dz;
        if (ny < 0 || ny >= CHUNK_Y) continue;
        // skip corners on outer ring
        if (Math.abs(dx) === r && Math.abs(dz) === r && r === 2) continue;
        if (nx < 0 || nx >= CHUNK_X || nz < 0 || nz >= CHUNK_Z) continue;
        if (c.data[Chunk.idx(nx, ny, nz)] === BLOCK.AIR) {
          c.set(nx, ny, nz, BLOCK.LEAVES);
        }
      }
    }
  }
  // top leaf
  if (leafBase + 2 < CHUNK_Y) c.set(lx, leafBase + 2, lz, BLOCK.LEAVES);
}

export function generateChunk(c: Chunk, seed: number) {
  const noises = getNoises(seed);
  const ox = c.cx * CHUNK_X;
  const oz = c.cz * CHUNK_Z;

  // Heightmap pass
  const heights = new Int16Array(CHUNK_X * CHUNK_Z);
  const biomes = new Uint8Array(CHUNK_X * CHUNK_Z);
  for (let lz = 0; lz < CHUNK_Z; lz++) {
    for (let lx = 0; lx < CHUNK_X; lx++) {
      const wx = ox + lx;
      const wz = oz + lz;
      const b = biomeAt(seed, wx, wz);
      const h = heightAt(seed, wx, wz, b);
      heights[lx + lz * CHUNK_X] = h;
      biomes[lx + lz * CHUNK_X] = b;
    }
  }

  // Fill
  for (let lz = 0; lz < CHUNK_Z; lz++) {
    for (let lx = 0; lx < CHUNK_X; lx++) {
      const h = heights[lx + lz * CHUNK_X];
      const b = biomes[lx + lz * CHUNK_X];
      // bedrock at y=0
      c.data[Chunk.idx(lx, 0, lz)] = BLOCK.BEDROCK;
      for (let y = 1; y <= h; y++) {
        let id: BlockId;
        if (y === h) id = topBlock(b);
        else if (y >= h - 3) id = subBlock(b);
        else id = BLOCK.STONE;

        // Cave carving (skip near top to keep terrain stable)
        if (y < h - 4 && y > 2) {
          const cx = noises.cave.fbm2(((ox + lx) + y * 13.7) * 0.07, (oz + lz) * 0.07, 3, 2, 0.5);
          if (cx > 0.55) id = BLOCK.AIR;
        }
        c.data[Chunk.idx(lx, y, lz)] = id;
      }
      // Water fill below sea level
      for (let y = h + 1; y <= SEA_LEVEL; y++) {
        if (c.data[Chunk.idx(lx, y, lz)] === BLOCK.AIR) {
          c.data[Chunk.idx(lx, y, lz)] = BLOCK.WATER;
        }
      }
    }
  }

  // Trees: scatter according to biome
  for (let lz = 1; lz < CHUNK_Z - 1; lz++) {
    for (let lx = 1; lx < CHUNK_X - 1; lx++) {
      const h = heights[lx + lz * CHUNK_X];
      const b = biomes[lx + lz * CHUNK_X];
      if (h <= SEA_LEVEL) continue;
      const treeChance = b === BIOME.FOREST ? 0.06 : b === BIOME.PLAINS ? 0.012 : 0;
      if (treeChance === 0) continue;
      const r = hash2(ox + lx, oz + lz, seed ^ 0xdeadbeef);
      if (r < treeChance && c.data[Chunk.idx(lx, h, lz)] === BLOCK.GRASS) {
        plantTree(c, lx, h + 1, lz);
      }
    }
  }
}

// Public helper: terrain height at (x, z) without generating a chunk
export function surfaceHeightAt(seed: number, wx: number, wz: number): number {
  return heightAt(seed, wx, wz, biomeAt(seed, wx, wz));
}
