
type SoundName =
  | 'ambience'
  | 'whispers'
  | 'heartbeat'
  | 'footsteps'
  | 'jumpscare'
  | 'collect'
  | 'ritual'
  | 'victory'
   | 'scream'


const files: Record<SoundName, string> = {
  ambience: '/sounds/ambiencehouse.wav',
  whispers:
    '/sounds/fadingembersaudio-creepy-female-ghost-whispers-430175.mp3',
  heartbeat:
    '/sounds/universfield-rapid-heartbeat-151928.mp3',
  footsteps: '/sounds/footsteps.mp3',
  jumpscare: '/sounds/jumpscare.mp3',
  collect: '/sounds/keycollect.mp3',
  ritual: '/sounds/ritual.mp3',
  victory: '/sounds/winnings.mp3',
  scream: '/sounds/ghost-scream.mp3',
}

const sounds = {} as Record<SoundName, HTMLAudioElement>

let initialized = false
let unlocked = false
let finished = false

function initialize() {
  if (initialized) return
  initialized = true

  for (const name of Object.keys(files) as SoundName[]) {
    const audio = new Audio(files[name])
    audio.preload = 'auto'
    audio.loop = [
      'ambience',
      'whispers',
      'heartbeat',
      'footsteps',
    ].includes(name)

    sounds[name] = audio
  }

  sounds.ambience.volume = 0.22
  sounds.whispers.volume = 0
  sounds.heartbeat.volume = 0
  sounds.footsteps.volume = 0.3
  sounds.jumpscare.volume = 0.9
  sounds.collect.volume = 0.75
  sounds.ritual.volume = 0.85
  sounds.victory.volume = 0.8
  sounds.scream.volume = 0.85
}

function start(name: SoundName) {
  if (!unlocked || finished) return

  const audio = sounds[name]
  if (!audio || !audio.paused) return

  audio.play().catch(() => {})
}

function stop(name: SoundName) {
  const audio = sounds[name]
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

function oneShot(name: SoundName) {
  if (!unlocked || finished) return

  const audio = sounds[name]
  if (!audio) return

  audio.pause()
  audio.currentTime = 0
  audio.play().catch(() => {})
}

export const gameAudio = {
  unlock() {
    initialize()
    if (finished) return
    unlocked = true
    start('ambience')
  },

  setThreat(distance: number) {
    if (!unlocked || finished) return

    const proximity = Math.max(
      0,
      Math.min(1, (5 - distance) / 4)
    )

    if (proximity > 0) {
      sounds.whispers.volume = proximity * 0.3
      sounds.heartbeat.volume = proximity * 0.55

      start('whispers')
      start('heartbeat')
    } else {
      stop('whispers')
      stop('heartbeat')
    }
  },

  scream() {
    oneShot('scream')
  },

  setWalking(moving: boolean) {
    if (!unlocked || finished) return

    if (moving) {
      start('footsteps')
    } else {
      stop('footsteps')
    }
  },

  collect() {
    oneShot('collect')
  },

  ritual() {
    oneShot('ritual')
  },

  jumpscare() {
    stop('footsteps')
    stop('heartbeat')
    stop('whispers')
    oneShot('jumpscare')
  },

  win() {
    if (finished) return
    stop('ambience')
    stop('footsteps')
    stop('heartbeat')
    stop('whispers')
    stop('jumpscare')

    // Play victory audio before marking the game finished.
    oneShot('victory')
    finished = true
  },

  gameOver() {
    stop('ambience')
    stop('footsteps')
    stop('heartbeat')
    stop('whispers')
    finished = true
  },
}
