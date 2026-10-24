
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

import { allowed } from './worldCollision'
import { remote, sendLock } from './controller/remote'
import { gameAudio } from './gameAudio'

// =====================================================
// TYPES
// =====================================================

type Props = {
  banishUnlocked: boolean
  gameOver: boolean
  onHit: () => void
  onWin: () => void
  onCharge: (value: number) => void
  onChasing: (value: boolean) => void
}

type GhostState =
  | 'wander'
  | 'stalk'
  | 'manifest'
  | 'hunt'
  | 'attack'

type Point = [number, number]

type Waypoint = {
  x: number
  z: number
}

// =====================================================
// DIFFICULTY SETTINGS
// =====================================================

const TARGET_HEIGHT = 1.8

// Ghost moves slowly while exploring.
const WANDER_SPEED = 0.38

// Fast enough to create a real chase.
const HUNT_SPEED = 2.5

// When the ghost notices the player.
const NOTICE_DISTANCE = 3.0

// More aggressive after activating the ritual.
const RITUAL_NOTICE_DISTANCE = 4.8

// Player must get quite close to lose a life.
const CATCH_DISTANCE = 0.78

// When a hunt gives up.
const ESCAPE_DISTANCE = 6.5

// IMPORTANT: protection after being caught.
const RESPAWN_PROTECTION = 15

// Minimum time between attacks.
const ATTACK_COOLDOWN = 15

const MIN_HUNT_TIME = 7
const MAX_HUNT_TIME = 10

// Banishment settings.
const BANISH_SECONDS = 2.4
const BANISH_ANIMATION_SECONDS = 3.8

const START: [number, number, number] = [
  -1.7, 0, 4.5,
]

// Player respawns in the parlor at (0, 2.2).
// Keep the ghost away from that location.
const PLAYER_SPAWN: Point = [0, 2.2]

// =====================================================
// MANSION LOCATIONS
// =====================================================

const PATROL_POINTS: Point[] = [
  [-2.7, -0.2],
  [1.7, -1.8],
  [2.1, 2.0],
  [-2.1, 4.5],
  [1.6, 4.5],
  [4.5, -0.8],
  [5.8, 1.0],
  [4.5, 5.5],
  [5.8, 3.5],
]

const DOORWAY_POINTS: Point[] = [
  [2.75, 0],
  [3.1, 0.5],
  [-2.0, 3.4],
  [-1.8, 4.9],
  [2.8, 4.5],
  [3.85, 4.5],
  [1.5, 3.65],
]

// Preferred places for the ghost to retreat.
const RETREAT_POINTS: Point[] = [
  [5.8, 1.0],
  [4.5, -0.8],
  [5.8, 3.5],
  [4.5, 5.5],
  [-2.7, -0.2],
]

// =====================================================
// HELPERS
// =====================================================

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function distance2D(
  ax: number,
  az: number,
  bx: number,
  bz: number
) {
  return Math.hypot(ax - bx, az - bz)
}

function angleDifference(a: number, b: number) {
  return Math.atan2(
    Math.sin(a - b),
    Math.cos(a - b)
  )
}

// Approximate visibility using existing collisions.
// This keeps most walls between the ghost and player.
function hasLineOfSight(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number
) {
  const distance = distance2D(
    fromX, fromZ, toX, toZ
  )

  const steps = Math.max(
    1,
    Math.ceil(distance / 0.15)
  )

  for (let i = 1; i < steps; i++) {
    const t = i / steps

    const x = THREE.MathUtils.lerp(
      fromX, toX, t
    )

    const z = THREE.MathUtils.lerp(
      fromZ, toZ, t
    )

    if (!allowed(x, z)) {
      return false
    }
  }

  return true
}

function outsidePlayerView(
  camera: THREE.Camera,
  x: number,
  z: number
) {
  const forward = new THREE.Vector3()

  camera.getWorldDirection(forward)
  forward.y = 0
  forward.normalize()

  const toward = new THREE.Vector3(
    x - camera.position.x,
    0,
    z - camera.position.z
  ).normalize()

  return forward.dot(toward) < 0.25
}

function pickAppearancePoint(
  camera: THREE.Camera,
  points: Point[],
  minDistance = 2.5
): Point | null {
  const candidates = points.filter(([x, z]) => {
    return (
      allowed(x, z) &&
      distance2D(
        camera.position.x,
        camera.position.z,
        x,
        z
      ) >= minDistance &&
      outsidePlayerView(camera, x, z)
    )
  })

  if (candidates.length === 0) return null

  return candidates[
    Math.floor(Math.random() * candidates.length)
  ]
}

