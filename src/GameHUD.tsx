
type Props = {
  lives: number
  chasing: boolean
  banishUnlocked: boolean
  banishCharge: number
  won: boolean
  lost: boolean
}

export default function GameHUD({
  lives,
  chasing,
  banishUnlocked,
  banishCharge,
  won,
  lost,
}: Props) {
  const restart = () => {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    window.location.reload()
  }

  return (
    <>
      {/* Lives: bottom-left */}
      {!won && !lost && (
        <div
          style={{
            position: 'fixed',
            bottom: 55,
            left: 20,
            zIndex: 60,
            padding: '12px 17px',
            border: '1px solid #69404d',
            borderRadius: 12,
            background: 'rgba(11, 8, 17, 0.9)',
            color: '#eac0cb',
            fontFamily: 'Georgia, serif',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 9,
              color: '#b99aa5',
            }}
          >
            YOUR SOULS
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
            }}
          >
            {[0, 1, 2].map((i) => (
              <svg
                key={i}
                width="30"
                height="31"
                viewBox="0 0 32 32"
              >
                <path
                  d="M16 28C12 22 3 17 3 10C3 2 12 1 16 8C20 1 29 2 29 10C29 17 20 22 16 28Z"
                  fill={i < lives ? '#c8325c' : '#30242e'}
                  stroke={i < lives ? '#ff7193' : '#65515c'}
                  strokeWidth="1.5"
                />
              </svg>
            ))}
          </div>
        </div>
      )}

      {/* Ghost proximity warning */}
      {chasing && !won && !lost && (
        <div
          style={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#ff8ea2',
            fontFamily: 'Georgia, serif',
            fontSize: 13,
            letterSpacing: 3,
            textShadow: '0 0 16px #d91d4c',
            zIndex: 55,
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
         A PRESENCE LINGERS NEARBY...
        </div>
      )}

      {/* Banish charge */}
      {banishUnlocked && !won && !lost && (
        <div
          style={{
            position: 'fixed',
            bottom: 115,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 280,
            maxWidth: '60vw',
            padding: 13,
            border: '1px solid #873d61',
            background: 'rgba(13, 7, 19, 0.89)',
            borderRadius: 12,
            zIndex: 55,
            pointerEvents: 'none',
            color: '#f5a7bb',
            fontFamily: 'Georgia, serif',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              letterSpacing: 2,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            BANISHING POWER
          </div>

          <div
            style={{
              height: 9,
              background: '#42202e',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${banishCharge * 100}%`,
                background: 'linear-gradient(90deg,#a92453,#ff88ad)',
              }}
            />
          </div>

          <div
            style={{
              fontSize: 10,
              color: '#b998a6',
              marginTop: 9,
            }}
          >
            AIM AT THE GHOST · HOLD B / BANISH
          </div>
        </div>
      )}

      {/* Victory */}
      {won && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            background: 'rgba(5, 4, 11, 0.97)',
            color: '#ffd3e0',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
          }}
        >
          <style>
            {`
              @keyframes ghostCatDance {
                0%,100% { transform: rotate(-13deg) translateY(0); }
                50% { transform: rotate(13deg) translateY(-22px); }
              }
            `}
          </style>

          <div
            style={{
              letterSpacing: 5,
              color: '#ee7898',
              fontSize: 13,
            }}
          >
            RITUAL SUCCESSFUL
          </div>

          <div
            style={{
              fontSize: 'clamp(25px, 5vw, 56px)',
              fontWeight: 'bold',
              maxWidth: 750,
              padding: '0 20px',
            }}
          >
            THE GHOST HAS LEFT THE CHAT
          </div>

          <div
            style={{
              fontSize: 95,
        
            }}
          >
           <img src="/memes/victory.gif" alt="Victory dance" />
          </div>

          <div style={{ color: '#bca0b1', fontSize: 16 }}>
            Congratulations. You survived the last ritual.
          </div>

          <button
            onClick={restart}
            style={{
              marginTop: 12,
              padding: '14px 26px',
              color: '#ffe4eb',
              border: '1px solid #c84a78',
              borderRadius: 10,
              background: '#562239',
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Game over */}
      {lost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 22,
            background: 'rgba(9, 0, 6, 0.96)',
            color: '#ef9aab',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(32px, 6vw, 65px)',
              letterSpacing: 5,
            }}
          >
            YOUR SOUL IS LOST
          </div>

          <p style={{ color: '#bd8998' }}>
            The spirit claimed its final victim.
          </p>

          <button
            onClick={restart}
            style={{
              padding: '14px 28px',
              borderRadius: 10,
              border: '1px solid #8a3b53',
              background: '#451c2e',
              color: '#ffe1e9',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </>
  )
}
