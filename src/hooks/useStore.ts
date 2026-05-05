import { create } from 'zustand';

const nanoid = () => Math.random().toString(36).slice(2);

type Texture = 'dirt' | 'grass' | 'glass' | 'wood' | 'log';

interface Cube {
  key: string;
  pos: [number, number, number];
  texture: Texture;
}

interface GameState {
  texture: Texture;
  cubes: Cube[];
  addCube: (x: number, y: number, z: number) => void;
  removeCube: (x: number, y: number, z: number) => void;
  setTexture: (texture: Texture) => void;
  saveWorld: () => void;
  resetWorld: () => void;
}

export const useStore = create<GameState>((set) => ({
  texture: 'dirt',
  cubes: [
    {
      key: nanoid(),
      pos: [0, 0.5, -3],
      texture: 'dirt',
    },
    {
      key: nanoid(),
      pos: [1, 0.5, -3],
      texture: 'grass',
    },
    {
      key: nanoid(),
      pos: [-1, 0.5, -3],
      texture: 'wood',
    },
  ],
  addCube: (x, y, z) => {
    set((state) => ({
      cubes: [
        ...state.cubes,
        {
          key: nanoid(),
          pos: [x, y, z],
          texture: state.texture,
        },
      ],
    }));
  },
  removeCube: (x, y, z) => {
    set((state) => ({
      cubes: state.cubes.filter((cube) => {
        const [cx, cy, cz] = cube.pos;
        return cx !== x || cy !== y || cz !== z;
      }),
    }));
  },
  setTexture: (texture) => {
    set(() => ({
      texture,
    }));
  },
  saveWorld: () => {
    set((state) => {
      localStorage.setItem('cubes', JSON.stringify(state.cubes));
      return state;
    });
  },
  resetWorld: () => {
    set(() => ({
      cubes: [],
    }));
  },
}));
