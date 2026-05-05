import * as THREE from 'three';
import { BLOCK, isSolid } from './blocks';
import type { World } from './world';

export interface RayHit {
  block: [number, number, number];      // hit voxel coords
  normal: [number, number, number];     // face normal pointing out of block
  distance: number;
}

// Amanatides & Woo voxel traversal.
export function voxelRaycast(
  world: World,
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  maxDistance: number,
): RayHit | null {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const dx = dir.x, dy = dir.y, dz = dir.z;
  if (dx === 0 && dy === 0 && dz === 0) return null;

  const stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
  const stepY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
  const stepZ = dz > 0 ? 1 : (dz < 0 ? -1 : 0);

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity;

  const voxelEdgeX = stepX > 0 ? (x + 1 - origin.x) : (origin.x - x);
  const voxelEdgeY = stepY > 0 ? (y + 1 - origin.y) : (origin.y - y);
  const voxelEdgeZ = stepZ > 0 ? (z + 1 - origin.z) : (origin.z - z);

  let tMaxX = stepX !== 0 ? voxelEdgeX / Math.abs(dx) : Infinity;
  let tMaxY = stepY !== 0 ? voxelEdgeY / Math.abs(dy) : Infinity;
  let tMaxZ = stepZ !== 0 ? voxelEdgeZ / Math.abs(dz) : Infinity;

  let normal: [number, number, number] = [0, 0, 0];
  let t = 0;

  while (t <= maxDistance) {
    const id = world.getBlock(x, y, z);
    if (id !== BLOCK.AIR && id !== BLOCK.WATER && isSolid(id)) {
      return { block: [x, y, z], normal, distance: t };
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      t = tMaxX;
      tMaxX += tDeltaX;
      normal = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      normal = [0, -stepY, 0];
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      normal = [0, 0, -stepZ];
    }
  }
  return null;
}
