import { useStore } from '../hooks/useStore';
import { audio } from '../game/audio';

export function Settings() {
  const renderDistance = useStore((s) => s.renderDistance);
  const setRenderDistance = useStore((s) => s.setRenderDistance);
  const sensitivity = useStore((s) => s.mouseSensitivity);
  const setSensitivity = useStore((s) => s.setMouseSensitivity);
  const audioVolume = useStore((s) => s.audioVolume);
  const setAudioVolume = useStore((s) => s.setAudioVolume);
  const audioEnabled = useStore((s) => s.audioEnabled);
  const setAudioEnabled = useStore((s) => s.setAudioEnabled);
  const setPhase = useStore((s) => s.setPhase);
  const phase = useStore((s) => s.phase);

  return (
    <div className="overlay">
      <div className="panel settings-panel">
        <h2>Settings</h2>
        <div className="settings-row">
          <label>Render distance: <strong>{renderDistance}</strong></label>
          <input
            type="range" min={2} max={8} step={1}
            value={renderDistance}
            onChange={(e) => setRenderDistance(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="settings-row">
          <label>Mouse sensitivity: <strong>{(sensitivity * 1000).toFixed(2)}</strong></label>
          <input
            type="range" min={0.5} max={5} step={0.05}
            value={sensitivity * 1000}
            onChange={(e) => setSensitivity(parseFloat(e.target.value) / 1000)}
          />
        </div>
        <div className="settings-row">
          <label>Master volume: <strong>{Math.round(audioVolume * 100)}%</strong></label>
          <input
            type="range" min={0} max={1} step={0.01}
            value={audioVolume}
            onChange={(e) => { setAudioVolume(parseFloat(e.target.value)); audio.setVolume(parseFloat(e.target.value)); }}
          />
        </div>
        <div className="settings-row">
          <label>
            <input
              type="checkbox" checked={audioEnabled}
              onChange={(e) => { setAudioEnabled(e.target.checked); audio.enabled = e.target.checked; }}
            /> Audio enabled
          </label>
        </div>
        <div className="panel-buttons">
          <button
            className="primary"
            onClick={() => { audio.play('click'); setPhase(phase === 'settings' && useStore.getState().world ? 'paused' : 'title'); }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
