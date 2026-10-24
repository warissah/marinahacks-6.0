
import { useEffect, useState } from 'react'

type Props = {
  artifactsReady: boolean
  unlocked: boolean
  nearby: boolean
  progress: number
}

export default function RitualHUD({
  artifactsReady,
  unlocked,
  nearby,
  progress,
}: Props) {
  const [showUnlocked, setShowUnlocked] = useState(false)

  useEffect(() => {
    if (!unlocked) return

    setShowUnlocked(true)

    const timer = window.setTimeout(() => {
      setShowUnlocked(false)
    }, 4000)

    return () => window.clearTimeout(timer)
  }, [unlocked])

  const boxStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    bottom: 110,
    transform: 'translateX(-50%)',
    zIndex: 80,
    background: 'rgba(12, 7, 17, 0.94)',
    color: '#f5c6d1',
    border: '1px solid #a94d65',
    borderRadius: 12,
    padding: '16px 24px',
    textAlign: 'center',
    fontFamily: 'Georgia, serif',
    boxShadow: '0 0 30px #8e183544',
    pointerEvents: 'none',
    minWidth: 260,
  }

  return (
    <>
      {artifactsReady && !unlocked && nearby && (
        <div style={boxStyle}>
          <div
            style={{
              letterSpacing: 2,
              fontSize: 15,
            }}
          >
            AWAKEN THE ALTAR
          </div>

          <div
            style={{
              marginTop: 8,
              color: '#bca1ad',
              fontSize: 12,
            }}
          >
            HOLD E / INTERACT
          </div>

          <div
            style={{
              height: 7,
              marginTop: 14,
              background: '#38222f',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: '100%',
                background:
                  'linear-gradient(90deg,#992441,#ff5478)',
              }}
            />
          </div>
        </div>
      )}

      {showUnlocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 75,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            background: 'rgba(100, 0, 30, 0.12)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '24px 30px',
              background: 'rgba(9, 4, 13, 0.88)',
              border: '1px solid #be4566',
              boxShadow: '0 0 55px #c61a5244',
              color: '#ffb7c8',
              fontFamily: 'Georgia, serif',
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 4,
                marginBottom: 12,
              }}
            >
              RITUAL COMPLETE
            </div>

            <div
              style={{
                fontSize: 'clamp(22px, 3vw, 35px)',
                letterSpacing: 2,
                marginBottom: 12,
              }}
            >
              BANISHING POWER AWAKENED
            </div>

            <div
              style={{
                fontSize: 14,
                color: '#d4a0ae',
              }}
            >
              The spirit can now be confronted.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
