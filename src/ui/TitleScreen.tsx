import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { audio } from '../game/audio';

export function TitleScreen() {
  const startNewGame = useStore((s) => s.startNewGame);
  const setPhase = useStore((s) => s.setPhase);
  const [seedInput, setSeedInput] = useState('');

  const start = (mode: 'creative' | 'survival') => {
    audio.init();
    audio.play('click');
    const parsed = seedInput.trim() === '' ? undefined : Math.abs(hashString(seedInput));
    startNewGame(mode, parsed);
  };

  return (
    <div className="title-screen">
      <h1 className="title">VOXEL<span>CRAFT</span></h1>
      <p className="subtitle">A Minecraft-inspired sandbox</p>

      <div className="title-form">
        <label>
          <span>Seed (optional)</span>
          <input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder="random"
          />
        </label>
      </div>

      <div className="title-buttons">
        <button onClick={() => start('creative')} className="primary">Play Creative</button>
        <button onClick={() => start('survival')}>Play Survival</button>
        <button onClick={() => { audio.init(); audio.play('click'); setPhase('help'); }}>Controls</button>
        <button onClick={() => { audio.init(); audio.play('click'); setPhase('settings'); }}>Settings</button>
      </div>

      <p className="title-tip">Click the world to lock the cursor. Press Esc to pause.</p>
    </div>
  );
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
