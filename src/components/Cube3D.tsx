import { useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Standard Face Colors[cite: 2]
const COLOR_MAP: Record<string, string> = {
  R: '#dc2626', // Red (Right)[cite: 2]
  L: '#ea580c', // Orange (Left)[cite: 2]
  U: '#f8fafc', // White (Up)[cite: 2]
  D: '#eab308', // Yellow (Down)[cite: 2]
  F: '#16a34a', // Green (Front)[cite: 2]
  B: '#2563eb', // Blue (Back)[cite: 2]
  CORE: '#1e293b' // Internal plastic core
};

// Map each 3D piece face to its index in cubejs 54-character string:
// U (0-8), R (9-17), F (18-26), D (27-35), L (36-44), B (45-53)[cite: 2]
function getStickerColors(x: number, y: number, z: number, state: string) {
  let cR = COLOR_MAP.CORE;
  let cL = COLOR_MAP.CORE;
  let cU = COLOR_MAP.CORE;
  let cD = COLOR_MAP.CORE;
  let cF = COLOR_MAP.CORE;
  let cB = COLOR_MAP.CORE;

  // Up (y = 1) -> Indices 0..8 (row: -z from -1 to 1, col: x from -1 to 1)
  if (y === 1) {
    const row = 1 - z;
    const col = x + 1;
    const idx = row * 3 + col;
    cU = COLOR_MAP[state[idx]] || COLOR_MAP.U;
  }

  // Down (y = -1) -> Indices 27..35 (row: z + 1, col: x + 1)
  if (y === -1) {
    const row = z + 1;
    const col = x + 1;
    const idx = 27 + row * 3 + col;
    cD = COLOR_MAP[state[idx]] || COLOR_MAP.D;
  }

  // Front (z === 1) -> Indices 18..26 (row: 1 - y, col: x + 1)
  if (z === 1) {
    const row = 1 - y;
    const col = x + 1;
    const idx = 18 + row * 3 + col;
    cF = COLOR_MAP[state[idx]] || COLOR_MAP.F;
  }

  // Back (z === -1) -> Indices 45..53 (row: 1 - y, col: 1 - x)
  if (z === -1) {
    const row = 1 - y;
    const col = 1 - x;
    const idx = 45 + row * 3 + col;
    cB = COLOR_MAP[state[idx]] || COLOR_MAP.B;
  }

  // Right (x === 1) -> Indices 9..17 (row: 1 - y, col: 1 - z)
  if (x === 1) {
    const row = 1 - y;
    const col = 1 - z;
    const idx = 9 + row * 3 + col;
    cR = COLOR_MAP[state[idx]] || COLOR_MAP.R;
  }

  // Left (x === -1) -> Indices 36..44 (row: 1 - y, col: z + 1)
  if (x === -1) {
    const row = 1 - y;
    const col = z + 1;
    const idx = 36 + row * 3 + col;
    cL = COLOR_MAP[state[idx]] || COLOR_MAP.L;
  }

  return [cR, cL, cU, cD, cF, cB];
}

interface PieceProps {
  position: [number, number, number];
  cubeState: string;
}

function Piece({ position, cubeState }: PieceProps) {
  const [x, y, z] = position;

  const materials = useMemo(() => {
    const colors = getStickerColors(x, y, z, cubeState);
    return colors.map(
      (color) =>
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.15,
          metalness: 0.05,
        })
    );
  }, [x, y, z, cubeState]);

  return (
    <mesh position={position} material={materials}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
    </mesh>
  );
}

function Controls({ resetTrigger }: { resetTrigger: number }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 8;
    controlsRef.current = controls;

    return () => {
      controls.dispose();
    };
  }, [camera, gl]);

  // Handle View Reset
  useEffect(() => {
    if (controlsRef.current) {
      camera.position.set(4, 4, 4);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [resetTrigger, camera]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
}

interface Cube3DProps {
  cubeState?: string;
  resetTrigger?: number;
}

const DEFAULT_SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

export default function Cube3D({ cubeState = DEFAULT_SOLVED_STATE, resetTrigger = 0 }: Cube3DProps) {
  const pieces = useMemo(() => {
    const coords: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          coords.push([x, y, z]);
        }
      }
    }
    return coords;
  }, []);

  return (
    <div style={{ width: '100%', height: '320px', position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: '#020617' }}>
      <Canvas camera={{ position: [4, 4, 4], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <group>
          {pieces.map((pos, idx) => (
            <Piece key={`${pos.join(',')}-${cubeState}`} position={pos} cubeState={cubeState} />
          ))}
        </group>
        <Controls resetTrigger={resetTrigger} />
      </Canvas>
    </div>
  );
}