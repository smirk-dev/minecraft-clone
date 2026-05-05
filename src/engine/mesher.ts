import * as THREE from 'three';
import { CHUNK_X, CHUNK_Y, CHUNK_Z, ATLAS_TILES } from '../config/constants';
import { BLOCK, BLOCKS, isTransparent } from './blocks';
import type { Chunk } from './chunk';
import type { World } from './world';

interface MaskCell {
  blockId: number;
  tile: number;
  side: 1 | -1;
  transparent: boolean;
}

class GeomBuilder {
  positions: number[] = [];
  normals: number[] = [];
  tileBases: number[] = [];
  uvLocals: number[] = [];
  shades: number[] = [];
  indices: number[] = [];

  pushQuad(
    p0: [number, number, number], p1: [number, number, number],
    p2: [number, number, number], p3: [number, number, number],
    normal: [number, number, number],
    tileBaseU: number, tileBaseV: number,
    w: number, h: number,
    shade: number,
    flip: boolean,
  ) {
    const baseIdx = this.positions.length / 3;
    const corners = [p0, p1, p2, p3];
    for (const c of corners) this.positions.push(c[0], c[1], c[2]);
    for (let i = 0; i < 4; i++) this.normals.push(normal[0], normal[1], normal[2]);
    // UV locals: corner order matches p0..p3 with extents (0,0), (w,0), (w,h), (0,h)
    this.uvLocals.push(0, 0, w, 0, w, h, 0, h);
    for (let i = 0; i < 4; i++) {
      this.tileBases.push(tileBaseU, tileBaseV);
      this.shades.push(shade);
    }
    if (!flip) {
      this.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
    } else {
      this.indices.push(baseIdx, baseIdx + 2, baseIdx + 1, baseIdx, baseIdx + 3, baseIdx + 2);
    }
  }

