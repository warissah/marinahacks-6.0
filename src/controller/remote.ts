
import { io, type Socket } from 'socket.io-client'

export const RELAY: string =
  import.meta.env.VITE_RELAY_URL ?? 'http://localhost:3001'

export type GameMode = 'explore' | 'banish' | 'won'

let sock: Socket | null = null

// The game reads phone input from this object.
export const remote = {
  connected: false,

  // Joystick
  moveX: 0,
  moveY: 0,

  // Absolute camera angles from the phone.
  yaw: 0,
  pitch: 0,

  // Last angles applied to the laptop camera.
  lastYaw: 0,
  lastPitch: 0,
  fresh: true,

  // Gyroscope banishment
  aiming: false,
  aimYaw: 0,
  aimPitch: 0,

  // Buttons
  interact: false,
  flashlight: false,
  banish: false,

  // Diagnostics
  rtt: 0,
  pps: 0,
}

function resetRemote() {
  remote.connected = false
  remote.moveX = 0
  remote.moveY = 0

  remote.yaw = 0
  remote.pitch = 0
  remote.lastYaw = 0
  remote.lastPitch = 0
  remote.fresh = true

  remote.aiming = false
  remote.aimYaw = 0
  remote.aimPitch = 0

  remote.interact = false
  remote.flashlight = false
  remote.banish = false

  remote.rtt = 0
  remote.pps = 0
}

export function sendLock(value: boolean) {
  sock?.emit('lock', value)
}

export function setPhoneMode(mode: GameMode) {
  sock?.emit('mode', mode)
}

export function startHost(
  room: string,
  onStatus: (connected: boolean) => void,
  onError?: (message: string) => void
) {
  sock?.disconnect()
  resetRemote()

  const s = io(RELAY, {
    transports: ['websocket'],
    timeout: 10000,
    reconnection: true,
  })

  sock = s

  let packets = 0

  const packetTimer = window.setInterval(() => {
    remote.pps = packets
    packets = 0
  }, 1000)

  const pingTimer = window.setInterval(() => {
    if (remote.connected && s.connected) {
      s.emit('ping', performance.now())
    }
  }, 1000)

  s.on('connect', () => {
    s.emit('host', room, (result: { ok: boolean }) => {
      if (result?.ok) {
        onError?.('')
      } else {
        onError?.('Could not register room.')
      }
    })
  })

  s.on('connect_error', (error) => {
    onError?.(error.message)
  })

  s.on('phone-connected', () => {
    remote.connected = true
    remote.fresh = true
    remote.moveX = 0
    remote.moveY = 0
    remote.interact = false
    remote.banish = false

    onStatus(true)
  })

  function phoneLeft() {
    resetRemote()
    onStatus(false)
  }

  s.on('peer-left', phoneLeft)
  s.on('phone-disconnected', phoneLeft)

  s.on('pong', (time: number) => {
    remote.rtt = Math.round(performance.now() - time)
  })

  s.on('input', (data: number[]) => {
    if (!remote.connected || !Array.isArray(data)) return

    if (
      data.length < 4 ||
      !data.slice(0, 4).every(
        (v) => typeof v === 'number' && Number.isFinite(v)
      )
    ) {
      return
    }

    packets++

    remote.moveX = THREEClamp(data[0])
    remote.moveY = THREEClamp(data[1])

    // Original phone-test system:
    // the phone sends angles, not touch pixel deltas.
    remote.yaw = data[2]
    remote.pitch = data[3]

    remote.aiming = data[4] === 1
    remote.aimYaw = data[5] ?? 0
    remote.aimPitch = data[6] ?? 0

    if (remote.fresh) {
      remote.lastYaw = remote.yaw
      remote.lastPitch = remote.pitch
      remote.fresh = false
    }
  })

  s.on(
    'btn',
    (data: {
      n: 'interact' | 'flashlight' | 'banish'
      d: boolean
    }) => {
      if (
        data.n === 'interact' ||
        data.n === 'flashlight' ||
        data.n === 'banish'
      ) {
        remote[data.n] = data.d
      }
    }
  )

  s.on('disconnect', phoneLeft)

  return () => {
    window.clearInterval(packetTimer)
    window.clearInterval(pingTimer)

    s.disconnect()

    if (sock === s) {
      sock = null
      resetRemote()
    }
  }
}

function THREEClamp(value: number) {
  return Math.max(-1, Math.min(1, value))
}
