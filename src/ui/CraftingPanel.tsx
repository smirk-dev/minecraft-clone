import { useStore } from '../hooks/useStore';
import { RECIPES, canCraft } from '../game/crafting';
import { BlockIcon } from './BlockIcon';
import { itemDisplayName, countItem } from '../game/inventory';
import { audio } from '../game/audio';

export function CraftingPanel() {
  const slots = useStore((s) => s.slots);
  const setPhase = useStore((s) => s.setPhase);
  const craft = useStore((s) => s.craft);

  const tryCraft = (recipeId: string) => {
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r) return;
    if (craft(r)) {
      audio.play('pickup');
    } else {
      audio.play('click');
    }
  };

  return (
    <div className="overlay">
      <div className="panel crafting-panel">
        <h2>Crafting</h2>
        <p className="panel-tip">Pick a recipe to craft. Inputs are taken from your inventory, output is placed back.</p>
        <div className="recipe-list">
          {RECIPES.map((r) => {
            const has = canCraft(slots, r);
            return (
              <div key={r.id} className={`recipe ${has ? '' : 'disabled'}`}>
                <div className="recipe-inputs">
                  {r.inputs.map((inp, i) => (
                    <div key={i} className="recipe-stack">
                      <BlockIcon itemId={inp.item} size={28} />
                      <span className="cnt">×{inp.count}</span>
                      <span className="have">have {countItem(slots, inp.item)}</span>
                    </div>
                  ))}
                </div>
                <span className="arrow">→</span>
                <div className="recipe-output">
                  <BlockIcon itemId={r.output.item} size={36} />
                  <div className="recipe-name">
                    <strong>{itemDisplayName(r.output.item)}</strong>
                    <span>×{r.output.count}</span>
                  </div>
                </div>
                <button
                  className="primary"
                  disabled={!has}
                  onClick={() => tryCraft(r.id)}
                >
                  Craft
                </button>
              </div>
            );
          })}
        </div>
        <div className="panel-buttons">
          <button onClick={() => { audio.play('click'); setPhase('inventory'); }}>Inventory</button>
          <button className="primary" onClick={() => { audio.play('click'); setPhase('playing'); }}>Close (C)</button>
        </div>
      </div>
    </div>
  );
}
