
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import House from './House'
import Smoke from './Smoke'
import Ghost from './Ghost'
import HauntedDetails from './HauntedDetails'

import { remote } from './controller/remote'

import CrimsonShard from './CrimsonShard'
import RitualInventory from './RitualInventory'
import RitualActivation from './RitualActivation'
import RitualHUD from './RitualHUD'
import GameHUD from './GameHUD'
import Jumpscare from './Jumpscare'
import StartScreen from './StartScreen'

import { gameAudio } from './gameAudio'
import { allowed } from './worldCollision'

import ForgottenBedroom from './ForgottenBedroom.tsx'
import BedroomJournal from './BedroomJournal'

type V3 = [number, number, number]

// --------------------------------------------------
// PLAYER SETTINGS
// --------------------------------------------------

const PLAYER_HEIGHT = 1.6
const WALK_SPEED = 3.5
const RUN_SPEED = 5.0

const MOVEMENT_SMOOTHING = 18
const JOYSTICK_DEADZONE = 0.08

// --------------------------------------------------
// PLAYER
// Laptop keyboard + mouse
// iPhone joystick + camera
// --------------------------------------------------

function Player({
  respawnCount,
  stopped,
}: {
  respawnCount: number
  stopped: boolean
}) {
  const { camera } = useThree()

  const keys = useRef<Record<string, boolean>>({})

  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const movement = useRef(new THREE.Vector3())
  const smoothInput = useRef(new THREE.Vector2())

  // Same camera-rotation approach as your phone-test.
  const eul = useRef(
    new THREE.Euler(0, 0, 0, 'YXZ')
  )

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 2.2)
    camera.rotation.order = 'YXZ'

    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }

    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }

    const blur = () => {
      keys.current = {}
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      gameAudio.setWalking(false)
    }
  }, [camera])

  

  // Respawn in the parlor after taking damage.
  useEffect(() => {
    if (respawnCount === 0) return

    camera.position.set(0, PLAYER_HEIGHT, 2.2)

    smoothInput.current.set(0, 0)
    keys.current = {}

    gameAudio.setWalking(false)
  }, [camera, respawnCount])

  

  useFrame((_, delta) => {
    if (stopped) {
      gameAudio.setWalking(false)
      return
    }

    

    const dt = Math.min(delta, 0.05)
    const k = keys.current

    // -----------------------------------------
    // IPHONE CAMERA
    // Original phone-test quaternion logic
    // -----------------------------------------

    if (remote.connected) {
      const dYaw = remote.yaw - remote.lastYaw
      const dPitch = remote.pitch - remote.lastPitch

      remote.lastYaw = remote.yaw
      remote.lastPitch = remote.pitch

      if (dYaw !== 0 || dPitch !== 0) {
        eul.current.setFromQuaternion(
          camera.quaternion,
          'YXZ'
        )

        eul.current.y -= dYaw

        eul.current.x = THREE.MathUtils.clamp(
          eul.current.x + dPitch,
          -1.4,
          1.4
        )

        eul.current.z = 0
        camera.quaternion.setFromEuler(eul.current)
      }
    }

    // -----------------------------------------
    // IPHONE JOYSTICK
    // -----------------------------------------

    let targetX = remote.connected
      ? THREE.MathUtils.clamp(remote.moveX, -1, 1)
      : 0

    let targetY = remote.connected
      ? THREE.MathUtils.clamp(remote.moveY, -1, 1)
      : 0

    const length = Math.hypot(targetX, targetY)

    if (length < JOYSTICK_DEADZONE) {
      targetX = 0
      targetY = 0
    } else {
      const adjusted = Math.min(
        1,
        (length - JOYSTICK_DEADZONE) /
          (1 - JOYSTICK_DEADZONE)
      )

      targetX = (targetX / length) * adjusted
      targetY = (targetY / length) * adjusted
    }

    const alpha =
      1 - Math.exp(-MOVEMENT_SMOOTHING * dt)

    smoothInput.current.x = THREE.MathUtils.lerp(
      smoothInput.current.x,
      targetX,
      alpha
    )

    smoothInput.current.y = THREE.MathUtils.lerp(
      smoothInput.current.y,
      targetY,
      alpha
    )

    // -----------------------------------------
    // CAMERA-RELATIVE MOVEMENT
    // -----------------------------------------

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()

    right.current
      .crossVectors(forward.current, camera.up)
      .normalize()

    movement.current.set(0, 0, 0)

    // Laptop keyboard.
    if (k.KeyW) movement.current.add(forward.current)
    if (k.KeyS) movement.current.sub(forward.current)
    if (k.KeyD) movement.current.add(right.current)
    if (k.KeyA) movement.current.sub(right.current)

    // iPhone joystick.
    movement.current.addScaledVector(
      forward.current,
      smoothInput.current.y
    )

    movement.current.addScaledVector(
      right.current,
      smoothInput.current.x
    )

    // Prevent diagonal speed boost.
    movement.current.clampLength(0, 1)

    // Walking and footsteps.
    const moving =
      movement.current.lengthSq() > 0.0001

    gameAudio.setWalking(moving)

    if (!moving) {
      camera.position.y = PLAYER_HEIGHT
      return
    }

    // -----------------------------------------
    // WALKING / RUNNING
    // -----------------------------------------

    const speed = k.ShiftLeft
      ? RUN_SPEED
      : WALK_SPEED

    movement.current.multiplyScalar(speed * dt)

    // -----------------------------------------
    // WALL AND FURNITURE COLLISIONS
    // -----------------------------------------

    const p = camera.position

    const nextX = p.x + movement.current.x

    if (allowed(nextX, p.z)) {
      p.x = nextX
    }

    const nextZ = p.z + movement.current.z

    if (allowed(p.x, nextZ)) {
      p.z = nextZ
    }

    p.y = PLAYER_HEIGHT
  })

  return null
}

