import { useMemo } from 'react'
import * as THREE from 'three'
import { grimeTexture, floorTexture, bloodTexture, webTexture } from './textures'
import { Text } from '@react-three/drei'

type V3 = [number, number, number]
const H = 2.8
const T = 0.2
const PI = Math.PI

const FLOOR = floorTexture()
const WALL = grimeTexture('#34373c', 40, 8)
const CEIL = grimeTexture('#1c1e22', 50, 4)
const CELLAR_WALL = grimeTexture('#212328', 60, 12)
const CELLAR_FLOOR = grimeTexture('#131518', 50, 14)
const HALL_WALL = grimeTexture('#29262d', 55, 10)
const RITUAL_WALL = grimeTexture('#30202a', 55, 10)
const BLOOD_POOL = bloodTexture('pool')
const BLOOD_POOL_2 = bloodTexture('pool')
const BLOOD_SPLAT = bloodTexture('wall')
const BLOOD_SPLAT_2 = bloodTexture('wall')
const BLOOD_SMEAR = bloodTexture('smear')
const WEB = webTexture()

function useTiled(tex: THREE.Texture, rx: number, ry: number) {
  return useMemo(() => {
    const t = tex.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rx, ry)
    t.needsUpdate = true
    return t
  }, [tex, rx, ry])
}

function Slab({ pos, size, tex, tint = '#ffffff' }: { pos: V3; size: V3; tex: THREE.Texture; tint?: string }) {
  const [sx, sy, sz] = size
  const map = useTiled(tex, Math.max(0.5, Math.max(sx, sz) / 2.5), Math.max(0.3, sy / 2.5))
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial map={map} color={tint} roughness={0.95} />
    </mesh>
  )
}

function Flat({ pos, size, rot, tex, tint = '#ffffff' }: { pos: V3; size: [number, number]; rot: V3; tex: THREE.Texture; tint?: string }) {
  const map = useTiled(tex, size[0] / 2.5, size[1] / 2.5)
  return (
    <mesh position={pos} rotation={rot} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} color={tint} roughness={0.9} />
    </mesh>
  )
}

function Decal({ pos, rot, size, tex }: { pos: V3; rot: V3; size: number; tex: THREE.Texture }) {
  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} transparent roughness={0.25} depthWrite={false} polygonOffset polygonOffsetFactor={-2} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Web({ pos, rotY = 0, flip = false, size = 1.4 }: { pos: V3; rotY?: number; flip?: boolean; size?: number }) {
  return (
    <group position={pos} rotation-y={rotY}>
      <mesh position={[(flip ? -1 : 1) * size / 2, -size / 2, 0]} scale-x={flip ? -1 : 1}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={WEB} transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} roughness={1} />
      </mesh>
    </group>
  )
}

// All doorway openings are 1.4m wide and 2.2m tall.
// This is a wall running along Z, with an opening at centerZ.
function DoorwayX({ x, zMin, zMax, centerZ, tex }: { x: number; zMin: number; zMax: number; centerZ: number; tex: THREE.Texture }) {
  const half = 0.7
  const leftLength = centerZ - half - zMin
  const rightLength = zMax - (centerZ + half)
  return (
    <group>
      {leftLength > 0 && <Slab pos={[x, H / 2, (zMin + centerZ - half) / 2]} size={[T, H, leftLength]} tex={tex} />}
      {rightLength > 0 && <Slab pos={[x, H / 2, (centerZ + half + zMax) / 2]} size={[T, H, rightLength]} tex={tex} />}
      <Slab pos={[x, 2.2 + (H - 2.2) / 2, centerZ]} size={[T, H - 2.2, 1.4]} tex={tex} />
    </group>
  )
}

