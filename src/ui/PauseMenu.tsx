import { useStore } from '../hooks/useStore';
import { audio } from '../game/audio';

export function PauseMenu() {
  const setPhase = useStore((s) => s.setPhase);
  const quitToTitle = useStore((s) => s.quitToTitle);

  return (
    <div className="overlay">
      <div className="panel">
        <h2>Paused</h2>
        <div className="panel-buttons">
          <button onClick={() => { audio.play('click'); setPhase('playing'); }} className="primary">Resume</button>
          <button onClick={() => { audio.play('click'); setPhase('inventory'); }}>Inventory</button>
          <button onClick={() => { audio.play('click'); setPhase('crafting'); }}>Crafting</button>
          <button onClick={() => { audio.play('click'); setPhase('settings'); }}>Settings</button>
          <button onClick={() => { audio.play('click'); setPhase('help'); }}>Controls</button>
          <button onClick={() => { audio.play('click'); quitToTitle(); }}>Quit to Title</button>
        </div>
        <p className="panel-tip">Click outside or press Esc to resume after closing this menu.</p>
      </div>
    </div>
  );
}
