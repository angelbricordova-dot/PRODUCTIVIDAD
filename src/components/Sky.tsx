import { useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { DayPart } from '../lib/date'
import { seeded } from '../lib/util'
import { AlbaSun } from './Alba'

const SKIES: Record<DayPart, { bg: string; light: boolean; hill1: string; hill2: string }> = {
  dawn: {
    bg: 'linear-gradient(180deg, #4a3b8f 0%, #b45e9a 42%, #ff9a7a 78%, #ffcf8f 100%)',
    light: false,
    hill1: '#e9849a',
    hill2: '#f6a58e',
  },
  morning: {
    bg: 'linear-gradient(180deg, #7cc4ff 0%, #a9dcff 40%, #ffe3b8 85%, #ffd09a 100%)',
    light: true,
    hill1: '#a7dbff',
    hill2: '#ffd59a',
  },
  afternoon: {
    bg: 'linear-gradient(180deg, #ffb35c 0%, #ff8e6e 45%, #ffb98a 80%, #ffd7a6 100%)',
    light: false,
    hill1: '#ff9f6e',
    hill2: '#ffc48f',
  },
  dusk: {
    bg: 'linear-gradient(180deg, #2c2463 0%, #7c3f8f 40%, #f06b7a 75%, #ffae7a 100%)',
    light: false,
    hill1: '#b05a92',
    hill2: '#e47486',
  },
  night: {
    bg: 'linear-gradient(180deg, #0d0b2a 0%, #1d1850 45%, #3a2a6e 85%, #4d3577 100%)',
    light: false,
    hill1: '#3a2f78',
    hill2: '#4a3a8a',
  },
}

function celestial(now: Date) {
  const h = now.getHours() + now.getMinutes() / 60
  const isSun = h >= 6 && h < 20
  // arco de izquierda a derecha
  const t = isSun ? (h - 6) / 14 : ((h < 6 ? h + 24 : h) - 20) / 10
  // Recorre la mitad derecha del cielo para no tapar el saludo.
  const x = 76 + t * 18
  const y = 84 - Math.sin(t * Math.PI) * 50
  return { isSun, x, y }
}

export function Sky({ part, now, joy = 0.6, children }: { part: DayPart; now: Date; joy?: number; children: ReactNode }) {
  const sky = SKIES[part]
  const { isSun, x, y } = celestial(now)
  const stars = useMemo(() => {
    const r = seeded('stars')
    return Array.from({ length: 38 }, () => ({ x: r() * 100, y: r() * 70, s: 0.6 + r() * 1.4, d: r() * 4 }))
  }, [])
  const showStars = part === 'night' || part === 'dusk' || part === 'dawn'

  return (
    <header className={`sky ${sky.light ? 'light-sky' : ''}`}>
      <div className="sky-bg" style={{ background: sky.bg }} />
      <svg className="sky-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <radialGradient id="sunG">
            <stop offset="0" stopColor="#fffbe6" />
            <stop offset="0.6" stopColor="#ffe28a" />
            <stop offset="1" stopColor="#ffb547" />
          </radialGradient>
          <radialGradient id="sunGlow">
            <stop offset="0" stopColor="rgba(255,230,160,0.7)" />
            <stop offset="1" stopColor="rgba(255,230,160,0)" />
          </radialGradient>
          <radialGradient id="moonG">
            <stop offset="0" stopColor="#fffdf2" />
            <stop offset="1" stopColor="#e8e0ff" />
          </radialGradient>
        </defs>
        {showStars &&
          stars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.s * 0.18}
              fill="#fff"
              opacity={part === 'night' ? 0.85 : 0.35}
              style={{ animation: `twinkle ${2.5 + s.d}s ease-in-out ${s.d}s infinite alternate` }}
            />
          ))}
      </svg>
      {/* Alba, la mascota: recorre el cielo durante el día y sonríe más cuanto más avanzas */}
      <motion.div
        aria-hidden
        className="sky-mascot"
        initial={{ opacity: 0, y: 30, scale: 0.6 }}
        animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
        transition={{ opacity: { duration: 0.6 }, scale: { type: 'spring', stiffness: 160, damping: 14 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        style={{ left: `${x}%`, top: `${y}%`, marginLeft: -48, marginTop: -48 }}
      >
        <AlbaSun size={96} joy={joy} night={!isSun} />
      </motion.div>
      {!showStars && (
        <>
          <div className="cloud" style={{ top: '22%', animationDuration: '70s' }} />
          <div className="cloud small" style={{ top: '44%', animationDuration: '95s', animationDelay: '-40s' }} />
        </>
      )}
      <svg className="hills" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden>
        <path d="M0 50 C 60 20, 120 30, 190 46 S 320 30, 400 40 L400 90 L0 90 Z" fill={sky.hill1} />
        <path d="M0 64 C 80 44, 150 70, 240 58 S 360 48, 400 56 L400 90 L0 90 Z" fill={sky.hill2} />
        <path d="M0 76 C 90 62, 200 86, 300 72 S 380 70, 400 72 L400 90 L0 90 Z" fill="var(--bg)" />
      </svg>
      {children}
    </header>
  )
}
