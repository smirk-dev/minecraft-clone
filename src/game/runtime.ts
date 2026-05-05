import * as THREE from 'three';

// Shared mutable runtime state outside React's render cycle.
// Engine components write/read this directly each frame.
export const runtime = {
  playerPos: { x: 0.5, y: 60, z: 0.5 },
  cameraDir: new THREE.Vector3(0, 0, -1),
  cameraOrigin: new THREE.Vector3(0, 60, 0),
  selection: null as { block: [number, number, number]; normal: [number, number, number] } | null,
  breakProgress: 0, // 0..1 if breaking
  onGround: false,
  // Frame metrics
  frame: 0,
  // Per-frame chunk pipeline counters
  triangles: 0,
  visibleChunks: 0,
};
