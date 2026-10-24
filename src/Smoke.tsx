import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type V3 = [number, number, number]

// soft puff made from overlapping blurry circles
function puffTexture() {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  for (let i = 0; i < 14; i++) {
    const x = S / 2 + (Math.random() - 0.5) * S * 0.4
    const y = S / 2 + (Math.random() - 0.5) * S * 0.4
    const r = S * (0.18 + Math.random() * 0.12)
    const gr = g.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, 'rgba(255,255,255,0.35)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, S, S)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

type Props = {
  center: V3
  size: V3
  count?: number
  color?: string
  opacity?: number
  puff?: number // bigger = larger puffs
}

export default function Smoke({ center, size, count = 40, color = '#c07a78', opacity = 0.14, puff = 1 }: Props) {
  const tex = useMemo(puffTexture, [])
  const refs = useRef<(THREE.Sprite | null)[]>([])

  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * size[0],
        y: Math.random() * size[1],
        z: (Math.random() - 0.5) * size[2],
        vx: (Math.random() - 0.5) * 0.12,
        vy: 0.03 + Math.random() * 0.07,
        vz: (Math.random() - 0.5) * 0.12,
        s: (1.6 + Math.random() * 1.8) * puff,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 0.15,
        age: Math.random() * 10,
        life: 8 + Math.random() * 6,
      })),
    [count, size, puff],
  )

  useFrame((_, dt) => {
    parts.forEach((p, i) => {
      const sprite = refs.current[i]
      if (!sprite) return
      p.age += dt
      if (p.age > p.life || p.y > size[1]) {
        p.age = 0
        p.x = (Math.random() - 0.5) * size[0]
        p.y = Math.random() * 0.3
        p.z = (Math.random() - 0.5) * size[2]
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      const k = p.age / p.life
      const fade = Math.sin(Math.PI * k) // fades in, then out
      sprite.position.set(center[0] + p.x, center[1] - size[1] / 2 + p.y, center[2] + p.z)
      sprite.scale.setScalar(p.s * (0.8 + k * 0.8))
      const m = sprite.material as THREE.SpriteMaterial
      m.opacity = opacity * fade
      m.rotation = p.rot + p.spin * p.age
    })
  })

  return (
    <group>
      {parts.map((_, i) => (
        <sprite key={i} ref={(el) => { refs.current[i] = el }}>
          <spriteMaterial map={tex} color={color} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  )
}