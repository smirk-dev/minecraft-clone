import { CHUNK_X, CHUNK_Y, CHUNK_Z } from '../config/constants';
import { BLOCK } from './blocks';
import type { BlockId } from './blocks';
import { Chunk, chunkKey, worldToChunk } from './chunk';
import { generateChunk } from './terrain';

export class World {
  readonly chunks = new Map<string, Chunk>();
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  hasChunk(cx: number, cz: number): boolean {
    return this.chunks.has(chunkKey(cx, cz));
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(chunkKey(cx, cz));
  }

  ensureChunk(cx: number, cz: number): Chunk {
    const k = chunkKey(cx, cz);
    let c = this.chunks.get(k);
    if (!c) {
      c = new Chunk(cx, cz);
      this.chunks.set(k, c);
    }
    return c;
  }

  generateIfNeeded(cx: number, cz: number): Chunk {
    const c = this.ensureChunk(cx, cz);
    if (!c.generated) {
      generateChunk(c, this.seed);
      c.generated = true;
      c.meshDirty = true;
    }
    return c;
  }

  unloadChunk(cx: number, cz: number): boolean {
    return this.chunks.delete(chunkKey(cx, cz));
  }

  getBlock(wx: number, wy: number, wz: number): BlockId {
    if (wy < 0 || wy >= CHUNK_Y) return BLOCK.AIR;
    const [cx, cz] = worldToChunk(wx, wz);
    const c = this.chunks.get(chunkKey(cx, cz));
    if (!c || !c.generated) return BLOCK.AIR;
    const lx = wx - cx * CHUNK_X;
    const lz = wz - cz * CHUNK_Z;
    return c.data[Chunk.idx(lx, wy, lz)];
  }

  setBlock(wx: number, wy: number, wz: number, id: BlockId): { changed: boolean; affected: Chunk[] } {
    if (wy < 0 || wy >= CHUNK_Y) return { changed: false, affected: [] };
    const [cx, cz] = worldToChunk(wx, wz);
    const c = this.chunks.get(chunkKey(cx, cz));
    if (!c) return { changed: false, affected: [] };
    const lx = wx - cx * CHUNK_X;
    const lz = wz - cz * CHUNK_Z;
    const changed = c.set(lx, wy, lz, id);
    if (!changed) return { changed: false, affected: [] };
    const affected: Chunk[] = [c];
    // If on a chunk border, the neighbor's mesh needs to be rebuilt too
    if (lx === 0) {
      const n = this.chunks.get(chunkKey(cx - 1, cz));
      if (n) { n.meshDirty = true; affected.push(n); }
    } else if (lx === CHUNK_X - 1) {
      const n = this.chunks.get(chunkKey(cx + 1, cz));
      if (n) { n.meshDirty = true; affected.push(n); }
    }
    if (lz === 0) {
      const n = this.chunks.get(chunkKey(cx, cz - 1));
      if (n) { n.meshDirty = true; affected.push(n); }
    } else if (lz === CHUNK_Z - 1) {
      const n = this.chunks.get(chunkKey(cx, cz + 1));
      if (n) { n.meshDirty = true; affected.push(n); }
    }
    return { changed: true, affected };
  }

  // Snapshot for save/load
  serialize(): unknown {
    const chunks: Array<{ cx: number; cz: number; data: number[] }> = [];
    this.chunks.forEach((c) => {
      if (c.generated) {
        chunks.push({ cx: c.cx, cz: c.cz, data: Array.from(c.data) });
      }
    });
    return { seed: this.seed, chunks };
  }

  static deserialize(snapshot: { seed: number; chunks: Array<{ cx: number; cz: number; data: number[] }> }): World {
    const w = new World(snapshot.seed);
    for (const sc of snapshot.chunks) {
      const c = w.ensureChunk(sc.cx, sc.cz);
      c.data.set(sc.data);
      c.generated = true;
      c.meshDirty = true;
    }
    return w;
  }
}
