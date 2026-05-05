import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../game/runtime';

export function SelectionOutline() {
  const { scene } = useThree();
  const lineRef = useRef<THREE.LineSegments | null>(null);
  const breakRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.001, 1.001, 1.001));
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1, transparent: true, opacity: 0.85, depthTest: true });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 2;
    lines.visible = false;
    scene.add(lines);
    lineRef.current = lines;

    // Break overlay quads (a translucent darkening cube that scales with progress)
    const breakGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const breakMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
    const breakMesh = new THREE.Mesh(breakGeo, breakMat);
    breakMesh.frustumCulled = false;
    breakMesh.visible = false;
    breakMesh.renderOrder = 3;
    scene.add(breakMesh);
    breakRef.current = breakMesh;

    return () => {
      scene.remove(lines);
      geo.dispose();
      mat.dispose();
      scene.remove(breakMesh);
      breakGeo.dispose();
      breakMat.dispose();
    };
  }, [scene]);

  useFrame(() => {
    const sel = runtime.selection;
    const lines = lineRef.current;
    const brk = breakRef.current;
    if (!lines || !brk) return;
    if (!sel) {
      lines.visible = false;
      brk.visible = false;
      return;
    }
    lines.visible = true;
    lines.position.set(sel.block[0] + 0.5, sel.block[1] + 0.5, sel.block[2] + 0.5);

    const p = runtime.breakProgress;
    if (p > 0.01) {
      brk.visible = true;
      brk.position.copy(lines.position);
      const m = brk.material as THREE.MeshBasicMaterial;
      m.opacity = Math.min(0.55, p * 0.55);
    } else {
      brk.visible = false;
    }
  });

  return null;
}
