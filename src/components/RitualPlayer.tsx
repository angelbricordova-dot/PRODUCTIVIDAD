import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, SkipForward, Timer } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useStore } from '../store'
import { useToday } from '../lib/hooks'
import { isDone, showsOn, TIME_OF_DAY } from '../lib/habits'
import { habitReward } from '../lib/game'
import { habitStreak } from '../lib/habits'
import type { TimeOfDay } from '../store/types'
import { cx } from '../lib/util'

const BG: Record<TimeOfDay, string> = {
  morning: 'linear-gradient(170deg, #ff9a7a 0%, #ffb88a 35%, #ffd9a0 100%)',
  afternoon: 'linear-gradient(170deg, #ff8e6e 0%, #ffb35c 60%, #ffd7a6 100%)',
  evening: 'linear-gradient(170deg, #1d1850 0%, #3a2a6e 55%, #7c3f8f 100%)',
  anytime: 'linear-gradient(170deg, #4a3b8f 0%, #b45e9a 60%, #ff9a7a 100%)',
}

export function RitualPlayer({ part, onClose }: { part: TimeOfDay; onClose: () => void }) {
  const today = useToday()
  const habits = useStore((s) => s.habits)
  const logs = useStore((s) => s.logs)
  const restDays = useStore((s) => s.restDays)
  const setCount = useStore((s) => s.setHabitCount)
  // La lista se congela al abrir para que no salte al completar.
  const queue = useMemo(
    () => habits.filter((h) => h.timeOfDay === part && showsOn(h, today) && !isDone(h, logs, today)).sort((a, b) => a.order - b.order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [i, setI] = useState(0)
  const [earned, setEarned] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const h = queue[i]
  const finished = i >= queue.length

  useEffect(() => {
    if (!timerEnd) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [timerEnd])

  useEffect(() => {
    if (finished && doneCount > 0) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#ffb547', '#ff7a59', '#ffffff', '#e07cf0'], disableForReducedMotion: true })
    }
  }, [finished, doneCount])

  const next = () => {
    setTimerEnd(null)
    setI((x) => x + 1)
  }
  const complete = () => {
    if (!h) return
    const { xp } = habitReward(h.difficulty, habitStreak(h, logs, restDays, today).current)
    setEarned((e) => e + xp)
    setDoneCount((c) => c + 1)
    setCount(h.id, today, h.target)
    next()
  }

  const left = timerEnd ? Math.max(0, timerEnd - now) : 0
  const meta = TIME_OF_DAY[part]

  return (
    <motion.div
      className="fullscreen"
      style={{ background: BG[part], color: part === 'evening' ? '#fff' : '#2b1838' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
    >
      <div className="ritual-player">
        <div className="row-between">
          <span className="bold">
            {meta.emoji} {meta.ritual}
          </span>
          <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.25)', color: 'inherit', boxShadow: 'none' }} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="ritual-dots" style={{ marginTop: 14 }}>
          {queue.map((q, k) => (
            <i key={q.id} className={cx(k < i && 'on')} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!finished && h ? (
            <motion.div
              key={h.id}
              className="ritual-card"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            >
              <motion.div className="ritual-emoji" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                {h.emoji}
              </motion.div>
              <div className="ritual-name">{h.name}</div>
              {h.cue && <p style={{ opacity: 0.8 }}>{h.cue}</p>}
              {h.why && <p className="quote" style={{ fontSize: 17, opacity: 0.9, maxWidth: 320 }}>“{h.why}”</p>}
              {h.minutes ? (
                timerEnd ? (
                  <div className="timer-num" style={{ fontSize: 52 }}>
                    {String(Math.floor(left / 60000)).padStart(2, '0')}:{String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}
                  </div>
                ) : (
                  <button className="btn" style={{ background: 'rgba(255,255,255,0.3)', color: 'inherit' }} onClick={() => setTimerEnd(Date.now() + (h.minutes ?? 0) * 60000)}>
                    <Timer size={18} /> Temporizador {h.minutes} min
                  </button>
                )
              ) : null}
              <p className="small" style={{ opacity: 0.7 }}>
                {i + 1} de {queue.length}
              </p>
            </motion.div>
          ) : (
            <motion.div key="done" className="ritual-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
              <div className="ritual-emoji">{doneCount ? '🌟' : '🌿'}</div>
              <div className="ritual-name">{doneCount ? '¡Ritual completado!' : 'Nada pendiente aquí'}</div>
              {doneCount > 0 && (
                <p style={{ fontSize: 18 }}>
                  {doneCount} hábitos · <b>+{earned} XP</b>
                </p>
              )}
              <p style={{ opacity: 0.8, maxWidth: 300 }}>Cada repetición es un voto por la persona en la que te estás convirtiendo.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!finished ? (
          <div className="row">
            <button className="btn grow" style={{ background: 'rgba(255,255,255,0.25)', color: 'inherit' }} onClick={next}>
              <SkipForward size={18} /> Ahora no
            </button>
            <button className="btn grow" style={{ background: '#fff', color: '#2b1838', flex: 1.6 }} onClick={complete}>
              <Check size={20} strokeWidth={3} /> Hecho
            </button>
          </div>
        ) : (
          <button className="btn block" style={{ background: '#fff', color: '#2b1838' }} onClick={onClose}>
            Continuar mi día
          </button>
        )}
      </div>
    </motion.div>
  )
}
