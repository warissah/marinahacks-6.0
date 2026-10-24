
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { io, type Socket } from 'socket.io-client'
import * as THREE from 'three'
import { RELAY } from './remote'

const D2R = Math.PI / 180

// Gyroscope math from the original phone test.
const euler = new THREE.Euler()
const qNow = new THREE.Quaternion()
const qSm = new THREE.Quaternion()
const qStart = new THREE.Quaternion()
const qRel = new THREE.Quaternion()
const qFix = new THREE.Quaternion(
  -Math.SQRT1_2,
  0,
  0,
  Math.SQRT1_2
)
const qScr = new THREE.Quaternion()
const ZEE = new THREE.Vector3(0, 0, 1)
const FWD = new THREE.Vector3()

const CSS = `
html,body {
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
}
.pad {
  position: fixed;
  inset: 0;
  background: #0b0d11;
  color: #e8ecf2;
  font: 600 14px system-ui;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  overflow: hidden;
}
.pad.lk {
  box-shadow: inset 0 0 0 8px #d03030;
}
.zl {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 42%;
  touch-action: none;
}
.zr {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 58%;
  touch-action: none;
}
.hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #778394;
  font-size: 13px;
  pointer-events: none;
  text-align: center;
}
.aimhint {
  position: absolute;
  left: 50%;
  top: 44%;
  transform: translate(-50%,-50%);
  color: #e8ecf2;
  font-size: 20px;
  pointer-events: none;
  z-index: 5;
  text-align: center;
}
.base {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 2px solid #3a4452;
  background: #12161c;
  transform: translate(-50%,-50%);
  opacity: 0.65;
  pointer-events: none;
}
.knob {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 62px;
  height: 62px;
  margin: -31px 0 0 -31px;
  border-radius: 50%;
  background: #46515f;
}
.b {
  position: absolute;
  border-radius: 20px;
  border: 2px solid #3a4452;
  background: #161b22;
  color: inherit;
  font: inherit;
  z-index: 3;
  touch-action: none;
}
.b.on {
  background: #7a1f1f;
  border-color: #c24040;
}
.inter {
  right: max(18px,env(safe-area-inset-right));
  bottom: max(18px,env(safe-area-inset-bottom));
  width: 150px;
  height: 96px;
  font-size: 17px;
}
.flash {
  right: max(18px,env(safe-area-inset-right));
  bottom: calc(max(18px,env(safe-area-inset-bottom)) + 112px);
  width: 110px;
  height: 56px;
}
.ban {
  left: max(18px,env(safe-area-inset-left));
  bottom: max(18px,env(safe-area-inset-bottom));
  width: 140px;
  height: 100px;
  font-size: 17px;
}
.top {
  position: absolute;
  top: max(8px,env(safe-area-inset-top));
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 4;
  flex-wrap: wrap;
}
.chip {
  padding: 6px 11px;
  border-radius: 99px;
  background: #161b22;
  border: 1px solid #3a4452;
  font-size: 13px;
  color: #e8ecf2;
}
.center {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
  background: #0b0d11;
  color: #e8ecf2;
  font: 16px system-ui;
}
.go {
  padding: 18px 32px;
  border-radius: 16px;
  border: 0;
  background: #c24040;
  color: #fff;
  font: 700 18px system-ui;
}
.rot {
  display: none;
}
@media (orientation: portrait) {
  .rot {
    display: grid;
    position: fixed;
    inset: 0;
    place-items: center;
    background: #0b0d11;
    color: #e8ecf2;
    font: 18px system-ui;
    z-index: 9;
    text-align: center;
    padding: 24px;
  }
}
`

