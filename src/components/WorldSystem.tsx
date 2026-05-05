import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHUNK_GEN_BUDGET_MS, CHUNK_X, CHUNK_Z, MESH_BUDGET_MS } from '../config/constants';
import { meshChunk } from '../engine/mesher';
import { chunkKey, worldToChunk } from '../engine/chunk';
import type { Chunk } from '../engine/chunk';
import type { World } from '../engine/world';
import { createVoxelMaterial } from '../engine/voxelMaterial';
import { useStore } from '../hooks/useStore';
import { runtime } from '../game/runtime';

interface ChunkMeshes {
  opaque?: THREE.Mesh;
  transparent?: THREE.Mesh;
}

export function WorldSystem() {
  const { scene } = useThree();
  const world = useStore((s) => s.world);
  const phase = useStore((s) => s.phase);
  const renderDistance = useStore((s) => s.renderDistance);
  const setStats = useStore((s) => s.setStats);

  const meshesRef = useRef<Map<string, ChunkMeshes>>(new Map());
  const opaqueMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const transpMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const remeshQueueRef = useRef<string[]>([]);
  const genQueueRef = useRef<string[]>([]);

  useEffect(() => {
    const group = new THREE.Group();
    group.name = 'world';
    scene.add(group);
    groupRef.current = group;

    opaqueMatRef.current = createVoxelMaterial({ transparent: false });
    transpMatRef.current = createVoxelMaterial({ transparent: true });

    return () => {
      // Dispose all chunk meshes on unmount
      meshesRef.current.forEach((cm) => {
        if (cm.opaque) {
          cm.opaque.geometry.dispose();
          group.remove(cm.opaque);
        }
        if (cm.transparent) {
          cm.transparent.geometry.dispose();
          group.remove(cm.transparent);
        }
      });
      meshesRef.current.clear();
      scene.remove(group);
      opaqueMatRef.current?.dispose();
      transpMatRef.current?.dispose();
    };
  }, [scene]);

  // When world changes, eagerly pregenerate the spawn area so the player has ground.
  useEffect(() => {
    if (!world) return;
    pregenerateSpawn(world);
    // Force initial enqueue so render picks up
    remeshQueueRef.current = [];
    genQueueRef.current = [];
  }, [world]);

  useFrame(() => {
    const w = world;
    const grp = groupRef.current;
    const opaqueMat = opaqueMatRef.current;
    const transpMat = transpMatRef.current;
    if (!w || !grp || !opaqueMat || !transpMat) return;
    if (phase !== 'playing' && phase !== 'paused' && phase !== 'inventory' && phase !== 'crafting') return;

    const px = runtime.playerPos.x;
    const pz = runtime.playerPos.z;
    const [pcx, pcz] = worldToChunk(Math.floor(px), Math.floor(pz));

    // 1) Determine desired set of chunks
    const desired = new Set<string>();
    for (let dz = -renderDistance; dz <= renderDistance; dz++) {
      for (let dx = -renderDistance; dx <= renderDistance; dx++) {
        if (dx * dx + dz * dz > (renderDistance + 0.5) * (renderDistance + 0.5)) continue;
        desired.add(chunkKey(pcx + dx, pcz + dz));
      }
    }

    // 2) Unload far chunks
    meshesRef.current.forEach((cm, key) => {
      if (!desired.has(key)) {
        if (cm.opaque) { grp.remove(cm.opaque); cm.opaque.geometry.dispose(); }
        if (cm.transparent) { grp.remove(cm.transparent); cm.transparent.geometry.dispose(); }
        meshesRef.current.delete(key);
        const [cxs, czs] = key.split(',').map(Number);
        w.unloadChunk(cxs, czs);
      }
    });

    // 3) Build/refresh queues
    const genQueue: string[] = [];
    const meshQueue: string[] = [];
    desired.forEach((key) => {
      const [cx, cz] = key.split(',').map(Number);
      const c = w.getChunk(cx, cz);
      if (!c || !c.generated) {
        genQueue.push(key);
      } else if (c.meshDirty) {
        meshQueue.push(key);
      }
    });
    // Sort by distance for both
    const distSq = (key: string) => {
      const [cx, cz] = key.split(',').map(Number);
      const dcx = cx - pcx, dcz = cz - pcz;
      return dcx * dcx + dcz * dcz;
    };
    genQueue.sort((a, b) => distSq(a) - distSq(b));
    meshQueue.sort((a, b) => distSq(a) - distSq(b));

    // 4) Generation budget
    const genStart = performance.now();
    while (genQueue.length && performance.now() - genStart < CHUNK_GEN_BUDGET_MS) {
      const key = genQueue.shift()!;
      const [cx, cz] = key.split(',').map(Number);
      const c = w.generateIfNeeded(cx, cz);
      // Mark neighbors dirty so their borders recompute against this new chunk
      const neighbors: Array<[number, number]> = [[cx - 1, cz], [cx + 1, cz], [cx, cz - 1], [cx, cz + 1]];
      neighbors.forEach(([ncx, ncz]) => {
        const nc = w.getChunk(ncx, ncz);
        if (nc && nc.generated) {
          nc.meshDirty = true;
          if (!meshQueue.includes(chunkKey(ncx, ncz))) meshQueue.push(chunkKey(ncx, ncz));
        }
      });
      c.meshDirty = true;
      meshQueue.push(key);
    }

    // 5) Mesh budget
    const meshStart = performance.now();
    while (meshQueue.length && performance.now() - meshStart < MESH_BUDGET_MS) {
      const key = meshQueue.shift()!;
      const [cx, cz] = key.split(',').map(Number);
      const c = w.getChunk(cx, cz);
      if (!c || !c.generated) continue;
      // Only mesh if all 4 neighbors are also generated, OR accept partial (with AIR border)
      // We prefer to mesh always (border faces vs ungenerated neighbors will treat them as AIR -> visible),
      // and remesh later when neighbors come in.
      remeshChunk(w, c, grp, meshesRef.current, opaqueMat, transpMat);
      c.meshDirty = false;
    }

    // 6) Stats
    let triangles = 0;
    let visible = 0;
    meshesRef.current.forEach((cm) => {
      if (cm.opaque) {
        const idx = cm.opaque.geometry.getIndex();
        if (idx) triangles += idx.count / 3;
        visible++;
      }
      if (cm.transparent) {
        const idx = cm.transparent.geometry.getIndex();
        if (idx) triangles += idx.count / 3;
      }
    });
    runtime.triangles = triangles;
    runtime.visibleChunks = visible;
    setStats({
      loadedChunks: w.chunks.size,
      visibleChunks: visible,
      triangles,
      queuedRemeshes: meshQueue.length + genQueue.length,
    });
  });

  return null;
}

