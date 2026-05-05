import { create } from 'zustand';
import type { BlockId } from '../engine/blocks';
import { World } from '../engine/world';
import { defaultCreativeSlots, emptySlots, addItem as addItemFn, removeFromSlot, moveStack } from '../game/inventory';
import type { Slots } from '../game/inventory';
import { craft as craftFn } from '../game/crafting';
import type { Recipe } from '../game/crafting';
import { RENDER_DISTANCE_DEFAULT } from '../config/constants';

export type GamePhase = 'title' | 'playing' | 'paused' | 'inventory' | 'crafting' | 'help' | 'settings';
export type GameMode = 'creative' | 'survival';

interface DebugStats {
  fps: number;
  loadedChunks: number;
  visibleChunks: number;
  triangles: number;
  queuedRemeshes: number;
}

interface GameState {
  phase: GamePhase;
  mode: GameMode;
  world: World | null;
  seed: number;
  slots: Slots;
  selectedHotbar: number; // 0..8
  timeOfDay: number; // 0..1
  renderDistance: number;
  showDebug: boolean;
  audioVolume: number;
  audioEnabled: boolean;
  mouseSensitivity: number;
  stats: DebugStats;

  setPhase: (p: GamePhase) => void;
  startNewGame: (mode: GameMode, seed?: number) => void;
  resumeGame: () => void;
  quitToTitle: () => void;
  setSelectedHotbar: (i: number) => void;
  setSlots: (s: Slots) => void;
  pickupItem: (id: BlockId, count: number) => number; // returns remainder
  consumeFromHotbar: (count?: number) => boolean;
  moveSlot: (from: number, to: number) => void;
  craft: (r: Recipe) => boolean;
  setTimeOfDay: (t: number) => void;
  setRenderDistance: (n: number) => void;
  toggleDebug: () => void;
  setAudioVolume: (v: number) => void;
  setAudioEnabled: (b: boolean) => void;
  setMouseSensitivity: (n: number) => void;
  setStats: (s: Partial<DebugStats>) => void;
}

export const useStore = create<GameState>((set, get) => ({
  phase: 'title',
  mode: 'creative',
  world: null,
  seed: Math.floor(Math.random() * 1_000_000),
  slots: emptySlots(),
  selectedHotbar: 0,
  timeOfDay: 0.3, // morning
  renderDistance: RENDER_DISTANCE_DEFAULT,
  showDebug: false,
  audioVolume: 0.5,
  audioEnabled: true,
  mouseSensitivity: 0.0025,
  stats: { fps: 0, loadedChunks: 0, visibleChunks: 0, triangles: 0, queuedRemeshes: 0 },

  setPhase: (p) => set({ phase: p }),
  startNewGame: (mode, seed) => {
    const useSeed = seed ?? Math.floor(Math.random() * 1_000_000);
    set({
      phase: 'playing',
      mode,
      seed: useSeed,
      world: new World(useSeed),
      slots: mode === 'creative' ? defaultCreativeSlots() : emptySlots(),
      selectedHotbar: 0,
      timeOfDay: 0.3,
    });
  },
  resumeGame: () => set({ phase: 'playing' }),
  quitToTitle: () => set({ phase: 'title', world: null }),
  setSelectedHotbar: (i) => set({ selectedHotbar: Math.max(0, Math.min(8, i)) }),
  setSlots: (s) => set({ slots: s }),
  pickupItem: (id, count) => {
    const { slots } = get();
    const r = addItemFn(slots, id, count);
    set({ slots: r.slots });
    return r.remainder;
  },
  consumeFromHotbar: (count = 1) => {
    const { slots, selectedHotbar, mode } = get();
    if (mode === 'creative') return true;
    const s = slots[selectedHotbar];
    if (!s || s.count < count) return false;
    set({ slots: removeFromSlot(slots, selectedHotbar, count) });
    return true;
  },
  moveSlot: (from, to) => {
    const { slots } = get();
    set({ slots: moveStack(slots, from, to) });
  },
  craft: (r) => {
    const { slots } = get();
    const result = craftFn(slots, r);
    if (result.ok) set({ slots: result.slots });
    return result.ok;
  },
  setTimeOfDay: (t) => set({ timeOfDay: ((t % 1) + 1) % 1 }),
  setRenderDistance: (n) => set({ renderDistance: Math.max(2, Math.min(8, n)) }),
  toggleDebug: () => set((s) => ({ showDebug: !s.showDebug })),
  setAudioVolume: (v) => set({ audioVolume: Math.max(0, Math.min(1, v)) }),
  setAudioEnabled: (b) => set({ audioEnabled: b }),
  setMouseSensitivity: (n) => set({ mouseSensitivity: Math.max(0.0005, Math.min(0.01, n)) }),
  setStats: (s) => set((cur) => ({ stats: { ...cur.stats, ...s } })),
}));
