
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  collected: boolean
  progress: number
}

function BookIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
      <path
        d="M32 15C24 10 16 10 8 13V49C16 46 24 46 32 51V15Z"
        fill="#6F5148"
        stroke="#D1B08B"
        strokeWidth="2"
      />
      <path
        d="M32 15C40 10 48 10 56 13V49C48 46 40 46 32 51V15Z"
        fill="#4D383D"
        stroke="#D1B08B"
        strokeWidth="2"
      />
      <path d="M32 15V51" stroke="#D1B08B" strokeWidth="2" />
      <path d="M16 23L25 21M16 30L25 28M39 22L48 24M39 29L48 31" stroke="#C09A79" strokeWidth="2" />
      <circle cx="32" cy="33" r="3" fill="#B84D63" />
    </svg>
  )
}

function DaggerIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
      <path
        d="M34 8L40 13L29 39L24 34L34 8Z"
        fill="#C4B9AF"
        stroke="#EEE0CE"
        strokeWidth="1.5"
      />
      <path
        d="M34 8L32 35L29 39"
        stroke="#7A797D"
        strokeWidth="2"
      />
      <path
        d="M17 30L33 46M35 28L19 44"
        stroke="#B69A73"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M25 39L16 49"
        stroke="#6F4D43"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="51" r="4" fill="#A7495C" stroke="#CEAA86" strokeWidth="2" />
    </svg>
  )
}

function ShardIcon({ collected }: { collected: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
      <path
        d="M31 7L48 25L35 56L17 31L31 7Z"
        fill={collected ? '#CB224B' : '#51303E'}
        stroke={collected ? '#FF8196' : '#966073'}
        strokeWidth="2"
      />
      <path
        d="M31 7L32 37L17 31M32 37L48 25M32 37L35 56"
        stroke={collected ? '#FF96A9' : '#805361'}
        strokeWidth="1.5"
      />
      <path
        d="M31 7L38 26L32 37L28 24Z"
        fill={collected ? '#FF7E9A' : '#684351'}
      />
    </svg>
  )
}

function Slot({
  children,
  owned,
  name,
}: {
  children: React.ReactNode
  owned: boolean
  name: string
}) {
  return (
    <div
      title={name}
      style={{
        width: 75,
        height: 79,
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 9,
        border: owned
          ? '1px solid #7A6260'
          : '1px solid #9B3D55',
        background: owned
          ? 'linear-gradient(145deg,#30262D,#171318)'
          : 'linear-gradient(145deg,#301A26,#130E16)',
        boxShadow: owned
          ? 'inset 0 0 14px #0008, 0 3px 8px #0008'
          : 'inset 0 0 15px #4A162D88, 0 0 12px #9B25401A',
      }}
    >
      {/* Decorative inner border */}
      <div
        style={{
          position: 'absolute',
          inset: 5,
          border: '1px solid #8D718033',
          borderRadius: 5,
          pointerEvents: 'none',
        }}
      />

      {children}

      {/* Small status marker */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 6,
          fontSize: 13,
          fontFamily: 'system-ui',
          color: owned ? '#8BC69C' : '#CA6580',
          fontWeight: 700,
        }}
      >
        {owned ? '✓' : '◇'}
      </div>
    </div>
  )
}

export default function RitualInventory({
  collected,
  progress,
}: Props) {
  const [showReady, setShowReady] = useState(false)

  useEffect(() => {
    if (!collected) return

    setShowReady(true)

    const timeout = window.setTimeout(() => {
      setShowReady(false)
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [collected])

  const panel: CSSProperties = {
    position: 'fixed',
    bottom: 55,
    right: 18,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    padding: '12px 13px',
    borderRadius: 13,
    border: '1px solid #70414B',
    background: 'rgba(12, 10, 16, 0.92)',
    boxShadow: '0 8px 30px #000B',
    pointerEvents: 'none',
  }

  return (
    <>
      {/* Bottom-right inventory */}
      <div style={panel}>
        <div
          style={{
            color: '#B9959D',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: 10,
            letterSpacing: 2.3,
          }}
        >
          RITUAL ARTIFACTS
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          <Slot owned name="Book of the Dead">
            <BookIcon />
          </Slot>

          <Slot owned name="Ritual Dagger">
            <DaggerIcon />
          </Slot>

          <Slot
            owned={collected}
            name={
              collected
                ? 'Crimson Shard — Collected'
                : 'Crimson Shard — Missing'
            }
          >
            <ShardIcon collected={collected} />
          </Slot>
        </div>
      </div>

      {/* Hold-to-collect bar */}
      {!collected && progress > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            width: 245,
            padding: 13,
            background: 'rgba(14, 8, 17, 0.94)',
            border: '1px solid #A34760',
            borderRadius: 10,
            color: '#E7BAC2',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
            fontSize: 12,
            letterSpacing: 1.5,
            pointerEvents: 'none',
          }}
        >
          CLAIMING THE SHARD

          <div
            style={{
              height: 6,
              marginTop: 10,
              background: '#40222E',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: '#D63C66',
              }}
            />
          </div>
        </div>
      )}

      {/* Brief notification after collection */}
      {showReady && (
        <div
          style={{
            position: 'fixed',
            top: '22%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            padding: '15px 22px',
            border: '1px solid #9C4961',
            borderRadius: 8,
            background: 'rgba(13, 7, 16, 0.94)',
            color: '#F3B1C0',
            fontFamily: 'Georgia, serif',
            fontSize: 19,
            letterSpacing: 2,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          THE RITUAL IS READY
        </div>
      )}
    </>
  )
}
