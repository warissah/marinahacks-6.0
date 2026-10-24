
import PhoneConnection from './controller/PhoneConnection'
import { gameAudio } from './gameAudio'
import './StartScreen.css'

type Props = {
  started: boolean
  onStart: () => void
}

export default function StartScreen({
  started,
  onStart,
}: Props) {
  const enterGame = () => {
    // Unlock audio from a real user click.
    gameAudio.unlock()
    onStart()
  }

  return (
    <div
      className="phantom-start"
      style={{
        display: started ? 'none' : 'flex',
      }}
    >
      <div className="phantom-start-fog fog-one" />
      <div className="phantom-start-fog fog-two" />

      <div className="phantom-start-content">
        <div className="phantom-eyebrow">
          AN INTERACTIVE HORROR EXPERIENCE
        </div>

        <h1 className="phantom-title">
          PHANTOM
        </h1>

        <h2 className="phantom-subtitle">
          THE LAST RITUAL
        </h2>

        <p className="phantom-tagline">
          THE SPIRIT IS WAITING FOR YOU.
        </p>

        <div className="phantom-divider" />

        <div className="phantom-pairing">
          <h3>JOIN ROOM</h3>

          {/* Reuse the existing working QR system. */}
          <div className="phantom-qr-container">
            <PhoneConnection />
          </div>

          <p>
            SCAN THE CODE WITH YOUR PHONE
            <span> TO AWAKEN THE CONTROLLER</span>
          </p>
        </div>

        <button
          className="phantom-enter-button"
          type="button"
          onClick={enterGame}
        >
          ENTER THE HAUNTED HOUSE
        </button>

        <div className="phantom-start-footer">
          CONNECT YOUR PHONE BEFORE ENTERING
        </div>
      </div>
    </div>
  )
}
