
import { useMemo } from 'react'
import * as THREE from 'three'

function createTexture(
  draw: (ctx: CanvasRenderingContext2D) => void,
  repeatX = 1,
  repeatY = 1
) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.colorSpace = THREE.SRGBColorSpace

  return texture
}

export default function BedroomTextures() {
  const wood = useMemo(
    () =>
      createTexture((ctx) => {
        ctx.fillStyle = '#4b3024'
        ctx.fillRect(0, 0, 512, 512)

        for (let i = 0; i < 16; i++) {
          const y = i * 32

          ctx.fillStyle =
            i % 2 === 0 ? '#604030' : '#39251d'

          ctx.fillRect(0, y, 512, 31)

          ctx.strokeStyle = '#251814'
          ctx.lineWidth = 2
          ctx.strokeRect(0, y, 512, 32)

          // Fine wood grain.
          for (let j = 0; j < 12; j++) {
            ctx.strokeStyle = 'rgba(9,5,3,0.12)'
            ctx.lineWidth = 1

            ctx.beginPath()
            ctx.moveTo(Math.random() * 512, y + Math.random() * 30)
            ctx.lineTo(Math.random() * 512, y + Math.random() * 30)
            ctx.stroke()
          }
        }
      }, 2, 2),
    []
  )

  const wallpaper = useMemo(
    () =>
      createTexture((ctx) => {
        ctx.fillStyle = '#786653'
        ctx.fillRect(0, 0, 512, 512)

        for (let y = 0; y < 512; y += 80) {
          for (let x = 0; x < 512; x += 80) {
            ctx.strokeStyle = 'rgba(46,31,31,0.26)'
            ctx.lineWidth = 3

            ctx.beginPath()
            ctx.ellipse(
              x + 40, y + 40,
              19, 30, 0, 0, Math.PI * 2
            )
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(x + 40, y + 11)
            ctx.lineTo(x + 40, y + 69)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(x + 20, y + 40)
            ctx.lineTo(x + 60, y + 40)
            ctx.stroke()
          }
        }
      }, 3, 2),
    []
  )

  const carpet = useMemo(
    () =>
      createTexture((ctx) => {
        ctx.fillStyle = '#653d3d'
        ctx.fillRect(0, 0, 512, 512)

        ctx.strokeStyle = '#b39674'
        ctx.lineWidth = 12
        ctx.strokeRect(30, 30, 452, 452)

        ctx.lineWidth = 3
        ctx.strokeRect(54, 54, 404, 404)

        for (let x = 80; x < 450; x += 60) {
          for (let y = 80; y < 450; y += 60) {
            ctx.strokeStyle = '#9e7771'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(x, y - 12)
            ctx.lineTo(x + 12, y)
            ctx.lineTo(x, y + 12)
            ctx.lineTo(x - 12, y)
            ctx.closePath()
            ctx.stroke()
          }
        }
      }),
    []
  )

  return (
    <group>
      {/* Textured wood floor */}
      <mesh
        position={[-9, 0.005, 4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[5.6, 5.6]} />
        <meshStandardMaterial
          map={wood}
          roughness={0.9}
        />
      </mesh>

      {/* Textured south wall */}
      <mesh position={[-9, 1.35, 1.81]}>
        <planeGeometry args={[5.5, 2.7]} />
        <meshStandardMaterial
          map={wallpaper}
          roughness={1}
        />
      </mesh>

      {/* Textured north wall */}
      <mesh
        position={[-9, 1.35, 7.19]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[5.5, 2.7]} />
        <meshStandardMaterial
          map={wallpaper}
          roughness={1}
        />
      </mesh>

      {/* West wall */}
      <mesh
        position={[-11.69, 1.35, 4.5]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[5.5, 2.7]} />
        <meshStandardMaterial
          map={wallpaper}
          roughness={1}
        />
      </mesh>

      {/* Antique rug */}
      <mesh
        position={[-9.25, 0.032, 4.6]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3.2, 2.15]} />
        <meshStandardMaterial
          map={carpet}
          roughness={1}
        />
      </mesh>
    </group>
  )
}