// Wall running along X, with an opening at centerX.
function DoorwayZ({ z, xMin, xMax, centerX, tex }: { z: number; xMin: number; xMax: number; centerX: number; tex: THREE.Texture }) {
  const half = 0.7
  const leftLength = centerX - half - xMin
  const rightLength = xMax - (centerX + half)
  return (
    <group>
      {leftLength > 0 && <Slab pos={[(xMin + centerX - half) / 2, H / 2, z]} size={[leftLength, H, T]} tex={tex} />}
      {rightLength > 0 && <Slab pos={[(centerX + half + xMax) / 2, H / 2, z]} size={[rightLength, H, T]} tex={tex} />}
      <Slab pos={[centerX, 2.2 + (H - 2.2) / 2, z]} size={[1.4, H - 2.2, T]} tex={tex} />
    </group>
  )
}

function Wardrobe({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const wood = '#291b15'
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.08, 0]}><boxGeometry args={[1.4, 2.16, 0.65]} /><meshStandardMaterial color={wood} roughness={0.95} /></mesh>
      <mesh position={[0, 1.08, 0.333]}><planeGeometry args={[1.22, 1.93]} /><meshBasicMaterial color="#030203" /></mesh>
      <group position={[-0.68, 0, 0.35]} rotation-y={0.42}>
        <mesh position={[0.34, 1.08, 0]}><boxGeometry args={[0.68, 2.05, 0.055]} /><meshStandardMaterial color={wood} /></mesh>
        <mesh position={[0.59, 1.08, 0.065]}><sphereGeometry args={[0.034, 10, 10]} /><meshStandardMaterial color="#8b714b" metalness={0.7} /></mesh>
      </group>
      <mesh position={[0.34, 1.08, 0.36]}><boxGeometry args={[0.68, 2.05, 0.055]} /><meshStandardMaterial color={wood} /></mesh>
      <mesh position={[0.12, 1.08, 0.42]}><sphereGeometry args={[0.034, 10, 10]} /><meshStandardMaterial color="#8b714b" metalness={0.7} /></mesh>
      <mesh position={[0, 2.19, 0]}><boxGeometry args={[1.55, 0.12, 0.77]} /><meshStandardMaterial color="#120c0b" /></mesh>
    </group>
  )
}

function BrokenMirror({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const cracks: [number, number][][] = [
    [[-0.27, 0.51], [0.08, 0.12]], [[0.08, 0.12], [0.31, -0.42]],
    [[0.08, 0.12], [-0.18, -0.53]], [[0.08, 0.12], [0.33, 0.37]],
  ]
  return (
    <group position={position} rotation-y={rotation}>
      <mesh><boxGeometry args={[1.02, 1.55, 0.1]} /><meshStandardMaterial color="#21150f" /></mesh>
      <mesh position={[0, 0, 0.056]}><planeGeometry args={[0.83, 1.35]} /><meshStandardMaterial color="#52606a" metalness={0.7} roughness={0.28} /></mesh>
      {cracks.map(([a, b], i) => {
        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        return (
          <mesh key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.064]} rotation-z={-Math.atan2(dx, dy)}>
            <boxGeometry args={[0.012, Math.hypot(dx, dy), 0.003]} /><meshBasicMaterial color="#0a1015" />
          </mesh>
        )
      })}
    </group>
  )
}

function Portrait({ position, rotation = 0, tilt = 0.12 }: { position: V3; rotation?: number; tilt?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <group rotation-z={tilt}>
        <mesh><boxGeometry args={[0.8, 1.05, 0.08]} /><meshStandardMaterial color="#3d2918" /></mesh>
        <mesh position={[0, 0, 0.046]}><planeGeometry args={[0.64, 0.88]} /><meshStandardMaterial color="#17191c" /></mesh>
        <mesh position={[0, -0.22, 0.053]}><circleGeometry args={[0.23, 20]} /><meshBasicMaterial color="#08090b" /></mesh>
        <mesh position={[0, 0.12, 0.054]}><circleGeometry args={[0.15, 20]} /><meshBasicMaterial color="#08090b" /></mesh>
        {[-0.055, 0.055].map(x => (
          <mesh key={x} position={[x, 0.13, 0.058]}><sphereGeometry args={[0.012, 8, 8]} /><meshBasicMaterial color="#c5b9a3" /></mesh>
        ))}
      </group>
    </group>
  )
}

