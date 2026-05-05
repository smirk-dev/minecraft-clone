import * as THREE from 'three';
import { ATLAS_PX, ATLAS_TILE_PX, ATLAS_TILES } from '../config/constants';
import { hash2 } from './noise';

// Procedural pixel-art atlas. No external assets needed.
// Tile layout (row 0):
// 0 grass-top, 1 grass-side, 2 dirt, 3 stone, 4 sand, 5 log-top, 6 log-side,
// 7 leaves, 8 planks, 9 glass, 10 water, 11 torch, 12 cobble, 13 bedrock,
// 14 stick (item icon), 15 crafting-top

type Painter = (ctx: CanvasRenderingContext2D, x0: number, y0: number, size: number) => void;

const speckle = (
  ctx: CanvasRenderingContext2D, x0: number, y0: number, size: number,
  base: string, palette: string[], density: number, seed: number,
) => {
  ctx.fillStyle = base;
  ctx.fillRect(x0, y0, size, size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const r = hash2(px, py, seed);
      if (r < density) {
        ctx.fillStyle = palette[Math.floor(r * 1000) % palette.length];
        ctx.fillRect(x0 + px, y0 + py, 1, 1);
      }
    }
  }
};

const grassTop: Painter = (c, x, y, s) =>
  speckle(c, x, y, s, '#4d9c3a', ['#3d8a2a', '#5fb348', '#2f7a1f', '#67c053'], 0.55, 11);

const grassSide: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#8b5a2b', ['#7a4d22', '#a36b35', '#6c4321'], 0.5, 12); // dirt base
  // green top strip
  for (let py = 0; py < Math.ceil(s * 0.28); py++) {
    for (let px = 0; px < s; px++) {
      const r = hash2(px, py, 13);
      c.fillStyle = r < 0.5 ? '#4d9c3a' : (r < 0.8 ? '#3d8a2a' : '#5fb348');
      c.fillRect(x + px, y + py, 1, 1);
    }
  }
  // dribble
  for (let px = 0; px < s; px++) {
    if (hash2(px, 0, 14) < 0.35) {
      const drip = Math.floor(hash2(px, 1, 14) * 3) + Math.ceil(s * 0.28);
      c.fillStyle = '#3d8a2a';
      c.fillRect(x + px, y + drip, 1, 1);
    }
  }
};

const dirt: Painter = (c, x, y, s) =>
  speckle(c, x, y, s, '#8b5a2b', ['#7a4d22', '#a36b35', '#6c4321'], 0.55, 21);

const stone: Painter = (c, x, y, s) =>
  speckle(c, x, y, s, '#888888', ['#7a7a7a', '#9a9a9a', '#6e6e6e', '#a8a8a8'], 0.5, 31);

const cobble: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#7a7a7a', ['#888', '#666', '#999'], 0.55, 32);
  c.fillStyle = '#444';
  // grout lines
  for (let i = 0; i < s; i++) {
    if (i % Math.max(2, Math.floor(s / 5)) === 0) {
      c.fillRect(x + i, y, 1, s);
      c.fillRect(x, y + i, s, 1);
    }
  }
};

const sand: Painter = (c, x, y, s) =>
  speckle(c, x, y, s, '#e6d28a', ['#d4be73', '#f0dea0', '#c9b366'], 0.45, 41);

const logTop: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#8a6a3b', ['#7a5e34', '#9e7b46'], 0.4, 51);
  c.strokeStyle = '#5e4423';
  c.lineWidth = 1;
  const cx = x + s / 2, cy = y + s / 2;
  for (let r = 1; r < s / 2; r += 2) {
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
  }
};

const logSide: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#5e4423', ['#503820', '#6a4f2a', '#3e2a18'], 0.55, 52);
  // vertical streaks
  c.fillStyle = '#3e2a18';
  for (let px = 0; px < s; px += 3) {
    for (let py = 0; py < s; py++) c.fillRect(x + px, y + py, 1, 1);
  }
};

const leaves: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#2f7a1f', ['#1f5e15', '#3d8a2a', '#143f0b', '#4d9c3a'], 0.7, 61);
  // dark holes (transparency proxy, since we render leaves as transparent block)
  c.fillStyle = '#0a2106';
  for (let i = 0; i < s; i++) {
    for (let j = 0; j < s; j++) {
      if (hash2(i, j, 62) < 0.06) c.fillRect(x + i, y + j, 1, 1);
    }
  }
};

const planks: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#b88a4a', ['#a87a3e', '#c9a26b'], 0.4, 71);
  c.fillStyle = '#704922';
  // horizontal plank lines
  for (let py = 0; py < s; py += Math.max(2, Math.floor(s / 4))) {
    c.fillRect(x, y + py, s, 1);
  }
  // vertical staggered seams
  for (let py = 0; py < s; py += Math.max(2, Math.floor(s / 4))) {
    const off = (py / Math.max(2, Math.floor(s / 4))) % 2 === 0 ? Math.floor(s / 3) : Math.floor((s * 2) / 3);
    c.fillRect(x + off, y + py, 1, Math.max(2, Math.floor(s / 4)));
  }
};

