
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

type V3 = [number, number, number]

// -------------------------------------------------------
// 1. BOARDED WINDOW WITH AN UNSETTLING SILHOUETTE
// Positioned on the parlor's back wall.
// -------------------------------------------------------

function ShadowWindow({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[1.35, 1.65, 0.08]} />
        <meshStandardMaterial color="#241912" roughness={1} />
      </mesh>

      {/* Dark glass */}
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[1.15, 1.45]} />
        <meshBasicMaterial color="#080d13" />
      </mesh>

      {/* Human-shaped silhouette behind the glass */}
      <mesh position={[0.24, -0.31, 0.052]}>
        <planeGeometry args={[0.39, 0.57]} />
        <meshBasicMaterial color="#020305" />
      </mesh>

      <mesh position={[0.24, 0.12, 0.053]}>
        <circleGeometry args={[0.16, 20]} />
        <meshBasicMaterial color="#020305" />
      </mesh>

      {/* Wooden boards across the window */}
      {[
        [-0.36, -0.09],
        [0.11, 0.1],
        [0.48, -0.13],
      ].map(([y, angle], index) => (
        <mesh
          key={index}
          position={[0, y, 0.075]}
          rotation={[0, 0, angle]}
        >
          <boxGeometry args={[1.48, 0.16, 0.055]} />
          <meshStandardMaterial color="#38271d" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------
// 2. CLAW MARKS
// Static scratches that sit against a wall.
// -------------------------------------------------------

function Scratches({
  position,
  rotation = 0,
}: {
  position: V3
  rotation?: number
}) {
  return (
    <group position={position} rotation-y={rotation}>
      {[-0.13, 0, 0.13].map((x, index) => (
        <mesh
          key={index}
          position={[x, -index * 0.07, 0]}
          rotation-z={-0.18}
        >
          <planeGeometry args={[0.025, 0.75]} />
          <meshBasicMaterial
            color="#100b0d"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------
// 3. OLD WOODEN WALL PANEL
// Architectural detail rather than random furniture.
// -------------------------------------------------------

function Panel({
  position,
  width = 0.85,
  height = 2.3,
  rotation = 0,
}: {
  position: V3
  width?: number
  height?: number
  rotation?: number
}) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh>
        <boxGeometry args={[width, height, 0.045]} />
        <meshStandardMaterial color="#251b19" roughness={1} />
      </mesh>

      <mesh position={[0, 0, 0.027]}>
        <boxGeometry args={[width - 0.12, height - 0.15, 0.015]} />
        <meshStandardMaterial color="#3a2923" roughness={1} />
      </mesh>

      <mesh position={[0, 0, 0.038]}>
        <boxGeometry args={[width - 0.2, height - 0.25, 0.01]} />
        <meshStandardMaterial color="#211817" roughness={1} />
      </mesh>
    </group>
  )
}

// -------------------------------------------------------
// 4. HALLWAY CARPET
// Low-profile carpet that doesn't block movement.
// -------------------------------------------------------

function HallRunner() {
  return (
    <group>
      {/* Faded burgundy carpet */}
      <mesh
        position={[0, 0.025, 4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[4.9, 1.03]} />
        <meshStandardMaterial
          color="#45191d"
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Decorative border */}
      <mesh
        position={[0, 0.028, 4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[4.65, 0.88]} />
        <meshStandardMaterial
          color="#321518"
          roughness={1}
        />
      </mesh>

      {/* Gold-colored edging */}
      <mesh
        position={[-2.34, 0.031, 4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.025, 0.95]} />
        <meshBasicMaterial color="#80604c" />
      </mesh>

      <mesh
        position={[2.34, 0.031, 4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.025, 0.95]} />
        <meshBasicMaterial color="#80604c" />
      </mesh>
    </group>
  )
}

// -------------------------------------------------------
// 5. OLD WALL LAMP
// The cellar lamp occasionally flickers.
// -------------------------------------------------------

function WallLamp({
  position,
  rotation = 0,
  broken = false,
}: {
  position: V3
  rotation?: number
  broken?: boolean
}) {
  const light = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!light.current) return

    const t = clock.elapsedTime

    light.current.intensity = broken
      ? Math.sin(t * 2.4) > 0.96
        ? 1.2
        : 0.08
      : 0.55 + Math.sin(t * 5) * 0.045
  })

  return (
    <group position={position} rotation-y={rotation}>
      {/* Wall mount */}
      <mesh>
        <boxGeometry args={[0.19, 0.35, 0.06]} />
        <meshStandardMaterial color="#342923" metalness={0.3} />
      </mesh>

      {/* Support arm */}
      <mesh position={[0, -0.04, 0.13]}>
        <boxGeometry args={[0.06, 0.07, 0.25]} />
        <meshStandardMaterial color="#514332" metalness={0.65} />
      </mesh>

      {/* Aged lamp shade */}
      <mesh position={[0, 0.14, 0.2]}>
        <cylinderGeometry args={[0.075, 0.095, 0.25, 9]} />
        <meshStandardMaterial
          color="#ad8d6c"
          emissive="#57321c"
          emissiveIntensity={0.23}
        />
      </mesh>

      <pointLight
        ref={light}
        position={[0, 0.15, 0.35]}
        color="#fca565"
        intensity={0.5}
        distance={3}
        decay={2}
      />
    </group>
  )
}

// -------------------------------------------------------
// 6. DISTURBING FAMILY PORTRAIT
// Subtle, shadowy face rather than cartoonish red eyes.
// -------------------------------------------------------

function FamilyPortrait({
  position,
  rotation = 0,
}: {
  position: V3
  rotation?: number
}) {
  return (
    <group position={position} rotation-y={rotation}>
      <group rotation-z={-0.09}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.86, 1.14, 0.065]} />
          <meshStandardMaterial color="#44301e" />
        </mesh>

        {/* Dark canvas */}
        <mesh position={[0, 0, 0.039]}>
          <planeGeometry args={[0.7, 0.98]} />
          <meshBasicMaterial color="#222022" />
        </mesh>

        {/* Shadowy clothing */}
        <mesh position={[0, -0.22, 0.044]}>
          <planeGeometry args={[0.43, 0.43]} />
          <meshBasicMaterial color="#0e0d10" />
        </mesh>

        {/* Face */}
        <mesh position={[0, 0.12, 0.046]}>
          <circleGeometry args={[0.19, 24]} />
          <meshBasicMaterial color="#343034" />
        </mesh>

        {/* Face partially obscured */}
        <mesh position={[0, -0.02, 0.048]}>
          <planeGeometry args={[0.22, 0.15]} />
          <meshBasicMaterial color="#1a171b" />
        </mesh>

        {/* Damage across the painting */}
        <mesh
          position={[0.02, 0.06, 0.05]}
          rotation-z={-0.35}
        >
          <planeGeometry args={[0.035, 0.42]} />
          <meshBasicMaterial color="#0d0d10" />
        </mesh>
      </group>
    </group>
  )
}

// -------------------------------------------------------
// 7. CELLAR CRATES
// Positioned away from the existing bookshelf.
// -------------------------------------------------------

function CellarCrates() {
  const crates: { position: V3; size: number }[] = [
    { position: [6.02, 0.26, 1.22], size: 0.52 },
    { position: [5.98, 0.72, 1.25], size: 0.35 },
  ]

  return (
    <group>
      {crates.map((crate, index) => (
        <group key={index} position={crate.position}>
          <mesh>
            <boxGeometry args={[crate.size, crate.size, crate.size]} />
            <meshStandardMaterial
              color={index ? '#4b3829' : '#37291f'}
              roughness={1}
            />
          </mesh>

          {[-0.35, 0.35].map((x) => (
            <mesh
              key={x}
              position={[
                x * crate.size,
                0,
                crate.size / 2 + 0.008,
              ]}
            >
              <boxGeometry args={[0.035, crate.size, 0.018]} />
              <meshStandardMaterial color="#1f1713" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// -------------------------------------------------------
// 8. RITUAL BACKDROP
// Positioned behind the existing altar, not on top of it.
// -------------------------------------------------------

function RitualBackdrop() {
  const glow = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (glow.current) {
      glow.current.intensity =
        0.55 + Math.sin(clock.elapsedTime * 1.2) * 0.12
    }
  })

  return (
    <group>
      <group position={[5.13, 1.7, 5.875]}>
        {/* Dark wall panel */}
        <mesh>
          <planeGeometry args={[1.9, 1.65]} />
          <meshStandardMaterial
            color="#1a1015"
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Occult markings */}
        <mesh position={[0, 0.05, -0.018]}>
          <torusGeometry args={[0.56, 0.019, 6, 64]} />
          <meshBasicMaterial color="#69202c" />
        </mesh>

        <mesh position={[0, 0.05, -0.019]}>
          <torusGeometry args={[0.39, 0.009, 6, 64]} />
          <meshBasicMaterial color="#64202b" />
        </mesh>

        <Text
          position={[0, -0.65, -0.025]}
          fontSize={0.13}
          font="/fonts/Creepster-Regular.ttf"
          color="#741f25"
          anchorX="center"
          anchorY="middle"
        >
          IT KNOWS YOUR NAME
        </Text>
      </group>

      <pointLight
        ref={glow}
        position={[5.1, 1.5, 5.1]}
        color="#b32943"
        intensity={0.55}
        distance={3.1}
        decay={2}
      />
    </group>
  )
}


// Glowing ritual markings painted onto the floor.
// Centered around the existing ritual altar.
function FloorRitualCircle() {
  const outer = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (outer.current) {
      outer.current.opacity =
        0.5 + Math.sin(clock.elapsedTime * 1.5) * 0.12
    }
  })

  return (
    <group position={[5.0, 0.035, 4.5]}>
      {/* Large outer circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.12, 1.15, 96]} />
        <meshBasicMaterial
          ref={outer}
          color="#a51b2c"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Smaller inner circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.83, 0.85, 96]} />
        <meshBasicMaterial
          color="#75202c"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Crossed ritual lines */}
      {[0, Math.PI / 3, -Math.PI / 3].map((angle) => (
        <mesh
          key={angle}
          position={[0, 0.002, 0]}
          rotation={[-Math.PI / 2, 0, angle]}
        >
          <planeGeometry args={[0.018, 2.0]} />
          <meshBasicMaterial
            color="#70202b"
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Low red glow */}
      <pointLight
        position={[0, 0.2, 0]}
        color="#bd1830"
        intensity={0.35}
        distance={2.5}
      />
    </group>
  )
}
// -------------------------------------------------------
// MAIN COMPONENT
// Coordinates match the original House.tsx layout.
// -------------------------------------------------------



export default function HauntedDetails() {
  return (
    <group>
      {/* PARLOR */}
      <ShadowWindow position={[-0.35, 1.58, -2.85]} />

      <Scratches
        position={[-3.37, 1.55, 1.4]}
        rotation={Math.PI / 2}
      />

      <Panel
        position={[-3.37, 1.34, 2.35]}
        width={0.85}
        height={2.3}
        rotation={Math.PI / 2}
      />

      {/* CELLAR */}
      <CellarCrates />

      <WallLamp
        position={[6.36, 1.75, -0.5]}
        rotation={-Math.PI / 2}
        broken
      />

      {/* HALLWAY */}
      <HallRunner />

      <FamilyPortrait
        position={[-2.4, 1.7, 5.86]}
        rotation={Math.PI}
      />

      <FamilyPortrait
        position={[2.3, 1.7, 5.86]}
        rotation={Math.PI}
      />

      <WallLamp
        position={[-1.6, 1.65, 5.86]}
        rotation={Math.PI}
      />

      <WallLamp
        position={[1.6, 1.65, 5.86]}
        rotation={Math.PI}
        broken
      />

      {/* RITUAL ROOM */}
      <RitualBackdrop />

      <Scratches
        position={[6.36, 1.55, 4.9]}
        rotation={-Math.PI / 2}
      />
      <FloorRitualCircle />
    </group>
  )
}
