import { useSphere } from '@react-three/cannon';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, Mesh } from 'three';
import { useKeyboard } from '../hooks/useKeyboard';

export const Player = () => {
  const { moveBackward, moveForward, moveRight, moveLeft, jump } = useKeyboard();
  const { camera } = useThree();
  const [ref, api] = useSphere<Mesh>(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [0, 1, 0],
  }));

  const pos = useRef([0, 0, 0]);
  useEffect(() => {
    api.position.subscribe((p) => (pos.current = p));
  }, [api.position]);

  const vel = useRef([0, 0, 0]);
  useEffect(() => {
    api.velocity.subscribe((v) => (vel.current = v));
  }, [api.velocity]);

  useFrame(() => {
    camera.position.copy(new Vector3(pos.current[0], pos.current[1], pos.current[2]));

    const direction = new Vector3();
    const frontVector = new Vector3(
      0,
      0,
      Number(moveBackward) - Number(moveForward)
    );
    const sideVector = new Vector3(
      Number(moveLeft) - Number(moveRight),
      0,
      0
    );

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(4)
      .applyEuler(camera.rotation);

    api.velocity.set(direction.x, vel.current[1], direction.z);

    if (jump && Math.abs(vel.current[1]) < 0.05) {
      api.velocity.set(vel.current[0], 4, vel.current[2]);
    }
  });

  return <mesh ref={ref} />;
};
