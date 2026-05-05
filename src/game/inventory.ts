import { STACK_SIZE } from '../config/constants';
import { BLOCK, BLOCKS } from '../engine/blocks';
import type { BlockId } from '../engine/blocks';

export interface ItemStack {
  itemId: BlockId; // reused as item id
  count: number;
}

export const HOTBAR_SLOTS = 9;
export const INVENTORY_ROWS = 3;
export const INVENTORY_COLS = 9;
export const TOTAL_SLOTS = HOTBAR_SLOTS + INVENTORY_ROWS * INVENTORY_COLS;

// Slot layout: indices 0..8 are hotbar, 9..35 are main inventory.

export type Slots = (ItemStack | null)[];

export function emptySlots(): Slots {
  return Array.from({ length: TOTAL_SLOTS }, () => null);
}

export function defaultCreativeSlots(): Slots {
  const s = emptySlots();
  // Pre-fill hotbar with common blocks for quick start
  s[0] = { itemId: BLOCK.GRASS, count: STACK_SIZE };
  s[1] = { itemId: BLOCK.DIRT, count: STACK_SIZE };
  s[2] = { itemId: BLOCK.STONE, count: STACK_SIZE };
  s[3] = { itemId: BLOCK.SAND, count: STACK_SIZE };
  s[4] = { itemId: BLOCK.LOG, count: STACK_SIZE };
  s[5] = { itemId: BLOCK.PLANKS, count: STACK_SIZE };
  s[6] = { itemId: BLOCK.GLASS, count: STACK_SIZE };
  s[7] = { itemId: BLOCK.LEAVES, count: STACK_SIZE };
  s[8] = { itemId: BLOCK.TORCH, count: STACK_SIZE };
  return s;
}

export function addItem(slots: Slots, itemId: BlockId, count: number): { slots: Slots; remainder: number } {
  if (itemId === BLOCK.AIR || count <= 0) return { slots, remainder: 0 };
  const out = slots.slice();
  let rem = count;
  // Pass 1: stack onto existing partial stacks
  for (let i = 0; i < out.length && rem > 0; i++) {
    const s = out[i];
    if (s && s.itemId === itemId && s.count < STACK_SIZE) {
      const space = STACK_SIZE - s.count;
      const add = Math.min(space, rem);
      out[i] = { itemId, count: s.count + add };
      rem -= add;
    }
  }
  // Pass 2: place into empty slots
  for (let i = 0; i < out.length && rem > 0; i++) {
    if (!out[i]) {
      const add = Math.min(STACK_SIZE, rem);
      out[i] = { itemId, count: add };
      rem -= add;
    }
  }
  return { slots: out, remainder: rem };
}

export function removeFromSlot(slots: Slots, index: number, count: number): Slots {
  if (index < 0 || index >= slots.length) return slots;
  const s = slots[index];
  if (!s) return slots;
  const out = slots.slice();
  const newCount = s.count - count;
  out[index] = newCount > 0 ? { itemId: s.itemId, count: newCount } : null;
  return out;
}

export function countItem(slots: Slots, itemId: BlockId): number {
  let total = 0;
  for (const s of slots) if (s && s.itemId === itemId) total += s.count;
  return total;
}

export function consumeItems(slots: Slots, itemId: BlockId, count: number): { slots: Slots; ok: boolean } {
  if (count <= 0) return { slots, ok: true };
  if (countItem(slots, itemId) < count) return { slots, ok: false };
  const out = slots.slice();
  let rem = count;
  for (let i = 0; i < out.length && rem > 0; i++) {
    const s = out[i];
    if (s && s.itemId === itemId) {
      const take = Math.min(s.count, rem);
      const newCount = s.count - take;
      out[i] = newCount > 0 ? { itemId, count: newCount } : null;
      rem -= take;
    }
  }
  return { slots: out, ok: true };
}

export function moveStack(slots: Slots, from: number, to: number): Slots {
  if (from === to) return slots;
  const out = slots.slice();
  const a = out[from];
  const b = out[to];
  if (!a) return out;
  if (!b) {
    out[to] = a;
    out[from] = null;
    return out;
  }
  if (a.itemId === b.itemId) {
    const space = STACK_SIZE - b.count;
    const move = Math.min(space, a.count);
    out[to] = { itemId: b.itemId, count: b.count + move };
    const newA = a.count - move;
    out[from] = newA > 0 ? { itemId: a.itemId, count: newA } : null;
    return out;
  }
  // Swap
  out[from] = b;
  out[to] = a;
  return out;
}

export function itemDisplayName(itemId: BlockId): string {
  return BLOCKS[itemId]?.name ?? '?';
}
