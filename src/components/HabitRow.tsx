import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import type { Habit } from '../store/types'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { habitStreak, isDone, weekCount, countOn } from '../lib/habits'
import { habitReward } from '../lib/game'
import type { DateKey } from '../lib/date'
import { cx } from '../lib/util'
import { Ring } from './ui'

const PARTICLES = 12
const BURST_COLORS = ['var(--girasol)', 'var(--chicle)', 'var(--cielo)']

export function HabitRow({ habit, day }: { habit: Habit; day: DateKey }) {
  const logs = useStore((s) => s.logs)
  const restDays = useStore((s) => s.restDays)
  const areas = useStore((s) => s.areas)
  const logHabit = useStore((s) => s.logHabit)
  const setHabitCount = useStore((s) => s.setHabitCount)
  const open = useUI((s) => s.open)
  const [burst, setBurst] = useState(0)
  const [float, setFloat] = useState<number | null>(null)
  const pressTimer = useRef<number | null>(null)
  const longPressed = useRef(false)

  const area = areas.find((a) => a.id === habit.areaId)
  const color = area?.color ?? 'var(--a)'
  const count = countOn(logs, habit.id, day)
  const done = isDone(habit, logs, day)
  const streak = habitStreak(habit, logs, restDays, day)
  const multi = habit.target > 1
  const weekly = habit.schedule.type === 'weekly' ? { n: weekCount(habit, logs, day), of: habit.schedule.times } : null

  const tap = () => {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    if (multi) {
      const next = done ? 0 : count + 1
      if (next >= habit.target && !done) celebrate()
      setHabitCount(habit.id, day, next)
    } else {
      if (!done) celebrate()
      logHabit(habit.id, day, done ? -1 : 1)
    }
  }

  const celebrate = () => {
    setBurst((b) => b + 1)
    setFloat(habitReward(habit.difficulty, streak.current).xp)
    setTimeout(() => setFloat(null), 900)
  }

  // Mantener pulsado en un hábito contable: marcar todo de golpe.
  const onDown = () => {
    if (!multi) return
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true
      if (!done) {
        celebrate()
        setHabitCount(habit.id, day, habit.target)
      }
    }, 450)
  }
  const onUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  return (
    <div className={cx('habit', done && 'done')} style={{ ['--hc' as string]: color }}>
      <button className="h-main" onClick={() => open({ type: 'habitDetail', id: habit.id })}>
        <motion.div className="h-emoji" animate={done ? { rotate: [0, -12, 10, 0], scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.5 }}>
          {habit.emoji}
        </motion.div>
        <div className="grow">
          <div className="h-name">{habit.name}</div>
          <div className="h-meta">
            {multi && (
              <span className="num">
                {count}/{habit.target} {habit.unit ?? ''}
              </span>
            )}
            {weekly && (
              <span className="num">
                {weekly.n}/{weekly.of} esta semana
              </span>
            )}
            {!multi && !weekly && habit.minutes ? <span>{habit.minutes} min</span> : null}
            {!multi && !weekly && !habit.minutes && habit.cue ? <span className="ellipsis">{habit.cue}</span> : null}
            {streak.current > 1 && (
              <span className={cx('streak', streak.atRisk && 'risk')} title="Racha">
                <Flame size={13} strokeWidth={2.6} />
                {streak.current}
              </span>
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {float !== null && (
          <motion.span
            className="xp-float"
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: -14, scale: 1 }}
            exit={{ opacity: 0, y: -26 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            +{float} XP
          </motion.span>
        )}
      </AnimatePresence>

      <motion.button
        className={cx('check', multi && count > 0 && !done && 'partial')}
        onClick={tap}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        aria-label={done ? `Desmarcar ${habit.name}` : `Completar ${habit.name}`}
        aria-pressed={done}
        whileTap={{ scale: 0.86 }}
      >
        {multi && !done && count > 0 && (
          <div className="ring">
            <Ring value={count / habit.target} size={44} stroke={4} color={color} track="transparent" />
          </div>
        )}
        <AnimatePresence initial={false}>
          {done && (
            <motion.div
              className="fill"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 26 }}
            />
          )}
        </AnimatePresence>
        {done ? (
          <motion.svg className="tick" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, delay: 0.06, ease: [0.23, 1, 0.32, 1] }} />
          </motion.svg>
        ) : multi && count > 0 ? (
          <span className="count">{count}</span>
        ) : null}
        <Burst key={burst} active={burst > 0} color={color} />
      </motion.button>
    </div>
  )
}

function Burst({ active, color }: { active: boolean; color: string }) {
  if (!active) return null
  return (
    <span className="burst" aria-hidden>
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const dist = 30 + (i % 3) * 8
        return (
          <motion.i
            key={i}
            style={{ background: i % 2 ? color : BURST_COLORS[i % 3], borderRadius: i % 3 ? 3 : 99 }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          />
        )
      })}
    </span>
  )
}

