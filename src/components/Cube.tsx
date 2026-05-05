import { useBox } from '@react-three/cannon';
import { useStore } from '../hooks/useStore';
import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Mesh } from 'three';

const textureColors: Record<string, string> = {
  dirt: '#8B4513',
  grass: '#228B22',
  glass: '#ADD8E6',
  wood: '#DEB887',
  log: '#654321',
};

export const Cube = ({ position, texture }: { position: [number, number, number]; texture: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    position,
  }));
  const [addCube, removeCube] = useStore((state) => [state.addCube, state.removeCube]);
  const color = textureColors[texture] || '#FFFFFF';

  return (
    <mesh
      onPointerMove={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const clickedFace = Math.floor(e.faceIndex! / 2);
        const [x, y, z] = position;
        if (e.altKey) {
          removeCube(x, y, z);
          return;
        }
        else if (clickedFace === 0) {
          addCube(x + 1, y, z);
          return;
        }
        else if (clickedFace === 1) {
          addCube(x - 1, y, z);
          return;
        }
        else if (clickedFace === 2) {
          addCube(x, y + 1, z);
          return;
        }
        else if (clickedFace === 3) {
          addCube(x, y - 1, z);
          return;
        }
        else if (clickedFace === 4) {
          addCube(x, y, z + 1);
          return;
        }
        else if (clickedFace === 5) {
          addCube(x, y, z - 1);
          return;
        }
      }}
      ref={ref}
    >
      <boxGeometry attach="geometry" />
      <meshStandardMaterial
        color={isHovered ? '#888888' : color}
        transparent={texture === 'glass'}
        opacity={texture === 'glass' ? 0.6 : 1}
        attach="material"
      />
    </mesh>
  );
};
