import { isSolid } from './blocks';
import type { World } from './world';

export interface AABB {
  // Min/max corners in world space
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

const EPS = 1e-4;

function intersectsSolid(world: World, box: AABB): boolean {
  const x0 = Math.floor(box.minX);
  const x1 = Math.floor(box.maxX - EPS);
  const y0 = Math.floor(box.minY);
  const y1 = Math.floor(box.maxY - EPS);
  const z0 = Math.floor(box.minZ);
  const z1 = Math.floor(box.maxZ - EPS);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        if (isSolid(world.getBlock(x, y, z))) return true;
      }
    }
  }
  return false;
}

export function moveAndCollide(
  world: World,
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  half: { x: number; y: number; z: number },
  dt: number,
): { onGround: boolean; hitX: boolean; hitZ: boolean; hitY: boolean } {
  const result = { onGround: false, hitX: false, hitY: false, hitZ: false };

  const move = { x: vel.x * dt, y: vel.y * dt, z: vel.z * dt };

  // Move along each axis separately so we can slide.
  // X
  if (move.x !== 0) {
    pos.x += move.x;
    const box: AABB = {
      minX: pos.x - half.x, maxX: pos.x + half.x,
      minY: pos.y - half.y, maxY: pos.y + half.y,
      minZ: pos.z - half.z, maxZ: pos.z + half.z,
    };
    if (intersectsSolid(world, box)) {
      // back off until clear
      pos.x -= move.x;
      // Step toward block face precisely
      if (move.x > 0) {
        const newX = Math.floor(pos.x + half.x + move.x) - half.x - EPS;
        if (newX > pos.x) pos.x = newX;
      } else {
        const newX = Math.ceil(pos.x - half.x + move.x) + half.x + EPS;
        if (newX < pos.x) pos.x = newX;
      }
      vel.x = 0;
      result.hitX = true;
    }
  }
  // Z
  if (move.z !== 0) {
    pos.z += move.z;
    const box: AABB = {
      minX: pos.x - half.x, maxX: pos.x + half.x,
      minY: pos.y - half.y, maxY: pos.y + half.y,
      minZ: pos.z - half.z, maxZ: pos.z + half.z,
    };
    if (intersectsSolid(world, box)) {
      pos.z -= move.z;
      if (move.z > 0) {
        const newZ = Math.floor(pos.z + half.z + move.z) - half.z - EPS;
        if (newZ > pos.z) pos.z = newZ;
      } else {
        const newZ = Math.ceil(pos.z - half.z + move.z) + half.z + EPS;
        if (newZ < pos.z) pos.z = newZ;
      }
      vel.z = 0;
      result.hitZ = true;
    }
  }
  // Y
  if (move.y !== 0) {
    pos.y += move.y;
    const box: AABB = {
      minX: pos.x - half.x, maxX: pos.x + half.x,
      minY: pos.y - half.y, maxY: pos.y + half.y,
      minZ: pos.z - half.z, maxZ: pos.z + half.z,
    };
    if (intersectsSolid(world, box)) {
      pos.y -= move.y;
      if (move.y > 0) {
        const newY = Math.floor(pos.y + half.y + move.y) - half.y - EPS;
        if (newY > pos.y) pos.y = newY;
        result.hitY = true;
      } else {
        const newY = Math.ceil(pos.y - half.y + move.y) + half.y + EPS;
        if (newY < pos.y) pos.y = newY;
        result.onGround = true;
      }
      vel.y = 0;
    }
  }

  return result;
}

export function blockOverlapsAABB(
  bx: number, by: number, bz: number,
  box: AABB,
): boolean {
  return !(
    bx + 1 <= box.minX || bx >= box.maxX ||
    by + 1 <= box.minY || by >= box.maxY ||
    bz + 1 <= box.minZ || bz >= box.maxZ
  );
}
