import { usePlane } from '@react-three/cannon';
import type { Mesh } from 'three';

export const Ground = () => {
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.5, 0],
  }));

  return (
    <mesh ref={ref}>
      <planeGeometry attach="geometry" args={[100, 100]} />
      <meshStandardMaterial attach="material" color="#7CFC00" />
    </mesh>
  );
};
