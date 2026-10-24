import * as THREE from 'three'

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

function makeCanvas(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return { c, g: c.getContext('2d')! }
}

function toTexture(c: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// draw at 9 offsets so stains wrap seamlessly when the texture tiles
function wrapped(size: number, draw: (dx: number, dy: number) => void) {
  for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) draw(dx, dy)
}

function radial(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, `rgba(${rgb},${a})`)
  gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr
  g.fillRect(x - r, y - r, r * 2, r * 2)
}

/** Dirty plaster / stone: noise, brown stains, water streaks, old blood blotches. */
export function grimeTexture(base: string, stains = 36, bloodStains = 0) {
  const S = 512
  const { c, g } = makeCanvas(S)
  g.fillStyle = base
  g.fillRect(0, 0, S, S)
  for (let i = 0; i < 7000; i++) {
    g.fillStyle = `rgba(0,0,0,${rand(0.03, 0.12)})`
    g.fillRect(rand(0, S), rand(0, S), rand(1, 4), rand(1, 4))
  }
  for (let i = 0; i < stains; i++) {
    const x = rand(0, S), y = rand(0, S), r = rand(25, 100), a = rand(0.12, 0.35)
    wrapped(S, (dx, dy) => radial(g, x + dx, y + dy, r, '25,12,6', a))
  }
  for (let i = 0; i < 26; i++) {
    const x = rand(0, S), y = rand(0, S), len = rand(80, 320), w = rand(2, 8)
    wrapped(S, (dx, dy) => {
      const gr = g.createLinearGradient(0, y + dy, 0, y + dy + len)
      gr.addColorStop(0, 'rgba(15,8,4,0.28)')
      gr.addColorStop(1, 'rgba(15,8,4,0)')
      g.fillStyle = gr
      g.fillRect(x + dx, y + dy, w, len)
    })
  }
  for (let i = 0; i < bloodStains; i++) {
    const x = rand(0, S), y = rand(0, S), r = rand(15, 60)
    wrapped(S, (dx, dy) => radial(g, x + dx, y + dy, r, '70,6,8', rand(0.25, 0.5)))
  }
  return toTexture(c, true)
}

/** Old wooden floorboards, stained. */
export function floorTexture() {
  const S = 512
  const { c, g } = makeCanvas(S)
  const plank = 64
  for (let i = 0; i < S / plank; i++) {
    g.fillStyle = `hsl(${rand(15, 28)} 35% ${rand(10, 18)}%)`
    g.fillRect(i * plank, 0, plank, S)
    for (let k = 0; k < 120; k++) {
      g.fillStyle = `rgba(0,0,0,${rand(0.05, 0.2)})`
      g.fillRect(i * plank + rand(0, plank), rand(0, S), 1, rand(10, 80))
    }
    g.fillStyle = 'rgba(0,0,0,0.65)'
    g.fillRect(i * plank, 0, 2, S)
    g.fillRect(i * plank, rand(0, S), plank, 2)
  }
  for (let i = 0; i < 30; i++) {
    const x = rand(0, S), y = rand(0, S), r = rand(30, 90)
    wrapped(S, (dx, dy) => radial(g, x + dx, y + dy, r, '10,4,2', rand(0.2, 0.4)))
  }
  return toTexture(c, true)
}

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, 'rgba(110,8,10,0.95)')
  gr.addColorStop(0.7, 'rgba(80,5,8,0.9)')
  gr.addColorStop(1, 'rgba(60,4,6,0)')
  g.fillStyle = gr
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
}

/** Transparent blood decals: floor pool, wall splatter with drips, or drag smears. */
export function bloodTexture(kind: 'pool' | 'wall' | 'smear') {
  const S = 512
  const { c, g } = makeCanvas(S)
  if (kind === 'pool') {
    for (let i = 0; i < 70; i++) blob(g, 256 + gauss() * 70, 256 + gauss() * 70, rand(14, 50))
    for (let i = 0; i < 45; i++) {
      const a = rand(0, Math.PI * 2), d = rand(110, 235)
      blob(g, 256 + Math.cos(a) * d, 256 + Math.sin(a) * d, rand(2, 9))
    }
  } else if (kind === 'wall') {
    for (let i = 0; i < 40; i++) blob(g, 256 + gauss() * 60, 150 + gauss() * 40, rand(12, 40))
    for (let i = 0; i < 30; i++) {
      const a = rand(0, Math.PI * 2), d = rand(80, 200)
      blob(g, 256 + Math.cos(a) * d, 150 + Math.sin(a) * d * 0.7, rand(2, 8))
    }
    for (let i = 0; i < 9; i++) {
      const x = 256 + rand(-80, 80), w = rand(4, 10), len = rand(90, 320)
      const gr = g.createLinearGradient(0, 150, 0, 150 + len)
      gr.addColorStop(0, 'rgba(100,8,10,0.95)')
      gr.addColorStop(1, 'rgba(70,5,8,0.9)')
      g.fillStyle = gr
      g.fillRect(x - w / 2, 150, w, len)
      blob(g, x, 150 + len, w * 0.9)
    }
  } else {
    g.lineCap = 'round'
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 65 + rand(-12, 12), w = rand(14, 30), y1 = rand(300, 470)
      const gr = g.createLinearGradient(0, 60, 0, y1)
      gr.addColorStop(0, 'rgba(105,8,10,0.95)')
      gr.addColorStop(1, 'rgba(70,5,8,0)')
      g.strokeStyle = gr
      g.lineWidth = w
      g.beginPath()
      g.moveTo(x, 60)
      g.bezierCurveTo(x + rand(-30, 30), 180, x + rand(-30, 30), 300, x + rand(-20, 20), y1)
      g.stroke()
    }
  }
  return toTexture(c)
}

/** Quarter cobweb. The origin is the top-left corner of the texture. */
export function webTexture() {
  const S = 512
  const { c, g } = makeCanvas(S)
  g.strokeStyle = 'rgba(235,235,235,0.9)'
  g.lineCap = 'round'
  const spokes = 7
  const R = S * 0.98
  g.lineWidth = 1.6
  for (let i = 0; i <= spokes; i++) {
    const a = (i / spokes) * (Math.PI / 2)
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(Math.cos(a) * R, Math.sin(a) * R)
    g.stroke()
  }
  g.lineWidth = 1
  for (let r = 50; r < R; r += 46 + rand(-8, 8)) {
    for (let i = 0; i < spokes; i++) {
      const a1 = (i / spokes) * (Math.PI / 2), a2 = ((i + 1) / spokes) * (Math.PI / 2)
      const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r
      const x2 = Math.cos(a2) * r, y2 = Math.sin(a2) * r
      g.beginPath()
      g.moveTo(x1, y1)
      g.quadraticCurveTo(((x1 + x2) / 2) * 0.88, ((y1 + y2) / 2) * 0.88, x2, y2) // sag toward the corner
      g.stroke()
    }
  }
  return toTexture(c)
}