// --------------------------------------------------
// CANDLES
// --------------------------------------------------

function Candle({
  position,
  height = 0.22,
  base = 6,
  light = true,
  color = '#ff9a40',
}: {
  position: V3
  height?: number
  base?: number
  light?: boolean
  color?: string
}) {
  const lightRef = useRef<THREE.PointLight>(null)
  const flameRef = useRef<THREE.Mesh>(null)
  const seed = useRef(Math.random() * 100)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed.current

    const flicker =
      1 +
      Math.sin(t * 17) * 0.1 +
      Math.sin(t * 7.3) * 0.08 +
      (Math.random() - 0.5) * 0.18

    if (lightRef.current) {
      lightRef.current.intensity =
        base * flicker
    }

    if (flameRef.current) {
      flameRef.current.scale.set(
        1,
        1.7 * flicker,
        1
      )
    }
  })

  return (
    <group position={position}>
      {/* Candle body */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry
          args={[0.035, 0.04, height, 10]}
        />
        <meshStandardMaterial
          color="#8a8478"
          roughness={0.9}
        />
      </mesh>

      {/* Candle flame */}
      <mesh
        ref={flameRef}
        position={[0, height + 0.03, 0]}
      >
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#ffd9a0" />
      </mesh>

      {/* Optional real-time light */}
      {light && (
        <pointLight
          ref={lightRef}
          position={[0, height + 0.06, 0]}
          color={color}
          distance={9}
          decay={2}
        />
      )}
    </group>
  )
}

// --------------------------------------------------
// MAIN GAME
// --------------------------------------------------

