import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { WorldSystem } from './WorldSystem';
import { PlayerSystem } from './PlayerSystem';
import { SkySystem } from './SkySystem';
import { SelectionOutline } from './SelectionOutline';
import { useStore } from '../hooks/useStore';
import { audio } from '../game/audio';

function FpsTracker() {
  const lastT = useRef(performance.now());
  const acc = useRef(0);
  const frames = useRef(0);
  const setStats = useStore((s) => s.setStats);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const t = performance.now();
      const dt = (t - lastT.current) / 1000;
      lastT.current = t;
      acc.current += dt;
      frames.current++;
      if (acc.current >= 0.5) {
        const fps = frames.current / acc.current;
        setStats({ fps });
        acc.current = 0;
        frames.current = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setStats]);
  return null;
}

export function Game() {
  const audioVolume = useStore((s) => s.audioVolume);
  const audioEnabled = useStore((s) => s.audioEnabled);

  useEffect(() => {
    audio.enabled = audioEnabled;
    audio.setVolume(audioVolume);
  }, [audioVolume, audioEnabled]);

  return (
    <>
      <FpsTracker />
      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 75, near: 0.1, far: 300, position: [0, 60, 0] }}
        dpr={[1, 1.5]}
      >
        <SkySystem />
        <WorldSystem />
        <PlayerSystem />
        <SelectionOutline />
      </Canvas>
    </>
  );
}
