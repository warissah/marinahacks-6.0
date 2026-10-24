
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { remote } from './controller/remote'

type Props = {
  reading: boolean
  onRead: () => void
  onPrompt: (message: string | null) => void
}


const JOURNAL = new THREE.Vector3(-9.8, 1.6, 3.15)

// =====================================================
// PROCEDURAL TEXTURES
// No additional downloads or image assets needed.
// =====================================================

function useBedroomTextures() {
  const textures = useMemo(() => {
    function make(
      painter: (ctx: CanvasRenderingContext2D) => void,
      rx = 1,
      ry = 1
    ) {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512

      const ctx = canvas.getContext('2d')!
      painter(ctx)

      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(rx, ry)

      return texture
    }

    const wood = make((ctx) => {
      ctx.fillStyle = '#493023'
      ctx.fillRect(0, 0, 512, 512)

      for (let y = 0; y < 512; y += 44) {
        ctx.fillStyle =
          Math.floor(y / 44) % 2 === 0
            ? '#543727'
            : '#3c271d'

        ctx.fillRect(0, y, 512, 43)

        ctx.strokeStyle = '#211710'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(512, y)
        ctx.stroke()

        for (let i = 0; i < 32; i++) {
          const xx = Math.random() * 512
          const yy = y + Math.random() * 43

          ctx.strokeStyle =
            'rgba(15,8,5,0.13)'

          ctx.lineWidth = Math.random() * 2 + 0.4
          ctx.beginPath()
          ctx.moveTo(xx, yy)
          ctx.lineTo(xx + Math.random() * 110, yy)
          ctx.stroke()
        }
      }
    }, 2, 2)

    const wallpaper = make((ctx) => {
      ctx.fillStyle = '#786756'
      ctx.fillRect(0, 0, 512, 512)

      // Repeating aged Victorian damask pattern.
      for (let x = 0; x < 512; x += 80) {
        for (let y = 0; y < 512; y += 96) {
          ctx.strokeStyle = 'rgba(45,33,29,0.34)'
          ctx.lineWidth = 3

          ctx.beginPath()
          ctx.ellipse(
            x + 40, y + 48,
            24, 39,
            0, 0, Math.PI * 2
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(x + 40, y + 9)
          ctx.bezierCurveTo(
            x - 1, y + 44,
            x + 80, y + 51,
            x + 40, y + 87
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.ellipse(
            x + 40, y + 48,
            7, 18,
            0, 0, Math.PI * 2
          )
          ctx.stroke()
        }
      }

      // Faded and worn finish.
      for (let i = 0; i < 1700; i++) {
        ctx.fillStyle =
          'rgba(20,15,12,0.045)'
        ctx.fillRect(
          Math.random() * 512,
          Math.random() * 512,
          Math.random() * 18 + 1,
          Math.random() * 5 + 1
        )
      }
    }, 2, 1)

    const rug = make((ctx) => {
      ctx.fillStyle = '#59383d'
      ctx.fillRect(0, 0, 512, 512)

      ctx.strokeStyle = '#b69b78'
      ctx.lineWidth = 16
      ctx.strokeRect(28, 28, 456, 456)

      ctx.lineWidth = 4
      ctx.strokeRect(54, 54, 404, 404)

      for (let x = 85; x < 465; x += 68) {
        for (let y = 85; y < 465; y += 68) {
          ctx.strokeStyle = '#94736d'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x, y - 18)
          ctx.lineTo(x + 17, y)
          ctx.lineTo(x, y + 18)
          ctx.lineTo(x - 17, y)
          ctx.closePath()
          ctx.stroke()
        }
      }
    })

    const cover = make((ctx) => {
      // Antique ivory cotton.
      ctx.fillStyle = '#b5a594'
      ctx.fillRect(0, 0, 512, 512)

      // Woven fabric threads.
      for (let i = 0; i < 512; i += 4) {
        ctx.fillStyle = 'rgba(255,248,230,0.065)'
        ctx.fillRect(i, 0, 1, 512)

        ctx.fillStyle = 'rgba(63,47,39,0.035)'
        ctx.fillRect(0, i, 512, 1)
      }

      // Faded stripe pattern.
      for (let x = 0; x < 512; x += 65) {
        ctx.fillStyle = 'rgba(94,74,66,0.12)'
        ctx.fillRect(x, 0, 11, 512)
      }

      // Irregular folds.
      for (let i = 0; i < 24; i++) {
        const y = Math.random() * 512

        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(
          110, y - 13,
          300, y + 17,
          512, y - 7
        )

        ctx.strokeStyle = 'rgba(48,35,32,0.14)'
        ctx.lineWidth = 2 + Math.random() * 5
        ctx.stroke()
      }

      // Main dried blood stain.
      const stain = ctx.createRadialGradient(
        335, 290, 6,
        335, 290, 120
      )

      stain.addColorStop(0, 'rgba(56,8,13,0.96)')
      stain.addColorStop(0.35, 'rgba(78,14,18,0.84)')
      stain.addColorStop(0.75, 'rgba(92,26,27,0.43)')
      stain.addColorStop(1, 'rgba(92,26,27,0)')

      ctx.fillStyle = stain
      ctx.beginPath()
      ctx.ellipse(
        335, 290,
        115, 91,
        -0.25, 0, Math.PI * 2
      )
      ctx.fill()

      // Splattered spots around the stain.
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 153

        const x = 335 + Math.cos(angle) * radius
        const y = 290 + Math.sin(angle) * radius
        const r = 2 + Math.random() * 10

        ctx.fillStyle =
          `rgba(69,12,16,${0.25 + Math.random() * 0.55})`

        ctx.beginPath()
        ctx.ellipse(
          x, y, r, r * 0.7,
          Math.random() * 2,
          0, Math.PI * 2
        )
        ctx.fill()
      }
    })

    return { wood, wallpaper, rug, cover }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(textures).forEach(
        (texture) => texture.dispose()
      )
    }
  }, [textures])

  return textures
}

