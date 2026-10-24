
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { remote } from './controller/remote'

type Props = {
  artifactsReady: boolean
  unlocked: boolean
  onUnlock: () => void
  onProgress: (progress: number) => void
  onNearby: (nearby: boolean) => void
}

const ALTAR = new THREE.Vector3(5.25, 1.05, 4.55)
const RITUAL_TIME = 2

export default function RitualActivation({
  artifactsReady,
  unlocked,
  onUnlock,
  onProgress,
  onNearby,
}: Props) {
  const { camera } = useThree()

  const group = useRef<THREE.Group>(null)
  const hold = useRef(0)
  const completed = useRef(false)
  const eHeld = useRef(false)
  const wasNearby = useRef(false)
  const lastProgress = useRef(-1)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') eHeld.current = true
    }

    const up = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') eHeld.current = false
    }

    const blur = () => {
      eHeld.current = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useFrame(({ clock }, dt) => {
    if (group.current) {
      group.current.rotation.y =
        Math.sin(clock.elapsedTime * 0.5) * 0.04
    }

    if (!artifactsReady || unlocked || completed.current) {
      if (wasNearby.current) {
        wasNearby.current = false
        onNearby(false)
      }
      return
    }

    // Horizontal distance avoids penalizing the player
    // for the altar being higher than the floor.
    const distance = Math.hypot(
      camera.position.x - ALTAR.x,
      camera.position.z - ALTAR.z
    )

    const nearby = distance < 3.0

    if (nearby !== wasNearby.current) {
      wasNearby.current = nearby
      onNearby(nearby)
    }

    const interacting = remote.interact || eHeld.current

    if (nearby && interacting) {
      hold.current = Math.min(
        RITUAL_TIME,
        hold.current + Math.min(dt, 0.1)
      )

      if (hold.current >= RITUAL_TIME) {
        completed.current = true
        onProgress(0)
        onNearby(false)
        onUnlock()
        return
      }
    } else {
      hold.current = 0
    }

    const progress =
      Math.round((hold.current / RITUAL_TIME) * 20) / 20

    if (progress !== lastProgress.current) {
      lastProgress.current = progress
      onProgress(progress)
    }
  })

  return (
    <group
      ref={group}
      position={[5.25, 1.1, 4.55]}
    >
      {/* Magical glyph above the existing altar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.31, 48]} />
        <meshBasicMaterial
          color={unlocked ? '#ff305c' : '#8c3048'}
          side={THREE.DoubleSide}
          transparent
          opacity={artifactsReady ? 0.85 : 0.15}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.40, 0.42, 48]} />
        <meshBasicMaterial
          color="#b74c63"
          side={THREE.DoubleSide}
          transparent
          opacity={artifactsReady ? 0.65 : 0.12}
        />
      </mesh>

      {/* Floating ritual symbol */}
      {(artifactsReady || unlocked) && (
        <mesh
          position={[0, 0.34, 0]}
          rotation={[0.2, 0, 0.2]}
        >
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color="#ff365b"
            emissive="#c10e39"
            emissiveIntensity={unlocked ? 3 : 1.4}
            roughness={0.25}
          />
        </mesh>
      )}

      {/* The altar gets brighter when awakened */}
      {(artifactsReady || unlocked) && (
        <pointLight
          color="#d91f51"
          intensity={unlocked ? 3 : 0.75}
          distance={3}
          decay={2}
        />
      )}
    </group>
  )
}