  build(): THREE.BufferGeometry | null {
    if (this.indices.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geo.setAttribute('aTileBase', new THREE.Float32BufferAttribute(this.tileBases, 2));
    geo.setAttribute('aUVLocal', new THREE.Float32BufferAttribute(this.uvLocals, 2));
    geo.setAttribute('aShade', new THREE.Float32BufferAttribute(this.shades, 1));
    geo.setIndex(this.indices);
    geo.computeBoundingSphere();
    return geo;
  }
}

const INSET = 0.5 / (ATLAS_TILES * 16);

const tileBaseUV = (tile: number): [number, number] => {
  const col = tile % ATLAS_TILES;
  const row = Math.floor(tile / ATLAS_TILES);
  // Match atlas.ts tileUV inversion: row 0 (top of canvas) is at v = 1 - 0/16
  const u0 = col / ATLAS_TILES + INSET;
  const v0 = 1 - (row + 1) / ATLAS_TILES + INSET;
  return [u0, v0];
};

// Per-face shade based on normal direction (top brightest, bottom darkest, sides medium).
const faceShade = (axis: number, side: 1 | -1): number => {
  if (axis === 1) return side === 1 ? 1.0 : 0.5;   // top vs bottom
  if (axis === 2) return 0.85;                      // Z faces
  return 0.7;                                       // X faces
};

// Should we draw a face from "self" looking toward "neighbor"?
function showFace(self: number, neighbor: number): boolean {
  if (self === BLOCK.AIR) return false;
  if (self === BLOCK.WATER) {
    // water faces only against air (not against itself or solid)
    return neighbor === BLOCK.AIR;
  }
  if (neighbor === BLOCK.AIR) return true;
  // Hide identical-block seams (clean glass/leaves clusters)
  if (self === neighbor) return false;
  // Opaque next to opaque -> hidden; one transparent -> show
  if (!BLOCKS[self].transparent && !BLOCKS[neighbor].transparent) return false;
  // self opaque, neighbor transparent -> show
  if (!BLOCKS[self].transparent) return true;
  // self transparent, neighbor opaque -> show? typically the opaque shows its face
  if (BLOCKS[self].transparent && !BLOCKS[neighbor].transparent) return false;
  // Both transparent, different ids -> show one face from self
  return true;
}

function maskCellsEqual(a: MaskCell | null, b: MaskCell | null): boolean {
  if (!a || !b) return a === b;
  return a.blockId === b.blockId && a.tile === b.tile && a.side === b.side;
}

function tileForFace(blockId: number, axis: number, side: 1 | -1): number {
  const faces = BLOCKS[blockId].faces;
  // faces order: [posX, negX, posY, negY, posZ, negZ]
  if (axis === 0) return side === 1 ? faces[0] : faces[1];
  if (axis === 1) return side === 1 ? faces[2] : faces[3];
  return side === 1 ? faces[4] : faces[5];
}

export interface ChunkMeshResult {
  opaque: THREE.BufferGeometry | null;
  transparent: THREE.BufferGeometry | null;
}

export function meshChunk(chunk: Chunk, world: World): ChunkMeshResult {
  const opaque = new GeomBuilder();
  const transp = new GeomBuilder();

  const dims = [CHUNK_X, CHUNK_Y, CHUNK_Z];
  const ox = chunk.cx * CHUNK_X;
  const oz = chunk.cz * CHUNK_Z;

  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;

    for (let s = -1; s < dims[axis]; s++) {
      const mask: (MaskCell | null)[] = new Array(dims[u] * dims[v]).fill(null);

      for (let vv = 0; vv < dims[v]; vv++) {
        for (let uu = 0; uu < dims[u]; uu++) {
          const aLocal: [number, number, number] = [0, 0, 0];
          aLocal[axis] = s;
          aLocal[u] = uu;
          aLocal[v] = vv;
          const bLocal: [number, number, number] = [aLocal[0], aLocal[1], aLocal[2]];
          bLocal[axis] = s + 1;

          const a = world.getBlock(aLocal[0] + ox, aLocal[1], aLocal[2] + oz);
          const b = world.getBlock(bLocal[0] + ox, bLocal[1], bLocal[2] + oz);

          let cell: MaskCell | null = null;
          // Face from "a" pointing in +axis direction
          if (showFace(a, b)) {
            cell = {
              blockId: a,
              tile: tileForFace(a, axis, 1),
              side: 1,
              transparent: isTransparent(a),
            };
          } else if (showFace(b, a)) {
            cell = {
              blockId: b,
              tile: tileForFace(b, axis, -1),
              side: -1,
              transparent: isTransparent(b),
            };
          }
          mask[uu + vv * dims[u]] = cell;
        }
      }

      // Greedy merge
      for (let vv = 0; vv < dims[v]; vv++) {
        let uu = 0;
        while (uu < dims[u]) {
          const cell = mask[uu + vv * dims[u]];
          if (!cell) {
            uu++;
            continue;
          }
          // Width along u
          let w = 1;
          while (uu + w < dims[u] && maskCellsEqual(mask[uu + w + vv * dims[u]], cell)) w++;
          // Height along v
          let h = 1;
          let outerDone = false;
          while (vv + h < dims[v] && !outerDone) {
            for (let k = 0; k < w; k++) {
              if (!maskCellsEqual(mask[uu + k + (vv + h) * dims[u]], cell)) {
                outerDone = true;
                break;
              }
            }
            if (!outerDone) h++;
          }

          // Build quad in chunk-local space
          // Quad lies in plane axis=s+1 (face position).
          const x: [number, number, number] = [0, 0, 0];
          x[axis] = s + 1;
          x[u] = uu;
          x[v] = vv;

          const du: [number, number, number] = [0, 0, 0];
          du[u] = w;
          const dv: [number, number, number] = [0, 0, 0];
          dv[v] = h;

          // Add chunk world offset
          const baseX = x[0] + ox;
          const baseY = x[1];
          const baseZ = x[2] + oz;

          const p0: [number, number, number] = [baseX, baseY, baseZ];
          const p1: [number, number, number] = [baseX + du[0], baseY + du[1], baseZ + du[2]];
          const p2: [number, number, number] = [baseX + du[0] + dv[0], baseY + du[1] + dv[1], baseZ + du[2] + dv[2]];
          const p3: [number, number, number] = [baseX + dv[0], baseY + dv[1], baseZ + dv[2]];

          const normal: [number, number, number] = [0, 0, 0];
          normal[axis] = cell.side;

          const [tu, tv] = tileBaseUV(cell.tile);
          const shade = faceShade(axis, cell.side);

          // Winding so triangle is front-facing toward normal direction.
          // For positive side: standard order p0,p1,p2,p3 yields normal in -axis when (u,v) cross-product
          // points along -axis. We flip if needed.
          // Heuristic: compute cross of (p1-p0) x (p3-p0) and compare to normal.
          const cu0 = p1[0] - p0[0], cu1 = p1[1] - p0[1], cu2 = p1[2] - p0[2];
          const cv0 = p3[0] - p0[0], cv1 = p3[1] - p0[1], cv2 = p3[2] - p0[2];
          const cx0 = cu1 * cv2 - cu2 * cv1;
          const cx1 = cu2 * cv0 - cu0 * cv2;
          const cx2 = cu0 * cv1 - cu1 * cv0;
          const dot = cx0 * normal[0] + cx1 * normal[1] + cx2 * normal[2];
          const flip = dot < 0;

          const out = cell.transparent ? transp : opaque;
          out.pushQuad(p0, p1, p2, p3, normal, tu, tv, w, h, shade, flip);

          // Clear consumed cells
          for (let dh = 0; dh < h; dh++) {
            for (let dw = 0; dw < w; dw++) {
              mask[uu + dw + (vv + dh) * dims[u]] = null;
            }
          }
          uu += w;
        }
      }
    }
  }

  return {
    opaque: opaque.build(),
    transparent: transp.build(),
  };
}
