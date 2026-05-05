import { BLOCK } from '../engine/blocks';
import type { BlockId } from '../engine/blocks';
import { consumeItems, countItem, addItem } from './inventory';
import type { Slots } from './inventory';

export interface Recipe {
  id: string;
  name: string;
  inputs: Array<{ item: BlockId; count: number }>;
  output: { item: BlockId; count: number };
}

export const RECIPES: Recipe[] = [
  {
    id: 'planks',
    name: 'Planks (×4)',
    inputs: [{ item: BLOCK.LOG, count: 1 }],
    output: { item: BLOCK.PLANKS, count: 4 },
  },
  {
    id: 'sticks',
    name: 'Sticks (×4)',
    inputs: [{ item: BLOCK.PLANKS, count: 2 }],
    output: { item: BLOCK.STICK, count: 4 },
  },
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    inputs: [{ item: BLOCK.PLANKS, count: 4 }],
    output: { item: BLOCK.CRAFTING_TABLE, count: 1 },
  },
  {
    id: 'glass',
    name: 'Glass (×1) from sand',
    inputs: [{ item: BLOCK.SAND, count: 4 }],
    output: { item: BLOCK.GLASS, count: 1 },
  },
  {
    id: 'cobble_to_stone',
    name: 'Stone from cobble',
    inputs: [{ item: BLOCK.COBBLESTONE, count: 4 }],
    output: { item: BLOCK.STONE, count: 4 },
  },
  {
    id: 'torch',
    name: 'Torch (×4)',
    inputs: [
      { item: BLOCK.STICK, count: 1 },
      { item: BLOCK.LOG, count: 1 },
    ],
    output: { item: BLOCK.TORCH, count: 4 },
  },
];

export function canCraft(slots: Slots, recipe: Recipe): boolean {
  for (const inp of recipe.inputs) {
    if (countItem(slots, inp.item) < inp.count) return false;
  }
  return true;
}

export function craft(slots: Slots, recipe: Recipe): { slots: Slots; ok: boolean } {
  if (!canCraft(slots, recipe)) return { slots, ok: false };
  let working = slots;
  for (const inp of recipe.inputs) {
    const r = consumeItems(working, inp.item, inp.count);
    if (!r.ok) return { slots, ok: false };
    working = r.slots;
  }
  const added = addItem(working, recipe.output.item, recipe.output.count);
  return { slots: added.slots, ok: added.remainder === 0 };
}