export default function App() {
  // -----------------------------------------
  // CRIMSON SHARD
  // -----------------------------------------
  const [started, setStarted] = useState(false)

  const [journalOpen, setJournalOpen] = useState(false)

const [bedroomPrompt, setBedroomPrompt] =
  useState<string | null>(null)

  const [shardCollected, setShardCollected] =
    useState(false)

  const [collectProgress, setCollectProgress] =
    useState(0)

  // -----------------------------------------
  // RITUAL
  // -----------------------------------------

  const [banishUnlocked, setBanishUnlocked] =
    useState(false)

  const [ritualProgress, setRitualProgress] =
    useState(0)

  const [ritualNearby, setRitualNearby] =
    useState(false)

  // -----------------------------------------
  // GHOST AND PLAYER
  // -----------------------------------------

  const [lives, setLives] = useState(3)

  const [respawnCount, setRespawnCount] =
    useState(0)

  const [chasing, setChasing] =
    useState(false)

  const [banishCharge, setBanishCharge] =
    useState(0)

  const [won, setWon] =
    useState(false)

  // -----------------------------------------
  // JUMPSCARE
  // -----------------------------------------

  const [jumpscare, setJumpscare] =
    useState(false)

  const scareActive = useRef(false)

  const scareTimer =
    useRef<number | null>(null)

  const lost = lives <= 0
  const stopped = won || lost

  // -----------------------------------------
  // AUDIO UNLOCK
  // Browsers require a user gesture.
  // -----------------------------------------

  useEffect(() => {
    const unlockAudio = () => {
      gameAudio.unlock()
    }

    window.addEventListener(
      'pointerdown',
      unlockAudio
    )

    window.addEventListener(
      'keydown',
      unlockAudio
    )

    return () => {
      window.removeEventListener(
        'pointerdown',
        unlockAudio
      )

      window.removeEventListener(
        'keydown',
        unlockAudio
      )
    }
  }, [])


  useEffect(() => {
  if (journalOpen && document.pointerLockElement) {
    document.exitPointerLock()
  }
}, [journalOpen])

  // -----------------------------------------
  // COLLECTION SOUND
  // -----------------------------------------

  useEffect(() => {
    if (shardCollected) {
      gameAudio.collect()
    }
  }, [shardCollected])

  // -----------------------------------------
  // RITUAL SOUND
  // -----------------------------------------

  useEffect(() => {
    if (banishUnlocked) {
      gameAudio.ritual()
    }
  }, [banishUnlocked])

  // -----------------------------------------
  // ENDING AUDIO
  // -----------------------------------------

  useEffect(() => {
    if (won) {
      gameAudio.win()
    } else if (lost) {
      gameAudio.gameOver()
    }
  }, [won, lost])

  // -----------------------------------------
  // RELEASE MOUSE WHEN GAME ENDS
  // -----------------------------------------

  useEffect(() => {
    if (
      (stopped || jumpscare) &&
      document.pointerLockElement
    ) {
      document.exitPointerLock()
    }
  }, [stopped, jumpscare])

  // -----------------------------------------
  // CLEAN UP JUMPSCARE TIMER
  // -----------------------------------------

  useEffect(() => {
    return () => {
      if (scareTimer.current !== null) {
        window.clearTimeout(
          scareTimer.current
        )
      }
    }
  }, [])

  // -----------------------------------------
  // PLAYER CAUGHT BY GHOST
  // -----------------------------------------

  const handleHit = () => {
    // Never trigger multiple jumpscares at once.
    if (stopped || scareActive.current) {
      return
    }

    scareActive.current = true

    // Show 3D ghost close-up.
    setJumpscare(true)

    // Play your jumpscare.mp3.
    gameAudio.jumpscare()

    // After the scare, remove one life
    // and send the player back to spawn.
    scareTimer.current =
      window.setTimeout(() => {
        setJumpscare(false)

        setLives((previous) =>
          Math.max(0, previous - 1)
        )

        setRespawnCount((previous) =>
          previous + 1
        )

        scareActive.current = false
        scareTimer.current = null
      }, 1400)
  }

  // -----------------------------------------
  // MAIN RENDER
  // -----------------------------------------

  return (
    <>
      <Canvas
        camera={{
          fov: 72,
          near: 0.05,
          far: 100,
        }}
        dpr={1}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
        }}
      >
        {/* ATMOSPHERE */}

        <color
          attach="background"
          args={['#030406']}
        />

        <fog
          attach="fog"
          args={['#030406', 1, 10]}
        />

        <ambientLight
          intensity={0.1}
          color="#3b4a5c"
        />

        {/* PARLOR CANDLES */}

        <Candle
          position={[0, 0.825, 0]}
          base={7}
        />

        <Candle
          position={[0.45, 0.825, 0.25]}
          height={0.14}
          light={false}
        />

        <Candle
          position={[-0.4, 0.825, -0.3]}
          height={0.3}
          light={false}
        />

        <Candle
          position={[-3.0, 0, -2.5]}
          height={0.35}
          base={4}
        />

        <Candle
          position={[-1.2, 0, 2.5]}
          height={0.25}
          base={4}
        />

        <Candle
          position={[2.9, 0, -2.4]}
          height={0.2}
          base={3.5}
        />

        {/* CELLAR */}

        <Candle
          position={[5.5, 0, -1.4]}
          height={0.18}
          base={3}
        />

        {/* HALLWAY */}

        <Candle
          position={[-2.9, 0, 5.4]}
          height={0.25}
          base={4}
        />

        <Candle
          position={[2.5, 0, 5.45]}
          height={0.22}
          base={3.5}
        />

        {/* RITUAL ROOM */}

        <Candle
          position={[5.25, 1.05, 4.55]}
          height={0.16}
          base={5}
          color="#d35a78"
        />

        {/* SMOKE */}

        <Smoke
          center={[0, 1.4, 0]}
          size={[7, 2.6, 6]}
          count={45}
          color="#4f555d"
          opacity={0.12}
        />

        <Smoke
          center={[0, 0.35, 0]}
          size={[7, 0.5, 6]}
          count={24}
          puff={1.6}
          color="#4f555d"
          opacity={0.16}
        />

        <Smoke
          center={[5, 1.4, 0]}
          size={[3, 2.6, 4]}
          count={18}
          color="#3f444b"
          opacity={0.12}
        />

        <Smoke
          center={[0, 0.6, 4.5]}
          size={[7, 1.2, 3]}
          count={20}
          color="#4f555d"
          opacity={0.12}
        />

        <Smoke
          center={[5, 1.2, 4.5]}
          size={[3, 2.2, 3]}
          count={16}
          color="#62454f"
          opacity={0.12}
        />

        {/* MANSION */}

        <House />
        <HauntedDetails />

        {/* CRIMSON SHARD */}

        <CrimsonShard
          collected={shardCollected}
          onCollect={() => {
            setShardCollected(true)
            setCollectProgress(0)
          }}
          onProgress={setCollectProgress}
        />

        {/* ALTAR ACTIVATION */}

        <RitualActivation
          artifactsReady={shardCollected}
          unlocked={banishUnlocked}
          onUnlock={() => {
            setBanishUnlocked(true)
          }}
          onProgress={setRitualProgress}
          onNearby={setRitualNearby}
        />

        {/* ANIMATED GHOST AI */}

        <Ghost
          banishUnlocked={banishUnlocked}
          gameOver={!started ||stopped || jumpscare || journalOpen}
          onHit={handleHit}
          onWin={() => {
            setWon(true)
          }}
          onCharge={setBanishCharge}
          onChasing={setChasing}
        />

        {/* PLAYER */}

        <Player
          respawnCount={respawnCount}
          stopped={!started ||stopped || jumpscare || journalOpen}
        />
        <ForgottenBedroom
  reading={journalOpen}
  onRead={() => setJournalOpen(true)}
  onPrompt={setBedroomPrompt}
