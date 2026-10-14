import { useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { DayPart } from '../lib/date'
import { seeded } from '../lib/util'

const SKIES: Record<DayPart, { bg: string; light: boolean; hill1: string; hill2: string }> = {
  dawn: {
    bg: 'linear-gradient(180deg, #4a3b8f 0%, #b45e9a 42%, #ff9a7a 78%, #ffcf8f 100%)',
    light: false,
    hill1: 'rgba(255, 214, 190, 0.55)',
    hill2: 'rgba(255, 190, 170, 0.5)',
  },
  morning: {
    bg: 'linear-gradient(180deg, #7cc4ff 0%, #a9dcff 40%, #ffe3b8 85%, #ffd09a 100%)',
    light: true,
    hill1: 'rgba(255, 255, 255, 0.5)',
    hill2: 'rgba(255, 236, 210, 0.6)',
  },
  afternoon: {
    bg: 'linear-gradient(180deg, #ffb35c 0%, #ff8e6e 45%, #ffb98a 80%, #ffd7a6 100%)',
    light: false,
    hill1: 'rgba(255, 230, 200, 0.5)',
    hill2: 'rgba(255, 210, 180, 0.55)',
  },
  dusk: {
    bg: 'linear-gradient(180deg, #2c2463 0%, #7c3f8f 40%, #f06b7a 75%, #ffae7a 100%)',
    light: false,
    hill1: 'rgba(240, 150, 160, 0.45)',
    hill2: 'rgba(200, 120, 160, 0.45)',
  },
  night: {
    bg: 'linear-gradient(180deg, #0d0b2a 0%, #1d1850 45%, #3a2a6e 85%, #4d3577 100%)',
    light: false,
    hill1: 'rgba(120, 100, 190, 0.35)',
    hill2: 'rgba(90, 70, 160, 0.4)',
  },
}

function celestial(now: Date) {
  const h = now.getHours() + now.getMinutes() / 60
  const isSun = h >= 6 && h < 20
  // arco de izquierda a derecha
  const t = isSun ? (h - 6) / 14 : ((h < 6 ? h + 24 : h) - 20) / 10
  const x = 8 + t * 84
  const y = 82 - Math.sin(t * Math.PI) * 62
  return { isSun, x, y }
}

export function Sky({ part, now, children }: { part: DayPart; now: Date; children: ReactNode }) {
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
      {/* Sol / luna en un elemento propio para que no se deforme con preserveAspectRatio */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: isSun ? 74 : 54,
          height: isSun ? 74 : 54,
          marginLeft: isSun ? -37 : -27,
          marginTop: isSun ? -37 : -27,
          zIndex: -1,
          borderRadius: '50%',
          background: isSun
            ? 'radial-gradient(circle at 40% 38%, #fffbe6, #ffe28a 55%, #ffb547)'
            : 'radial-gradient(circle at 38% 35%, #fffdf2, #e8e0ff 70%)',
          boxShadow: isSun
            ? '0 0 50px 18px rgba(255, 220, 140, 0.55), 0 0 120px 40px rgba(255, 200, 120, 0.3)'
            : '0 0 40px 10px rgba(220, 210, 255, 0.35), inset -10px -6px 0 rgba(160, 140, 220, 0.25)',
          animation: 'floaty 7s ease-in-out infinite alternate',
        }}
      />
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