function FallenChair({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <group position={[0, 0.28, 0]} rotation-z={PI / 2.6}>
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.65, 0.1, 0.65]} /><meshStandardMaterial color="#302019" /></mesh>
        <mesh position={[0, 1.02, -0.27]}><boxGeometry args={[0.65, 1.12, 0.09]} /><meshStandardMaterial color="#302019" /></mesh>
        {[-0.24, 0.24].flatMap(x => [-0.24, 0.24].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.19, z]}><boxGeometry args={[0.09, 0.4, 0.09]} /><meshStandardMaterial color="#302019" /></mesh>
        )))}
      </group>
    </group>
  )
}

function Bookshelf({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const books = [
    [-0.48, 0.55, '#40332c'], [-0.32, 0.55, '#352a30'], [-0.16, 0.55, '#443528'],
    [0.22, 1.15, '#302e37'], [0.38, 1.15, '#4a302d'],
    [-0.38, 1.75, '#342e29'], [-0.22, 1.75, '#45372f'],
  ] as const
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.1, -0.19]}><boxGeometry args={[1.35, 2.2, 0.08]} /><meshStandardMaterial color="#211611" /></mesh>
      {[-0.65, 0.65].map(x => <mesh key={x} position={[x, 1.1, 0]}><boxGeometry args={[0.09, 2.2, 0.48]} /><meshStandardMaterial color="#211611" /></mesh>)}
      {[0.12, 0.72, 1.32, 1.92, 2.15].map(y => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[1.35, 0.08, 0.48]} /><meshStandardMaterial color="#211611" /></mesh>)}
      {books.map(([x, y, color], i) => <mesh key={i} position={[x, y, 0.04]} rotation-z={i === 2 ? 0.15 : 0}><boxGeometry args={[0.12, 0.36, 0.32]} /><meshStandardMaterial color={color} /></mesh>)}
    </group>
  )
}

function RitualAltar() {
  return (
    <group position={[5.25, 0, 4.55]}>
      <mesh position={[0, 0.48, 0]}><boxGeometry args={[1.2, 0.96, 0.75]} /><meshStandardMaterial color="#20191c" roughness={1} /></mesh>
      <mesh position={[0, 0.99, 0]}><boxGeometry args={[1.4, 0.08, 0.95]} /><meshStandardMaterial color="#4b252e" roughness={0.9} /></mesh>
      <mesh position={[0, 1.045, 0]} rotation-x={-PI / 2}>
        <ringGeometry args={[0.17, 0.21, 32]} />
        <meshBasicMaterial color="#a32e45" side={THREE.DoubleSide} />
      </mesh>
      {[-0.45, 0.45].map(x => <mesh key={x} position={[x, 1.11, 0]}><cylinderGeometry args={[0.04, 0.05, 0.2, 8]} /><meshStandardMaterial color="#ddd1b6" /></mesh>)}
    </group>
  )
}


function RitualRoomSign() {
  return (
    <group
      position={[3.37, 2.48, 4.5]}
      rotation-y={-Math.PI / 2}
    >
      {/* Dark wooden sign */}
      <mesh>
        <boxGeometry args={[1.65, 0.34, 0.07]} />
        <meshStandardMaterial
          color="#24120f"
          roughness={0.85}
        />
      </mesh>

      {/* Decorative border */}
      <mesh position={[0, 0, 0.041]}>
        <boxGeometry args={[1.58, 0.27, 0.008]} />
        <meshStandardMaterial color="#704431" />
      </mesh>

      {/* Inner dark panel */}
      <mesh position={[0, 0, 0.048]}>
        <boxGeometry args={[1.51, 0.22, 0.008]} />
        <meshStandardMaterial color="#160b0e" />
      </mesh>

      {/* Glowing text */}
    <Text
    position={[0, 0, 0.058]}
    font="/fonts/Creepster-Regular.ttf"
    fontSize={0.19}
    color="#c93646"
    anchorX="center"
    anchorY="middle"
    letterSpacing={0.025}
    maxWidth={1.45}
    >
    RITUAL ROOM
    <meshBasicMaterial
        color="#c93646"
        toneMapped={false}
    />
    </Text>
    </group>
  )
}


