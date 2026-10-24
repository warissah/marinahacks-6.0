
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { remote } from './controller/remote'

type Props = {
  collected: boolean
  onCollect: () => void
  onProgress: (value: number) => void
}

// Far corner of the cellar.
// Away from the player's parlor spawn.
const SHARD_POSITION = new THREE.Vector3(
  5.85,
  0.62,
  1.15
)

export default function CrimsonShard({
  collected,
  onCollect,
  onProgress,
}: Props) {
  const { camera } = useThree()

  const crystal = useRef<THREE.Group>(null)
  const hold = useRef(0)
  const keyPressed = useRef(false)
  const direction = useRef(new THREE.Vector3())
  const towardShard = useRef(new THREE.Vector3())
  const lastProgress = useRef(-1)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') keyPressed.current = true
    }

    const up = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') keyPressed.current = false
    }

    const blur = () => {
      keyPressed.current = false
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
    if (collected) return

    // Slow and subtle floating animation.
    if (crystal.current) {
      crystal.current.rotation.y += dt * 0.45

      crystal.current.position.y =
        SHARD_POSITION.y +
        Math.sin(clock.elapsedTime * 1.7) * 0.055
    }

    const distance =
      camera.position.distanceTo(SHARD_POSITION)

    camera.getWorldDirection(direction.current)

    towardShard.current
      .copy(SHARD_POSITION)
      .sub(camera.position)
      .normalize()

    const facing =
      direction.current.dot(towardShard.current)

    // Must approach and actually look at it.
    const inRange =
      distance < 2.0 && facing > 0.75

    const interacting =
      remote.interact || keyPressed.current

    if (inRange && interacting) {
      hold.current = Math.min(
        1,
        hold.current + dt
      )

      if (hold.current >= 1) {
        hold.current = 0
        onCollect()
        onProgress(0)
        return
      }
    } else {
      hold.current = 0
    }

    const rounded =
      Math.round(hold.current * 20) / 20

    if (rounded !== lastProgress.current) {
      lastProgress.current = rounded
      onProgress(rounded)
    }
  })

  if (collected) return null

  return (
    <group
      ref={crystal}
      position={SHARD_POSITION.toArray()}
    >
      {/* Main dark crimson crystal */}
      <mesh rotation={[0.18, 0, 0.12]}>
        <octahedronGeometry args={[0.115, 0]} />

        <meshStandardMaterial
          color="#AD1234"
          emissive="#A8092A"
          emissiveIntensity={0.85}
          metalness={0.3}
          roughness={0.25}
        />
      </mesh>

      {/* Tiny inner glimmer */}
      <mesh scale={0.47}>
        <octahedronGeometry args={[0.115, 0]} />
        <meshBasicMaterial color="#E85A78" />
      </mesh>

      {/* Small detached shard */}
      <mesh
        position={[0.14, -0.09, 0.02]}
        rotation={[0.4, 0.3, 0.3]}
      >
        <octahedronGeometry args={[0.038, 0]} />
        <meshStandardMaterial
          color="#B51F41"
          emissive="#751129"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Very soft local red light */}
      <pointLight
        color="#C51944"
        intensity={0.55}
        distance={1.3}
        decay={2}
      />
    </group>
  )
}