// =====================================================
// BED — TEXTURED BLANKET AND BLOOD
// =====================================================

function HauntedBed({
  cover,
}: {
  cover: THREE.Texture
}) {
  return (
    <group position={[-10.05, 0, 5.35]}>
      {/* Wooden frame */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.41, 0]}
      >
        <boxGeometry args={[2.22, 0.27, 1.53]} />
        <meshStandardMaterial
          color="#3b241c"
          roughness={0.83}
        />
      </mesh>

      {/* Four bedposts */}
      {[-1.06, 1.06].flatMap((x) =>
        [-0.71, 0.71].map((z) => (
          <group
            key={`${x}-${z}`}
            position={[x, 0.48, z]}
          >
            <mesh castShadow>
              <cylinderGeometry
                args={[0.065, 0.095, 0.9, 12]}
              />
              <meshStandardMaterial color="#382219" />
            </mesh>
            <mesh position={[0, 0.46, 0]}>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color="#57392a" />
            </mesh>
          </group>
        ))
      )}

      {/* Mattress */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.64, 0]}
      >
        <boxGeometry args={[1.98, 0.2, 1.33]} />
        <meshStandardMaterial
          color="#c7b7a1"
          roughness={1}
        />
      </mesh>

      {/* Tall antique headboard */}
      <mesh
        castShadow
        position={[-1.08, 1.06, 0]}
      >
        <boxGeometry args={[0.15, 1.42, 1.57]} />
        <meshStandardMaterial color="#321e17" />
      </mesh>

      {/* Headboard trim */}
      {[-0.43, 0, 0.43].map((z) => (
        <mesh
          key={z}
          position={[-0.99, 1.07, z]}
        >
          <boxGeometry args={[0.04, 0.9, 0.32]} />
          <meshStandardMaterial color="#624331" />
        </mesh>
      ))}

      {/* Blanket body */}
      <mesh
        receiveShadow
        castShadow
        position={[0.32, 0.762, 0]}
      >
        <boxGeometry args={[1.31, 0.085, 1.31]} />
        <meshStandardMaterial
          color="#b5a594"
          roughness={1}
        />
      </mesh>

      {/* Top fabric surface:
          blood texture faces UP, not sideways */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.32, 0.811, 0]}
      >
        <planeGeometry args={[1.30, 1.30]} />
        <meshStandardMaterial
          map={cover}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Raised blanket creases */}
      {[0.05, 0.48, 0.81].map((x, i) => (
        <mesh
          key={i}
          castShadow
          position={[x, 0.822, 0]}
          rotation={[
            0,
            i % 2 === 0 ? -0.04 : 0.055,
            i % 2 === 0 ? -0.02 : 0.035,
          ]}
        >
          <boxGeometry args={[0.038, 0.025, 1.28]} />
          <meshStandardMaterial
            color="#8e7d6d"
            roughness={1}
          />
        </mesh>
      ))}

      {/* Pillows with rounded shapes */}
      {[-0.33, 0.33].map((z, i) => (
        <mesh
          key={i}
          castShadow
          position={[-0.70, 0.79, z]}
          rotation={[0, i === 0 ? -0.08 : 0.08, 0]}
          scale={[0.28, 0.095, 0.29]}
        >
          <sphereGeometry args={[1, 20, 14]} />
          <meshStandardMaterial
            color="#d2c3ae"
            roughness={1}
          />
        </mesh>
      ))}

      {/* Lower wooden footboard */}
      <mesh
        castShadow
        position={[1.08, 0.66, 0]}
      >
        <boxGeometry args={[0.12, 0.67, 1.54]} />
        <meshStandardMaterial color="#452a20" />
      </mesh>
    </group>
  )
}

