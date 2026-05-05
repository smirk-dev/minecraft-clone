import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../hooks/useStore';

export function SkySystem() {
  const { scene } = useThree();
  const timeOfDay = useStore((s) => s.timeOfDay);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const fogRef = useRef<THREE.Fog | null>(null);

  // Cache colors (no allocations per frame).
  const colors = useMemo(() => ({
    skyDay: new THREE.Color(0x9bd0ff),
    skyDusk: new THREE.Color(0xff9b6e),
    skyNight: new THREE.Color(0x0a1226),
    sunDay: new THREE.Color(0xffffff),
    sunDusk: new THREE.Color(0xffd1a3),
    sunNight: new THREE.Color(0x223355),
    tmp: new THREE.Color(),
  }), []);

  useEffect(() => {
    scene.background = new THREE.Color(0x9bd0ff);
    scene.fog = new THREE.Fog(0x9bd0ff, 30, 120);
    fogRef.current = scene.fog as THREE.Fog;
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(0, 100, 0);
    scene.add(sun);
    sunRef.current = sun;
    const amb = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(amb);
    ambientRef.current = amb;
    return () => {
      scene.remove(sun);
      scene.remove(amb);
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  // Update sky/fog/sun based on time of day.
  useFrame(() => {
    const t = timeOfDay; // 0..1; 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    const angle = t * Math.PI * 2 - Math.PI / 2; // -PI/2 at t=0 (sun below)
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle);

    if (sunRef.current) {
      sunRef.current.position.set(sunX * 100, sunY * 100, 30);
      sunRef.current.intensity = Math.max(0, sunY) * 0.9;
    }
    // Day factor: 0 at night, 1 at noon
    const dayFactor = Math.max(0, sunY); // simple
    const dusk = Math.max(0, 1 - Math.abs(sunY) * 1.5) * (sunY > -0.2 ? 1 : 0);

    // Sky color
    const sky = colors.tmp.copy(colors.skyNight)
      .lerp(colors.skyDay, dayFactor)
      .lerp(colors.skyDusk, dusk * 0.5);
    if (scene.background instanceof THREE.Color) scene.background.copy(sky);
    if (fogRef.current) fogRef.current.color.copy(sky);

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.2 + dayFactor * 0.3;
    }

    // Update voxel material uniforms (find them on world group)
    const grp = scene.getObjectByName('world');
    if (grp) {
      grp.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
        if (m && m.uniforms?.uDayFactor) {
          m.uniforms.uDayFactor.value = 0.15 + dayFactor * 0.85;
          m.uniforms.uFogColor.value.copy(sky);
        }
      });
    }
  });

  return null;
}
