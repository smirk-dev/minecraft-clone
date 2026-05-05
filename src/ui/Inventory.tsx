import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { HOTBAR_SLOTS, INVENTORY_COLS, INVENTORY_ROWS, itemDisplayName } from '../game/inventory';
import { BlockIcon } from './BlockIcon';
import { audio } from '../game/audio';

export function Inventory() {
  const slots = useStore((s) => s.slots);
  const moveSlot = useStore((s) => s.moveSlot);
  const setPhase = useStore((s) => s.setPhase);
  const [picked, setPicked] = useState<number | null>(null);

  const onClickSlot = (idx: number) => {
    audio.play('click');
    if (picked === null) {
      if (slots[idx]) setPicked(idx);
    } else {
      moveSlot(picked, idx);
      setPicked(null);
    }
  };

  return (
    <div className="overlay">
      <div className="panel inventory-panel">
        <h2>Inventory</h2>
        <div className="inventory-grid">
          {Array.from({ length: INVENTORY_ROWS }, (_, row) => (
            <div key={row} className="inv-row">
              {Array.from({ length: INVENTORY_COLS }, (_, col) => {
                const idx = HOTBAR_SLOTS + row * INVENTORY_COLS + col;
                const s = slots[idx];
                return (
                  <button
                    key={idx}
                    className={`inv-slot ${picked === idx ? 'picked' : ''}`}
                    onClick={() => onClickSlot(idx)}
                    title={s ? `${itemDisplayName(s.itemId)} ×${s.count}` : ''}
                  >
                    {s ? (
                      <>
                        <BlockIcon itemId={s.itemId} size={36} />
                        {s.count > 1 && <span className="count">{s.count}</span>}
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <h3>Hotbar</h3>
        <div className="inv-row">
          {Array.from({ length: HOTBAR_SLOTS }, (_, col) => {
            const idx = col;
            const s = slots[idx];
            return (
              <button
                key={idx}
                className={`inv-slot ${picked === idx ? 'picked' : ''}`}
                onClick={() => onClickSlot(idx)}
                title={s ? `${itemDisplayName(s.itemId)} ×${s.count}` : ''}
              >
                {s ? (
                  <>
                    <BlockIcon itemId={s.itemId} size={36} />
                    {s.count > 1 && <span className="count">{s.count}</span>}
                  </>
                ) : null}
                <span className="hotkey">{col + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="panel-buttons">
          <button onClick={() => { audio.play('click'); setPhase('crafting'); }}>Open Crafting</button>
          <button className="primary" onClick={() => { audio.play('click'); setPhase('playing'); }}>Close (E)</button>
        </div>
      </div>
    </div>
  );
}