// Find a safe place far from BOTH the player's
// current position and the parlor respawn point.
function pickRetreatPoint(camera: THREE.Camera): Point {
  const candidates = RETREAT_POINTS.filter(([x, z]) => {
    return (
      allowed(x, z) &&
      distance2D(
        x, z,
        camera.position.x,
        camera.position.z
      ) > 4 &&
      distance2D(
        x, z,
        PLAYER_SPAWN[0],
        PLAYER_SPAWN[1]
      ) > 4
    )
  })

  if (candidates.length > 0) {
    return candidates[
      Math.floor(Math.random() * candidates.length)
    ]
  }

  // A safe fallback inside the distant cellar.
  return [5.8, 1.0]
}

// =====================================================
// NAVIGATION GRID
// =====================================================

const STEP = 0.25
const MIN_X = -3.25
const MIN_Z = -2.75

const NX = 39
const NZ = 35

const walkable = new Uint8Array(NX * NZ)

function gridIndex(x: number, z: number) {
  return z * NX + x
}

function worldX(x: number) {
  return MIN_X + x * STEP
}

function worldZ(z: number) {
  return MIN_Z + z * STEP
}

for (let z = 0; z < NZ; z++) {
  for (let x = 0; x < NX; x++) {
    if (allowed(worldX(x), worldZ(z))) {
      walkable[gridIndex(x, z)] = 1
    }
  }
}

function nearestCell(x: number, z: number) {
  let best = -1
  let bestDistance = Infinity

  const gx = Math.round((x - MIN_X) / STEP)
  const gz = Math.round((z - MIN_Z) / STEP)

  for (
    let j = Math.max(0, gz - 7);
    j <= Math.min(NZ - 1, gz + 7);
    j++
  ) {
    for (
      let i = Math.max(0, gx - 7);
      i <= Math.min(NX - 1, gx + 7);
      i++
    ) {
      const id = gridIndex(i, j)

      if (!walkable[id]) continue

      const distance =
        (worldX(i) - x) ** 2 +
        (worldZ(j) - z) ** 2

      if (distance < bestDistance) {
        bestDistance = distance
        best = id
      }
    }
  }

  return best
}

function findPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number
): Waypoint[] {
  const start = nearestCell(fromX, fromZ)
  const goal = nearestCell(toX, toZ)

  if (start < 0 || goal < 0) return []

  const previous = new Int32Array(
    NX * NZ
  ).fill(-1)

  const queue = new Int32Array(NX * NZ)

  let head = 0
  let tail = 0

  queue[tail++] = start
  previous[start] = start

  while (head < tail) {
    const current = queue[head++]

    if (current === goal) break

    const x = current % NX
    const z = Math.floor(current / NX)

    const neighbors = [
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ]

    for (const [nx, nz] of neighbors) {
      if (
        nx < 0 ||
        nx >= NX ||
        nz < 0 ||
        nz >= NZ
      ) {
        continue
      }

      const next = gridIndex(nx, nz)

      if (!walkable[next]) continue
      if (previous[next] !== -1) continue

      previous[next] = current
      queue[tail++] = next
    }
  }

  if (previous[goal] === -1) return []

  const path: Waypoint[] = []
  let current = goal

  while (current !== start) {
    const x = current % NX
    const z = Math.floor(current / NX)

    path.push({
      x: worldX(x),
      z: worldZ(z),
    })

    current = previous[current]
  }

  return path.reverse()
}

// =====================================================
// GHOST SMOKE
// =====================================================

