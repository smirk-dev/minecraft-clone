import { useStore } from './hooks/useStore';
import { Game } from './components/Game';
import { TitleScreen } from './ui/TitleScreen';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { Inventory } from './ui/Inventory';
import { CraftingPanel } from './ui/CraftingPanel';
import { Settings } from './ui/Settings';
import { HelpOverlay } from './ui/HelpOverlay';

function App() {
  const phase = useStore((s) => s.phase);
  const world = useStore((s) => s.world);
  const stats = useStore((s) => s.stats);

  // The Game component is mounted whenever a world exists; this preserves chunks and meshes
  // across pause/inventory/crafting screens.
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {world && <Game />}
      {!world && phase === 'title' && <TitleScreen />}
      {!world && phase === 'help' && <HelpOverlay />}
      {!world && phase === 'settings' && <Settings />}

      {world && phase === 'playing' && stats.loadedChunks < 4 && (
        <div className="loading-banner">Generating world…</div>
      )}

      {world && <HUD />}
      {world && phase === 'paused' && <PauseMenu />}
      {world && phase === 'inventory' && <Inventory />}
      {world && phase === 'crafting' && <CraftingPanel />}
      {world && phase === 'settings' && <Settings />}
      {world && phase === 'help' && <HelpOverlay />}
    </div>
  );
}

export default App;
