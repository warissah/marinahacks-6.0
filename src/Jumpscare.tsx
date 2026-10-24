
import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

function ScareGhost() {
  const { scene, animations } = useGLTF('/models/ghost.glb')
  const model = useMemo(() => clone(scene), [scene])

  const { scale, offset } = useMemo(() => {
    model.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    const s = 2.7 / Math.max(size.y, 0.001)

    return {
      scale: s,
      offset: [
        -center.x * s,
        -center.y * s,
        -center.z * s,
      ] as [number, number, number],
    }
  }, [model])

  const { actions, names } = useAnimations(animations, model)

  useEffect(() => {
    const name =
      names.find((n) =>
        /attack|scream|scare/i.test(n)
      ) ??
      names.find((n) =>
        n.toLowerCase().includes('stalking2')
      ) ??
      names[0]

    const action = name ? actions[name] : undefined
    action?.reset().play()

    return () => {
      action?.stop()
    }
  }, [actions, names])

  return (
    <group position={offset}>
      <group scale={scale}>
        <primitive object={model} />
      </group>
    </group>
  )
}

export default function Jumpscare({
  active,
}: {
  active: boolean
}) {
  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 180,
        background: '#100006',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          @keyframes phantomScareShake {
            0% { transform: translate(0,0) scale(1); }
            15% { transform: translate(-18px,10px) scale(1.12); }
            30% { transform: translate(15px,-15px) scale(1.18); }
            50% { transform: translate(-10px,12px) scale(1.23); }
            75% { transform: translate(12px,-8px) scale(1.2); }
            100% { transform: translate(0,0) scale(1.12); }
          }

          @keyframes phantomScareFlash {
            0%, 25%, 65%, 100% { opacity: 0.1; }
            10%, 45%, 80% { opacity: 0.58; }
          }
        `}
      </style>

      <div
        style={{
          width: '100%',
          height: '100%',
          animation:
            'phantomScareShake 0.18s linear infinite',
        }}
      >
        <Canvas
          camera={{
            position: [0, 0.15, 1.6],
            fov: 55,
            near: 0.05,
            far: 20,
          }}
          dpr={1}
          gl={{ antialias: false }}
        >
          <color attach="background" args={['#100006']} />
          <ambientLight color="#b84f67" intensity={2} />
          <pointLight
            position={[0, 1.1, 2]}
            color="#ff1848"
            intensity={12}
          />
          <pointLight
            position={[-1, 0, -2]}
            color="#e1d8e3"
            intensity={5}
          />
          <ScareGhost />
        </Canvas>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#c6002b',
          mixBlendMode: 'screen',
          animation:
            'phantomScareFlash 0.16s linear infinite',
        }}
      />
    </div>
  )
}