// =====================================================
// ROOM FURNITURE
// =====================================================

function BedroomFurniture({
  cover,
}: {
  cover: THREE.Texture
}) {
  return (
    <group>
      <HauntedBed cover={cover} />

      {/* Desk top — restored missing tabletop */}
      <mesh
        castShadow
        receiveShadow
        position={[-9.8, 0.72, 3.15]}
      >
        <boxGeometry args={[1.7, 0.12, 0.82]} />
        <meshStandardMaterial
          color="#4e3021"
          roughness={0.8}
        />
      </mesh>

      {/* Desk legs */}
      {[
        [-10.52, 2.85],
        [-9.08, 2.85],
        [-10.52, 3.45],
        [-9.08, 3.45],
      ].map(([x, z], i) => (
        <mesh
          key={i}
          castShadow
          position={[x, 0.34, z]}
        >
          <boxGeometry args={[0.11, 0.68, 0.11]} />
          <meshStandardMaterial color="#352219" />
        </mesh>
      ))}

      {/* Desk drawer */}
      <mesh position={[-9.8, 0.55, 2.73]}>
        <boxGeometry args={[0.72, 0.22, 0.04]} />
        <meshStandardMaterial color="#3c271d" />
      </mesh>

      <mesh position={[-9.8, 0.55, 2.698]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color="#b49a60"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Interactive open journal */}
      <group position={[-9.8, 0.81, 3.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.72, 0.045, 0.5]} />
          <meshStandardMaterial color="#553126" />
        </mesh>

        {[-0.17, 0.17].map((x) => (
          <mesh
            key={x}
            position={[x, 0.035, 0]}
            rotation={[0, 0, x < 0 ? 0.055 : -0.055]}
          >
            <boxGeometry args={[0.32, 0.025, 0.43]} />
            <meshStandardMaterial color="#e5d3af" />
          </mesh>
        ))}

        <pointLight
          position={[0, 0.45, 0]}
          color="#f5c47b"
          intensity={1.2}
          distance={1.7}
        />
      </group>

      {/* Brass desk lamp */}
      <group position={[-9.16, 0.8, 3.15]}>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.08, 14]} />
          <meshStandardMaterial
            color="#967344"
            metalness={0.65}
            roughness={0.35}
          />
        </mesh>

        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.55, 10]} />
          <meshStandardMaterial
            color="#a18a67"
            metalness={0.65}
          />
        </mesh>

        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.21, 0.11, 0.3, 16]} />
          <meshStandardMaterial
            color="#e4c999"
            emissive="#c59156"
            emissiveIntensity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>

        <pointLight
          position={[0, 0.64, 0]}
          color="#ffd195"
          intensity={2.6}
          distance={5}
          castShadow
        />
      </group>

      {/* Antique wardrobe */}
      <mesh
        castShadow
        position={[-7.2, 1.09, 6.05]}
      >
        <boxGeometry args={[0.83, 2.18, 1.12]} />
        <meshStandardMaterial
          color="#3b271e"
          roughness={0.83}
        />
      </mesh>

      {/* Wardrobe panels */}
      {[-0.27, 0.27].map((z) => (
        <mesh
          key={z}
          position={[-6.77, 1.12, 6.05 + z]}
        >
          <boxGeometry args={[0.035, 1.8, 0.48]} />
          <meshStandardMaterial color="#5b3a2b" />
        </mesh>
      ))}

      {/* Wardrobe handles */}
      {[-0.11, 0.11].map((z) => (
        <mesh
          key={z}
          position={[-6.74, 1.1, 6.05 + z]}
        >
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial
            color="#c2a36c"
            metalness={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

// =====================================================
// MAIN BEDROOM
// =====================================================

export default function ForgottenBedroom({
  reading,
  onRead,
  onPrompt,
}: Props) {
  const { camera } = useThree()

  const textures = useBedroomTextures()

  const holdingE = useRef(false)
  const lastPressed = useRef(false)
  const cooldown = useRef(0)
  const lastPrompt = useRef<string | null>(null)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'KeyE') {
        holdingE.current = true
      }
    }

    const up = (event: KeyboardEvent) => {
      if (event.code === 'KeyE') {
        holdingE.current = false
      }
    }

    const blur = () => {
      holdingE.current = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      onPrompt(null)
    }
  }, [onPrompt])


useFrame((_, delta) => {
  cooldown.current = Math.max(
    0,
    cooldown.current - delta
  )

  const phonePressed = remote.interact
  const pressed = holdingE.current || phonePressed

  const justPressed =
    pressed && !lastPressed.current

  lastPressed.current = pressed

  // Hide prompts while the journal is open.
  if (reading) {
    if (lastPrompt.current !== null) {
      lastPrompt.current = null
      onPrompt(null)
    }

    return
  }

  // Walk into the bedroom normally with WASD.
  // E is used ONLY to interact with the journal.

  const p = camera.position

  const nearJournal =
    p.distanceTo(JOURNAL) < 1.5

  const prompt = nearJournal
    ? 'E / INTERACT — Read the journal'
    : null

  if (prompt !== lastPrompt.current) {
    lastPrompt.current = prompt
    onPrompt(prompt)
  }

  if (
    nearJournal &&
    justPressed &&
    cooldown.current <= 0
  ) {
    onRead()
    cooldown.current = 0.7

    if (phonePressed) {
      remote.interact = false
    }
  }
})

  return (
    <group>
      {/* ============================================ */}
      {/* FLOOR AND CEILING */}
      {/* ============================================ */}

      <mesh
        receiveShadow
        position={[-9, -0.08, 4.5]}
      >
        <boxGeometry args={[5.7, 0.16, 5.7]} />
        <meshStandardMaterial
          color="#483326"
          roughness={0.95}
        />
      </mesh>

      {/* Wood-textured floor surface */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-9, 0.008, 4.5]}
      >
        <planeGeometry args={[5.55, 5.55]} />
        <meshStandardMaterial
          map={textures.wood}
          roughness={0.92}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[-9, 2.75, 4.5]}>
        <boxGeometry args={[5.7, 0.18, 5.7]} />
        <meshStandardMaterial color="#776656" />
      </mesh>

      {/* ============================================ */}
      {/* WALLS */}
      {/* ============================================ */}

      {/* West wall */}
      <mesh
        receiveShadow
        position={[-11.8, 1.35, 4.5]}
      >
        <boxGeometry args={[0.2, 2.7, 5.7]} />
        <meshStandardMaterial color="#665449" />
      </mesh>

      {/* West wallpaper */}
      <mesh
        position={[-11.685, 1.35, 4.5]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[5.5, 2.7]} />
        <meshStandardMaterial
          map={textures.wallpaper}
          roughness={1}
        />
      </mesh>

      {/* North wall */}
      <mesh position={[-9, 1.35, 7.3]}>
        <boxGeometry args={[5.7, 2.7, 0.2]} />
        <meshStandardMaterial color="#665449" />
      </mesh>

      <mesh
        position={[-9, 1.35, 7.185]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[5.5, 2.7]} />
        <meshStandardMaterial
          map={textures.wallpaper}
          roughness={1}
        />
      </mesh>

      {/* South wall */}
      <mesh position={[-9, 1.35, 1.7]}>
        <boxGeometry args={[5.7, 2.7, 0.2]} />
        <meshStandardMaterial color="#665449" />
      </mesh>

      <mesh position={[-9, 1.35, 1.815]}>
        <planeGeometry args={[5.5, 2.7]} />
        <meshStandardMaterial
          map={textures.wallpaper}
          roughness={1}
        />
      </mesh>

      {/* ============================================ */}
      {/* EAST WALL — OPEN, NO DOOR */}
      {/* ============================================ */}

      {/* Lower-z wall section */}
      <mesh position={[-6.2, 1.35, 2.6]}>
        <boxGeometry args={[0.2, 2.7, 1.9]} />
        <meshStandardMaterial
          color="#665449"
          roughness={1}
        />
      </mesh>

      {/* Higher-z wall section */}
      <mesh position={[-6.2, 1.35, 6.4]}>
        <boxGeometry args={[0.2, 2.7, 1.9]} />
        <meshStandardMaterial
          color="#665449"
          roughness={1}
        />
      </mesh>

      {/* Header above the open entrance */}
      <mesh position={[-6.2, 2.44, 4.5]}>
        <boxGeometry args={[0.2, 0.52, 1.9]} />
        <meshStandardMaterial color="#59463b" />
      </mesh>

      {/* Wooden trim around open passage */}
      {[3.55, 5.45].map((z) => (
        <mesh
          key={z}
          position={[-6.1, 1.15, z]}
        >
          <boxGeometry args={[0.13, 2.3, 0.11]} />
          <meshStandardMaterial
            color="#332119"
            roughness={0.8}
          />
        </mesh>
      ))}

      <mesh position={[-6.1, 2.3, 4.5]}>
        <boxGeometry args={[0.13, 0.12, 1.95]} />
        <meshStandardMaterial color="#332119" />
      </mesh>

      {/* ============================================ */}
      {/* ANTIQUE PATTERNED RUG */}
      {/* ============================================ */}

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-9.1, 0.025, 4.55]}
      >
        <planeGeometry args={[3.1, 2.1]} />
        <meshStandardMaterial
          map={textures.rug}
          roughness={1}
        />
      </mesh>

      {/* ============================================ */}
      {/* FURNITURE */}
      {/* ============================================ */}

      <BedroomFurniture cover={textures.cover} />

      {/* ============================================ */}
      {/* WARM LIGHTING */}
      {/* ============================================ */}

      <ambientLight
        color="#c9a382"
        intensity={0.2}
      />

      <pointLight
        position={[-9.5, 2.25, 4.5]}
        color="#ffc98c"
        intensity={4.1}
        distance={8}
        decay={2}
      />

      {/* Antique ceiling bulb */}
      <mesh position={[-9.5, 2.52, 4.5]}>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshStandardMaterial
          color="#fff0c2"
          emissive="#ffc77b"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Subtle light near the open passage */}
      <pointLight
        position={[-6.7, 1.85, 4.5]}
        color="#f1bc83"
        intensity={0.9}
        distance={3}
      />
    </group>
  )
}