/>

        {/* LAPTOP MOUSE LOOK */}

        {started && !stopped && !jumpscare && !journalOpen && (
  <PointerLockControls />
)}


      </Canvas>
      <StartScreen
  started={started}
  onStart={() => setStarted(true)}
/>

      <BedroomJournal
  open={journalOpen}
  onClose={() => setJournalOpen(false)}
/>

      {/* PHONE CONNECTION / QR CODE */}

   

      {/* ARTIFACT SLOTS */}

      <RitualInventory
        collected={shardCollected}
        progress={collectProgress}
      />

      {/* RITUAL PROMPT */}

      <RitualHUD
        artifactsReady={shardCollected}
        unlocked={banishUnlocked}
        nearby={ritualNearby}
        progress={ritualProgress}
      />

      {/* LIVES + GHOST WARNING + VICTORY */}

      <GameHUD
        lives={lives}
        chasing={chasing}
        banishUnlocked={banishUnlocked}
        banishCharge={banishCharge}
        won={won}
        lost={lost}
      />

      {/* FULLSCREEN GHOST JUMPSCARE */}

      <Jumpscare active={jumpscare} />

      {/* CONTROL HINT */}

      {!stopped && !jumpscare && (
        <div
          style={{
            position: 'fixed',
            bottom: 15,
            left: 0,
            right: 0,
            color: '#8b94a3',
            textAlign: 'center',
            fontFamily: 'system-ui',
            fontSize: 12,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          WASD Move · Shift Run · E Interact ·
          B Banish · Esc Unlock Mouse
        </div>
      )}
    </>
  )
}
