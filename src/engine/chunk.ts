import { CHUNK_X, CHUNK_Y, CHUNK_Z } from '../config/constants';
import { BLOCK } from './blocks';
import type { BlockId } from './blocks';

export const chunkKey = (cx: number, cz: number) => `${cx},${cz}`;

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  readonly data: Uint8Array;
  // Mesh state
  meshDirty = true;
  generated = false;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.data = new Uint8Array(CHUNK_X * CHUNK_Y * CHUNK_Z);
  }

  static idx(lx: number, ly: number, lz: number): number {
    return lx + CHUNK_X * (lz + CHUNK_Z * ly);
  }

  inBounds(lx: number, ly: number, lz: number): boolean {
    return lx >= 0 && lx < CHUNK_X
      && ly >= 0 && ly < CHUNK_Y
      && lz >= 0 && lz < CHUNK_Z;
  }

  get(lx: number, ly: number, lz: number): BlockId {
    if (!this.inBounds(lx, ly, lz)) return BLOCK.AIR;
    return this.data[Chunk.idx(lx, ly, lz)];
  }

  set(lx: number, ly: number, lz: number, id: BlockId): boolean {
    if (!this.inBounds(lx, ly, lz)) return false;
    const i = Chunk.idx(lx, ly, lz);
    if (this.data[i] === id) return false;
    this.data[i] = id;
    this.meshDirty = true;
    return true;
  }

  origin(): [number, number, number] {
    return [this.cx * CHUNK_X, 0, this.cz * CHUNK_Z];
  }
}

export const worldToChunk = (wx: number, wz: number): [number, number] => {
  const cx = Math.floor(wx / CHUNK_X);
  const cz = Math.floor(wz / CHUNK_Z);
  return [cx, cz];
};

export const worldToLocal = (wx: number, wy: number, wz: number): [number, number, number, number, number] => {
  const cx = Math.floor(wx / CHUNK_X);
  const cz = Math.floor(wz / CHUNK_Z);
  const lx = wx - cx * CHUNK_X;
  const lz = wz - cz * CHUNK_Z;
  return [cx, cz, lx, wy, lz];
};
