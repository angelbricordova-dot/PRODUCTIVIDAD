// Sonido y háptica. Todo es opcional y silencioso si el dispositivo no lo soporta.

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(v: boolean) {
  enabled = v
}

function audio(): AudioContext | null {
  if (!enabled) return null
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.08, type: OscillatorType = 'sine') {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

// Escala pentatónica: cada hábito completado sube una nota, así el día "suena" a progreso.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98]

export function playComplete(step = 0) {
  const f = PENTA[Math.min(step, PENTA.length - 1)]
  tone(f, 0, 0.35, 0.07)
  tone(f * 2, 0.03, 0.25, 0.02, 'triangle')
}

export function playUndo() {
  tone(392, 0, 0.18, 0.04, 'triangle')
}

export function playLevelUp() {
  ;[523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, i * 0.09, 0.5, 0.06))
}

export function playCoins() {
  tone(1318.51, 0, 0.12, 0.05, 'square')
  tone(1760, 0.08, 0.3, 0.04, 'square')
}

export function playSoft() {
  tone(659.25, 0, 0.6, 0.04)
}

// iOS 18+ dispara la háptica nativa al alternar un <input switch>. En Android usamos vibrate().
let hapticLabel: HTMLLabelElement | null = null

export function haptic(kind: 'light' | 'success' = 'light') {
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(kind === 'success' ? [12, 40, 18] : 8)
      return
    }
    if (!hapticLabel) {
      hapticLabel = document.createElement('label')
      hapticLabel.ariaHidden = 'true'
      hapticLabel.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none'
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('switch', '')
      hapticLabel.appendChild(input)
      document.body.appendChild(hapticLabel)
    }
    hapticLabel.click()
    if (kind === 'success') setTimeout(() => hapticLabel?.click(), 90)
  } catch {
    /* sin háptica */
  }
}
