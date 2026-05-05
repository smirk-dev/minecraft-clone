import { useEffect, useRef } from 'react';
import { ATLAS_PX, ATLAS_TILE_PX, ATLAS_TILES } from '../config/constants';
import { BLOCKS, BLOCK } from '../engine/blocks';
import type { BlockId } from '../engine/blocks';
import { getAtlasCanvas } from '../engine/atlas';

interface Props {
  itemId: BlockId;
  size?: number;
}

// Renders a small "isometric-ish" block icon using the atlas tiles.
// Uses faces[0]=posX (right side), faces[2]=top, faces[4]=posZ (front-right).
export function BlockIcon({ itemId, size = 32 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    if (itemId === BLOCK.AIR) return;
    const def = BLOCKS[itemId];
    if (!def) return;
    const atlas = getAtlasCanvas();

    const tile = (idx: number) => {
      const col = idx % ATLAS_TILES;
      const row = Math.floor(idx / ATLAS_TILES);
      return { sx: col * ATLAS_TILE_PX, sy: row * ATLAS_TILE_PX };
    };

    if (def.isItemOnly) {
      // Item icon: just blit the tile centered
      const t = tile(def.faces[0]);
      ctx.drawImage(atlas, t.sx, t.sy, ATLAS_TILE_PX, ATLAS_TILE_PX, 0, 0, size, size);
      return;
    }

    // Pseudo-iso: draw three quads for visible faces of a cube
    // Mapping: top in upper triangle, left side bottom-left, right side bottom-right.
    const top = tile(def.faces[2]);
    const left = tile(def.faces[1]); // -X side as left
    const right = tile(def.faces[4]); // +Z side as right

    // Use offscreen canvas to apply shading + warp
    const drawShaded = (
      sx: number, sy: number, w: number, h: number,
      dx: number, dy: number, dw: number, dh: number,
      shade: number,
    ) => {
      // Draw tile
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(atlas, sx, sy, w, h, dx, dy, dw, dh);
      ctx.fillStyle = `rgba(0,0,0,${1 - shade})`;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.restore();
    };

    // For simplicity, draw three rectangular regions stacked.
    const half = Math.floor(size / 2);
    const quart = Math.floor(size / 4);
    // Top
    drawShaded(top.sx, top.sy, ATLAS_TILE_PX, ATLAS_TILE_PX, 0, 0, size, half, 1.0);
    // Left
    drawShaded(left.sx, left.sy, ATLAS_TILE_PX, ATLAS_TILE_PX, 0, half, half, half, 0.7);
    // Right
    drawShaded(right.sx, right.sy, ATLAS_TILE_PX, ATLAS_TILE_PX, half, half, half, half, 0.85);
    // Tiny diagonal mark to suggest cube
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, half); ctx.lineTo(size, half);
    ctx.moveTo(half, half); ctx.lineTo(half, size);
    ctx.stroke();
    void quart;
    void ATLAS_PX;
  }, [itemId, size]);

  return <canvas ref={canvasRef} className="block-icon" style={{ width: size, height: size }} />;
}