function GhostSmoke({
  intensity,
}: {
  intensity: { current: number }
}) {
  const sprites = useRef<THREE.Sprite[]>([])

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')

    canvas.width = 128
    canvas.height = 128

    const ctx = canvas.getContext('2d')

    if (ctx) {
      const gradient = ctx.createRadialGradient(
        64, 64, 4,
        64, 64, 64
      )

      gradient.addColorStop(
        0,
        'rgba(255,255,255,0.9)'
      )

      gradient.addColorStop(
        0.35,
        'rgba(255,255,255,0.55)'
      )

      gradient.addColorStop(
        0.7,
        'rgba(255,255,255,0.15)'
      )

      gradient.addColorStop(
        1,
        'rgba(255,255,255,0)'
      )

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 128, 128)
    }

    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => {
    return () => texture.dispose()
  }, [texture])

  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, () => {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 0.4

        return {
          x: Math.cos(angle) * radius,
          y: Math.random() * 1.65,
          z: Math.sin(angle) * radius,
          driftX: randomBetween(-0.4, 0.4),
          driftZ: randomBetween(-0.4, 0.4),
          size: randomBetween(0.35, 0.7),
          offset: Math.random(),
          speed: randomBetween(0.5, 1.1),
        }
      }),
    []
  )

  useFrame(({ clock }) => {
    const amount = intensity.current

    sprites.current.forEach((sprite, i) => {
      if (!sprite) return

      if (amount < 0.01) {
        sprite.visible = false
        return
      }

      const particle = particles[i]

      const t =
        (clock.elapsedTime * 0.24 +
          particle.offset) % 1

      sprite.visible = true

      sprite.position.set(
        particle.x + particle.driftX * t,
        particle.y + t * particle.speed,
        particle.z + particle.driftZ * t
      )

      const size =
        particle.size * (1 + t * 1.5)

      sprite.scale.set(size, size, 1)

      const material =
        sprite.material as THREE.SpriteMaterial

      material.opacity =
        amount *
        0.42 *
        Math.sin(t * Math.PI)
    })
  })

  return (
    <group>
      {particles.map((_, i) => (
        <sprite
          key={i}
          visible={false}
          ref={(node) => {
            if (node) sprites.current[i] = node
          }}
        >
          <spriteMaterial
            map={texture}
            color={
              i % 4 === 0
                ? '#77727b'
                : '#252630'
            }
            transparent
            opacity={0}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// =====================================================
// MAIN GHOST COMPONENT
// =====================================================

export default function Ghost({
  banishUnlocked,
  gameOver,
  onHit,
  onWin,
  onCharge,
  onChasing,
}: Props) {
  const { camera } = useThree()

  const ghostRef = useRef<THREE.Group>(null)

  // ===================================================
  // LOAD ANIMATED GHOST
  // ===================================================

  const { scene, animations } =
    useGLTF('/models/ghost.glb')

  const { model, fadeMaterials } = useMemo(() => {
    const copy = clone(scene)

    const entries: {
      material: THREE.Material & {
        opacity: number
        transparent: boolean
        depthWrite: boolean
      }
      originalOpacity: number
    }[] = []

    copy.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return

      const originals = Array.isArray(
        object.material
      )
        ? object.material
        : [object.material]

      const cloned = originals.map(
        (original: THREE.Material) => {
          const material = original.clone() as
            THREE.Material & {
              opacity: number
              transparent: boolean
              depthWrite: boolean
            }

          entries.push({
            material,
            originalOpacity:
              typeof material.opacity === 'number'
                ? material.opacity
                : 1,
          })

          return material
        }
      )

      object.material = Array.isArray(
        object.material
      )
        ? cloned
        : cloned[0]
    })

    return {
      model: copy,
      fadeMaterials: entries,
    }
  }, [scene])

  const { scale, offset } = useMemo(() => {
    model.updateMatrixWorld(true)

    const bounds =
      new THREE.Box3().setFromObject(model)

    const size =
      bounds.getSize(new THREE.Vector3())

    const center =
      bounds.getCenter(new THREE.Vector3())

    const s =
      TARGET_HEIGHT / Math.max(size.y, 0.001)

    return {
      scale: s,
      offset: [
        -center.x * s,
        -bounds.min.y * s,
        -center.z * s,
      ] as [number, number, number],
    }
  }, [model])

  // ===================================================
  // GHOST ANIMATIONS
  // ===================================================

  const { actions, names } =
    useAnimations(animations, model)

  const normalAnimation =
    useRef<THREE.AnimationAction | null>(null)

  const chasingAnimation =
    useRef<THREE.AnimationAction | null>(null)

  const banishAnimation =
    useRef<THREE.AnimationAction | null>(null)

  const activeAnimation =
    useRef<'normal' | 'chase' | 'banish'>('normal')

  useEffect(() => {
    console.log('Available ghost animations:', names)

    const findAnimation = (keyword: string) =>
      names.find((name) =>
        name.toLowerCase()
          .replace(/\s/g, '')
          .includes(keyword)
      )

    const normalName =
      findAnimation('stalking2') ?? names[0]

    const chaseName =
      findAnimation('chasing') ?? normalName

    const banishName =
      findAnimation('stalking1') ?? normalName

    normalAnimation.current = normalName
      ? actions[normalName] ?? null
      : null

    chasingAnimation.current = chaseName
      ? actions[chaseName] ?? null
      : null

    banishAnimation.current = banishName
      ? actions[banishName] ?? null
      : null

    const action = normalAnimation.current

    action?.reset()
    action?.setLoop(THREE.LoopRepeat, Infinity)
    action?.play()

    return () => {
      normalAnimation.current?.stop()
      chasingAnimation.current?.stop()
      banishAnimation.current?.stop()
    }
  }, [actions, names])

  function switchAnimation(
    next: 'normal' | 'chase' | 'banish'
  ) {
    if (activeAnimation.current === next) return

    const previous =
      activeAnimation.current === 'normal'
        ? normalAnimation.current
        : activeAnimation.current === 'chase'
          ? chasingAnimation.current
          : banishAnimation.current

    const nextAction =
      next === 'normal'
        ? normalAnimation.current
        : next === 'chase'
          ? chasingAnimation.current
          : banishAnimation.current

    activeAnimation.current = next

    if (!nextAction || nextAction === previous) return

    previous?.fadeOut(0.3)

    nextAction.reset()

    if (next === 'banish') {
      nextAction.setLoop(THREE.LoopOnce, 1)
      nextAction.clampWhenFinished = true

      if (nextAction.getClip().duration > 0) {
        nextAction.setDuration(
          BANISH_ANIMATION_SECONDS
        )
      }
    } else {
      nextAction.setLoop(
        THREE.LoopRepeat,
        Infinity
      )

      nextAction.clampWhenFinished = false
      nextAction.setEffectiveTimeScale(1)
    }

    nextAction.fadeIn(0.3)
    nextAction.play()
  }

  // ===================================================
  // AI STATE
  // ===================================================

  const state = useRef<GhostState>('wander')

  const stateTime = useRef(0)
  const stateDuration = useRef(6)

  const position = useRef(
    new THREE.Vector3(...START)
  )

  const route = useRef<Waypoint[]>([])

  const target = useRef<Waypoint>({
    x: -2.1,
    z: 4.5,
  })

  const pathTimer = useRef(0)
  const patrolTimer = useRef(0)
  const pauseTimer = useRef(0)

  // ===================================================
  // CRITICAL SAFETY TIMERS
  // ===================================================

  // Cooldown before another attack is possible.
  const attackCooldown = useRef(0)

  // Player cannot be hurt during this period.
  const respawnProtection = useRef(0)

  // Prevent aggressive AI events after an attack.
  const eventCooldown = useRef(3)

  const lostSightTimer = useRef(0)

  // Fade stalking exactly once.
  const stalkFading = useRef(false)

  // ===================================================
  // VISUAL EFFECTS
  // ===================================================

  const visibility = useRef(1)
  const smokeIntensity = useRef(0)

  // ===================================================
  // BANISHMENT
  // ===================================================

  const keyboardB = useRef(false)

  const charge = useRef(0)
  const lastCharge = useRef(-1)
  const locked = useRef(false)

  const banishing = useRef(false)
  const banishTime = useRef(0)
  const won = useRef(false)

  const banishLight =
    useRef<THREE.PointLight>(null)

  const forward =
    useRef(new THREE.Vector3())

  const towardGhost =
    useRef(new THREE.Vector3())

  // ===================================================
  // CHANGE GHOST BEHAVIOR
  // ===================================================

  function changeState(
    next: GhostState,
    duration: number
  ) {
    if (
      next === 'attack' &&
      (
        state.current === 'attack' ||
        attackCooldown.current > 0 ||
        respawnProtection.current > 0
      )
    ) {
      return
    }

    state.current = next
    stateTime.current = 0
    stateDuration.current = duration

    route.current = []
    pathTimer.current = 0
    pauseTimer.current = 0

    stalkFading.current = false

    if (next === 'hunt') {
      // Do not hunt a player who is recovering.
      if (respawnProtection.current > 0) {
        state.current = 'wander'
        switchAnimation('normal')
        onChasing(false)
        return
      }

      lostSightTimer.current = 0

      switchAnimation('chase')
      onChasing(true)
    } else {
      switchAnimation('normal')
      onChasing(false)
    }

    // =================================================
    // ATTACK — CALLED ONCE
    // =================================================

    if (next === 'attack') {
      // Give the player plenty of recovery time.
      attackCooldown.current = ATTACK_COOLDOWN

      respawnProtection.current =
        RESPAWN_PROTECTION

      eventCooldown.current = 10

      // Cancel a partially charged banishment.
      charge.current = 0
      lastCharge.current = 0
      locked.current = false

      onCharge(0)
      sendLock(false)

      // Trigger exactly ONE jumpscare and life loss.
      gameAudio.setThreat(100)
      onHit()

      // Immediately retreat the ghost far away.
      // App.tsx handles the player's respawn.
      const retreat = pickRetreatPoint(camera)

      position.current.set(
        retreat[0],
        0,
        retreat[1]
      )

      route.current = []
      pathTimer.current = 0
      patrolTimer.current = 0

      // Keep ghost hidden during the scare.
      visibility.current = 0
      smokeIntensity.current = 0
    }
  }

  // ===================================================
  // RANDOM BEHAVIOR SELECTION
  // ===================================================

  function chooseNextBehavior() {
    // During recovery, the ghost only wanders.
    if (respawnProtection.current > 0) {
      changeState(
        'wander',
        randomBetween(6, 9)
      )
      return
    }

    const roll = Math.random()

    // 25%: Continue wandering.
    if (roll < 0.25) {
      changeState(
        'wander',
        randomBetween(5, 8)
      )
      return
    }

    // 30%: Stalk from a doorway.
    if (roll < 0.55) {
      const point = pickAppearancePoint(
        camera,
        DOORWAY_POINTS,
        2.8
      )

      if (point) {
        position.current.set(
          point[0],
          0,
          point[1]
        )

        visibility.current = 0

        changeState(
          'stalk',
          randomBetween(3, 5)
        )
        return
      }
    }

    // 25%: Appear with smoke.
    if (roll < 0.80) {
      const point = pickAppearancePoint(
        camera,
        PATROL_POINTS,
        2.8
      )

      if (point) {
        position.current.set(
          point[0],
          0,
          point[1]
        )

        visibility.current = 0

        changeState(
          'manifest',
          randomBetween(2.5, 3.5)
        )
        return
      }
    }

    // 20%: Possible hunt.
    const distance = distance2D(
      position.current.x,
      position.current.z,
      camera.position.x,
      camera.position.z
    )

    if (
      attackCooldown.current <= 0 &&
      respawnProtection.current <= 0 &&
      distance < 6
    ) {
      changeState(
        'hunt',
        randomBetween(
          MIN_HUNT_TIME,
          MAX_HUNT_TIME
        )
      )
      return
    }

    changeState(
      'wander',
      randomBetween(5, 8)
    )
  }

  // ===================================================
  // PATH MOVEMENT
  // ===================================================

  function moveAlongPath(
    delta: number,
    speed: number
  ) {
    const p = position.current

    while (route.current.length > 0) {
      const next = route.current[0]

      if (
        distance2D(
          p.x,
          p.z,
          next.x,
          next.z
        ) < 0.12
      ) {
        route.current.shift()
      } else {
        break
      }
    }

    if (route.current.length === 0) return

    const next = route.current[0]

    const dx = next.x - p.x
    const dz = next.z - p.z
    const length = Math.hypot(dx, dz)

    if (length < 0.001) return

    const step = Math.min(
      speed * delta,
      length
    )

    const nx =
      p.x + (dx / length) * step

    const nz =
      p.z + (dz / length) * step

    if (allowed(nx, p.z)) p.x = nx
    if (allowed(p.x, nz)) p.z = nz

    if (ghostRef.current) {
      const desired = Math.atan2(dx, dz)

      const difference = angleDifference(
        desired,
        ghostRef.current.rotation.y
      )

      ghostRef.current.rotation.y +=
        difference *
        (1 - Math.exp(-4 * delta))
    }
  }

  // ===================================================
  // KEYBOARD BANISH
  // ===================================================

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'KeyB') {
        keyboardB.current = true
      }
    }

    const up = (event: KeyboardEvent) => {
      if (event.code === 'KeyB') {
        keyboardB.current = false
      }
    }

    const blur = () => {
      keyboardB.current = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)

      sendLock(false)
    }
  }, [])

  // ===================================================
  // MAIN GAME LOOP
  // ===================================================

  useFrame(({ clock }, delta) => {
    if (
      !ghostRef.current ||
      gameOver ||
      won.current
    ) {
      return
    }

    const dt = Math.min(delta, 0.05)
    const elapsed = clock.elapsedTime

    const p = position.current
    const group = ghostRef.current

    // =================================================
    // FINAL BANISHMENT CINEMATIC
    // =================================================

    if (banishing.current) {
      banishTime.current += dt

      const progress = Math.min(
        1,
        banishTime.current /
          BANISH_ANIMATION_SECONDS
      )

      const shake =
        0.008 +
        Math.sin(progress * Math.PI) * 0.055

      const rise =
        THREE.MathUtils.smoothstep(
          progress,
          0.15,
          0.95
        ) * 0.85

      // Ghost trembles and rises.
      group.position.set(
        p.x + Math.sin(elapsed * 39) * shake,
        rise +
          Math.sin(elapsed * 31) *
            shake * 0.55,
        p.z + Math.cos(elapsed * 43) * shake
      )

      group.rotation.z =
        Math.sin(elapsed * 17) *
        shake * 0.55

      // Dark smoke surrounds the body.
      smokeIntensity.current =
        Math.min(1, progress * 3)

      // Gradually fade away.
      const dissolve =
        THREE.MathUtils.smoothstep(
          progress,
          0.25,
          0.92
        )

      visibility.current = 1 - dissolve

      if (banishLight.current) {
        banishLight.current.intensity =
          0.6 +
          Math.sin(elapsed * 16) * 0.3 +
          (1 - progress)
      }

      if (progress >= 1) {
        banishing.current = false
        won.current = true

        group.visible = false
        smokeIntensity.current = 0

        sendLock(false)
        onWin()
      }
    } else {
      // =================================================
      // UPDATE TIMERS
      // =================================================

      stateTime.current += dt

      attackCooldown.current = Math.max(
        0,
        attackCooldown.current - dt
      )

      respawnProtection.current = Math.max(
        0,
        respawnProtection.current - dt
      )

      eventCooldown.current = Math.max(
        0,
        eventCooldown.current - dt
      )

      pathTimer.current -= dt
      patrolTimer.current -= dt
      pauseTimer.current -= dt

      const playerX = camera.position.x
      const playerZ = camera.position.z

      const distance = distance2D(
        p.x,
        p.z,
        playerX,
        playerZ
      )

      const canSeePlayer = hasLineOfSight(
        p.x,
        p.z,
        playerX,
        playerZ
      )

      const protectedPlayer =
        respawnProtection.current > 0 ||
        attackCooldown.current > 0

      // Keep the ghost's audio distance-based.
      gameAudio.setThreat(distance)

      // =================================================
      // PREVENT HUNTING DURING RECOVERY
      // =================================================

      if (
        respawnProtection.current > 0 &&
        state.current === 'hunt'
      ) {
        changeState(
          'wander',
          randomBetween(6, 9)
        )
      }

      // =================================================
      // CONTACT DAMAGE
      // =================================================

      // The player only takes damage when:
      // - ghost is sufficiently visible
      // - player is very close
      // - neither safety timer is active
      // - ghost is not already attacking

      if (
        !protectedPlayer &&
        state.current !== 'attack' &&
        visibility.current > 0.65 &&
        distance < CATCH_DISTANCE
      ) {
        changeState('attack', 1.5)
      }

      // =================================================
      // MORE AGGRESSIVE AFTER THE ALTAR
      // =================================================

      if (
        banishUnlocked &&
        !protectedPlayer &&
        state.current !== 'attack' &&
        state.current !== 'hunt' &&
        visibility.current > 0.65 &&
        distance < RITUAL_NOTICE_DISTANCE &&
        canSeePlayer &&
        eventCooldown.current <= 0
      ) {
        changeState(
          'hunt',
          randomBetween(9, 12)
        )
      }

      const currentState = state.current

      // =================================================
      // 1. WANDER
      // =================================================

      if (currentState === 'wander') {
        visibility.current = Math.min(
          1,
          visibility.current + dt * 1.5
        )

        smokeIntensity.current = Math.max(
          0,
          smokeIntensity.current - dt * 1.5
        )

        // Stop and listen occasionally.
        if (
          pauseTimer.current <= 0 &&
          Math.random() < dt * 0.13
        ) {
          pauseTimer.current =
            randomBetween(1.5, 3)
        }

        if (pauseTimer.current <= 0) {
          if (
            patrolTimer.current <= 0 ||
            distance2D(
              p.x,
              p.z,
              target.current.x,
              target.current.z
            ) < 0.4
          ) {
            const choices = PATROL_POINTS.filter(
              ([x, z]) =>
                allowed(x, z) &&
                distance2D(
                  p.x, p.z, x, z
                ) > 1.5
            )

            const choice =
              choices[
                Math.floor(
                  Math.random() * choices.length
                )
              ]

            if (choice) {
              target.current = {
                x: choice[0],
                z: choice[1],
              }
            }

            patrolTimer.current =
              randomBetween(8, 13)

            pathTimer.current = 0
          }

          if (pathTimer.current <= 0) {
            route.current = findPath(
              p.x,
              p.z,
              target.current.x,
              target.current.z
            )

            pathTimer.current = 2
          }

          moveAlongPath(dt, WANDER_SPEED)
        }

        // The ghost may notice the player
        // only after the safety period finishes.
        if (
          !protectedPlayer &&
          distance < NOTICE_DISTANCE &&
          canSeePlayer &&
          eventCooldown.current <= 0
        ) {
          if (Math.random() < 0.55) {
            changeState(
              'stalk',
              randomBetween(3, 5)
            )
          } else {
            changeState(
              'hunt',
              randomBetween(
                MIN_HUNT_TIME,
                MAX_HUNT_TIME
              )
            )
          }
        } else if (
          stateTime.current >=
            stateDuration.current &&
          eventCooldown.current <= 0
        ) {
          chooseNextBehavior()
        }
      }

      // =================================================
      // 2. STALK
      // =================================================

      else if (currentState === 'stalk') {
        smokeIntensity.current = 0.12

        // Stand and face the player.
        const desired = Math.atan2(
          playerX - p.x,
          playerZ - p.z
        )

        group.rotation.y +=
          angleDifference(
            desired,
            group.rotation.y
          ) * (1 - Math.exp(-2 * dt))

        const remaining =
          stateDuration.current -
          stateTime.current

        if (remaining <= 0.7) {
          stalkFading.current = true
        }

        if (stalkFading.current) {
          visibility.current = Math.max(
            0,
            visibility.current - dt * 2
          )
        } else {
          visibility.current = Math.min(
            1,
            visibility.current + dt * 2
          )
        }

        if (
          stateTime.current >=
          stateDuration.current
        ) {
          // Relocate offscreen once finished.
          const point = pickAppearancePoint(
            camera,
            PATROL_POINTS,
            4
          )

          if (point) {
            p.set(point[0], 0, point[1])
            visibility.current = 0
          }

          eventCooldown.current = 3

          changeState(
            'wander',
            randomBetween(5, 8)
          )
        }
      }

      // =================================================
      // 3. MANIFEST
      // =================================================

      else if (currentState === 'manifest') {
        const t = Math.min(
          1,
          stateTime.current /
            stateDuration.current
        )

        if (t < 0.25) {
          visibility.current = t / 0.25
        } else if (t < 0.65) {
          visibility.current = 1
        } else {
          visibility.current = Math.max(
            0,
            1 - (t - 0.65) / 0.35
          )
        }

        smokeIntensity.current =
          Math.min(
            0.85,
            0.4 +
              Math.sin(t * Math.PI) * 0.45
          )

        const desired = Math.atan2(
          playerX - p.x,
          playerZ - p.z
        )

        group.rotation.y +=
          angleDifference(
            desired,
            group.rotation.y
          ) * (1 - Math.exp(-2 * dt))

        if (t >= 1) {
          const point = pickAppearancePoint(
            camera,
            PATROL_POINTS,
            4
          )

          if (point) {
            p.set(point[0], 0, point[1])
          }

          visibility.current = 0
          smokeIntensity.current = 0

          eventCooldown.current = 3

          changeState(
            'wander',
            randomBetween(5, 8)
          )
        }
      }

      // =================================================
      // 4. HUNT
      // =================================================

      else if (currentState === 'hunt') {
        visibility.current = Math.min(
          1,
          visibility.current + dt * 2
        )

        smokeIntensity.current = 0.15

        target.current = {
          x: playerX,
          z: playerZ,
        }

        if (pathTimer.current <= 0) {
          route.current = findPath(
            p.x,
            p.z,
            playerX,
            playerZ
          )

          pathTimer.current = 0.6
        }

        moveAlongPath(dt, HUNT_SPEED)

        // Calculate actual distance after moving.
        const updatedDistance = distance2D(
          p.x,
          p.z,
          playerX,
          playerZ
        )

        if (!canSeePlayer) {
          lostSightTimer.current += dt
        } else {
          lostSightTimer.current = 0
        }

        if (
          !protectedPlayer &&
          updatedDistance < CATCH_DISTANCE
        ) {
          changeState('attack', 1.5)
        } else {
          const escaped =
            updatedDistance > ESCAPE_DISTANCE ||
            lostSightTimer.current > 4

          const huntExpired =
            stateTime.current >=
            stateDuration.current

          if (escaped || huntExpired) {
            eventCooldown.current = 3

            changeState(
              'wander',
              randomBetween(5, 8)
            )
          }
        }
      }

      // =================================================
      // 5. ATTACK
      // =================================================

      else if (currentState === 'attack') {
        // The actual jumpscare was already
        // triggered once inside changeState().
        //
        // The ghost has already retreated.

        visibility.current = 0
        smokeIntensity.current = 0

        if (
          stateTime.current >=
          stateDuration.current
        ) {
          // Resume wandering, not hunting.
          eventCooldown.current = 10

          changeState(
            'wander',
            randomBetween(8, 12)
          )
        }
      }

      // =================================================
      // GHOST FLOATING
      // =================================================

      group.position.set(
        p.x,
        Math.sin(elapsed * 2) * 0.035,
        p.z
      )

      group.rotation.z = 0

      // =================================================
      // BANISH AIMING
      // =================================================

      const holding =
        keyboardB.current || remote.banish

      camera.getWorldDirection(
        forward.current
      )

      towardGhost.current
        .set(p.x, 1.45, p.z)
        .sub(camera.position)

      const ghostDistance =
        towardGhost.current.length()

      towardGhost.current.normalize()

      const screenAim =
        forward.current.dot(
          towardGhost.current
        ) > 0.91

      const desiredYaw = Math.atan2(
        -towardGhost.current.x,
        -towardGhost.current.z
      )

      const desiredPitch = Math.asin(
        THREE.MathUtils.clamp(
          towardGhost.current.y,
          -1,
          1
        )
      )

      const gyroAim =
        remote.aiming &&
        Math.abs(
          angleDifference(
            camera.rotation.y +
              remote.aimYaw,
            desiredYaw
          )
        ) < 0.36 &&
        Math.abs(
          camera.rotation.x +
            remote.aimPitch -
            desiredPitch
        ) < 0.36

      const ghostVisible =
        visibility.current > 0.65

      const targeted =
        holding &&
        banishUnlocked &&
        ghostVisible &&
        state.current !== 'attack' &&
        ghostDistance < 6 &&
        hasLineOfSight(
          camera.position.x,
          camera.position.z,
          p.x,
          p.z
        ) &&
        (screenAim || gyroAim)

      // =================================================
      // BANISH CHARGE
      // =================================================

      if (targeted) {
        charge.current = Math.min(
          1,
          charge.current +
            dt / BANISH_SECONDS
        )
      } else {
        charge.current = Math.max(
          0,
          charge.current - dt * 0.5
        )
      }

      if (targeted !== locked.current) {
        locked.current = targeted
        sendLock(targeted)
      }

      const rounded =
        Math.round(charge.current * 20) / 20

      if (rounded !== lastCharge.current) {
        lastCharge.current = rounded
        onCharge(rounded)
      }

      // =================================================
      // BEGIN FINAL BANISHMENT
      // =================================================

      if (
        charge.current >= 1 &&
        !banishing.current
      ) {
        banishing.current = true
        banishTime.current = 0

        route.current = []

        onChasing(false)

        locked.current = false
        sendLock(false)

        gameAudio.setThreat(100)
        gameAudio.scream()

        // Plays Stalking 1 during banishment.
        switchAnimation('banish')
      }
    }

    // =================================================
    // APPLY MODEL OPACITY
    // =================================================

    for (const entry of fadeMaterials) {
      const material = entry.material

      material.transparent = true
      material.depthWrite = false

      material.opacity =
        entry.originalOpacity *
        THREE.MathUtils.clamp(
          visibility.current,
          0,
          1
        )
    }
  })

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <group
      ref={ghostRef}
      position={START}
    >
      {/* Original ghost.glb model */}
      <group position={offset}>
        <group scale={scale}>
          <primitive object={model} />
        </group>
      </group>

      {/* Cold ghostly light */}
      <pointLight
        color="#708aa0"
        intensity={0.45}
        distance={2.4}
        decay={2}
        position={[0, 1.3, 0]}
      />

      {/* Manifestation and banishment smoke */}
      <GhostSmoke intensity={smokeIntensity} />

      {/* Banishment flicker */}
      <pointLight
        ref={banishLight}
        position={[0, 1.2, 0]}
        color="#9c9cae"
        intensity={0}
        distance={3.5}
        decay={2}
      />
    </group>
  )
}

useGLTF.preload('/models/ghost.glb')
