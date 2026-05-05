import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas style={{ background: '#87CEEB' }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <mesh position={[0, 0, -5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#7CFC00" />
        </mesh>
      </Canvas>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '2rem',
        pointerEvents: 'none'
      }}>+</div>
    </div>
  );
}

export default App;
