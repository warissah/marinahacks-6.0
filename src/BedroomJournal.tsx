
import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

export default function BedroomJournal({
  open,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return

    const keydown = (e: KeyboardEvent) => {
      if (
        e.code === 'Escape' ||
        e.code === 'KeyE'
      ) {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', keydown)

    return () => {
      window.removeEventListener('keydown', keydown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 4, 5, 0.84)',
        padding: 18,
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          width: 'min(540px, 95vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background:
            'linear-gradient(145deg, #edddbd, #ccae7e)',
          color: '#493323',
          padding: '34px 30px',
          borderRadius: 3,
          border: '7px solid #5c4230',
          boxShadow: '0 18px 70px #000',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: 3,
            opacity: 0.65,
          }}
        >
          A PAGE FROM THE PAST
        </div>

        <h2
          style={{
            textAlign: 'center',
            marginTop: 18,
            marginBottom: 22,
            fontSize: 28,
            fontWeight: 'normal',
          }}
        >
          The Forgotten Journal
        </h2>

        <div
          style={{
            lineHeight: 1.95,
            fontSize: 17,
            fontStyle: 'italic',
          }}
        >
          <p>
            We thought the ritual would save us.
            Instead, we brought something into this
            house that refuses to leave.
          </p>

          <p>
            The Book of the Dead and the ritual
            dagger remain in our possession.
            But the final piece is missing.
          </p>

          <p>
            The Crimson Shard was hidden below,
            where the air grows cold and the walls
            have long forgotten the sunlight.
          </p>

          <p>
            Only when the three are brought together
            at the altar can the spirit be released.
          </p>

          <p>
            May whoever finds this have the courage
            we did not.
          </p>
        </div>

        <div
          style={{
            textAlign: 'right',
            marginTop: 20,
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          — The final entry
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 28,
            padding: 14,
            border: '1px solid #73563b',
            background: '#593b2c',
            color: '#f6e6ca',
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Close Journal
        </button>
      </div>
    </div>
  )
}