export default function Controller({
  room,
}: {
  room: string
}) {
  const [phase, setPhase] =
    useState<'start' | 'live' | 'error'>('start')

  const [msg, setMsg] = useState('')
  const [sens, setSens] = useState(1)
  const [invert, setInvert] = useState(false)
  const [motion, setMotion] = useState(false)
  const [locked, setLocked] = useState(false)

  const [lit, setLit] = useState({
    interact: false,
    banish: false,
    flashlight: false,
  })

  const sock = useRef<Socket | null>(null)

  // Original controller state:
  // yaw and pitch are in radians.
  const st = useRef({
    mx: 0,
    my: 0,
    yaw: 0,
    pitch: 0,
  })

  const cfg = useRef({
    sens: 1,
    invert: false,
  })

  const haveMotion = useRef(false)
  const aimOn = useRef(false)

  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)

  const stick = useRef({
    x: 0,
    y: 0,
    id: -1,
  })

  const look = useRef({
    x: 0,
    y: 0,
    id: -1,
  })

  const downs = useRef<Record<string, boolean>>({})

  useEffect(() => {
    cfg.current = { sens, invert }
  }, [sens, invert])

  async function start() {
    setMsg('Requesting motion permission...')

    try {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        const DOE = DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<string>
        }

        if (typeof DOE.requestPermission === 'function') {
          const result = await DOE.requestPermission()

          if (result !== 'granted') {
            setMsg('Motion denied. Connecting without gyro...')
          }
        }
      }
    } catch (error) {
      console.warn('Motion permission:', error)
    }

    sock.current?.disconnect()
    setMsg(`Connecting to ${RELAY}...`)

    const s = io(RELAY, {
      transports: ['websocket'],
      timeout: 10000,
      reconnection: false,
    })

    sock.current = s

    s.on('connect_error', (error) => {
      console.error('Connection failed:', error)
      setMsg(`FAILED: ${error.message}`)
      setPhase('error')
    })

    s.on('connect', () => {
      setMsg('Relay connected. Joining room...')

      s.timeout(5000).emit(
        'join',
        room,
        (
          error: Error | null,
          response: { ok: boolean }
        ) => {
          if (error) {
            setMsg('Room join timed out.')
            setPhase('error')
            return
          }

          if (response?.ok) {
            st.current = {
              mx: 0,
              my: 0,
              yaw: 0,
              pitch: 0,
            }

            setMsg('')
            setPhase('live')
          } else {
            setMsg('Room not found. Refresh the laptop game.')
            setPhase('error')
          }
        }
      )
    })

    s.on('lock', (value: boolean) => {
      setLocked(value)
    })

    s.on('ping', (time: number) => {
      s.emit('pong', time)
    })

    s.on('host-disconnected', () => {
      setMsg('Laptop disconnected. Reconnect to continue.')
      setPhase('error')
    })

    s.on('disconnect', () => {
      setMsg('Controller disconnected.')
      setPhase('error')
    })
  }

  // -----------------------------------------
  // GYROSCOPE + INPUT SENDING
  // -----------------------------------------

  useEffect(() => {
    if (phase !== 'live') return

    const preventGesture = (e: Event) => {
      e.preventDefault()
    }

    document.addEventListener(
      'gesturestart',
      preventGesture
    )

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null) return

      const orient =
        screen.orientation?.angle ??
        (
          window as unknown as {
            orientation?: number
          }
        ).orientation ??
        0

      euler.set(
        (e.beta ?? 0) * D2R,
        (e.alpha ?? 0) * D2R,
        -(e.gamma ?? 0) * D2R,
        'YXZ'
      )

      qNow.setFromEuler(euler)
      qNow.multiply(qFix)

      qNow.multiply(
        qScr.setFromAxisAngle(
          ZEE,
          -orient * D2R
        )
      )

      if (!haveMotion.current) {
        qSm.copy(qNow)
        haveMotion.current = true
        setMotion(true)
      } else {
        qSm.slerp(qNow, 0.4)
      }
    }

    window.addEventListener(
      'deviceorientation',
      onOrientation
    )

    const timer = window.setInterval(() => {
      const a = st.current

      let aimYaw = 0
      let aimPitch = 0

      if (aimOn.current && haveMotion.current) {
        qRel.copy(qStart).invert().multiply(qSm)

        FWD.set(0, 0, -1).applyQuaternion(qRel)

        aimYaw = Math.atan2(
          -FWD.x,
          -FWD.z
        )

        aimPitch = Math.asin(
          THREE.MathUtils.clamp(FWD.y, -1, 1)
        )
      }

      // Original phone-test network format.
      sock.current?.volatile.emit('input', [
        a.mx,
        a.my,
        a.yaw,
        a.pitch,
        aimOn.current && haveMotion.current ? 1 : 0,
        aimYaw,
        aimPitch,
      ])
    }, 33)

    return () => {
      document.removeEventListener(
        'gesturestart',
        preventGesture
      )

      window.removeEventListener(
        'deviceorientation',
        onOrientation
      )

      window.clearInterval(timer)
    }
  }, [phase])

  useEffect(() => {
    return () => {
      sock.current?.disconnect()
    }
  }, [])

  // -----------------------------------------
  // FLOATING JOYSTICK
  // -----------------------------------------

  const R = 60

  const stickDown = (
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (stick.current.id !== -1) return

    const rect =
      e.currentTarget.getBoundingClientRect()

    stick.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
    }

    e.currentTarget.setPointerCapture(e.pointerId)

    if (base.current) {
      base.current.style.left =
        e.clientX - rect.left + 'px'

      base.current.style.top =
        e.clientY - rect.top + 'px'

      base.current.style.opacity = '1'
    }
  }

  const stickMove = (
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (e.pointerId !== stick.current.id) return

    let dx = e.clientX - stick.current.x
    let dy = e.clientY - stick.current.y

    const length = Math.hypot(dx, dy)

    if (length > R) {
      dx = (dx / length) * R
      dy = (dy / length) * R
    }

    st.current.mx = dx / R
    st.current.my = -dy / R

    if (knob.current) {
      knob.current.style.transform =
        `translate(${dx}px, ${dy}px)`
    }
  }

  const stickUp = (
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (e.pointerId !== stick.current.id) return

    stick.current.id = -1

    st.current.mx = 0
    st.current.my = 0

    if (knob.current) {
      knob.current.style.transform =
        'translate(0,0)'
    }

    if (base.current) {
      base.current.style.left = '50%'
      base.current.style.top = '58%'
      base.current.style.opacity = '.65'
    }
  }

  // -----------------------------------------
  // DRAG TO LOOK
  // -----------------------------------------

  const lookDown = (
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (look.current.id !== -1) return

    look.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
    }

    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const lookMove = (
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (e.pointerId !== look.current.id) return

    const dx = e.clientX - look.current.x
    const dy = e.clientY - look.current.y

    look.current.x = e.clientX
    look.current.y = e.clientY

    const sensitivity =
      0.005 * cfg.current.sens

    st.current.yaw += dx * sensitivity

    st.current.pitch = THREE.MathUtils.clamp(
      st.current.pitch -
        dy *
        sensitivity *
        (cfg.current.invert ? -1 : 1),
      -1.4,
      1.4
    )
  }

  const lookUp = (
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (e.pointerId === look.current.id) {
      look.current.id = -1
    }
  }

  // -----------------------------------------
  // BUTTONS
  // -----------------------------------------

  const send = (
    name: string,
    down: boolean
  ) => {
    sock.current?.emit('btn', {
      n: name,
      d: down,
    })
  }

  const hold = (
    name: 'interact' | 'banish',
    onDown?: () => void,
    onUp?: () => void
  ) => {
    const off = () => {
      if (!downs.current[name]) return

      downs.current[name] = false
      send(name, false)

      setLit((previous) => ({
        ...previous,
        [name]: false,
      }))

      onUp?.()
    }

    return {
      onPointerDown: (
        e: ReactPointerEvent<HTMLButtonElement>
      ) => {
        e.currentTarget.setPointerCapture(e.pointerId)

        downs.current[name] = true

        onDown?.()
        send(name, true)

        setLit((previous) => ({
          ...previous,
          [name]: true,
        }))

        navigator.vibrate?.(25)
      },
      onPointerUp: off,
      onPointerCancel: off,
      onLostPointerCapture: off,
    }
  }

  const banishProps = hold(
    'banish',
    () => {
      qStart.copy(qSm)
      aimOn.current = true
    },
    () => {
      aimOn.current = false
    }
  )

  const interactProps = hold('interact')

  const toggleFlash = () => {
    const enabled = !lit.flashlight

    setLit((previous) => ({
      ...previous,
      flashlight: enabled,
    }))

    send('flashlight', enabled)
  }

  // -----------------------------------------
  // CONNECTION SCREEN
  // -----------------------------------------

  if (phase !== 'live') {
    return (
      <div className="center">
        <style>{CSS}</style>

        <div>
          <h2>PHANTOM controller</h2>
          <p>Room {room}</p>

          <button className="go" onClick={start}>
            {phase === 'error'
              ? 'Try again'
              : 'Connect'}
          </button>

          <p style={{ color: '#9aa4b2' }}>
            {msg}
          </p>
        </div>
      </div>
    )
  }

  // -----------------------------------------
  // PHONE CONTROLLER SCREEN
  // -----------------------------------------

  return (
    <div className={'pad' + (locked ? ' lk' : '')}>
      <style>{CSS}</style>

      <div className="rot">
        Rotate your phone to landscape
      </div>

      {/* Sensitivity and gyro controls */}
      <div className="top">
        <button
          className="chip"
          onClick={() =>
            setSens((s) =>
              Math.max(0.4, +(s - 0.2).toFixed(1))
            )
          }
        >
          Sens −
        </button>

        <span className="chip">
          {sens.toFixed(1)}
        </span>

        <button
          className="chip"
          onClick={() =>
            setSens((s) =>
              Math.min(2.4, +(s + 0.2).toFixed(1))
            )
          }
        >
          Sens +
        </button>

        <button
          className="chip"
          onClick={() => setInvert((v) => !v)}
        >
          Invert Y: {invert ? 'on' : 'off'}
        </button>

        <span className="chip">
          gyro: {motion ? 'ok' : 'off'}
        </span>
      </div>

      {/* Joystick */}
      <div
        className="zl"
        onPointerDown={stickDown}
        onPointerMove={stickMove}
        onPointerUp={stickUp}
        onPointerCancel={stickUp}
      >
        <div
          className="base"
          ref={base}
          style={{
            left: '50%',
            top: '58%',
          }}
        >
          <div className="knob" ref={knob} />
        </div>

        <div
          className="hint"
          style={{ top: '30%' }}
        >
          MOVE
        </div>
      </div>

      {/* Camera dragging area */}
      <div
        className="zr"
        onPointerDown={lookDown}
        onPointerMove={lookMove}
        onPointerUp={lookUp}
        onPointerCancel={lookUp}
      >
        <div
          className="hint"
          style={{ top: '38%' }}
        >
          DRAG TO LOOK
        </div>
      </div>

      {/* Banishment feedback */}
      {lit.banish && (
        <div className="aimhint">
          {locked
            ? 'LOCKED ON. HOLD STEADY'
            : 'POINT AT THE GHOST'}
        </div>
      )}

      <button
        className={
          'b ban' + (lit.banish ? ' on' : '')
        }
        {...banishProps}
      >
        BANISH
      </button>

      <button
        className={
          'b flash' + (lit.flashlight ? ' on' : '')
        }
        onClick={toggleFlash}
      >
        LIGHT
      </button>

      <button
        className={
          'b inter' + (lit.interact ? ' on' : '')
        }
        {...interactProps}
      >
        INTERACT
      </button>
    </div>
  )
}
