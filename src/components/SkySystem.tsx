import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../hooks/useStore';

export function SkySystem() {
  const { scene } = useThree();
  const timeOfDay = useStore((s) => s.timeOfDay);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const skyColorRef = useRef(new THREE.Color(0x9bd0ff));

  const colors = useMemo(() => ({
    skyDay: new THREE.Color(0x9bd0ff),
    skyDusk: new THREE.Color(0xff9b6e),
    skyNight: new THREE.Color(0x0a1226),
    tmp: new THREE.Color(),
  }), []);

  useEffect(() => {
    scene.background = skyColorRef.current.clone();
    scene.fog = new THREE.Fog(skyColorRef.current, 40, 160);

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

  useFrame(() => {
    const t = timeOfDay;
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle);

    if (sunRef.current) {
      sunRef.current.position.set(sunX * 120, sunY * 120, 40);
      sunRef.current.intensity = Math.max(0, sunY) * 0.9;
    }

    const dayFactor = Math.max(0, sunY);
    const dusk = Math.max(0, 1 - Math.abs(sunY) * 1.5) * (sunY > -0.2 ? 1 : 0);

    const sky = colors.tmp
      .copy(colors.skyNight)
      .lerp(colors.skyDay, dayFactor)
      .lerp(colors.skyDusk, dusk * 0.5);

    skyColorRef.current.copy(sky);
    if (scene.background instanceof THREE.Color) scene.background.copy(sky);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(sky);

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.2 + dayFactor * 0.3;
    }

    // Update voxel shader uniforms via the registry exposed by WorldSystem
    const getVoxelMats = (window as unknown as Record<string, unknown>).__voxelMats as
      (() => Array<THREE.ShaderMaterial | null>) | undefined;
    if (getVoxelMats) {
      const dayUniform = 0.15 + dayFactor * 0.85;
      for (const mat of getVoxelMats()) {
        if (mat && mat.uniforms) {
          mat.uniforms.uDayFactor.value = dayUniform;
          mat.uniforms.uFogColor.value.copy(sky);
          mat.uniforms.uFogNear.value = 40;
          mat.uniforms.uFogFar.value = 160;
        }
      }
    }
  });

  return null;
}
