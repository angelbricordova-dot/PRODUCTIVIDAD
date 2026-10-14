// Alba, la mascota: un sol (o una luna de noche) con cara que reacciona a tu día.
// La misma cara se usa para el deslizador de ánimo, para que todo hable el mismo idioma.

import { motion } from 'framer-motion'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const MOOD_STOPS: [number, [number, number, number]][] = [
  [0, [108, 99, 255]],
  [0.25, [77, 150, 255]],
  [0.5, [150, 164, 190]],
  [0.75, [46, 196, 140]],
  [1, [255, 186, 46]],
]

export function moodColor(s: number): string {
  const t = Math.max(0, Math.min(1, s))
  let i = 0
  while (i < MOOD_STOPS.length - 2 && t > MOOD_STOPS[i + 1][0]) i++
  const [t0, c0] = MOOD_STOPS[i]
  const [t1, c1] = MOOD_STOPS[i + 1]
  const k = (t - t0) / (t1 - t0)
  const c = c0.map((v, j) => Math.round(lerp(v, c1[j], k)))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

/** Cara en un lienzo de 100×100. `joy` va de 0 (fatal) a 1 (genial). */
export function Face({ joy, sleepy = false, ink = '#2a1a3a' }: { joy: number; sleepy?: boolean; ink?: string }) {
  const s = Math.max(0, Math.min(1, joy))
  const curve = lerp(-9, 13, s)
  const open = s > 0.78 ? (s - 0.78) * 38 : 0
  const happyEyes = s > 0.9
  const browTilt = s < 0.38 ? (0.38 - s) * 34 : 0
  const cheeks = Math.max(0, (s - 0.5) * 1.8)
  const spring = { type: 'spring', stiffness: 380, damping: 26 } as const
  const mouth = `M 37 60 Q 50 ${60 + curve} 63 60 Q 50 ${60 + curve + open} 37 60 Z`

  return (
    <g>
      <motion.ellipse cx={31} cy={60} rx={6.5} ry={3.8} fill="#ff6b8b" animate={{ opacity: cheeks * 0.55 }} transition={spring} />
      <motion.ellipse cx={69} cy={60} rx={6.5} ry={3.8} fill="#ff6b8b" animate={{ opacity: cheeks * 0.55 }} transition={spring} />
      {sleepy || happyEyes ? (
        <>
          <path d={sleepy ? 'M 34 47 Q 40 51 46 47' : 'M 34 49 Q 40 42 46 49'} stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
          <path d={sleepy ? 'M 54 47 Q 60 51 66 47' : 'M 54 49 Q 60 42 66 49'} stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <g className="alba-blink">
          <ellipse cx={40} cy={47} rx={3.6} ry={lerp(3.4, 4.6, s)} fill={ink} />
          <ellipse cx={60} cy={47} rx={3.6} ry={lerp(3.4, 4.6, s)} fill={ink} />
          <circle cx={41.3} cy={45.3} r={1.2} fill="#fff" />
          <circle cx={61.3} cy={45.3} r={1.2} fill="#fff" />
        </g>
      )}
      <motion.g animate={{ opacity: browTilt ? 1 : 0 }} transition={spring}>
        <motion.line x1={34} y1={38} x2={45} y2={38} stroke={ink} strokeWidth={2.8} strokeLinecap="round" animate={{ rotate: -browTilt }} style={{ originX: '45px', originY: '38px' }} transition={spring} />
        <motion.line x1={55} y1={38} x2={66} y2={38} stroke={ink} strokeWidth={2.8} strokeLinecap="round" animate={{ rotate: browTilt }} style={{ originX: '55px', originY: '38px' }} transition={spring} />
      </motion.g>
      {!sleepy && (
        <motion.path
          d={mouth}
          animate={{ d: mouth }}
          transition={spring}
          fill={open > 0.5 ? ink : 'none'}
          stroke={ink}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {sleepy && <path d="M 45 61 Q 50 64 55 61" stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />}
      <motion.path
        d="M 66 52 q -2.4 4.4 0 6.4 q 2.4 -2 0 -6.4 z"
        fill="#7cc4ff"
        animate={{ opacity: s < 0.12 ? 1 : 0, y: s < 0.12 ? 2 : -2 }}
        transition={spring}
      />
    </g>
  )
}

/** Sol mascota con rayos que giran despacio. */
export function AlbaSun({ joy = 0.7, size = 96, night = false }: { joy?: number; size?: number; night?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 124 124" aria-hidden className="alba">
      {night ? (
        <>
          <circle cx={50} cy={50} r={36} fill="#efeaff" />
          <circle cx={30} cy={34} r={5} fill="#ddd3ff" />
          <circle cx={70} cy={70} r={7} fill="#ddd3ff" />
          <circle cx={72} cy={30} r={3.5} fill="#ddd3ff" />
          <Face joy={joy} sleepy />
        </>
      ) : (
        <>
          <g className="alba-rays">
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={46} y={-8} width={8} height={16} rx={4} fill="#ffb627" transform={`rotate(${i * 36} 50 50)`} />
            ))}
          </g>
          <circle cx={50} cy={50} r={36} fill="#ffc83d" />
          <circle cx={42} cy={40} r={22} fill="#ffd96b" opacity={0.6} />
          <Face joy={joy} />
        </>
      )}
    </svg>
  )
}
