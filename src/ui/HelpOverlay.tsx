import { useStore } from '../hooks/useStore';
import { audio } from '../game/audio';

export function HelpOverlay() {
  const setPhase = useStore((s) => s.setPhase);
  const world = useStore((s) => s.world);

  return (
    <div className="overlay">
      <div className="panel help-panel">
        <h2>Controls</h2>
        <div className="help-grid">
          <div><kbd>W A S D</kbd></div><div>Move</div>
          <div><kbd>Space</kbd></div><div>Jump</div>
          <div><kbd>Shift</kbd></div><div>Sprint</div>
          <div><kbd>Mouse</kbd></div><div>Look around</div>
          <div><kbd>Left click</kbd></div><div>Mine block (hold)</div>
          <div><kbd>Right click</kbd></div><div>Place block</div>
          <div><kbd>1 — 9</kbd></div><div>Select hotbar slot</div>
          <div><kbd>Mouse wheel</kbd></div><div>Cycle hotbar</div>
          <div><kbd>E</kbd></div><div>Inventory</div>
          <div><kbd>C</kbd></div><div>Crafting</div>
          <div><kbd>Esc</kbd></div><div>Pause</div>
          <div><kbd>F3</kbd></div><div>Toggle debug overlay</div>
        </div>
        <div className="panel-buttons">
          <button className="primary" onClick={() => { audio.play('click'); setPhase(world ? 'paused' : 'title'); }}>Back</button>
        </div>
      </div>
    </div>
  );
}