const glass: Painter = (c, x, y, s) => {
  c.clearRect(x, y, s, s);
  c.fillStyle = 'rgba(180,220,240,0.25)';
  c.fillRect(x, y, s, s);
  c.strokeStyle = '#cfe6f5';
  c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  // diagonal highlights
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.beginPath();
  c.moveTo(x + 2, y + s - 2); c.lineTo(x + s - 2, y + 2);
  c.stroke();
};

const water: Painter = (c, x, y, s) => {
  speckle(c, x, y, s, '#3a78c2', ['#2c64a8', '#4a8cd6', '#225595'], 0.5, 91);
  c.globalAlpha = 0.85;
  c.fillStyle = '#3a78c2';
  c.fillRect(x, y, s, s);
  c.globalAlpha = 1;
};

const torch: Painter = (c, x, y, s) => {
  c.clearRect(x, y, s, s);
  // stick
  const sx = x + Math.floor(s * 0.4);
  const sw = Math.max(2, Math.floor(s * 0.2));
  c.fillStyle = '#8a6a3b';
  c.fillRect(sx, y + Math.floor(s * 0.3), sw, Math.floor(s * 0.7));
  // flame
  c.fillStyle = '#ffcc33';
  c.fillRect(sx - 1, y + Math.floor(s * 0.1), sw + 2, Math.floor(s * 0.25));
  c.fillStyle = '#ff7a1f';
  c.fillRect(sx, y + Math.floor(s * 0.05), sw, Math.floor(s * 0.15));
};

const bedrock: Painter = (c, x, y, s) =>
  speckle(c, x, y, s, '#2a2a2a', ['#1a1a1a', '#3a3a3a', '#404040'], 0.6, 101);

const stickIcon: Painter = (c, x, y, s) => {
  c.clearRect(x, y, s, s);
  c.fillStyle = '#8a6a3b';
  c.fillRect(x + Math.floor(s * 0.2), y + Math.floor(s * 0.7), Math.floor(s * 0.6), Math.max(1, Math.floor(s * 0.1)));
  c.fillStyle = '#704922';
  for (let i = 0; i < 4; i++) {
    c.fillRect(
      x + Math.floor(s * 0.85) - i,
      y + Math.floor(s * 0.7) - i,
      Math.max(1, Math.floor(s * 0.1)),
      Math.max(1, Math.floor(s * 0.1)),
    );
  }
};

const craftingTop: Painter = (c, x, y, s) => {
  planks(c, x, y, s);
  c.fillStyle = '#3a2410';
  // 3x3 grid
  const t = Math.max(1, Math.floor(s / 8));
  const gx = x + Math.floor(s * 0.15);
  const gy = y + Math.floor(s * 0.15);
  const gs = Math.floor(s * 0.7);
  c.fillRect(gx, gy, gs, t);
  c.fillRect(gx, gy + Math.floor(gs / 3), gs, t);
  c.fillRect(gx, gy + Math.floor((gs * 2) / 3), gs, t);
  c.fillRect(gx, gy + gs - t, gs, t);
  c.fillRect(gx, gy, t, gs);
  c.fillRect(gx + Math.floor(gs / 3), gy, t, gs);
  c.fillRect(gx + Math.floor((gs * 2) / 3), gy, t, gs);
  c.fillRect(gx + gs - t, gy, t, gs);
};

const TILE_PAINTERS: Painter[] = [
  grassTop, grassSide, dirt, stone, sand, logTop, logSide, leaves,
  planks, glass, water, torch, cobble, bedrock, stickIcon, craftingTop,
];

let cachedTexture: THREE.Texture | null = null;
let cachedCanvas: HTMLCanvasElement | null = null;

export function getAtlasTexture(): THREE.Texture {
  if (cachedTexture) return cachedTexture;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_PX;
  canvas.height = ATLAS_PX;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ATLAS_PX, ATLAS_PX);
  for (let i = 0; i < TILE_PAINTERS.length; i++) {
    const col = i % ATLAS_TILES;
    const row = Math.floor(i / ATLAS_TILES);
    const x = col * ATLAS_TILE_PX;
    const y = row * ATLAS_TILE_PX;
    TILE_PAINTERS[i](ctx, x, y, ATLAS_TILE_PX);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipMapLinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedTexture = tex;
  cachedCanvas = canvas;
  return tex;
}

export function getAtlasCanvas(): HTMLCanvasElement {
  if (!cachedCanvas) getAtlasTexture();
  return cachedCanvas!;
}

// UV bounds for a tile, with a small inset to avoid texture bleed across tiles
const INSET = 0.5 / ATLAS_PX;
export function tileUV(tileIndex: number): { u0: number; v0: number; u1: number; v1: number } {
  const col = tileIndex % ATLAS_TILES;
  const row = Math.floor(tileIndex / ATLAS_TILES);
  const u0 = col / ATLAS_TILES + INSET;
  // Note: WebGL textures have V going up; our canvas tile (col, row) treats row 0 as top.
  // We invert V so that "top of tile" in UV space matches "top row" in canvas.
  const v1 = 1 - row / ATLAS_TILES - INSET;
  const u1 = (col + 1) / ATLAS_TILES - INSET;
  const v0 = 1 - (row + 1) / ATLAS_TILES + INSET;
  return { u0, v0, u1, v1 };
}
