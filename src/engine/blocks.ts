export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  LOG: 5,
  LEAVES: 6,
  PLANKS: 7,
  GLASS: 8,
  WATER: 9,
  TORCH: 10,
  COBBLESTONE: 11,
  BEDROCK: 12,
  STICK: 13,
  CRAFTING_TABLE: 14,
} as const;

export type BlockId = number;

export interface BlockDef {
  id: BlockId;
  name: string;
  solid: boolean;
  transparent: boolean;
  emissive: number; // 0..15 fake light
  hardness: number; // seconds to break by hand
  drops: BlockId; // item id dropped (could differ from block, e.g. stone -> cobblestone)
  // Atlas tile indices for [posX, negX, posY (top), negY (bottom), posZ, negZ]
  faces: [number, number, number, number, number, number];
  isItemOnly?: boolean; // sticks, etc (no block form)
  placeable?: boolean; // can be placed in world
}

// Texture atlas tile layout (tile = (col, row) -> index = row*16 + col)
const T = (col: number, row: number) => row * 16 + col;

const FACE_ALL = (t: number): [number, number, number, number, number, number] => [t, t, t, t, t, t];
const FACE_TOP_SIDE_BOTTOM = (
  side: number, top: number, bottom: number,
): [number, number, number, number, number, number] => [side, side, top, bottom, side, side];

export const BLOCKS: Record<BlockId, BlockDef> = {
  [BLOCK.AIR]: {
    id: BLOCK.AIR, name: 'Air', solid: false, transparent: true, emissive: 0,
    hardness: 0, drops: BLOCK.AIR, faces: FACE_ALL(0),
  },
  [BLOCK.GRASS]: {
    id: BLOCK.GRASS, name: 'Grass', solid: true, transparent: false, emissive: 0,
    hardness: 0.5, drops: BLOCK.DIRT, placeable: true,
    faces: FACE_TOP_SIDE_BOTTOM(T(1, 0), T(0, 0), T(2, 0)),
  },
  [BLOCK.DIRT]: {
    id: BLOCK.DIRT, name: 'Dirt', solid: true, transparent: false, emissive: 0,
    hardness: 0.5, drops: BLOCK.DIRT, placeable: true,
    faces: FACE_ALL(T(2, 0)),
  },
  [BLOCK.STONE]: {
    id: BLOCK.STONE, name: 'Stone', solid: true, transparent: false, emissive: 0,
    hardness: 1.5, drops: BLOCK.COBBLESTONE, placeable: true,
    faces: FACE_ALL(T(3, 0)),
  },
  [BLOCK.SAND]: {
    id: BLOCK.SAND, name: 'Sand', solid: true, transparent: false, emissive: 0,
    hardness: 0.4, drops: BLOCK.SAND, placeable: true,
    faces: FACE_ALL(T(4, 0)),
  },
  [BLOCK.LOG]: {
    id: BLOCK.LOG, name: 'Log', solid: true, transparent: false, emissive: 0,
    hardness: 1.0, drops: BLOCK.LOG, placeable: true,
    faces: FACE_TOP_SIDE_BOTTOM(T(5, 0), T(6, 0), T(6, 0)),
  },
  [BLOCK.LEAVES]: {
    id: BLOCK.LEAVES, name: 'Leaves', solid: true, transparent: true, emissive: 0,
    hardness: 0.2, drops: BLOCK.LEAVES, placeable: true,
    faces: FACE_ALL(T(7, 0)),
  },
  [BLOCK.PLANKS]: {
    id: BLOCK.PLANKS, name: 'Planks', solid: true, transparent: false, emissive: 0,
    hardness: 0.8, drops: BLOCK.PLANKS, placeable: true,
    faces: FACE_ALL(T(8, 0)),
  },
  [BLOCK.GLASS]: {
    id: BLOCK.GLASS, name: 'Glass', solid: true, transparent: true, emissive: 0,
    hardness: 0.3, drops: BLOCK.GLASS, placeable: true,
    faces: FACE_ALL(T(9, 0)),
  },
  [BLOCK.WATER]: {
    id: BLOCK.WATER, name: 'Water', solid: false, transparent: true, emissive: 0,
    hardness: 0, drops: BLOCK.AIR, placeable: false,
    faces: FACE_ALL(T(10, 0)),
  },
  [BLOCK.TORCH]: {
    id: BLOCK.TORCH, name: 'Torch', solid: true, transparent: true, emissive: 14,
    hardness: 0.1, drops: BLOCK.TORCH, placeable: true,
    faces: FACE_ALL(T(11, 0)),
  },
  [BLOCK.COBBLESTONE]: {
    id: BLOCK.COBBLESTONE, name: 'Cobblestone', solid: true, transparent: false, emissive: 0,
    hardness: 1.5, drops: BLOCK.COBBLESTONE, placeable: true,
    faces: FACE_ALL(T(12, 0)),
  },
  [BLOCK.BEDROCK]: {
    id: BLOCK.BEDROCK, name: 'Bedrock', solid: true, transparent: false, emissive: 0,
    hardness: -1, drops: BLOCK.AIR, placeable: false,
    faces: FACE_ALL(T(13, 0)),
  },
  [BLOCK.STICK]: {
    id: BLOCK.STICK, name: 'Stick', solid: false, transparent: true, emissive: 0,
    hardness: 0, drops: BLOCK.STICK, isItemOnly: true,
    faces: FACE_ALL(T(14, 0)),
  },
  [BLOCK.CRAFTING_TABLE]: {
    id: BLOCK.CRAFTING_TABLE, name: 'Crafting Table', solid: true, transparent: false, emissive: 0,
    hardness: 1.2, drops: BLOCK.CRAFTING_TABLE, placeable: true,
    faces: FACE_TOP_SIDE_BOTTOM(T(15, 0), T(8, 0), T(8, 0)),
  },
};

export function isSolid(id: BlockId): boolean {
  return BLOCKS[id]?.solid ?? false;
}
export function isTransparent(id: BlockId): boolean {
  return BLOCKS[id]?.transparent ?? true;
}
export function blockName(id: BlockId): string {
  return BLOCKS[id]?.name ?? 'Unknown';
}
