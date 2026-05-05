import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { BlockIcon } from './BlockIcon';
import { itemDisplayName } from '../game/inventory';
import { runtime } from '../game/runtime';

export function HUD() {
  const phase = useStore((s) => s.phase);
  const slots = useStore((s) => s.slots);
  const selected = useStore((s) => s.selectedHotbar);
  const stats = useStore((s) => s.stats);
  const showDebug = useStore((s) => s.showDebug);
  const timeOfDay = useStore((s) => s.timeOfDay);
  const mode = useStore((s) => s.mode);

  // Live position updater for debug overlay (read from runtime ref)
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  useEffect(() => {
    if (!showDebug || phase !== 'playing') return;
    const id = window.setInterval(() => {
      setPos({ x: runtime.playerPos.x, y: runtime.playerPos.y, z: runtime.playerPos.z });
    }, 200);
    return () => window.clearInterval(id);
  }, [showDebug, phase]);

  if (phase !== 'playing') return null;

  const hotbar = slots.slice(0, 9);
  const selectedSlot = hotbar[selected];

  const hh = Math.floor(timeOfDay * 24);
  const mm = Math.floor((timeOfDay * 24 - hh) * 60);
  const timeStr = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

  return (
    <>
      <div className="crosshair" />
      <div className="hotbar">
        {hotbar.map((s, i) => (
          <div key={i} className={`slot ${i === selected ? 'selected' : ''}`}>
            {s ? (
              <>
                <BlockIcon itemId={s.itemId} size={36} />
                {s.count > 1 && <span className="count">{s.count}</span>}
              </>
            ) : null}
            <span className="hotkey">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="hud-top-right">
        <div className="time-badge">
          <span className={`tod-icon ${isDay(timeOfDay) ? 'day' : 'night'}`} />
          {timeStr}
        </div>
        <div className="mode-badge">{mode === 'creative' ? 'Creative' : 'Survival'}</div>
      </div>
      {selectedSlot && (
        <div className="selection-name">{itemDisplayName(selectedSlot.itemId)}</div>
      )}
      {showDebug && (
        <div className="debug-overlay">
          <div>FPS: {stats.fps.toFixed(0)}</div>
          <div>Loaded chunks: {stats.loadedChunks}</div>
          <div>Visible chunks: {stats.visibleChunks}</div>
          <div>Triangles: {stats.triangles.toLocaleString()}</div>
          <div>Queued: {stats.queuedRemeshes}</div>
          <div>Pos: {pos.x.toFixed(1)}, {pos.y.toFixed(1)}, {pos.z.toFixed(1)}</div>
        </div>
      )}
    </>
  );
}

function isDay(t: number) {
  return t > 0.25 && t < 0.75;
}