export default function House() {
  return (
    <group>
      {/* PARLOR: x -3.5..3.5, z -3..3 */}
      <Flat pos={[0, 0, 0]} size={[7, 6]} rot={[-PI / 2, 0, 0]} tex={FLOOR} tint="#7a8088" />
      <Flat pos={[0, H, 0]} size={[7, 6]} rot={[PI / 2, 0, 0]} tex={CEIL} />
      <Slab pos={[0, H / 2, -3]} size={[7, H, T]} tex={WALL} />
      <Slab pos={[-3.5, H / 2, 0]} size={[T, H, 6]} tex={WALL} />
      <DoorwayX x={3.5} zMin={-3} zMax={3} centerZ={0} tex={WALL} />
      <DoorwayZ z={3} xMin={-3.5} xMax={3.5} centerX={-2} tex={WALL} />

      {/* CELLAR: x 3.5..6.5, z -2..2 */}
      <Flat pos={[5, 0, 0]} size={[3, 4]} rot={[-PI / 2, 0, 0]} tex={CELLAR_FLOOR} />
      <Flat pos={[5, H, 0]} size={[3, 4]} rot={[PI / 2, 0, 0]} tex={CEIL} tint="#666666" />
      <Slab pos={[5, H / 2, -2]} size={[3, H, T]} tex={CELLAR_WALL} />
      <Slab pos={[5, H / 2, 2]} size={[3, H, T]} tex={CELLAR_WALL} />
      <Slab pos={[6.5, H / 2, 0]} size={[T, H, 4]} tex={CELLAR_WALL} />

      {/* HAUNTED HALLWAY: x -3.5..3.5, z 3..6 */}
      <Flat pos={[0, 0, 4.5]} size={[7, 3]} rot={[-PI / 2, 0, 0]} tex={FLOOR} tint="#4b4147" />
      <Flat pos={[0, H, 4.5]} size={[7, 3]} rot={[PI / 2, 0, 0]} tex={CEIL} />
      {/* OPEN PASSAGE TO THE FORGOTTEN BEDROOM */}

{/* Wall below the opening */}
<Slab
  pos={[-3.5, H / 2, 3.275]}
  size={[T, H, 0.55]}
  tex={HALL_WALL}
/>

{/* Wall above the opening */}
<Slab
  pos={[-3.5, H / 2, 5.725]}
  size={[T, H, 0.55]}
  tex={HALL_WALL}
/>

{/* Upper wall above the walk-through opening */}
<Slab
  pos={[-3.5, 2.5, 4.5]}
  size={[T, 0.6, 1.9]}
  tex={HALL_WALL}
/>
      <DoorwayX x={3.5} zMin={3} zMax={6} centerZ={4.5} tex={HALL_WALL} />
      <Slab pos={[0, H / 2, 6]} size={[7, H, T]} tex={HALL_WALL} />
      {/* A sealed exit at the end of the hallway */}
      <Slab pos={[0, 1.05, 5.88]} size={[1.1, 2.1, 0.07]} tex={FLOOR} tint="#41312f" />
      <Decal pos={[0, 1.2, 5.825]} rot={[0, PI, 0]} size={1.35} tex={BLOOD_SMEAR} />


    {/* ============================================= */}
{/* FORGOTTEN BEDROOM CONNECTING CORRIDOR */}
{/* ============================================= */}

{/* Wooden corridor floor */}
<Flat
  pos={[-4.85, 0.008, 4.5]}
  size={[2.7, 1.9]}
  rot={[-PI / 2, 0, 0]}
  tex={FLOOR}
  tint="#705b4b"
/>

{/* Corridor ceiling */}
<Flat
  pos={[-4.85, H, 4.5]}
  size={[2.7, 1.9]}
  rot={[PI / 2, 0, 0]}
  tex={CEIL}
  tint="#8d796d"
/>

{/* Corridor wall on one side */}
<Slab
  pos={[-4.85, H / 2, 3.55]}
  size={[2.7, H, T]}
  tex={HALL_WALL}
  tint="#807063"
/>

{/* Corridor wall on the other side */}
<Slab
  pos={[-4.85, H / 2, 5.45]}
  size={[2.7, H, T]}
  tex={HALL_WALL}
  tint="#807063"
/>

{/* Wooden wall trim */}
{[3.55, 5.45].map((z) => (
  <mesh
    key={z}
    position={[-4.85, 0.18, z]}
  >
    <boxGeometry args={[2.7, 0.36, 0.08]} />
    <meshStandardMaterial
      color="#36231b"
      roughness={0.85}
    />
  </mesh>
))}

{/* Soft light guiding players to the bedroom */}
<pointLight
  position={[-4.85, 2.25, 4.5]}
  color="#ffc58c"
  intensity={2.2}
  distance={5}
/>
      {/* RITUAL ROOM: x 3.5..6.5, z 3..6 */}
      <Flat pos={[5, 0, 4.5]} size={[3, 3]} rot={[-PI / 2, 0, 0]} tex={CELLAR_FLOOR} tint="#6b4b57" />
      <Flat pos={[5, H, 4.5]} size={[3, 3]} rot={[PI / 2, 0, 0]} tex={CEIL} />
      <Slab pos={[5, H / 2, 3]} size={[3, H, T]} tex={RITUAL_WALL} />
      <Slab pos={[5, H / 2, 6]} size={[3, H, T]} tex={RITUAL_WALL} />
      <Slab pos={[6.5, H / 2, 4.5]} size={[T, H, 3]} tex={RITUAL_WALL} />

      {/* SÉANCE TABLE */}
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.9, 0.9, 0.8, 24]} /><meshStandardMaterial color="#1a1c1f" roughness={0.8} /></mesh>
      <mesh position={[0, 0.81, 0]}><cylinderGeometry args={[0.96, 0.96, 0.03, 24]} /><meshStandardMaterial color="#2a0508" roughness={0.6} /></mesh>

      {/* BLOOD AND COBWEBS */}
      <Decal pos={[1.5, 0.012, 1]} rot={[-PI / 2, 0, 0]} size={2.4} tex={BLOOD_POOL} />
      <Decal pos={[-1.8, 0.012, -1.4]} rot={[-PI / 2, 0, 0]} size={1.6} tex={BLOOD_POOL_2} />
      <Decal pos={[5, 0.012, -0.3]} rot={[-PI / 2, 0, 0]} size={1.8} tex={BLOOD_POOL} />
      <Decal pos={[4.9, 0.012, 5.3]} rot={[-PI / 2, 0, 0]} size={1.5} tex={BLOOD_POOL_2} />
      <Decal pos={[-3.39, 1.55, -0.8]} rot={[0, PI / 2, 0]} size={2.2} tex={BLOOD_SPLAT} />
      <Decal pos={[1.9, 1.6, -2.89]} rot={[0, 0, 0]} size={2} tex={BLOOD_SPLAT_2} />
      <Web pos={[-3.38, H - 0.01, -2.88]} size={1.6} />
      <Web pos={[3.38, H - 0.01, -2.88]} flip size={1.3} />
      <Web pos={[-3.38, H - 0.01, 5.88]} rotY={PI} flip size={1.4} />
      <Web pos={[6.38, H - 0.01, 5.88]} rotY={PI} size={1.3} />

      {/* FURNITURE */}
      <Wardrobe position={[-2.45, 0, -2.55]} />
      <BrokenMirror position={[1.4, 1.55, -2.88]} />
      <Portrait position={[1.25, 1.6, 2.88]} rotation={PI} tilt={0.17} />
     
      <Portrait position={[6.38, 1.55, 0.8]} rotation={-PI / 2} tilt={-0.12} />
      {/* Moved away from the center table */}
      <FallenChair position={[2.3, 0, 1.7]} rotation={0.4} />
      <Bookshelf position={[5.3, 0, -1.65]} />
      <RitualAltar />
      <RitualRoomSign />
    </group>
  )
}
