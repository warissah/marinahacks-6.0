import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { startHost } from './remote'

const ROOM = Math.random().toString(36).slice(2, 6).toUpperCase()

export default function PhoneConnection() {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  // Connect laptop to the Socket.IO relay.
  useEffect(() => {
    return startHost(ROOM, setConnected, setError)
  }, [])

  // Always use the website currently hosting the game.
  // On Vercel, this becomes your Vercel domain.
  // On localhost, this becomes your local development URL.
  const base = window.location.origin.replace(/\/$/, '')
  const phoneUrl = `${base}/?c=${ROOM}`

  return (
    <div className="phone-connection">
      <div className="phone-connection-info">
        <p className="phone-connection-label">JOIN ROOM</p>

        <h2 className="phone-connection-room">{ROOM}</h2>

        <p className="phone-connection-status">
          {connected ? 'PHONE CONNECTED' : 'WAITING FOR PHONE'}
        </p>

        {error && <p className="phone-connection-error">{error}</p>}
      </div>

      <div className="phone-connection-qr">
        <QRCodeSVG
          value={phoneUrl}
          size={144}
          bgColor="#ffffff"
          fgColor="#000000"
          marginSize={2}
        />
      </div>
    </div>
  )
}