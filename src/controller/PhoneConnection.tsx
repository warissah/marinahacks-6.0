
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { startHost } from './remote'

const ROOM = Math.random()
  .toString(36)
  .slice(2, 6)
  .toUpperCase()

export default function PhoneConnection() {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return startHost(ROOM, setConnected, setError)
  }, [])

  const base = (
    import.meta.env.VITE_PUBLIC_URL ||
    window.location.origin
  ).replace(/\/$/, '')

  const phoneUrl = `${base}/?c=${ROOM}`

  return (
    <div className="phantom-room-layout">
      {/* LEFT: ROOM INFORMATION */}
      <div className="phantom-room-info">
        <div className="phantom-room-label">
          JOIN ROOM
        </div>

        <div className="phantom-room-code">
          {ROOM}
        </div>

        <p className="phantom-room-instructions">
          Scan the code with your iPhone
          to connect your controller.
        </p>

        <div
          className="phantom-room-status"
          style={{
            color: connected ? '#90dba8' : '#bea6ae',
          }}
        >
          <span
            className="phantom-status-dot"
            style={{
              background: connected
                ? '#7dd99c'
                : '#bf886e',
            }}
          />

          {connected
            ? 'PHONE CONNECTED'
            : 'WAITING FOR CONTROLLER'}
        </div>

        {error && (
          <p className="phantom-room-error">
            {error}
          </p>
        )}
      </div>

      {/* RIGHT: QR CODE */}
      <div className="phantom-room-qr">
        <QRCodeSVG
          value={phoneUrl}
          size={175}
          bgColor="#ffffff"
          fgColor="#171015"
          level="H"
          marginSize={1}
        />
      </div>
    </div>
  )
}