function remeshChunk(
  world: World,
  chunk: Chunk,
  group: THREE.Group,
  meshes: Map<string, ChunkMeshes>,
  opaqueMat: THREE.ShaderMaterial,
  transpMat: THREE.ShaderMaterial,
) {
  const key = chunkKey(chunk.cx, chunk.cz);
  const result = meshChunk(chunk, world);
  let entry = meshes.get(key);
  if (!entry) {
    entry = {};
    meshes.set(key, entry);
  }

  // Opaque
  if (entry.opaque) {
    entry.opaque.geometry.dispose();
    group.remove(entry.opaque);
    entry.opaque = undefined;
  }
  if (result.opaque) {
    const m = new THREE.Mesh(result.opaque, opaqueMat);
    m.frustumCulled = true;
    group.add(m);
    entry.opaque = m;
  }

  // Transparent
  if (entry.transparent) {
    entry.transparent.geometry.dispose();
    group.remove(entry.transparent);
    entry.transparent = undefined;
  }
  if (result.transparent) {
    const m = new THREE.Mesh(result.transparent, transpMat);
    m.frustumCulled = true;
    m.renderOrder = 1;
    group.add(m);
    entry.transparent = m;
  }
}

function pregenerateSpawn(world: World) {
  // Generate a small initial area so the player has solid ground
  const r = 1;
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      world.generateIfNeeded(dx, dz);
    }
  }
  // Mark unused vars to avoid TS complaints
  void CHUNK_X; void CHUNK_Z;
}
